import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { service_description, city = 'Marília', state = 'SP' } = body;

        if (!service_description) {
            return Response.json({ error: 'Descrição do serviço é obrigatória' }, { status: 400 });
        }

        const searchResult = await base44.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            prompt: `Você é um especialista em prospecção B2B para o setor veterinário no Brasil.

Pesquise e identifique clínicas veterinárias e hospitais veterinários no Brasil que seriam clientes IDEAIS para o seguinte equipamento/serviço:

"${service_description}"

Critérios:
- Foco em: ${city}, ${state} e região (até 200km)
- Priorize estabelecimentos de médio e grande porte
- Inclua hospitais veterinários, clínicas especializadas e laboratórios
- Priorize os com maior volume de atendimentos e capacidade de investimento

Para cada estabelecimento, retorne TODOS esses campos:
- name: nome completo do estabelecimento
- clinic_name: nome fantasia se diferente
- city: cidade
- state: estado (sigla 2 letras)
- type: um de [clinica_pequena, clinica_media, hospital_veterinario, laboratorio, clinica_especializada]
- specialty: especialidade principal
- size: um de [micro, pequena, media, grande]
- website: URL do site (vazio se não encontrar)
- phone: telefone com DDD (vazio se não encontrar)
- address: endereço aproximado
- purchase_score: número 0-100 (potencial de compra para este produto)
- serasa_score: número 350-950 (estimativa baseada no porte, tempo de mercado e localização)
- market_time_years: anos estimados no mercado
- monthly_exams_estimate: estimativa de exames/atendimentos por mês
- why_ideal: 1-2 frases sobre por que é cliente ideal para este produto específico
- main_pain: principal dor que este produto/serviço resolve para esta clínica

Retorne 12-15 resultados de alta qualidade, ordenados por purchase_score decrescente.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    clinics: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                clinic_name: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                type: { type: "string" },
                                specialty: { type: "string" },
                                size: { type: "string" },
                                website: { type: "string" },
                                phone: { type: "string" },
                                address: { type: "string" },
                                purchase_score: { type: "number" },
                                serasa_score: { type: "number" },
                                market_time_years: { type: "number" },
                                monthly_exams_estimate: { type: "number" },
                                why_ideal: { type: "string" },
                                main_pain: { type: "string" }
                            }
                        }
                    },
                    search_summary: { type: "string" },
                    market_insight: { type: "string" }
                }
            }
        });

        // Cross-reference with CRM
        const [existingClients, existingLeads] = await Promise.all([
            base44.asServiceRole.entities.Client.list(),
            base44.asServiceRole.entities.Lead.list()
        ]);

        const enrichedClinics = (searchResult.clinics || []).map(clinic => {
            const nameKey = clinic.name.toLowerCase().substring(0, 8);
            const existingClient = existingClients.find(c =>
                (c.clinic_name || '').toLowerCase().includes(nameKey) ||
                clinic.name.toLowerCase().includes((c.clinic_name || '').toLowerCase().substring(0, 8))
            );
            const existingLead = !existingClient && existingLeads.find(l =>
                (l.company || '').toLowerCase().includes(nameKey) ||
                clinic.name.toLowerCase().includes((l.company || '').toLowerCase().substring(0, 8))
            );

            return {
                ...clinic,
                crm_status: existingClient ? 'cliente' : existingLead ? 'lead' : 'novo',
                crm_id: existingClient?.id || existingLead?.id || null
            };
        });

        return Response.json({
            success: true,
            clinics: enrichedClinics,
            search_summary: searchResult.search_summary,
            market_insight: searchResult.market_insight,
            total: enrichedClinics.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});