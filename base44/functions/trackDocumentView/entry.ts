import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const trackingId = String(body.tracking_id || '');
    const eventType = String(body.event_type || 'load');
    const sessionId = String(body.session_id || '');
    if (!trackingId) return Response.json({ error: 'tracking_id obrigatório' }, { status: 400 });

    const engagements = await base44.asServiceRole.entities.DocumentEngagement.filter({ tracking_id: trackingId }, '-updated_date', 1);
    const engagement = engagements[0];
    if (!engagement) return Response.json({ error: 'Documento não encontrado' }, { status: 404 });

    const safeDocument = {
      document_title: engagement.document_title || 'Documento',
      document_type: engagement.document_type,
      document_url: engagement.document_url || ''
    };
    if (eventType === 'load') return Response.json({ document: safeDocument });
    if (!sessionId) return Response.json({ error: 'session_id obrigatório' }, { status: 400 });

    const now = new Date().toISOString();
    const userAgent = req.headers.get('user-agent') || '';
    const device = /tablet|ipad/i.test(userAgent) ? 'Tablet' : /mobile|android|iphone/i.test(userAgent) ? 'Mobile' : 'Desktop';
    const history = Array.isArray(engagement.view_history) ? [...engagement.view_history] : [];
    const sessionExists = history.some((view) => view.session_id === sessionId);
    const updates = { last_viewed_at: now };

    if (eventType === 'open' && !sessionExists) {
      history.push({ timestamp: now, device_info: device, session_id: sessionId, event_type: 'open' });
      updates.view_history = history.slice(-200);
      updates.views_count = (engagement.views_count || 0) + 1;
      updates.first_viewed_at = engagement.first_viewed_at || now;
    }

    if (eventType === 'heartbeat') {
      const delta = Math.max(0, Math.min(30, Number(body.active_seconds) || 0));
      updates.time_spent_seconds = Math.min(14400, (engagement.time_spent_seconds || 0) + delta);
    }

    if (eventType === 'download') updates.downloaded = true;

    const uniqueSessions = updates.views_count ?? engagement.views_count ?? 0;
    const activeTime = updates.time_spent_seconds ?? engagement.time_spent_seconds ?? 0;
    const downloaded = updates.downloaded ?? engagement.downloaded ?? false;
    updates.engagement_score = Math.min(100, Math.min(uniqueSessions, 4) * 15 + Math.min(25, Math.floor(activeTime / 60) * 5) + (downloaded ? 15 : 0));
    updates.interest_level = updates.engagement_score >= 70 ? 'alto' : updates.engagement_score >= 40 ? 'medio' : updates.engagement_score >= 15 ? 'baixo' : 'nenhum';

    await base44.asServiceRole.entities.DocumentEngagement.update(engagement.id, updates);

    if (updates.engagement_score >= 60 && engagement.client_id) {
      const pending = await base44.asServiceRole.entities.CRMUpdateQueue.filter({ origem: 'sistema', cliente_id: engagement.client_id, tipo_atualizacao: 'documento_interesse', status: 'pendente' }, '-created_date', 1);
      if (!pending.length) await base44.asServiceRole.entities.CRMUpdateQueue.create({
        origem: 'sistema', texto_original: `Sinal de acesso ao documento ${engagement.id}`,
        comando_interpretado: 'Revisar sinal de interesse em documento', cliente_id: engagement.client_id,
        tipo_atualizacao: 'documento_interesse', campo_alvo: 'proxima_acao', valor_novo: 'Revisar engajamento do documento',
        status: 'pendente', risco: 'baixo', exige_aprovacao: true, data_criacao: now,
        observacao: 'Abertura, tempo ativo e download são sinais; não comprovam leitura integral nem intenção de compra.'
      });
    }

    return Response.json({ success: true, unique_sessions: uniqueSessions, active_time_seconds: activeTime, downloaded, signal_score: updates.engagement_score, official_status_changed: false, gps_collected: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});