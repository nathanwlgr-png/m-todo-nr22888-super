import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, city, segment } = await req.json();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    // Investigação via LLM (web search)
    const investigation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um investigador comercial. Pesquise empresas públicas/comerciais.

BUSCA: ${query}
CIDADE: ${city || 'Brasil inteiro'}
SEGMENTO: ${segment || 'Qualquer'}

Use apenas DADOS PÚBLICOS de:
- Google Search
- Google Maps
- Instagram público
- Facebook público
- Sites públicos
- Reviews públicos

Encontre até 5 empresas com:
- Nome
- CNPJ (se disponível)
- Endereço comercial
- Telefone público
- Website
- Instagram/Facebook
- Sinais de expansão/pressão/crescimento
- Rating Google

Responda em JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          leads: {
            type: "array",
            items: {
              type: "object",
              properties: {
                company_name: { type: "string" },
                cnpj: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                instagram: { type: "string" },
                facebook: { type: "string" },
                google_rating: { type: "number" },
                signals: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      },
      add_context_from_internet: true, // Usa web search
      model: 'gemini_3_1_pro' // Melhor para pesquisa web
    });

    // Criar leads no CRM
    const createdLeads = [];
    for (const lead of investigation.leads) {
      try {
        const created = await base44.asServiceRole.entities.LeadHunter.create({
          company_name: lead.company_name,
          cnpj: lead.cnpj || '',
          address: lead.address || '',
          city: lead.city || city || '',
          state: lead.state || 'SP', // default
          phone: lead.phone || '',
          website: lead.website || '',
          instagram: lead.instagram || '',
          facebook: lead.facebook || '',
          google_rating: lead.google_rating || 0,
          segment: segment || 'outro',
          signals: lead.signals?.map(s => ({
            type: 'novo',
            detected_at: new Date().toISOString(),
            source: 'public_data',
            evidence: s
          })) || [],
          score_expansion: 50,
          score_opportunity: 50,
          priority: 'potencial',
          status: 'novo',
          data_sources: ['Google', 'Instagram', 'Facebook', 'Website', 'Reviews']
        });
        createdLeads.push(created);
      } catch (e) {
        console.error(`Erro ao criar lead ${lead.company_name}:`, e);
      }
    }

    return Response.json({
      success: true,
      investigation_results: investigation.leads,
      created_leads: createdLeads.length,
      leads: createdLeads
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});