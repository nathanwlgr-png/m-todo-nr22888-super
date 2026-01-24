import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { period_type = 'monthly' } = await req.json();

    // Buscar dados históricos
    const clients = await base44.entities.Client.list();
    const sales = await base44.entities.Sale.list();
    const interactions = await base44.entities.Interaction.list();
    const visits = await base44.entities.Visit.list();

    // Calcular métricas históricas
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const recentSales = sales.filter(s => new Date(s.sale_date) > thirtyDaysAgo);
    const lastMonthSales = sales.filter(s => new Date(s.sale_date) > sixtyDaysAgo && new Date(s.sale_date) <= thirtyDaysAgo);
    const twoMonthsAgoSales = sales.filter(s => new Date(s.sale_date) > ninetyDaysAgo && new Date(s.sale_date) <= sixtyDaysAgo);

    const hotClients = clients.filter(c => c.status === 'quente' && (c.purchase_score || 0) >= 70);
    const warmClients = clients.filter(c => c.status === 'morno' && (c.purchase_score || 0) >= 50);
    
    const recentInteractions = interactions.filter(i => new Date(i.created_date) > thirtyDaysAgo);
    const scheduledVisits = visits.filter(v => v.status === 'agendada');

    // Calcular velocidade do pipeline
    const closedSales = sales.filter(s => s.status === 'fechada');
    let avgPipelineVelocity = 30;
    
    if (closedSales.length > 0) {
      const velocities = closedSales.map(sale => {
        const client = clients.find(c => c.id === sale.client_id);
        if (!client || !client.created_date) return 30;
        const days = (new Date(sale.sale_date) - new Date(client.created_date)) / (1000 * 60 * 60 * 24);
        return days;
      }).filter(d => d > 0 && d < 365);
      
      avgPipelineVelocity = velocities.length > 0 
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
        : 30;
    }

    // Taxa de conversão
    const totalClients = clients.length;
    const convertedClients = new Set(sales.filter(s => s.status === 'fechada').map(s => s.client_id)).size;
    const conversionRate = totalClients > 0 ? (convertedClients / totalClients) * 100 : 5;

    // Preparar dados para IA
    const aiPrompt = `Você é um especialista em previsão de vendas e análise preditiva.

ANÁLISE HISTÓRICA DE VENDAS:
- Vendas últimos 30 dias: ${recentSales.length} (R$ ${recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')})
- Vendas 30-60 dias atrás: ${lastMonthSales.length} (R$ ${lastMonthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')})
- Vendas 60-90 dias atrás: ${twoMonthsAgoSales.length} (R$ ${twoMonthsAgoSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')})
- Total de clientes: ${totalClients}
- Taxa de conversão histórica: ${conversionRate.toFixed(1)}%

PIPELINE ATUAL:
- Clientes quentes (score ≥70): ${hotClients.length}
- Clientes mornos (score ≥50): ${warmClients.length}
- Velocidade média pipeline: ${avgPipelineVelocity.toFixed(0)} dias
- Interações últimos 30 dias: ${recentInteractions.length}
- Visitas agendadas: ${scheduledVisits.length}

MÉTRICAS DE ENGAJAMENTO:
- Total de interações: ${interactions.length}
- Total de visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Clientes com LTV estimado: ${clients.filter(c => c.ai_sales_intelligence?.ltv_24_months).length}
- Clientes segmento VIP/Champions: ${clients.filter(c => c.ai_segment === 'VIP' || c.ai_segment === 'Champions').length}

TAREFA:
Gere uma previsão de vendas para os próximos 30 dias (forecast mensal).

Retorne JSON estruturado:
{
  "predicted_sales_count": número inteiro de vendas previstas,
  "predicted_revenue": receita prevista em R$,
  "confidence_level": 0-100 (baseado na qualidade dos dados),
  "conversion_rate_forecast": taxa de conversão prevista %,
  "key_factors": [
    {
      "factor": "Nome do fator",
      "impact": "positive" | "negative" | "neutral",
      "weight": 1-10,
      "description": "Explicação detalhada"
    }
  ],
  "high_probability_clients": [
    {
      "client_id": "id do cliente",
      "client_name": "nome",
      "probability": 0-100,
      "expected_value": valor em R$,
      "expected_close_date": "YYYY-MM-DD",
      "reasoning": "por que tem alta probabilidade"
    }
  ],
  "market_conditions": {
    "trend": "growing" | "stable" | "declining",
    "seasonality_impact": "descrição do impacto sazonal",
    "external_factors": ["fator 1", "fator 2"]
  },
  "ai_reasoning": "explicação DETALHADA de como você chegou nesta previsão (3-4 parágrafos)",
  "recommendations": [
    "Recomendação 1 acionável",
    "Recomendação 2 acionável"
  ],
  "risk_factors": [
    "Risco 1",
    "Risco 2"
  ]
}

Use:
- Tendência histórica (crescimento/queda)
- Pipeline atual (clientes quentes/mornos)
- Velocidade de conversão
- Engajamento (interações, visitas)
- Sazonalidade (estamos em Janeiro/2026 - início de ano)
- Análise estatística (média móvel, regressão)

Seja REALISTA, não otimista demais. Base a confiança na qualidade dos dados.`;

    const forecast = await base44.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          predicted_sales_count: { type: "number" },
          predicted_revenue: { type: "number" },
          confidence_level: { type: "number" },
          conversion_rate_forecast: { type: "number" },
          key_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                impact: { type: "string" },
                weight: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          high_probability_clients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_id: { type: "string" },
                client_name: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                expected_close_date: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          },
          market_conditions: {
            type: "object",
            properties: {
              trend: { type: "string" },
              seasonality_impact: { type: "string" },
              external_factors: { type: "array", items: { type: "string" } }
            }
          },
          ai_reasoning: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Mapear clientes de alta probabilidade
    const highProbClients = forecast.high_probability_clients.map(hpc => {
      const client = clients.find(c => c.first_name === hpc.client_name);
      return {
        ...hpc,
        client_id: client?.id || hpc.client_id
      };
    });

    // Salvar previsão
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const savedForecast = await base44.entities.SalesForecast.create({
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      forecast_type: 'monthly',
      predicted_sales_count: forecast.predicted_sales_count,
      predicted_revenue: forecast.predicted_revenue,
      confidence_level: forecast.confidence_level,
      pipeline_velocity: avgPipelineVelocity,
      conversion_rate: forecast.conversion_rate_forecast,
      key_factors: forecast.key_factors,
      high_probability_clients: highProbClients,
      market_conditions: forecast.market_conditions,
      ai_reasoning: forecast.ai_reasoning,
      recommendations: forecast.recommendations,
      risk_factors: forecast.risk_factors,
      accuracy_score: 0
    });

    return Response.json({
      success: true,
      forecast: savedForecast,
      execution_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('Erro ao gerar previsão:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});