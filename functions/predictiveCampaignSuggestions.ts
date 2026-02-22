import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch CRM data
    const [clients, leads, sales, tasks, interactions] = await Promise.all([
      base44.entities.Client?.list('-updated_date', 100).catch(() => []),
      base44.entities.Lead?.list('-updated_date', 100).catch(() => []),
      base44.entities.Sale?.list('-updated_date', 50).catch(() => []),
      base44.entities.Task?.list('-updated_date', 50).catch(() => []),
      base44.entities.Interaction?.list('-updated_date', 100).catch(() => [])
    ]);

    // Analyze data patterns
    const clientsByStatus = {
      hot: clients.filter(c => c.status === 'quente').length,
      warm: clients.filter(c => c.status === 'morno').length,
      cold: clients.filter(c => c.status === 'frio').length
    };

    const leadsByStage = {
      new: leads.filter(l => l.stage === 'novo').length,
      contacted: leads.filter(l => l.stage === 'em_contato').length,
      qualified: leads.filter(l => l.stage === 'qualificado').length,
      negotiation: leads.filter(l => l.stage === 'negociacao').length,
      converted: leads.filter(l => l.stage === 'convertido').length
    };

    const avgSaleValue = sales.length > 0 ? sales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / sales.length : 0;
    const conversionRate = leads.length > 0 ? (leadsByStage.converted / leads.length * 100).toFixed(1) : 0;

    const positiveInteractions = interactions.filter(i => i.sentiment === 'positive').length;
    const totalInteractions = interactions.length;
    const sentiment = totalInteractions > 0 ? (positiveInteractions / totalInteractions * 100).toFixed(1) : 50;

    // Generate suggestions via AI
    const prompt = `Analyze this CRM data and suggest 3 high-impact marketing campaigns:

DATA:
- Clients: ${clientsByStatus.hot} hot, ${clientsByStatus.warm} warm, ${clientsByStatus.cold} cold
- Leads: ${leadsByStage.new} new, ${leadsByStage.contacted} contacted, ${leadsByStage.qualified} qualified, ${leadsByStage.negotiation} in negotiation, ${leadsByStage.converted} converted
- Average Sale Value: R$ ${avgSaleValue.toFixed(2)}
- Conversion Rate: ${conversionRate}%
- Positive Sentiment: ${sentiment}%
- Total Interactions: ${totalInteractions}

For EACH of the 3 campaigns, provide a JSON response with:
{
  "campaigns": [
    {
      "name": "Campaign name",
      "type": "reactivation|nurture|expansion|acquisition",
      "target_segment": "who should receive this",
      "success_probability": 75,
      "expected_roi": 320,
      "duration_days": 30,
      "description": "brief campaign description",
      "channel_primary": "email|whatsapp|both",
      "ad_copy": "compelling ad text (max 2 lines)",
      "email_subject": "subject line",
      "email_body": "email content (2-3 paragraphs)",
      "success_factors": ["factor1", "factor2", "factor3"],
      "risks": ["risk1", "risk2"]
    }
  ]
}

Make campaigns highly specific to the data patterns. Ensure probability and ROI are realistic based on conversion rates.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          campaigns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                target_segment: { type: 'string' },
                success_probability: { type: 'number' },
                expected_roi: { type: 'number' },
                duration_days: { type: 'number' },
                description: { type: 'string' },
                channel_primary: { type: 'string' },
                ad_copy: { type: 'string' },
                email_subject: { type: 'string' },
                email_body: { type: 'string' },
                success_factors: { type: 'array', items: { type: 'string' } },
                risks: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    return Response.json({
      campaigns: aiResponse.campaigns || [],
      analysis: {
        clientsByStatus,
        leadsByStage,
        avgSaleValue,
        conversionRate,
        sentiment
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});