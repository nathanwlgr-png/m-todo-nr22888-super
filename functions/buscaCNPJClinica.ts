import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cnpj, clinic_name, city, search_type = 'cnpj' } = await req.json();

    let result = {};

    if (search_type === 'cnpj' && cnpj) {
      // Buscar dados do CNPJ via API pública brasileira
      const cleanCNPJ = cnpj.replace(/[.\-\/]/g, '');
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (res.ok) {
        const data = await res.json();
        result = {
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          cnpj: data.cnpj,
          situacao: data.descricao_situacao_cadastral,
          logradouro: data.logradouro,
          numero: data.numero,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep,
          telefone: data.ddd_telefone_1 ? `${data.ddd_telefone_1}${data.ddd_telefone_2 || ''}` : null,
          email: data.email,
          porte: data.porte,
          natureza_juridica: data.natureza_juridica,
          data_abertura: data.data_inicio_atividade,
          capital_social: data.capital_social,
          atividade_principal: data.cnae_fiscal_descricao,
          atividades_secundarias: data.cnaes_secundarios?.slice(0, 3).map(c => c.descricao),
          socios: data.qsa?.map(s => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio })),
        };
      } else {
        result = { error: 'CNPJ não encontrado na Receita Federal', cnpj };
      }
    }

    else if (search_type === 'internet' && (clinic_name || city)) {
      // Busca de clínicas veterinárias via LLM com internet
      const prompt = `Pesquise informações sobre clínicas veterinárias${clinic_name ? ` com nome: "${clinic_name}"` : ''}${city ? ` na cidade de ${city}` : ''}.

Para cada clínica encontrada, forneça:
- Nome completo da clínica
- Nome do proprietário/veterinário responsável
- CNPJ (se disponível)
- Endereço completo
- Telefone/WhatsApp
- Website/Instagram
- Especialidades (pequenos animais, equinos, exóticos, etc.)
- Equipamentos de diagnóstico que possivelmente possuem
- Porte estimado (pequena, média, hospital)
- Potencial para venda de equipamentos de laboratório

Retorne até 5 clínicas em formato estruturado.`;

      const searchResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinicas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  proprietario: { type: "string" },
                  cnpj: { type: "string" },
                  endereco: { type: "string" },
                  cidade: { type: "string" },
                  telefone: { type: "string" },
                  website: { type: "string" },
                  instagram: { type: "string" },
                  especialidades: { type: "string" },
                  equipamentos_possiveis: { type: "string" },
                  porte: { type: "string" },
                  potencial_venda: { type: "string" },
                  score_potencial: { type: "number" }
                }
              }
            },
            total_encontradas: { type: "number" },
            observacoes: { type: "string" }
          }
        }
      });

      result = searchResult;
    }

    else if (search_type === 'crmv' && city) {
      // Busca no CRMV via internet
      const prompt = `Pesquise no CRMV (Conselho Regional de Medicina Veterinária) veterinários e clínicas registrados${city ? ` em ${city}` : ''}.

Forneça:
- Nomes dos veterinários registrados
- Clínicas associadas
- Especialidades
- Dados de contato disponíveis
- CRMV números

Foque em veterinários com potencial para comprar equipamentos de diagnóstico laboratorial (hematologia, bioquímica, gasometria).`;

      const crmvResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            veterinarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  crmv: { type: "string" },
                  clinica: { type: "string" },
                  especialidade: { type: "string" },
                  cidade: { type: "string" },
                  contato: { type: "string" }
                }
              }
            },
            fonte: { type: "string" },
            observacoes: { type: "string" }
          }
        }
      });

      result = crmvResult;
    }

    return Response.json({ success: true, search_type, result });

  } catch (error) {
    console.error('Erro buscaCNPJClinica:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});