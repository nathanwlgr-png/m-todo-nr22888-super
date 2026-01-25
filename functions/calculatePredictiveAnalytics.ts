import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Buscar dados do cliente
    const client = await base44.asServiceRole.entities.Client.get(client_id);
    
    // Buscar histórico de vendas
    const sales = await base44.asServiceRole.entities.Sale.filter({ client_id });
    
    // Buscar interações
    const interactions = await base44.asServiceRole.entities.Interaction.filter({ client_id });
    
    // Buscar visitas
    const visits = await base44.asServiceRole.entities.Visit.filter({ client_id });
    
    // Buscar tarefas
    const tasks = await base44.asServiceRole.entities.Task.filter({ client_id });

    // Buscar equipamentos disponíveis
    const allEquipments = await base44.asServiceRole.entities.Equipment.list();

    // Preparar contexto para IA
    const context = {
      client: {
        name: client.first_name,
        segment: client.client_type,
        current_equipment: client.current_equipment,
        current_volume: client.current_volume,
        status: client.status,
        pipeline_stage: client.pipeline_stage,
        purchase_score: client.purchase_score,
        available_budget: client.available_budget,
        market_time: client.market_time,
        company_size: client.company_size,
        lab_needs: client.lab_needs,
        equipment_interest: client.equipment_interest
      },
      sales_history: sales.map(s => ({
        date: s.sale_date,
        value: s.sale_value,
        equipment: s.equipment_name,
        status: s.status
      })),
      interactions_count: interactions.length,
      recent_interactions: interactions.slice(-5).map(i => ({
        type: i.type,
        outcome: i.outcome,
        date: i.created_date,
        sentiment: i.ai_sentiment
      })),
      visits_count: visits.length,
      last_visit: visits.length > 0 ? visits[visits.length - 1].scheduled_date : null,
      pending_tasks: tasks.filter(t => t.status === 'pendente').length,
      available_equipments: allEquipments.map(e => ({
        name: e.name,
        category: e.category,
        price: e.price
      }))
    };

    // Invocar IA para análise preditiva
    const analyticsResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um analista preditivo de vendas especializado em equipamentos veterinários.

Analise os dados do cliente e forneça uma análise preditiva COMPLETA e ESTRATÉGICA:

**DADOS DO CLIENTE:**
${JSON.stringify(context, null, 2)}

**ANÁLISE REQUERIDA:**

1. **LIFETIME VALUE (LTV):**
   - Calcule o LTV estimado para 12, 24 e 36 meses
   - Base-se no histórico de compras, volume atual, orçamento disponível e necessidades de laboratório
   - Considere compras recorrentes de insumos e consumíveis
   - Considere upgrades e expansões de equipamentos

2. **RISCO DE CHURN:**
   - Calcule o risco de perda do cliente (0-100%)
   - Analise: frequência de interações, sentimento, tempo sem compra, tarefas pendentes
   - Identifique sinais de alerta (ex: sentimento negativo, falta de follow-up)

3. **PROBABILIDADE DE CONVERSÃO:**
   - Calcule a probabilidade de conversão atual (0-100%)
   - Base-se no estágio do pipeline, score, interações e budget

4. **OPORTUNIDADES DE CROSS-SELL:**
   - Identifique 2-3 equipamentos complementares que o cliente ainda não tem
   - Para cada um, forneça:
     * Nome do produto (usar lista de equipamentos disponíveis)
     * Probabilidade de venda (0-100%)
     * Valor esperado
     * Timing ideal (ex: "Próximos 30 dias", "3-6 meses")
     * Razão estratégica convincente

5. **OPORTUNIDADES DE UPSELL:**
   - Identifique 1-2 upgrades ou versões superiores
   - Para cada um, forneça os mesmos dados do cross-sell

6. **PREVISÃO DE PRÓXIMA COMPRA:**
   - Categoria de produto mais provável
   - Data estimada
   - Probabilidade
   - Valor estimado

7. **ESTRATÉGIA:**
   - Melhor abordagem de vendas
   - 3-5 gatilhos mentais mais efetivos para este perfil
   - 2-3 conteúdos/materiais recomendados para enviar
   - Melhor horário para contato
   - Objeções previstas

Seja ESPECÍFICO, use números REALISTAS baseados no mercado veterinário brasileiro.`,
      response_json_schema: {
        type: "object",
        properties: {
          ltv_12_months: { type: "number" },
          ltv_24_months: { type: "number" },
          ltv_36_months: { type: "number" },
          churn_risk: { type: "number" },
          conversion_probability: { type: "number" },
          best_approach: { type: "string" },
          optimal_contact_time: { type: "string" },
          key_triggers: {
            type: "array",
            items: { type: "string" }
          },
          predicted_objections: {
            type: "array",
            items: { type: "string" }
          },
          recommended_content: {
            type: "array",
            items: { type: "string" }
          },
          cross_sell_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          upsell_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          next_purchase_prediction: {
            type: "object",
            properties: {
              product_category: { type: "string" },
              estimated_date: { type: "string" },
              probability: { type: "number" },
              estimated_value: { type: "number" }
            }
          },
          product_adoption_rate: { type: "number" }
        }
      }
    });

    // Adicionar timestamp
    const analytics = {
      ...analyticsResult,
      last_ai_analysis: new Date().toISOString()
    };

    return Response.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Erro ao calcular análise preditiva:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});