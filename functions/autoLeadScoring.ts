import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    // Se lead_id específico, processar apenas um, senão todos
    const leads = lead_id 
      ? [await base44.asServiceRole.entities.Lead.get(lead_id)]
      : await base44.asServiceRole.entities.Lead.list();

    let processed = 0;

    for (const lead of leads) {
      try {
        // Buscar interações do lead
        const interactions = await base44.asServiceRole.entities.Interaction.filter({
          client_id: lead.id
        });

        // Buscar documentos visualizados
        const docEngagement = await base44.asServiceRole.entities.DocumentEngagement?.filter({
          client_id: lead.id
        }).catch(() => []);

        // Buscar tarefas
        const tasks = await base44.asServiceRole.entities.Task?.filter({
          client_id: lead.id
        }).catch(() => []);

        // Calcular fatores de engajamento
        const engagementFactors = {
          total_interactions: interactions.length,
          recent_interactions: interactions.filter(i => {
            const daysSince = (Date.now() - new Date(i.created_date)) / (1000 * 60 * 60 * 24);
            return daysSince <= 7;
          }).length,
          positive_sentiment: interactions.filter(i => i.sentiment === 'positive').length,
          negative_sentiment: interactions.filter(i => i.sentiment === 'negative').length,
          avg_sentiment_score: interactions.length > 0
            ? interactions.reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / interactions.length
            : 0,
          docs_viewed: docEngagement.reduce((sum, d) => sum + (d.views_count || 0), 0),
          docs_downloaded: docEngagement.filter(d => d.downloaded).length,
          response_received: interactions.filter(i => i.response_received).length,
          tasks_completed: tasks.filter(t => t.status === 'concluida').length
        };

        // Análise IA para scoring
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em qualificação de leads B2B. Calcule um score de 0-100.

DADOS DO LEAD:
- Nome: ${lead.full_name}
- Empresa: ${lead.company}
- Interesse: ${lead.interest}
- Origem: ${lead.source}
- Urgência: ${lead.urgency}
- Orçamento: ${lead.budget_range}
- Tamanho Empresa: ${lead.company_size}
- Estágio: ${lead.stage}

ENGAJAMENTO:
- Interações totais: ${engagementFactors.total_interactions}
- Interações últimos 7 dias: ${engagementFactors.recent_interactions}
- Sentimento médio: ${engagementFactors.avg_sentiment_score.toFixed(2)} (-1 a 1)
- Interações positivas: ${engagementFactors.positive_sentiment}
- Interações negativas: ${engagementFactors.negative_sentiment}
- Documentos visualizados: ${engagementFactors.docs_viewed}
- Downloads: ${engagementFactors.docs_downloaded}
- Respostas recebidas: ${engagementFactors.response_received}
- Tarefas concluídas: ${engagementFactors.tasks_completed}

ANALYTICS:
- Page views: ${lead.web_analytics?.page_views || 0}
- Tempo no site: ${lead.web_analytics?.time_on_site || 0}s
- Emails abertos: ${lead.email_engagement?.emails_opened || 0}
- Taxa abertura: ${lead.email_engagement?.open_rate || 0}%
- Cliques: ${lead.email_engagement?.emails_clicked || 0}

CALCULE:
1. Score total (0-100)
2. Breakdown por fator (engagement, fit, intent, timing, behavioral)
3. Razões do score (fatores positivos e negativos)
4. Prioridade (urgente/alta/media/baixa)
5. Ação recomendada específica
6. Melhor horário de contato

RETORNE JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              total_score: { type: "number" },
              breakdown: {
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
              priority_level: { type: "string" },
              recommended_action: { type: "string" },
              best_contact_time: { type: "string" }
            }
          }
        });

        // Atualizar lead
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          ai_score: aiAnalysis.total_score,
          ai_score_breakdown: aiAnalysis.breakdown,
          score_reasons: aiAnalysis.score_reasons,
          ai_scored_at: new Date().toISOString()
        });

        // Criar/atualizar prioridade
        const existingPriority = await base44.asServiceRole.entities.LeadPriority?.filter({
          lead_id: lead.id
        }).then(r => r[0]).catch(() => null);

        const priorityData = {
          lead_id: lead.id,
          lead_name: lead.full_name,
          assigned_to: lead.assigned_to,
          priority_score: aiAnalysis.total_score,
          priority_level: aiAnalysis.priority_level,
          ai_reasoning: aiAnalysis.score_reasons.map(r => r.description),
          recommended_action: aiAnalysis.recommended_action,
          best_contact_time: aiAnalysis.best_contact_time,
          conversion_probability: aiAnalysis.breakdown.intent_score,
          urgency_factors: aiAnalysis.score_reasons
            .filter(r => r.impact === 'positive')
            .map(r => r.factor),
          last_interaction: interactions[0]?.created_date,
          days_without_contact: interactions.length > 0
            ? Math.floor((Date.now() - new Date(interactions[0].created_date)) / (1000 * 60 * 60 * 24))
            : 999
        };

        if (existingPriority) {
          await base44.asServiceRole.entities.LeadPriority.update(existingPriority.id, priorityData);
        } else {
          await base44.asServiceRole.entities.LeadPriority.create(priorityData);
        }

        processed++;
      } catch (error) {
        console.error(`Error scoring lead ${lead.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      processed,
      total: leads.length
    });

  } catch (error) {
    console.error('Auto lead scoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});