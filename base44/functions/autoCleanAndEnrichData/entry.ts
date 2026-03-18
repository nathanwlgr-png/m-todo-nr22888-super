import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { entity_type, auto_delete_duplicates = false, enrich_data = true } = await req.json();

    if (!entity_type || !['Client', 'Lead'].includes(entity_type)) {
      return Response.json({ error: 'Tipo de entidade inválido' }, { status: 400 });
    }

    const results = {
      duplicates_found: 0,
      duplicates_deleted: 0,
      records_enriched: 0,
      errors: []
    };

    // 1. DETECTAR E REMOVER DUPLICATAS
    const records = await base44.asServiceRole.entities[entity_type].list();
    const duplicateGroups = {};
    const seenRecords = new Set();

    for (const record of records) {
      if (seenRecords.has(record.id)) continue;

      const email = record.email?.toLowerCase().trim() || '';
      const phone = record.phone?.replace(/\D/g, '') || '';
      const cnpj = record.cnpj?.replace(/\D/g, '') || '';

      // Criar chave única baseada em email, telefone ou CNPJ
      let matchKey = null;
      if (email) matchKey = `email:${email}`;
      else if (phone && phone.length >= 10) matchKey = `phone:${phone}`;
      else if (cnpj) matchKey = `cnpj:${cnpj}`;

      if (matchKey) {
        if (!duplicateGroups[matchKey]) {
          duplicateGroups[matchKey] = [];
        }
        duplicateGroups[matchKey].push(record);
      }
    }

    // Processar duplicatas
    for (const [key, group] of Object.entries(duplicateGroups)) {
      if (group.length > 1) {
        results.duplicates_found += group.length - 1;

        // Ordenar por qualidade de dados (mais completo primeiro)
        const sorted = group.sort((a, b) => {
          const scoreA = (
            (a.email ? 10 : 0) +
            (a.phone ? 10 : 0) +
            (a.cnpj ? 15 : 0) +
            (a.address ? 5 : 0) +
            (a.razao_social ? 10 : 0) +
            (a.full_name || a.first_name ? 5 : 0) +
            (new Date(a.created_date).getTime() / 1000000000) // Favorece mais antigo
          );
          const scoreB = (
            (b.email ? 10 : 0) +
            (b.phone ? 10 : 0) +
            (b.cnpj ? 15 : 0) +
            (b.address ? 5 : 0) +
            (b.razao_social ? 10 : 0) +
            (b.full_name || b.first_name ? 5 : 0) +
            (new Date(b.created_date).getTime() / 1000000000)
          );
          return scoreB - scoreA;
        });

        const keepRecord = sorted[0];
        const deleteRecords = sorted.slice(1);

        // Mesclar dados únicos dos duplicados no registro principal
        const mergedData = { ...keepRecord };
        for (const dup of deleteRecords) {
          if (!mergedData.email && dup.email) mergedData.email = dup.email;
          if (!mergedData.phone && dup.phone) mergedData.phone = dup.phone;
          if (!mergedData.cnpj && dup.cnpj) mergedData.cnpj = dup.cnpj;
          if (!mergedData.address && dup.address) mergedData.address = dup.address;
          if (!mergedData.razao_social && dup.razao_social) mergedData.razao_social = dup.razao_social;
        }

        // Atualizar registro principal com dados mesclados
        try {
          await base44.asServiceRole.entities[entity_type].update(keepRecord.id, mergedData);
          // Delay para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          results.errors.push(`Erro ao mesclar dados: ${err.message}`);
        }

        // Deletar duplicatas se auto_delete estiver ativo
        if (auto_delete_duplicates) {
          for (const dup of deleteRecords) {
            try {
              await base44.asServiceRole.entities[entity_type].delete(dup.id);
              results.duplicates_deleted++;
              seenRecords.add(dup.id);
              // Delay para evitar rate limit
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
              results.errors.push(`Erro ao deletar ${dup.id}: ${err.message}`);
            }
          }
        }
      }
    }

    // 2. ENRIQUECER DADOS (Processamento em lotes para evitar rate limit)
    if (enrich_data) {
      const recordsToEnrich = await base44.asServiceRole.entities[entity_type].list();
      const BATCH_SIZE = 10; // Processar 10 registros por vez
      
      for (let i = 0; i < recordsToEnrich.length; i += BATCH_SIZE) {
        const batch = recordsToEnrich.slice(i, i + BATCH_SIZE);
        
        for (const record of batch) {
          if (seenRecords.has(record.id)) continue; // Pular registros deletados

          const updates = {};

          // Enriquecer com dados de CNPJ
          if (record.cnpj && !record.razao_social) {
            try {
              const cnpjClean = record.cnpj.replace(/\D/g, '');
              const cnpjData = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
              
              if (cnpjData.ok) {
                const data = await cnpjData.json();
                
                if (data.razao_social) updates.razao_social = data.razao_social;
                if (data.nome_fantasia && !record.clinic_name) updates.clinic_name = data.nome_fantasia;
                if (data.cnae_fiscal_descricao) updates.industry = data.cnae_fiscal_descricao;
                
                // Montar endereço completo
                if (!record.address && data.logradouro) {
                  updates.address = `${data.logradouro}, ${data.numero || 'S/N'} - ${data.bairro}, ${data.municipio}/${data.uf}`;
                }
                if (!record.cep && data.cep) updates.cep = data.cep;
                if (!record.city && data.municipio) updates.city = data.municipio;
                
                // Email e telefone
                if (!record.email && data.email) updates.email = data.email;
                if (!record.phone && data.ddd_telefone_1) {
                  updates.phone = `55${data.ddd_telefone_1.replace(/\D/g, '')}`;
                }
                
                // Data de abertura
                if (!record.clinic_opening_date && data.data_inicio_atividade) {
                  updates.clinic_opening_date = data.data_inicio_atividade;
                }
              }
              // Delay para APIs externas
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              results.errors.push(`Erro ao buscar CNPJ ${record.cnpj}: ${err.message}`);
            }
          }

          // Buscar dados de CEP se não tiver endereço completo
          if (record.cep && !record.address) {
            try {
              const cepClean = record.cep.replace(/\D/g, '');
              const cepData = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
              
              if (cepData.ok) {
                const data = await cepData.json();
                
                if (!data.erro) {
                  if (data.logradouro) {
                    updates.address = `${data.logradouro} - ${data.bairro}, ${data.localidade}/${data.uf}`;
                  }
                  if (!record.city && data.localidade) updates.city = data.localidade;
                }
              }
              // Delay para APIs externas
              await new Promise(resolve => setTimeout(resolve, 150));
            } catch (err) {
              results.errors.push(`Erro ao buscar CEP ${record.cep}: ${err.message}`);
            }
          }

          // Atualizar se houver novos dados
          if (Object.keys(updates).length > 0) {
            try {
              await base44.asServiceRole.entities[entity_type].update(record.id, updates);
              results.records_enriched++;
              // Delay para evitar rate limit
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
              results.errors.push(`Erro ao atualizar ${record.id}: ${err.message}`);
            }
          }
        }
        
        // Pausa entre lotes
        if (i + BATCH_SIZE < recordsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    return Response.json({
      success: true,
      entity_type,
      summary: results
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});