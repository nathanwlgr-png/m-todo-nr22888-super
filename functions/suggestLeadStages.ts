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
      return Response.json({ suggestions: {} });
    }

    // Call LLM to analyze leads and suggest optimal stages
    const leadContext = leads.map(lead => ({
      id: lead.id,
      name: lead.full_name,
      company: lead.company,
      current_stage: lead.stage,
      score: lead.predictive_score || 0,
      engagement: lead.engagement_metrics?.last_engagement ? 
        Math.floor((Date.now() - new Date(lead.engagement_metrics.last_engagement).getTime()) / (1000 * 60 * 60 * 24)) : 30,
      buying_signals: lead.buying_signals || [],
      interactions: lead.engagement_metrics || {},
      budget: lead.estimated_deal_value || 0
    }));

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas. Analise estes leads e sugira o estágio ideal para cada um no pipeline.

LEADS:
${JSON.stringify(leadContext, null, 2)}

ESTÁGIOS: novo, em_contato, qualificado, negociacao, convertido, perdido

Para cada lead, retorne:
1. recommended_stage: estágio ideal baseado em score, sinais de compra e histórico de engagement
2. reason: breve explicação

Considere:
- Score preditivo alto = mais avançado no pipeline
- Sinais de compra = qualificado ou negociação
- Engagement recente (< 7 dias) = em_contato ou qualificado
- Sem engagement > 30 dias = novo ou frio
- Budget > R$ 50k = negociação avançada

Retorne um JSON com formato:
{
  "lead_id": {
    "recommended_stage": "stage_name",
    "reason": "brief explanation"
  }
}`,
      response_json_schema: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            recommended_stage: { type: "string" },
            reason: { type: "string" }
          }
        }
      }
    });

    return Response.json({ suggestions: response });
  } catch (error) {
    console.error('Error in suggestLeadStages:', error);
    return Response.json({ error: error.message, suggestions: {} }, { status: 500 });
  }
});