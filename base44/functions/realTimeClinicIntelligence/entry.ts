import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clinic_name, city } = await req.json();

    if (!clinic_name || !city) {
      return Response.json({ 
        error: 'clinic_name e city obrigatórios' 
      }, { status: 400 });
    }

    // Busca de inteligência na web
    const webIntelligence = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Faça uma pesquisa minuciosa sobre a clínica veterinária: "${clinic_name}" em ${city}, Brasil.

PROCURE POR:
1. Site oficial (qual equipamento usam, volume de exames, especialidades)
2. Redes sociais (Facebook, Instagram - padrão de comunicação, tipo de serviço)
3. Avaliações (Google, Waze - sentimento geral)
4. Estrutura (quantos veterinários, especialidades, atendimentos)
5. Volume estimado de exames por mês
6. Equipamentos atuais mencionados
7. Horário de funcionamento e padrão de atendimento

Estruture a resposta em JSON com campos:
- clinic_name
- location
- website_url
- specialties (array)
- estimated_exams_per_month
- current_equipment (array)
- team_size
- communication_style (formal/descontraído/corporativo)
- social_media_presence (facebook, instagram, etc)
- customer_sentiment (positivo/neutro/negativo)
- opportunity_level (alto/médio/baixo)
- best_contact_approach
- key_decision_makers_profile

Se não encontrar informação, coloque null.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          clinic_name: { type: "string" },
          specialties: { type: "array", items: { type: "string" } },
          estimated_exams_per_month: { type: "number" },
          current_equipment: { type: "array", items: { type: "string" } },
          communication_style: { type: "string" },
          opportunity_level: { type: "string" },
          best_contact_approach: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      clinic_intelligence: webIntelligence,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});