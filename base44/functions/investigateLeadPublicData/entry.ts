import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, city, segment, manual_data } = await req.json();

    // MODE 1: Manual data enrichment (RECOMENDADO - sem web search)
    if (manual_data && Array.isArray(manual_data)) {
      const enrichedLeads = [];
      
      for (const item of manual_data) {
        try {
          // Enriquecer cada lead com IA
          const enrichment = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Você é especialista em análise de oportunidades comerciais veterinárias.

EMPRESA FORNECIDA:
- Nome: ${item.company_name || 'N/A'}
- Cidade: ${item.city || city || 'N/A'}
- Telefone: ${item.phone || 'N/A'}
- Website: ${item.website || 'N/A'}
- Informações adicionais: ${item.extra_info || 'Nenhuma'}

TAREFA: Baseado APENAS nos dados fornecidos, gere:
1. Score de expansão (0-100)
2. Score de pressão financeira (0-100)
3. Score de maturidade digital (0-100)
4. Sinais provável identificáveis nesses dados
5. Prioridade (normal/potencial/quente/urgente/raro)

Responda em JSON estruturado.`,
            response_json_schema: {
              type: "object",
              properties: {
                score_expansion: { type: "number" },
                score_financial_pressure: { type: "number" },
                score_digital: { type: "number" },
                signals: { type: "array", items: { type: "string" } },
                priority: { type: "string" }
              }
            }
          });

          // Criar lead enriquecido
          const created = await base44.asServiceRole.entities.LeadHunter.create({
            company_name: item.company_name || 'Empresa desconhecida',
            cnpj: item.cnpj || '',
            address: item.address || '',
            city: item.city || city || 'SP',
            state: item.state || 'SP',
            phone: item.phone || '',
            website: item.website || '',
            instagram: item.instagram || '',
            facebook: item.facebook || '',
            google_rating: item.google_rating || 0,
            google_reviews_count: item.google_reviews_count || 0,
            segment: segment || 'outro',
            signals: enrichment.signals?.map(s => ({
              type: 'novo',
              detected_at: new Date().toISOString(),
              source: 'manual_input',
              evidence: s
            })) || [],
            score_expansion: enrichment.score_expansion || 50,
            score_financial_pressure: enrichment.score_financial_pressure || 50,
            score_digital: enrichment.score_digital || 50,
            score_opportunity: Math.round(
              (enrichment.score_expansion + enrichment.score_digital) / 2
            ),
            priority: enrichment.priority || 'potencial',
            status: 'novo',
            data_sources: ['manual_input']
          });

          enrichedLeads.push(created);
        } catch (e) {
          console.error(`Erro ao enriquecer ${item.company_name}:`, e);
        }
      }

      return Response.json({
        success: true,
        mode: 'manual_enrichment',
        created_leads: enrichedLeads.length,
        leads: enrichedLeads
      });
    }

    // MODE 2: Query search (usa dados públicos já na DB ou cache)
    if (query) {
      // Busca local primeiro
      const filters = {
        ...(city && { city }),
        ...(segment && { segment })
      };
      
      const existingLeads = await base44.asServiceRole.entities.LeadHunter.filter(filters, '-created_date', 100);
      
      // Filtrar por query
      const matchingLeads = existingLeads.filter(l =>
        l.company_name?.toLowerCase().includes(query.toLowerCase())
      );

      return Response.json({
        success: true,
        mode: 'local_search',
        results: matchingLeads.length,
        leads: matchingLeads
      });
    }

    return Response.json({ error: 'query or manual_data required' }, { status: 400 });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});