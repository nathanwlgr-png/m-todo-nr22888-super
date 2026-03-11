import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { entity_type } = await req.json();

    if (!entity_type || !['Client', 'Lead'].includes(entity_type)) {
      return Response.json({ error: 'Tipo de entidade inválido' }, { status: 400 });
    }

    // Buscar todos os registros
    const records = await base44.asServiceRole.entities[entity_type].list();

    // Agrupar por critérios de duplicação
    const duplicateGroups = {};

    for (const record of records) {
      // Normalizar dados para comparação
      const email = record.email?.toLowerCase().trim() || '';
      const phone = record.phone?.replace(/\D/g, '') || '';
      const name = record.full_name?.toLowerCase().trim() || record.first_name?.toLowerCase().trim() || '';

      // Criar chaves de identificação
      const keys = [];
      if (email) keys.push(`email:${email}`);
      if (phone && phone.length >= 10) keys.push(`phone:${phone}`);
      if (email && name) keys.push(`email_name:${email}_${name}`);

      // Adicionar aos grupos de duplicatas
      for (const key of keys) {
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(record);
      }
    }

    // Filtrar apenas grupos com duplicatas (2+ registros)
    const duplicates = Object.entries(duplicateGroups)
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => {
        // Ordenar por data de criação (mais antigo primeiro = candidato a manter)
        const sorted = group.sort((a, b) => 
          new Date(a.created_date) - new Date(b.created_date)
        );

        return {
          match_key: key,
          match_type: key.split(':')[0],
          total_count: sorted.length,
          keep_candidate: sorted[0], // Mais antigo
          duplicates: sorted.slice(1), // Restantes
          all_records: sorted
        };
      });

    // Estatísticas
    const stats = {
      total_records: records.length,
      duplicate_groups: duplicates.length,
      total_duplicates: duplicates.reduce((sum, g) => sum + g.duplicates.length, 0),
      by_match_type: {}
    };

    duplicates.forEach(group => {
      const type = group.match_type;
      if (!stats.by_match_type[type]) {
        stats.by_match_type[type] = 0;
      }
      stats.by_match_type[type] += group.duplicates.length;
    });

    return Response.json({
      success: true,
      entity_type,
      stats,
      duplicate_groups: duplicates
    });

  } catch (error) {
    console.error('Erro ao detectar duplicatas:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});