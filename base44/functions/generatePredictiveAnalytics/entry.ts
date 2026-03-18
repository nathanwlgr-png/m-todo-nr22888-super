import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todos os dados relevantes
    const [clients, sales, interactions, visits, tasks] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Sale.list(),
      base44.entities.Interaction.list('-created_date', 500),
      base44.entities.Visit.list(),
      base44.entities.Task.list()
    ]);

    // Preparar contexto para IA
    const activeClients = clients.filter(c => c.status !== 'perdido' && c.pipeline_stage !== 'perdido');
    
    const clientsWithActivity = activeClients.map(client => {
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      const clientSales = sales.filter(s => s.client_id === client.id);
      const clientVisits = visits.filter(v => v.client_id === client.id);
      const clientTasks = tasks.filter(t => t.client_id === client.id);
      
      const lastInteraction = clientInteractions[0];
      const daysSinceLastInteraction = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return {
        id: client.id,
        name: client.first_name,
        clinic: client.clinic_name,
        status: client.status,
        score: client.purchase_score || 0,
        pipeline_stage: client.pipeline_stage,
        interactions_count: clientInteractions.length,
        sales_count: clientSales.length,
        visits_count: clientVisits.length,
        pending_tasks: clientTasks.filter(t => t.status === 'pendente').length,
        days_since_last_contact: daysSinceLastInteraction,
        total_revenue: clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        avg_interaction_outcome: clientInteractions.filter(i => i.outcome === 'positive').length / Math.max(clientInteractions.length, 1),
        equipment_interest: client.equipment_interest,
        budget: client.available_budget
      };
    });

    // Análise de tendências mensais
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthSales = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate.getMonth() === month && saleDate.getFullYear() === year;
      });
      
      last6Months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        sales_count: monthSales.length,
        revenue: monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0)
      });
    }

    const analyticsPrompt = `Você é um analista de vendas especializado em previsões e analytics preditiva.

═══════════════════════════════════════
📊 DADOS DO CRM PARA ANÁLISE
═══════════════════════════════════════

**CLIENTES ATIVOS:** ${activeClients.length}
**TOTAL DE VENDAS:** ${sales.length} (Total: R$ ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString()})
**INTERAÇÕES (últimas 500):** ${interactions.length}

**TENDÊNCIA ÚLTIMOS 6 MESES:**
${last6Months.map(m => `- ${m.month}: ${m.sales_count} vendas, R$ ${m.revenue.toLocaleString()}`).join('\n')}

**TOP 20 CLIENTES COM ATIVIDADE:**
${clientsWithActivity.slice(0, 20).map(c => `
- ${c.name} (${c.clinic})
  Status: ${c.status} | Score: ${c.score}% | Pipeline: ${c.pipeline_stage}
  Interações: ${c.interactions_count} | Vendas: ${c.sales_count} (R$ ${c.total_revenue})
  Último contato: há ${c.days_since_last_contact} dias
  Taxa sucesso interações: ${(c.avg_interaction_outcome * 100).toFixed(0)}%
  Interesse: ${c.equipment_interest || 'N/A'} | Orçamento: ${c.budget ? 'R$ ' + c.budget : 'N/A'}
`).join('\n')}

═══════════════════════════════════════
🎯 ANÁLISE PREDITIVA SOLICITADA
═══════════════════════════════════════

Baseado nos dados acima, forneça análise preditiva COMPLETA:

1. **PREVISÃO DE VENDAS (próximos 3 meses)**
2. **CLIENTES EM RISCO DE CHURN**
3. **DEALS COM MAIOR PROBABILIDADE DE FECHAR**
4. **TENDÊNCIAS E INSIGHTS ACIONÁVEIS**

Retorne JSON estruturado:`;

    const predictions = await base44.integrations.Core.InvokeLLM({
      prompt: analyticsPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          sales_forecast: {
            type: "object",
            properties: {
              next_month: {
                type: "object",
                properties: {
                  predicted_sales_count: { type: "number" },
                  predicted_revenue: { type: "number" },
                  confidence: { type: "number" },
                  key_factors: { type: "array", items: { type: "string" } }
                }
              },
              second_month: {
                type: "object",
                properties: {
                  predicted_sales_count: { type: "number" },
                  predicted_revenue: { type: "number" },
                  confidence: { type: "number" }
                }
              },
              third_month: {
                type: "object",
                properties: {
                  predicted_sales_count: { type: "number" },
                  predicted_revenue: { type: "number" },
                  confidence: { type: "number" }
                }
              },
              trend: { type: "string" },
              reasoning: { type: "string" }
            }
          },
          churn_risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_id: { type: "string" },
                client_name: { type: "string" },
                risk_level: { type: "string" },
                risk_score: { type: "number" },
                reasons: { type: "array", items: { type: "string" } },
                recommended_actions: { type: "array", items: { type: "string" } },
                days_to_act: { type: "number" }
              }
            }
          },
          hot_deals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_id: { type: "string" },
                client_name: { type: "string" },
                close_probability: { type: "number" },
                estimated_value: { type: "number" },
                estimated_close_date: { type: "string" },
                key_factors: { type: "array", items: { type: "string" } },
                next_steps: { type: "array", items: { type: "string" } }
              }
            }
          },
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                insight: { type: "string" },
                action: { type: "string" },
                priority: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          market_trends: {
            type: "object",
            properties: {
              overall_health: { type: "string" },
              velocity: { type: "string" },
              conversion_rate_trend: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      predictions,
      metadata: {
        total_clients: activeClients.length,
        total_sales: sales.length,
        total_revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});