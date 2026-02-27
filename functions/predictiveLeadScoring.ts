import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id, client_id, client_data, action } = body;

    // Suporte a client_id (clientes CRM) ou lead_id
    const targetId = lead_id || client_id;

    if (!targetId && !client_data) {
      return Response.json({ error: 'lead_id, client_id ou client_data obrigatório' }, { status: 400 });
    }
    
    if (!targetId && client_data) {
      // Score rápido local sem banco
      const score = Math.round(
        ((client_data.purchase_score || 50) * 0.4) +
        ((client_data.health_score || 50) * 0.3) +
        ((client_data.engagement_score || 30) * 0.3)
      );
      return Response.json({
        success: true,
        predictive_score: score,
        conversion_probability: score,
        priority_level: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low',
        next_best_action: score >= 70 ? 'Ligar agora e agendar demonstração' : 'Enviar conteúdo e nutrir',
      });
    }

    // Se veio client_data direto (score rápido sem banco)
    if (client_data && !lead_id) {
      const score = Math.round(
        ((client_data.purchase_score || 50) * 0.4) +
        ((client_data.health_score || 50) * 0.3) +
        ((client_data.engagement_score || 30) * 0.3)
      );
      return Response.json({
        success: true,
        client_id: targetId,
        predictive_score: score,
        conversion_probability: score,
        priority_level: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low',
        next_best_action: score >= 70 ? 'Ligar agora e agendar demonstração' : 'Enviar conteúdo e nutrir',
        score_breakdown: { purchase_score: client_data.purchase_score || 50, health_score: client_data.health_score || 50 }
      });
    }

    // Buscar lead e suas interações
    const lead = await base44.asServiceRole.entities.Lead.get(targetId).catch(async () => {
      // Tentar buscar como cliente
      return await base44.asServiceRole.entities.Client.get(targetId).catch(() => null);
    });
    const interactions = await base44.asServiceRole.entities.Interaction.filter({ 
      client_id: lead_id 
    }).catch(() => []);
    
    const documents = await base44.asServiceRole.entities.DocumentEngagement.filter({ 
      client_id: lead_id 
    }).catch(() => []);

    // Calcular scores individuais
    const engagementScore = calculateEngagementScore(lead, interactions, documents);
    const fitScore = calculateFitScore(lead);
    const intentScore = calculateIntentScore(lead, interactions);
    const timingScore = calculateTimingScore(lead);
    const interactionScore = calculateInteractionQuality(interactions);

    // Score preditivo ponderado
    const predictiveScore = Math.round(
      engagementScore * 0.25 +
      fitScore * 0.25 +
      intentScore * 0.30 +
      timingScore * 0.10 +
      interactionScore * 0.10
    );

    // Probabilidade de conversão usando IA
    const conversionProb = await calculateConversionProbability(
      base44,
      lead,
      interactions,
      predictiveScore
    );

    // Determinar prioridade
    let priority;
    if (predictiveScore >= 80) priority = 'critical';
    else if (predictiveScore >= 60) priority = 'high';
    else if (predictiveScore >= 40) priority = 'medium';
    else priority = 'low';

    // Gerar insights com IA
    const insights = await generateAIInsights(base44, lead, interactions, {
      engagementScore,
      fitScore,
      intentScore,
      timingScore,
      interactionScore
    });

    // Detectar sinais de compra
    const buyingSignals = detectBuyingSignals(lead, interactions);

    // Próxima melhor ação
    const nextAction = suggestNextAction(lead, predictiveScore, buyingSignals);

    // Atualizar apenas se for lead (não client)
    if (lead_id) await base44.asServiceRole.entities.Lead.update(lead_id, {
      predictive_score: predictiveScore,
      score_breakdown: {
        engagement_score: engagementScore,
        fit_score: fitScore,
        intent_score: intentScore,
        timing_score: timingScore,
        interaction_score: interactionScore
      },
      priority_level: priority,
      conversion_probability: conversionProb,
      ai_insights: insights,
      buying_signals: buyingSignals,
      next_best_action: nextAction,
      last_score_update: new Date().toISOString()
    }).catch(() => {});

    return Response.json({
      success: true,
      lead_id,
      predictive_score: predictiveScore,
      priority_level: priority,
      conversion_probability: conversionProb,
      score_breakdown: {
        engagement_score: engagementScore,
        fit_score: fitScore,
        intent_score: intentScore,
        timing_score: timingScore,
        interaction_score: interactionScore
      },
      insights,
      buying_signals: buyingSignals,
      next_best_action: nextAction
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function calculateEngagementScore(lead, interactions, documents) {
  let score = 0;
  
  // Métricas de engajamento
  const metrics = lead.engagement_metrics || {};
  if (metrics.emails_opened > 0) score += 15;
  if (metrics.emails_clicked > 0) score += 20;
  if (metrics.whatsapp_responses > 2) score += 25;
  if (metrics.website_visits > 3) score += 15;
  if (metrics.documents_viewed > 0) score += 15;
  
  // Interações recentes
  const recentInteractions = interactions.filter(i => {
    const days = (Date.now() - new Date(i.created_date).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  });
  
  if (recentInteractions.length > 0) score += 10;
  
  return Math.min(score, 100);
}

function calculateFitScore(lead) {
  let score = 0;
  
  // Tamanho da empresa
  const sizeScore = {
    '1-10': 50,
    '11-50': 75,
    '51-200': 90,
    '200+': 100
  };
  score += (sizeScore[lead.company_size] || 50) * 0.3;
  
  // Orçamento
  const budgetScore = {
    'ate_50k': 50,
    '50k_100k': 75,
    '100k_200k': 90,
    '200k+': 100
  };
  score += (budgetScore[lead.budget_range] || 50) * 0.4;
  
  // Localização (prioridade para região)
  if (lead.city?.match(/Marília|Bauru|Assis|Ourinhos|Tupã/i)) {
    score += 30;
  } else {
    score += 15;
  }
  
  return Math.round(score);
}

function calculateIntentScore(lead, interactions) {
  let score = 0;
  
  // Urgência
  const urgencyScore = {
    'imediata': 100,
    '1_3_meses': 75,
    '3_6_meses': 50,
    '6_meses+': 25
  };
  score += (urgencyScore[lead.urgency] || 25) * 0.4;
  
  // Interesse específico
  if (lead.interest) score += 20;
  
  // Interações de qualidade (perguntas sobre produto, preço)
  const qualityInteractions = interactions.filter(i => 
    i.notes?.match(/preço|proposta|demonstração|orçamento|compra/i)
  );
  score += Math.min(qualityInteractions.length * 15, 40);
  
  return Math.min(score, 100);
}

function calculateTimingScore(lead) {
  const createdDate = new Date(lead.created_date);
  const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Timing ideal: 1-14 dias
  if (daysSinceCreated <= 3) return 100;
  if (daysSinceCreated <= 7) return 85;
  if (daysSinceCreated <= 14) return 70;
  if (daysSinceCreated <= 30) return 50;
  return 30;
}

function calculateInteractionQuality(interactions) {
  if (interactions.length === 0) return 0;
  
  let score = 0;
  
  // Sentimento positivo
  const positive = interactions.filter(i => i.sentiment === 'positive').length;
  score += (positive / interactions.length) * 50;
  
  // Respostas rápidas
  const quickResponses = interactions.filter(i => i.direction === 'inbound').length;
  score += Math.min(quickResponses * 10, 30);
  
  // Interações outbound (proatividade)
  const outbound = interactions.filter(i => i.direction === 'outbound').length;
  score += Math.min(outbound * 5, 20);
  
  return Math.round(score);
}

async function calculateConversionProbability(base44, lead, interactions, score) {
  try {
    const prompt = `Baseado nos dados abaixo, calcule a probabilidade de conversão deste lead em % (0-100):

LEAD:
- Nome: ${lead.full_name}
- Empresa: ${lead.company || 'N/A'}
- Interesse: ${lead.interest || 'N/A'}
- Orçamento: ${lead.budget_range || 'N/A'}
- Urgência: ${lead.urgency || 'N/A'}
- Score Preditivo: ${score}

INTERAÇÕES: ${interactions.length} interações
- Positivas: ${interactions.filter(i => i.sentiment === 'positive').length}
- Negativas: ${interactions.filter(i => i.sentiment === 'negative').length}

Responda APENAS com um número de 0 a 100.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          probability: { type: "number" }
        }
      }
    });

    return response.probability || score;
  } catch (error) {
    return score; // Fallback para o score calculado
  }
}

async function generateAIInsights(base44, lead, interactions, scores) {
  try {
    const prompt = `Analise este lead e gere 3-5 insights estratégicos:

LEAD: ${lead.full_name} | ${lead.company || 'N/A'}
INTERESSE: ${lead.interest || 'N/A'}

SCORES:
- Engajamento: ${scores.engagementScore}/100
- Fit com ICP: ${scores.fitScore}/100
- Intenção: ${scores.intentScore}/100
- Timing: ${scores.timingScore}/100

INTERAÇÕES: ${interactions.length}

Gere insights práticos e acionáveis.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                insight: { type: "string" },
                confidence: { type: "number" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.insights || [];
  } catch (error) {
    return [];
  }
}

function detectBuyingSignals(lead, interactions) {
  const signals = [];
  
  if (lead.urgency === 'imediata') signals.push('Urgência imediata');
  if (lead.budget_range?.includes('100k') || lead.budget_range?.includes('200k')) {
    signals.push('Orçamento qualificado');
  }
  
  interactions.forEach(i => {
    if (i.notes?.match(/preço|quanto custa/i)) signals.push('Perguntou sobre preço');
    if (i.notes?.match(/demonstração|demo/i)) signals.push('Pediu demonstração');
    if (i.notes?.match(/proposta|orçamento/i)) signals.push('Solicitou proposta');
    if (i.notes?.match(/quando|prazo/i)) signals.push('Perguntou sobre prazos');
  });
  
  return [...new Set(signals)];
}

function suggestNextAction(lead, score, signals) {
  if (score >= 80) {
    return 'URGENTE: Ligar agora e agendar demonstração';
  } else if (score >= 60) {
    return 'Enviar proposta personalizada e agendar call';
  } else if (score >= 40) {
    return 'Nutrir com conteúdo educacional e cases de sucesso';
  } else {
    return 'Adicionar em campanha de nurturing automatizada';
  }
}