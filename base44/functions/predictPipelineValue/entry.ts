import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leads } = body;

    if (!leads || leads.length === 0) {
      return Response.json({
        periods: [
          { days: 30, expected_value: 0, probability: 0, deals_count: 0 },
          { days: 60, expected_value: 0, probability: 0, deals_count: 0 },
          { days: 90, expected_value: 0, probability: 0, deals_count: 0 }
        ],
        total_by_stage: {},
        risks: [],
        opportunities: [],
        confidence_score: 0,
        chart_data: []
      });
    }

    // Prepare lead data for analysis
    const leadData = leads.map(lead => ({
      id: lead.id,
      name: lead.full_name,
      stage: lead.stage,
      estimated_deal_value: lead.estimated_deal_value || 0,
      conversion_probability: lead.conversion_probability || 50,
      stage_entered: lead.created_date,
      last_interaction: lead.engagement_metrics?.last_engagement || lead.created_date,
      buying_signals: lead.buying_signals || [],
      score: lead.predictive_score || 50
    }));

    // Call LLM for AI-powered pipeline forecasting
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de vendas especializado em previsões de pipeline. 

DADOS DOS LEADS:
${JSON.stringify(leadData, null, 2)}

Analise este pipeline e:

1. CALCULE para 30, 60 e 90 dias:
   - expected_value: valor total esperado em R$ (conversion_probability × deal_value)
   - probability: probabilidade média ponderada de conversão (%)
   - deals_count: número esperado de conversões
   
2. IDENTIFIQUE riscos:
   - Leads parados há muito tempo
   - Baixa probabilidade de conversão
   - Leads em estágio inicial sem movimento

3. IDENTIFIQUE oportunidades:
   - Quick wins (alta score, baixo tempo em negociação)
   - Cross-sell/upsell potencial
   - Leads com alto score mas ainda em contato

4. CONFIANÇA:
   - confidence_score (0-100) baseado em dados históricos
   - Quanto mais interações e dados, mais alta a confiança

5. TREND:
   - Crie dados de chart_data com evolução diária

Retorne JSON exatamente assim:
{
  "periods": [
    {"days": 30, "expected_value": NUMBER, "probability": NUMBER, "deals_count": NUMBER},
    {"days": 60, "expected_value": NUMBER, "probability": NUMBER, "deals_count": NUMBER},
    {"days": 90, "expected_value": NUMBER, "probability": NUMBER, "deals_count": NUMBER}
  ],
  "total_by_stage": {
    "em_contato": NUMBER,
    "qualificado": NUMBER,
    "negociacao": NUMBER
  },
  "risks": [
    {"risk": "string", "impact": "string"}
  ],
  "opportunities": [
    {"opportunity": "string", "action": "string"}
  ],
  "confidence_score": NUMBER,
  "chart_data": [
    {"day": "Day N", "value": NUMBER}
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          periods: {
            type: "array",
            items: {
              type: "object",
              properties: {
                days: { type: "number" },
                expected_value: { type: "number" },
                probability: { type: "number" },
                deals_count: { type: "number" }
              }
            }
          },
          total_by_stage: { type: "object" },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opportunity: { type: "string" },
                action: { type: "string" }
              }
            }
          },
          confidence_score: { type: "number" },
          chart_data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                value: { type: "number" }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error in predictPipelineValue:', error);
    return Response.json({
      periods: [
        { days: 30, expected_value: 0, probability: 0, deals_count: 0 },
        { days: 60, expected_value: 0, probability: 0, deals_count: 0 },
        { days: 90, expected_value: 0, probability: 0, deals_count: 0 }
      ],
      total_by_stage: {},
      risks: [],
      opportunities: [],
      confidence_score: 0,
      chart_data: [],
      error: error.message
    }, { status: 500 });
  }
});