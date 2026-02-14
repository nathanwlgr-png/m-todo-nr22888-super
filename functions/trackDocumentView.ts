import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_id, device_info, location } = await req.json();

    if (!tracking_id) {
      return Response.json({ error: 'tracking_id obrigatório' }, { status: 400 });
    }

    // Buscar documento de engagement
    const engagements = await base44.asServiceRole.entities.DocumentEngagement.filter({ tracking_id });
    
    if (engagements.length === 0) {
      return Response.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const engagement = engagements[0];
    const now = new Date().toISOString();
    
    // Atualizar contadores
    const viewHistory = engagement.view_history || [];
    viewHistory.push({
      timestamp: now,
      device_info: device_info || 'Desconhecido',
      location: location || 'Desconhecido'
    });

    const updates = {
      views_count: (engagement.views_count || 0) + 1,
      last_viewed_at: now,
      view_history: viewHistory
    };

    if (!engagement.first_viewed_at) {
      updates.first_viewed_at = now;
    }

    // Calcular engagement score baseado em visualizações
    const viewCount = updates.views_count;
    let engagementScore = 0;
    if (viewCount === 1) engagementScore = 30;
    else if (viewCount === 2) engagementScore = 50;
    else if (viewCount === 3) engagementScore = 70;
    else if (viewCount >= 4) engagementScore = 90;
    
    updates.engagement_score = engagementScore;

    // Inferir interesse
    if (viewCount === 1) updates.interest_level = 'baixo';
    else if (viewCount === 2) updates.interest_level = 'medio';
    else if (viewCount === 3) updates.interest_level = 'alto';
    else if (viewCount >= 4) updates.interest_level = 'muito_alto';

    await base44.asServiceRole.entities.DocumentEngagement.update(engagement.id, updates);

    // Atualizar engagement_score do cliente
    if (engagement.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: engagement.client_id });
      if (clients.length > 0) {
        const currentScore = clients[0].engagement_score || 0;
        const newScore = Math.min(100, currentScore + (viewCount >= 3 ? 10 : 5));
        await base44.asServiceRole.entities.Client.update(engagement.client_id, {
          engagement_score: newScore
        });
      }
    }

    return Response.json({ 
      success: true, 
      views: updates.views_count,
      engagement_score: updates.engagement_score,
      interest_level: updates.interest_level
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});