import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id } = await req.json();

    // Fetch lead
    const lead = await base44.entities.Lead.filter({ id: lead_id });
    if (lead.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const leadData = lead[0];

    // Fetch all related data
    const interactions = await base44.entities.Interaction.filter({ 
      client_id: lead_id 
    });
    const whatsappMessages = await base44.entities.WhatsAppMessage.filter({ 
      contact_id: lead_id 
    });
    const documentEngagements = await base44.entities.DocumentEngagement?.filter({ 
      client_id: lead_id 
    }).catch(() => []);

    // Calculate CRM behavior
    const contactFrequency = interactions.length / 4; // per week estimate
    const positiveInteractions = interactions.filter(i => 
      i.outcome === 'positive' || i.ai_sentiment === 'positivo'
    ).length;
    const negativeInteractions = interactions.filter(i => 
      i.outcome === 'negative' || i.ai_sentiment === 'negativo'
    ).length;
    
    const documentsViewed = documentEngagements.filter(d => d.views_count > 0).length;
    const documentsDownloaded = documentEngagements.filter(d => d.downloaded).length;
    const proposalsViewed = documentEngagements.filter(d => 
      d.document_type === 'proposta' && d.views_count > 0
    ).length;

    // Calculate response time
    const responseTimes = [];
    for (let i = 1; i < interactions.length; i++) {
      if (interactions[i].direction === 'inbound' && interactions[i-1].direction === 'outbound') {
        const diff = new Date(interactions[i].created_date) - new Date(interactions[i-1].created_date);
        responseTimes.push(diff / (1000 * 60 * 60)); // hours
      }
    }
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : null;

    const crmBehavior = {
      contact_frequency: contactFrequency,
      avg_response_time_hours: avgResponseTime,
      positive_interactions: positiveInteractions,
      negative_interactions: negativeInteractions,
      documents_viewed: documentsViewed,
      documents_downloaded: documentsDownloaded,
      proposals_viewed: proposalsViewed
    };

    // Prepare AI analysis
    const analysisPrompt = `
Analise este lead e forneça um score detalhado:

LEAD: ${leadData.full_name} - ${leadData.company}
Origem: ${leadData.source}
Estágio: ${leadData.stage}
Orçamento: ${leadData.budget_range}
Urgência: ${leadData.urgency}
Tamanho empresa: ${leadData.company_size}

COMPORTAMENTO NO CRM:
- Frequência de contato: ${contactFrequency.toFixed(1)}/semana
- Tempo médio de resposta: ${avgResponseTime ? avgResponseTime.toFixed(1) + 'h' : 'N/A'}
- Interações positivas: ${positiveInteractions}
- Interações negativas: ${negativeInteractions}
- Documentos visualizados: ${documentsViewed}
- Documentos baixados: ${documentsDownloaded}
- Propostas visualizadas: ${proposalsViewed}
- Total interações: ${interactions.length}
- Mensagens WhatsApp: ${whatsappMessages.length}

ENGAJAMENTO EMAIL (se disponível):
${leadData.email_engagement ? JSON.stringify(leadData.email_engagement) : 'Não disponível'}

ANALYTICS WEB (se disponível):
${leadData.web_analytics ? JSON.stringify(leadData.web_analytics) : 'Não disponível'}

Forneça análise JSON:
{
  "ai_score": (0-100),
  "ai_score_breakdown": {
    "engagement_score": (0-100, baseado em interações e respostas),
    "fit_score": (0-100, baseado em orçamento e tamanho empresa),
    "intent_score": (0-100, baseado em urgência e comportamento),
    "timing_score": (0-100, baseado em estágio e momentum),
    "behavioral_score": (0-100, baseado em docs visualizados e padrão)
  },
  "score_reasons": [
    {
      "factor": "nome do fator",
      "impact": "positive|negative|neutral",
      "description": "explicação clara",
      "weight": 5-20 (peso do fator)
    }
  ],
  "recommended_action": "próxima melhor ação",
  "conversion_probability": (0-100),
  "ideal_contact_time": "melhor momento para contato"
}
`;

    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          ai_score: { type: "number" },
          ai_score_breakdown: {
            type: "object",
            properties: {
              engagement_score: { type: "number" },
              fit_score: { type: "number" },
              intent_score: { type: "number" },
              timing_score: { type: "number" },
              behavioral_score: { type: "number" }
            }
          },
          score_reasons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                impact: { type: "string" },
                description: { type: "string" },
                weight: { type: "number" }
              }
            }
          },
          recommended_action: { type: "string" },
          conversion_probability: { type: "number" },
          ideal_contact_time: { type: "string" }
        }
      }
    });

    // Update lead with enhanced scoring
    const updatedLead = await base44.asServiceRole.entities.Lead.update(lead_id, {
      ai_score: aiAnalysis.ai_score,
      ai_score_breakdown: aiAnalysis.ai_score_breakdown,
      score_reasons: aiAnalysis.score_reasons,
      crm_behavior: crmBehavior,
      ai_scored_at: new Date().toISOString(),
      lead_score: aiAnalysis.ai_score
    });

    // Create or update priority
    const existingPriority = await base44.entities.LeadPriority.filter({ lead_id });
    
    const priorityData = {
      lead_id,
      lead_name: leadData.full_name,
      assigned_to: leadData.assigned_to || user.email,
      priority_score: aiAnalysis.ai_score,
      priority_level: aiAnalysis.ai_score > 80 ? 'urgente' : 
                      aiAnalysis.ai_score > 65 ? 'alta' : 
                      aiAnalysis.ai_score > 50 ? 'media' : 'baixa',
      ai_reasoning: aiAnalysis.score_reasons.map(r => `${r.factor}: ${r.description}`),
      recommended_action: aiAnalysis.recommended_action,
      best_contact_time: aiAnalysis.ideal_contact_time,
      conversion_probability: aiAnalysis.conversion_probability,
      estimated_value: parseInt(leadData.budget_range?.replace(/[^0-9]/g, '') || '0') * 1000
    };

    if (existingPriority.length > 0) {
      await base44.asServiceRole.entities.LeadPriority.update(existingPriority[0].id, priorityData);
    } else {
      await base44.asServiceRole.entities.LeadPriority.create(priorityData);
    }

    return Response.json({
      success: true,
      lead: updatedLead,
      analysis: aiAnalysis
    });

  } catch (error) {
    console.error('Enhanced scoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});