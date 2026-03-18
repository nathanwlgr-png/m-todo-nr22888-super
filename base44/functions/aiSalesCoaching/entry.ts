import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email, period_days = 30 } = await req.json();
    const targetEmail = user_email || user.email;

    // Fetch interactions
    const allInteractions = await base44.entities.Interaction.list();
    const userInteractions = allInteractions.filter(i => i.created_by === targetEmail);
    
    // Fetch WhatsApp messages
    const whatsappMessages = await base44.entities.WhatsAppMessage.filter({
      sent_by: targetEmail
    });

    // Fetch sales
    const sales = await base44.entities.Sale.filter({ salesperson: targetEmail });
    
    const totalInteractions = userInteractions.length;
    const closedSales = sales.filter(s => s.status === 'fechada').length;
    const conversionRate = totalInteractions > 0 ? (closedSales / totalInteractions) * 100 : 0;

    // Analyze patterns
    const successfulInteractions = userInteractions.filter(i => 
      i.outcome === 'positive' && i.ai_sentiment === 'positivo'
    );

    const unsuccessfulInteractions = userInteractions.filter(i =>
      i.outcome === 'negative' || i.ai_sentiment === 'negativo'
    );

    // Use AI to analyze
    const analysisPrompt = `
Analise o desempenho deste vendedor:

MÉTRICAS:
- Total de interações: ${totalInteractions}
- Vendas fechadas: ${closedSales}
- Taxa de conversão: ${conversionRate.toFixed(1)}%
- Interações positivas: ${successfulInteractions.length}
- Interações negativas: ${unsuccessfulInteractions.length}
- Mensagens WhatsApp enviadas: ${whatsappMessages.length}

EXEMPLOS DE INTERAÇÕES POSITIVAS:
${successfulInteractions.slice(0, 3).map(i => `- ${i.subject}: ${i.notes?.substring(0, 200)}`).join('\n')}

EXEMPLOS DE INTERAÇÕES NEGATIVAS:
${unsuccessfulInteractions.slice(0, 3).map(i => `- ${i.subject}: ${i.notes?.substring(0, 200)}`).join('\n')}

Forneça análise detalhada em JSON:
{
  "performance_score": (0-100),
  "strengths": [{"area": "", "description": "", "examples": []}],
  "areas_for_improvement": [{"area": "", "description": "", "priority": "alta|media|baixa", "actionable_tips": []}],
  "successful_patterns": [{"pattern": "", "success_rate": 0-100, "recommendation": ""}],
  "training_suggestions": [{"topic": "", "reason": "", "resources": []}]
}
`;

    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          performance_score: { type: "number" },
          strengths: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                area: { type: "string" },
                description: { type: "string" },
                examples: { type: "array", items: { type: "string" } }
              }
            }
          },
          areas_for_improvement: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" },
                actionable_tips: { type: "array", items: { type: "string" } }
              }
            }
          },
          successful_patterns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                success_rate: { type: "number" },
                recommendation: { type: "string" }
              }
            }
          },
          training_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                reason: { type: "string" },
                resources: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Calculate avg response time
    const responseTimes = userInteractions
      .filter(i => i.duration_minutes)
      .map(i => i.duration_minutes);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Create coaching session
    const coachingSession = await base44.asServiceRole.entities.SalesCoaching.create({
      user_email: targetEmail,
      user_name: user.full_name,
      analysis_date: new Date().toISOString(),
      period_analyzed: `${period_days} dias`,
      interactions_analyzed: totalInteractions,
      performance_score: aiAnalysis.performance_score,
      strengths: aiAnalysis.strengths,
      areas_for_improvement: aiAnalysis.areas_for_improvement,
      successful_patterns: aiAnalysis.successful_patterns,
      training_suggestions: aiAnalysis.training_suggestions,
      conversion_rate: conversionRate,
      avg_response_time: avgResponseTime,
      key_metrics: {
        leads_contacted: userInteractions.length,
        meetings_scheduled: userInteractions.filter(i => i.type === 'meeting').length,
        proposals_sent: userInteractions.filter(i => i.type === 'proposal_sent').length,
        deals_closed: closedSales
      }
    });

    return Response.json({
      success: true,
      coaching_session: coachingSession
    });

  } catch (error) {
    console.error('AI Coaching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});