import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_id, device_info, location, time_spent_seconds, downloaded } = await req.json();

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
    
    // Detectar dispositivo automaticamente se não fornecido
    const userAgent = req.headers.get('user-agent') || '';
    const autoDeviceInfo = device_info || (
      /mobile|android|iphone|ipad/i.test(userAgent) ? 'Mobile' :
      /tablet|ipad/i.test(userAgent) ? 'Tablet' : 'Desktop'
    );

    // Atualizar contadores e histórico
    const viewHistory = engagement.view_history || [];
    viewHistory.push({
      timestamp: now,
      device_info: autoDeviceInfo,
      location: location || 'Desconhecido',
      time_spent: time_spent_seconds || 0
    });

    const updates = {
      views_count: (engagement.views_count || 0) + 1,
      last_viewed_at: now,
      view_history: viewHistory,
      time_spent_seconds: (engagement.time_spent_seconds || 0) + (time_spent_seconds || 0)
    };

    if (downloaded) {
      updates.downloaded = true;
    }

    if (!engagement.first_viewed_at) {
      updates.first_viewed_at = now;
    }

    // Calcular engagement score GRANULAR baseado em visualizações + tempo
    const viewCount = updates.views_count;
    const totalTime = updates.time_spent_seconds;
    
    let engagementScore = 0;
    
    // Score base por visualizações
    if (viewCount === 1) engagementScore = 20;
    else if (viewCount === 2) engagementScore = 40;
    else if (viewCount === 3) engagementScore = 60;
    else if (viewCount >= 4) engagementScore = 80;
    
    // Bônus por tempo (até +20 pontos)
    if (totalTime > 0) {
      const timeBonus = Math.min(20, Math.floor(totalTime / 30)); // +1 ponto a cada 30s
      engagementScore += timeBonus;
    }
    
    // Bônus por download (+10 pontos)
    if (updates.downloaded) {
      engagementScore += 10;
    }
    
    updates.engagement_score = Math.min(100, engagementScore);

    // Inferir interesse baseado em score combinado
    const finalScore = updates.engagement_score;
    if (finalScore >= 80) updates.interest_level = 'muito_alto';
    else if (finalScore >= 60) updates.interest_level = 'alto';
    else if (finalScore >= 40) updates.interest_level = 'medio';
    else if (finalScore >= 20) updates.interest_level = 'baixo';
    else updates.interest_level = 'nenhum';

    await base44.asServiceRole.entities.DocumentEngagement.update(engagement.id, updates);

    // Atualizar engagement_score do cliente com cálculo mais sofisticado
    if (engagement.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: engagement.client_id });
      if (clients.length > 0) {
        const currentScore = clients[0].engagement_score || 0;
        
        // Score incremental baseado em interesse
        let increment = 0;
        if (updates.interest_level === 'muito_alto') increment = 15;
        else if (updates.interest_level === 'alto') increment = 10;
        else if (updates.interest_level === 'medio') increment = 5;
        else increment = 2;
        
        const newScore = Math.min(100, currentScore + increment);
        
        await base44.asServiceRole.entities.Client.update(engagement.client_id, {
          engagement_score: newScore
        });
      }
    }

    // Criar alerta para alta prioridade (3+ views ou muito_alto)
    if (viewCount >= 3 || updates.interest_level === 'muito_alto') {
      try {
        await base44.asServiceRole.entities.Alert.create({
          client_id: engagement.client_id,
          type: 'high_engagement',
          title: `🔥 ALTA PRIORIDADE: ${engagement.client_name}`,
          message: `Visualizou "${engagement.document_title}" ${viewCount}x. Interesse: ${updates.interest_level}`,
          priority: 'high',
          action_required: true
        });
      } catch (error) {
        console.warn('Erro ao criar alerta (não crítico):', error);
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