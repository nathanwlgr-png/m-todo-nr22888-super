import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const visit = payload.data || null;
    const visitId = payload.event?.entity_id || payload.visit_id || visit?.id;

    if (!visitId && !visit) {
      return Response.json({ success: false, reason: 'Visita não informada' }, { status: 400 });
    }

    const visitData = visit || await base44.asServiceRole.entities.Visit.get(visitId);
    if (!visitData || visitData.status === 'cancelada') {
      return Response.json({ success: true, skipped: true, reason: 'Visita cancelada ou não encontrada' });
    }

    const clientId = visitData.client_id;
    if (!clientId) {
      return Response.json({ success: true, skipped: true, reason: 'Visita sem cliente vinculado' });
    }

    const existingTasks = await base44.asServiceRole.entities.Task.filter({ source_visit_id: visitData.id || visitId, type: 'follow_up' }).catch(() => []);
    if (existingTasks.length > 0) {
      return Response.json({ success: true, skipped: true, reason: 'Follow-up já existe', task_id: existingTasks[0].id });
    }

    const client = await base44.asServiceRole.entities.Client.get(clientId).catch(() => null);
    const visitDate = new Date(visitData.scheduled_date || visitData.created_date || new Date().toISOString());
    const followupDate = new Date(visitDate.getTime() + 48 * 60 * 60 * 1000);
    const followupDateOnly = followupDate.toISOString().slice(0, 10);
    const clientName = visitData.client_name || client?.clinic_name || client?.full_name || client?.first_name || 'Clínica';

    const task = await base44.asServiceRole.entities.Task.create({
      client_id: clientId,
      client_name: clientName,
      title: `Follow-up 48h pós-visita — ${clientName}`,
      description: `Alerta automático para retomar contato 48h após a visita registrada em ${visitDate.toLocaleString('pt-BR')}. Próximo passo sugerido: enviar WhatsApp curto, validar interesse, tratar objeções e avançar para proposta se houver sinal de compra.`,
      due_date: followupDateOnly,
      followup_due_at: followupDate.toISOString(),
      source_visit_id: visitData.id || visitId,
      followup_alert_sent: false,
      status: 'pendente',
      priority: client?.status === 'quente' || Number(client?.purchase_score || 0) >= 80 ? 'alta' : 'media',
      type: 'follow_up',
      auto_created: true,
      assigned_to: client?.created_by || visitData.created_by || undefined
    });

    return Response.json({ success: true, task_id: task.id, followup_due_at: followupDate.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});