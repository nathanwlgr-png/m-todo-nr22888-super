import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { city } = await req.json();

    if (!city) {
      return Response.json({ error: 'Cidade é obrigatória' }, { status: 400 });
    }

    // Usar IA para pesquisar e priorizar clínicas
    const llmPrompt = `Você é um analista de vendas da Seamaty Brasil, empresa que vende equipamentos de diagnóstico veterinário (analisadores hematológicos e bioquímicos).

Encontre as 20 clínicas veterinárias mais promissoras em ${city}, Brasil para vendas de equipamentos de diagnóstico Seamaty Brasil.

Para cada clínica, retorne:
- nome: nome completo da clínica
- address: endereço completo
- phone: telefone
- website: site (se disponível)
- services: principais serviços oferecidos
- specialties: especialidades (se houver)
- size: porte estimado (pequeno, médio, grande)
- equipment_info: informação sobre equipamentos de laboratório que já possuem ou necessitam
- sales_potential_score: pontuação de 0 a 100 baseada em: porte da clínica, volume de atendimentos estimado, especialidades que demandam exames laboratoriais, presença/ausência de equipamentos próprios
- priority_reason: explicação breve do porque tem esse potencial

Ordene pela pontuação de potencial de venda (maior para menor).`;

    const clinicsData = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_pro',
      response_json_schema: {
        type: "object",
        properties: {
          clinics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                services: { type: "string" },
                specialties: { type: "string" },
                size: { type: "string" },
                equipment_info: { type: "string" },
                sales_potential_score: { type: "number" },
                priority_reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    const prioritizedClinics = (clinicsData.clinics || []).sort((a, b) => 
      (b.sales_potential_score || 0) - (a.sales_potential_score || 0)
    );

    return Response.json({
      success: true,
      city,
      total_found: prioritizedClinics.length,
      clinics: prioritizedClinics,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('prioritizeClinicsByCity error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});