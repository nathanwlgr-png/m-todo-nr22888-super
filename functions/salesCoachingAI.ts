import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { user_email, interaction_logs = [], transcript = null } = body;

    // Fetch user interactions and sales data
    const [allInteractions, allTasks, allSales] = await Promise.all([
      base44.asServiceRole.entities.Interaction.filter({ created_by: user_email }).catch(() => []),
      base44.asServiceRole.entities.Task.filter({ assigned_to: user_email }).catch(() => []),
      base44.asServiceRole.entities.Sale.list().catch(() => [])
    ]);

    // Analyze interactions for coaching insights
    const coachingAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um coach de vendas especializado em consultoria veterinária. 
      
Analise as seguintes interações e transcrições de vendas:

${allInteractions.slice(0, 10).map(i => `
- Tipo: ${i.type}
- Sentimento: ${i.sentiment || 'não avaliado'}
- Notas: ${i.notes || 'sem notas'}
- Data: ${i.created_date}
`).join('\n')}

${transcript ? `\n\nTranscrição de chamada:\n${transcript}` : ''}

ANÁLISE COMPLETA:

1. PONTOS FORTES:
   - O que está funcionando bem nas abordagens?
   - Quais técnicas de vendas estão sendo bem aplicadas?

2. ÁREAS DE MELHORIA:
   - Onde o vendedor está perdendo oportunidades?
   - Quais objeções não estão sendo bem tratadas?
   - Timing e fluxo da conversa

3. TÉCNICAS RECOMENDADAS:
   - SPIN Selling: fazer perguntas de situação/problema/implicação/necessidade
   - Gatilhos de Cialdini: qual seria mais efetivo?
   - Método consultivo: não vender, descobrir necessidade
   - Numerologia (se aplicável): adaptar tom ao perfil

4. FEEDBACK PERSONALIZADO (3-5 ações específicas):
   - Ação 1: descrição clara
   - Ação 2: exemplo prático
   - Etc.

5. MÉTRICA ESTIMADA:
   - Taxa de fechamento atual estimada (%)
   - Potencial com implementação das melhorias (%)

Responda em JSON estruturado.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          improvement_areas: { type: "array", items: { type: "string" } },
          recommended_techniques: { type: "array", items: { type: "string" } },
          personalized_feedback: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                description: { type: "string" },
                example: { type: "string" },
                priority: { type: "string" }
              }
            }
          },
          current_closing_rate_estimate: { type: "string" },
          potential_improvement: { type: "string" }
        }
      }
    });

    // Generate role-play scenarios
    const rolePlayScenarios = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é instrutor de role-play para vendedores de diagnóstico veterinário.

Crie 3 CENÁRIOS DE PRÁTICA realistas baseados nos pontos fracos identificados:

Para cada cenário:
1. Descrição do cliente/situação
2. Contexto (segmento, volume de exames, equipamento atual)
3. Objeção principal que o cliente fará
4. 3-5 passos da conversa esperada
5. Frases-chave para usar
6. Como responder à objeção
7. Técnica SPIN a aplicar

Foco em:
- Objeção de preço
- Falta de volume
- Cliente satisfeito com concorrente
- Desconfiança em novo fornecedor

Retorne em JSON.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          scenarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                client_profile: { type: "string" },
                main_objection: { type: "string" },
                conversation_steps: { type: "array", items: { type: "string" } },
                key_phrases: { type: "array", items: { type: "string" } },
                objection_response: { type: "string" },
                spin_technique: { type: "string" },
                difficulty_level: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Save coaching session
    const coachingSession = {
      user_email,
      analysis_date: new Date().toISOString(),
      interaction_count: allInteractions.length,
      strengths: coachingAnalysis.strengths || [],
      improvement_areas: coachingAnalysis.improvement_areas || [],
      recommended_techniques: coachingAnalysis.recommended_techniques || [],
      personalized_feedback: JSON.stringify(coachingAnalysis.personalized_feedback || []),
      current_closing_rate: coachingAnalysis.current_closing_rate_estimate || '0%',
      potential_improvement: coachingAnalysis.potential_improvement || '0%',
      role_play_scenarios: JSON.stringify(rolePlayScenarios.scenarios || [])
    };

    try {
      await base44.asServiceRole.entities.SalesCoaching?.create?.(coachingSession);
    } catch (e) {
      console.log('SalesCoaching optional:', e.message);
    }

    return Response.json({
      success: true,
      coaching_analysis: coachingAnalysis,
      role_play_scenarios: rolePlayScenarios.scenarios || [],
      session_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('salesCoachingAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});