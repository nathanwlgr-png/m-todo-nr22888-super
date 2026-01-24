import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === client_id);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const [interactions, visits, tasks, sales] = await Promise.all([
      base44.entities.Interaction.filter({ client_id }),
      base44.entities.Visit.filter({ client_id }),
      base44.entities.Task.filter({ client_id }),
      base44.entities.Sale.filter({ client_id })
    ]);

    const daysSinceLastContact = client.last_contact_date 
      ? Math.floor((Date.now() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24))
      : 999;

    const engagementScore = client.engagement_score || 0;
    const currentStage = client.pipeline_stage || 'lead';

    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas consultivas e gestão de pipeline.

CLIENTE: ${client.first_name}
Pipeline: ${currentStage} | Status: ${client.status} | Score: ${client.purchase_score}%
Engajamento: ${engagementScore}% | Último contato: ${daysSinceLastContact} dias atrás

PERFIL COMPLETO:
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo Decisão: ${client.decision_style}
- Tom: ${client.client_tone || 'Não observado'}
- Tipo: ${client.client_type} | Decisor: ${client.decision_role}
- Equipamento interesse: ${client.equipment_interest || 'Não definido'}

HISTÓRICO:
- Interações: ${interactions.length}
- Visitas: ${visits.length} (${visits.filter(v => v.status === 'realizada').length} realizadas)
- Vendas: ${sales.length}
- Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Gatilhos usados: ${client.triggers_used?.join(', ') || 'Nenhum'}

TAREFA:
Analise este cliente e gere recomendações ESTRATÉGICAS para avançá-lo no pipeline.

Retorne JSON com:
{
  "urgency_level": "critical" | "high" | "medium" | "low",
  "stage_diagnosis": "análise do estágio atual (2-3 linhas)",
  "immediate_actions": [
    {
      "action": "Ação específica a fazer",
      "priority": "alta" | "media" | "baixa",
      "channel": "email" | "whatsapp" | "telefone" | "presencial",
      "timing": "quando fazer (hoje, amanhã, esta semana)",
      "expected_outcome": "resultado esperado",
      "success_probability": 0-100
    }
  ],
  "objection_handlers": [
    {
      "objection": "objeção comum para este estágio/perfil",
      "response_framework": "SPIN | Cialdini | Numerologia",
      "exact_phrase": "frase exata pronta para usar",
      "follow_up_question": "pergunta de aprofundamento",
      "tone": "tom a usar (assertivo/empático/técnico)"
    }
  ],
  "pipeline_advancement_strategy": {
    "next_stage": "próximo estágio do pipeline",
    "milestones_needed": ["marco 1", "marco 2"],
    "estimated_days": número de dias estimados,
    "key_actions": ["ação crítica 1", "ação crítica 2"]
  },
  "personalized_scripts": {
    "opening": "script de abertura perfeito para este cliente",
    "value_proposition": "proposta de valor personalizada (2-3 linhas)",
    "closing_attempt": "frase de tentativa de fechamento"
  },
  "risk_factors": [
    {
      "risk": "fator de risco",
      "mitigation": "como mitigar"
    }
  ],
  "quick_wins": ["ganho rápido 1", "ganho rápido 2"],
  "ai_confidence": 0-100
}

CONSIDERE:
- Perfil numerológico ${client.numerology_number} (comportamento, decisão)
- Estágio ${currentStage} (que ações funcionam aqui?)
- Score ${client.purchase_score}% (probabilidade de conversão)
- Engajamento ${engagementScore}% (quão receptivo está?)
- ${daysSinceLastContact} dias sem contato (urgência de reengajar?)

Use frameworks: SPIN + Cialdini + Numerologia + Neurovendas + Arte da Guerra
Seja ESPECÍFICO, não genérico. Forneça frases PRONTAS.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          urgency_level: { type: "string" },
          stage_diagnosis: { type: "string" },
          immediate_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string" },
                channel: { type: "string" },
                timing: { type: "string" },
                expected_outcome: { type: "string" },
                success_probability: { type: "number" }
              }
            }
          },
          objection_handlers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                objection: { type: "string" },
                response_framework: { type: "string" },
                exact_phrase: { type: "string" },
                follow_up_question: { type: "string" },
                tone: { type: "string" }
              }
            }
          },
          pipeline_advancement_strategy: {
            type: "object",
            properties: {
              next_stage: { type: "string" },
              milestones_needed: { type: "array", items: { type: "string" } },
              estimated_days: { type: "number" },
              key_actions: { type: "array", items: { type: "string" } }
            }
          },
          personalized_scripts: {
            type: "object",
            properties: {
              opening: { type: "string" },
              value_proposition: { type: "string" },
              closing_attempt: { type: "string" }
            }
          },
          risk_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                mitigation: { type: "string" }
              }
            }
          },
          quick_wins: { type: "array", items: { type: "string" } },
          ai_confidence: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});