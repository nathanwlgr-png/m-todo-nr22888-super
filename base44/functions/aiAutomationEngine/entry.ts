import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    // Buscar dados do cliente
    const client = await base44.asServiceRole.entities.Client.get(client_id);
    const interactions = await base44.asServiceRole.entities.Interaction.filter({ client_id });
    const tasks = await base44.asServiceRole.entities.Task.filter({ client_id });
    const sales = await base44.asServiceRole.entities.Sale.filter({ client_id });
    const visits = await base44.asServiceRole.entities.Visit.filter({ client_id });

    // Análise IA completa
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um motor de automação de CRM especializado em vendas B2B veterinárias.

**DADOS DO CLIENTE:**
${JSON.stringify({
  nome: client.first_name,
  status: client.status,
  pipeline_stage: client.pipeline_stage,
  purchase_score: client.purchase_score,
  equipment_interest: client.equipment_interest,
  interactions_count: interactions.length,
  last_interaction: interactions[0]?.created_date,
  sentiment_history: interactions.slice(0, 5).map(i => ({
    type: i.type,
    sentiment: i.ai_sentiment,
    outcome: i.outcome,
    date: i.created_date
  })),
  pending_tasks: tasks.filter(t => t.status === 'pendente').length,
  sales_count: sales.length,
  visits_count: visits.length,
  last_visit: visits[0]?.scheduled_date
}, null, 2)}

**TAREFA: GERAR AUTOMAÇÕES INTELIGENTES**

1. **FOLLOW-UP AUTOMÁTICO:**
   - Analise o sentimento das últimas interações
   - Identifique gaps de comunicação (tempo sem contato)
   - Sugira 2-3 tarefas de follow-up ESPECÍFICAS e ACIONÁVEIS
   - Para cada tarefa: título, descrição, prioridade (alta/media/baixa), prazo (dias), tipo, motivo estratégico

2. **MATERIAL DE VENDAS RECOMENDADO:**
   - Baseado no estágio do pipeline e interesse
   - Sugira 3-4 materiais específicos (cases, vídeos, apresentações, artigos)
   - Para cada: nome do material, quando enviar, canal recomendado, motivo

3. **ANÁLISE DE RISCO DE CHURN:**
   - Calcule risco de perda (0-100%)
   - Identifique sinais de alerta específicos
   - Sugira 2-3 estratégias de reengajamento PRÁTICAS
   - Para cada: ação, timing, canal, mensagem sugerida

Seja ESPECÍFICO e PRÁTICO. Use dados reais do cliente.`,
      response_json_schema: {
        type: "object",
        properties: {
          follow_up_tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["alta", "media", "baixa"] },
                due_days: { type: "number" },
                type: { type: "string" },
                strategic_reason: { type: "string" }
              }
            }
          },
          sales_collateral: {
            type: "array",
            items: {
              type: "object",
              properties: {
                material_name: { type: "string" },
                when_to_send: { type: "string" },
                channel: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          churn_analysis: {
            type: "object",
            properties: {
              risk_score: { type: "number" },
              alert_signals: {
                type: "array",
                items: { type: "string" }
              },
              reengagement_strategies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    timing: { type: "string" },
                    channel: { type: "string" },
                    suggested_message: { type: "string" }
                  }
                }
              }
            }
          },
          overall_recommendation: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      automation_data: {
        ...analysis,
        generated_at: new Date().toISOString(),
        client_id
      }
    });

  } catch (error) {
    console.error('Erro no motor de automação:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});