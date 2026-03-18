import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json().catch(() => ({}));

    if (!client_id) {
      return Response.json({ error: 'client_id required' }, { status: 400 });
    }

    // Buscar cliente e dados relacionados
    const client = await base44.entities.Client.filter({ id: client_id }).catch(() => []);
    if (!client || client.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientData = client[0];

    // Buscar histórico de vendas
    const sales = await base44.entities.Sale.filter({ client_id }).catch(() => []);
    
    // Buscar interações
    const interactions = await base44.entities.Interaction.filter({ client_id }).catch(() => []);
    
    // Buscar visitas
    const visits = await base44.entities.Visit.filter({ client_id }).catch(() => []);

    // Calcular scores individuais
    const purchaseHistoryScore = calculatePurchaseScore(sales, clientData);
    const interactionScore = calculateInteractionScore(interactions, visits);
    const numerologyScore = calculateNumerologyScore(clientData);

    // Score consolidado (ponderado)
    const overallScore = Math.round(
      (purchaseHistoryScore * 0.4 + interactionScore * 0.35 + numerologyScore * 0.25)
    );

    // Determinar nível de engajamento
    const engagementLevel = getEngagementLevel(overallScore);
    
    // Calcular probabilidades
    const conversionProbability = calculateConversionProbability(
      overallScore,
      sales.length,
      interactions.length
    );
    
    const churnRisk = calculateChurnRisk(
      interactionScore,
      clientData.last_contact_date
    );

    // Gerar recomendações com IA
    const recommendations = await generateRecommendations(
      base44,
      clientData,
      { purchaseHistoryScore, interactionScore, numerologyScore, overallScore },
      { sales: sales.length, interactions: interactions.length, visits: visits.length }
    );

    // Salvar ou atualizar score
    const existingScore = await base44.entities.ClientScore.filter({ client_id }).catch(() => []);
    
    const scoreData = {
      client_id,
      purchase_history_score: purchaseHistoryScore,
      interaction_score: interactionScore,
      numerology_score: numerologyScore,
      overall_score: overallScore,
      engagement_level: engagementLevel,
      conversion_probability: conversionProbability,
      churn_risk: churnRisk,
      recommendations,
      score_breakdown: {
        purchase_weight: 0.4,
        interaction_weight: 0.35,
        numerology_weight: 0.25,
        sales_count: sales.length,
        interactions_count: interactions.length,
        visits_count: visits.length
      },
      last_calculated: new Date().toISOString()
    };

    if (existingScore && existingScore.length > 0) {
      await base44.entities.ClientScore.update(existingScore[0].id, scoreData);
    } else {
      await base44.entities.ClientScore.create(scoreData);
    }

    return Response.json({
      success: true,
      score: scoreData,
      metadata: {
        sales_count: sales.length,
        interactions_count: interactions.length,
        visits_count: visits.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculatePurchaseScore(sales, client) {
  let score = 0;
  
  // Quantidade de vendas
  const salesCount = sales.filter(s => s.status === 'fechada').length;
  score += Math.min(salesCount * 15, 40); // Máx 40 pontos
  
  // Valor total de compras
  const totalValue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  score += Math.min(totalValue / 1000, 30); // Máx 30 pontos por valor
  
  // Status de cliente
  if (client.sale_closed) score += 20; // 20 pontos se tem venda fechada
  
  // Equipamento vendido
  if (client.equipment_sold) score += 10;
  
  return Math.min(score, 100);
}

function calculateInteractionScore(interactions, visits) {
  let score = 0;
  
  // Frequência de interações
  const recentInteractions = interactions.filter(i => {
    const date = new Date(i.created_date);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return date > thirtyDaysAgo;
  });
  
  score += Math.min(recentInteractions.length * 10, 35); // Máx 35 pontos
  
  // Qualidade das interações (sentimento positivo)
  const positiveInteractions = interactions.filter(i => i.outcome === 'positive').length;
  score += Math.min(positiveInteractions * 8, 35); // Máx 35 pontos
  
  // Visitas realizadas
  const completedVisits = visits.filter(v => v.status === 'realizada').length;
  score += Math.min(completedVisits * 10, 30); // Máx 30 pontos
  
  return Math.min(score, 100);
}

function calculateNumerologyScore(client) {
  let score = 50; // Base neutra
  
  // Números de vida
  const lifePathNumber = client.life_path_number;
  if (lifePathNumber) {
    // Números auspiciosos para vendas: 1, 3, 8, 9
    if ([1, 3, 8, 9].includes(lifePathNumber)) {
      score += 20;
    } else if ([2, 4, 6, 7].includes(lifePathNumber)) {
      score += 10;
    }
  }
  
  // Perfil comportamental
  if (client.decision_style === 'assertivo') score += 15;
  if (client.client_tone === 'direto') score += 10;
  
  // Abordagem recomendada
  if (client.approach_tips) score += 5;
  
  return Math.min(score, 100);
}

function getEngagementLevel(score) {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

function calculateConversionProbability(overallScore, salesCount, interactionsCount) {
  let probability = overallScore;
  
  // Bônus por histórico
  if (salesCount > 0) probability += 10;
  if (interactionsCount > 5) probability += 5;
  
  return Math.min(probability, 100);
}

function calculateChurnRisk(interactionScore, lastContactDate) {
  if (!lastContactDate) return 80; // Sem contato = risco alto
  
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(lastContactDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  
  // Aumenta risco com cada dia sem contato
  let risk = 100 - interactionScore;
  risk += daysSinceContact * 0.5;
  
  return Math.min(risk, 100);
}

async function generateRecommendations(base44, client, scores, counts) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere 3-4 recomendações acionáveis para este cliente:

PERFIL:
- Nome: ${client.first_name}
- Score Geral: ${scores.overallScore}
- Score Compra: ${scores.purchaseHistoryScore}
- Score Interação: ${scores.interactionScore}
- Histórico: ${counts.sales_count} vendas, ${counts.interactions_count} interações, ${counts.visits_count} visitas
- Status: ${client.status}
- Tipo: ${client.client_type}

Retorne JSON:
{
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });
    
    return result.recommendations || [];
  } catch (error) {
    return ['Manter contato regular', 'Enviar conteúdo relevante', 'Agendar visita de follow-up'];
  }
}