import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { service_description, city } = await req.json();

    if (!service_description) return Response.json({ error: 'service_description obrigatório' }, { status: 400 });

    const regionContext = city ? `Foco na região: ${city}` : 'Brasil inteiro';

    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Você é um especialista em pesquisa de mercado para o setor veterinário brasileiro.

MISSÃO: Encontrar clínicas e hospitais veterinários no Brasil que seriam clientes ideais para comprar: "${service_description}"
${regionContext}

Para cada estabelecimento, forneça informações REAIS ou altamente prováveis baseadas em dados do mercado veterinário:

1. Nome da clínica/hospital veterinário
2. Cidade e Estado
3. Porte estimado: micro (1-5 vets) / pequena (5-15 vets) / media (15-30 vets) / grande (30+ vets)
4. Especialidades veterinárias oferecidas
5. Website (se existir)
6. Telefone/WhatsApp (se disponível)
7. Instagram (se disponível)
8. Probabilidade de interesse no produto (0-100%)
9. Score Serasa estimado (250-1000) baseado em: porte, tempo de mercado, visibilidade digital
   - Grande + muito tempo: 750-950
   - Médio estabelecido: 600-750  
   - Pequeno consolidado: 450-600
   - Micro/novo: 250-450
10. Razão social provável
11. Anos estimados no mercado
12. Por que seria um cliente ideal para este equipamento/serviço
13. Dores/necessidades que o produto resolve

Encontre 12-18 clínicas/hospitais veterinários reais ou altamente prováveis.
Priorize: hospitais veterinários 24h, clínicas de grande porte, clínicas com UTI veterinária, clínicas de especialidades.

Também forneça insights gerais sobre o mercado veterinário para este tipo de produto.`,
      response_json_schema: {
        type: "object",
        properties: {
          clinics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                size: { type: "string" },
                specialties: { type: "array", items: { type: "string" } },
                website: { type: "string" },
                phone: { type: "string" },
                instagram: { type: "string" },
                interest_probability: { type: "number" },
                serasa_score: { type: "number" },
                razao_social: { type: "string" },
                market_time_years: { type: "number" },
                ideal_reasons: { type: "string" },
                pain_points: { type: "string" }
              }
            }
          },
          market_insights: { type: "string" },
          total_market_size: { type: "string" }
        }
      }
    });

    // Cross-reference with CRM
    const [existingClients, existingLeads] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list()
    ]);

    const enrichedClinics = (searchResult.clinics || []).map(clinic => {
      const nameLower = clinic.name.toLowerCase();
      const existingClient = existingClients.find(c =>
        c.clinic_name?.toLowerCase().includes(nameLower) || nameLower.includes(c.clinic_name?.toLowerCase() || 'NOMATCH')
      );
      const existingLead = !existingClient && existingLeads.find(l =>
        l.company?.toLowerCase().includes(nameLower) || nameLower.includes(l.company?.toLowerCase() || 'NOMATCH')
      );

      return {
        ...clinic,
        crm_status: existingClient ? 'client' : existingLead ? 'lead' : 'new',
        crm_id: existingClient?.id || existingLead?.id,
      };
    });

    // Sort by interest probability desc
    enrichedClinics.sort((a, b) => (b.interest_probability || 0) - (a.interest_probability || 0));

    return Response.json({
      success: true,
      clinics: enrichedClinics,
      market_insights: searchResult.market_insights,
      total_market_size: searchResult.total_market_size
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});