import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar todos os clientes
    const clients = await base44.entities.Client.list('-updated_date', 1000).catch(() => []);
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Processar cada cliente
    for (const client of clients) {
      try {
        processed++;
        
        // Buscar dados relacionados
        const [sales, interactions, visits] = await Promise.all([
          base44.entities.Sale.filter({ client_id: client.id }).catch(() => []),
          base44.entities.Interaction.filter({ client_id: client.id }).catch(() => []),
          base44.entities.Visit.filter({ client_id: client.id }).catch(() => [])
        ]);

        // Calcular scores
        const purchaseHistoryScore = calculatePurchaseScore(sales, client);
        const interactionScore = calculateInteractionScore(interactions, visits);
        const numerologyScore = calculateNumerologyScore(client);

        const overallScore = Math.round(
          (purchaseHistoryScore * 0.4 + interactionScore * 0.35 + numerologyScore * 0.25)
        );

        const engagementLevel = getEngagementLevel(overallScore);
        const conversionProbability = calculateConversionProbability(
          overallScore,
          sales.length,
          interactions.length
        );
        const churnRisk = calculateChurnRisk(interactionScore, client.last_contact_date);

        const scoreData = {
          client_id: client.id,
          purchase_history_score: purchaseHistoryScore,
          interaction_score: interactionScore,
          numerology_score: numerologyScore,
          overall_score: overallScore,
          engagement_level: engagementLevel,
          conversion_probability: conversionProbability,
          churn_risk: churnRisk,
          score_breakdown: {
            sales_count: sales.length,
            interactions_count: interactions.length,
            visits_count: visits.length
          },
          last_calculated: new Date().toISOString()
        };

        // Salvar ou atualizar
        const existing = await base44.entities.ClientScore.filter({ client_id: client.id }).catch(() => []);
        
        if (existing && existing.length > 0) {
          await base44.entities.ClientScore.update(existing[0].id, scoreData);
        } else {
          await base44.entities.ClientScore.create(scoreData);
        }

        succeeded++;
      } catch (error) {
        failed++;
        console.error(`Erro ao processar cliente ${client.id}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_clients: clients.length,
        processed: processed,
        succeeded: succeeded,
        failed: failed,
        message: `✅ Scores recalculados: ${succeeded}/${clients.length} clientes processados`
      }
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});

function calculatePurchaseScore(sales, client) {
  let score = 0;
  const salesCount = sales.filter(s => s.status === 'fechada').length;
  score += Math.min(salesCount * 15, 40);
  const totalValue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  score += Math.min(totalValue / 1000, 30);
  if (client.sale_closed) score += 20;
  if (client.equipment_sold) score += 10;
  return Math.min(score, 100);
}

function calculateInteractionScore(interactions, visits) {
  let score = 0;
  const recentInteractions = interactions.filter(i => {
    const date = new Date(i.created_date);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return date > thirtyDaysAgo;
  });
  score += Math.min(recentInteractions.length * 10, 35);
  const positiveInteractions = interactions.filter(i => i.outcome === 'positive').length;
  score += Math.min(positiveInteractions * 8, 35);
  const completedVisits = visits.filter(v => v.status === 'realizada').length;
  score += Math.min(completedVisits * 10, 30);
  return Math.min(score, 100);
}

function calculateNumerologyScore(client) {
  let score = 50;
  const lifePathNumber = client.life_path_number;
  if (lifePathNumber) {
    if ([1, 3, 8, 9].includes(lifePathNumber)) {
      score += 20;
    } else if ([2, 4, 6, 7].includes(lifePathNumber)) {
      score += 10;
    }
  }
  if (client.decision_style === 'assertivo') score += 15;
  if (client.client_tone === 'direto') score += 10;
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
  if (salesCount > 0) probability += 10;
  if (interactionsCount > 5) probability += 5;
  return Math.min(probability, 100);
}

function calculateChurnRisk(interactionScore, lastContactDate) {
  if (!lastContactDate) return 80;
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(lastContactDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  let risk = 100 - interactionScore;
  risk += daysSinceContact * 0.5;
  return Math.min(risk, 100);
}