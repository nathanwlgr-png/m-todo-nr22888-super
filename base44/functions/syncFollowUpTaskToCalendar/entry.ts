import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const GCAL = 'https://www.googleapis.com/calendar/v3/calendars/primary';

// Sincroniza uma Tarefa de follow-up para o Google Calendar do dono da conta (modo shared).
// Chamada pelo workflow "Follow-up → Google Calendar" no create/update de Task.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const taskId = body.task_id || body.entity_id;

    if (!taskId) {
      return Response.json({ success: false, reason: 'task_id ausente' });
    }

    const task = await base44.asServiceRole.entities.Task.get(taskId).catch(() => null);
    if (!task) {
      return Response.json({ success: false, reason: 'Tarefa não encontrada' });
    }

    // Só sincroniza tarefas de follow-up ainda pendentes
    if (task.type !== 'follow_up') {
      return Response.json({ success: true, reason: 'Não é follow-up, ignorada' });
    }
    if (task.status && task.status !== 'pendente') {
      // Se foi concluída/cancelada e tinha evento, remove da agenda
      if (task.google_calendar_event_id) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
          await fetch(`${GCAL}/events/${task.google_calendar_event_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }).catch(() => {});
          await base44.asServiceRole.entities.Task.update(taskId, {
            google_calendar_synced: false,
            google_calendar_event_id: null,
          });
        } catch (_) { /* conector indisponível — ignora */ }
      }
      return Response.json({ success: true, action: 'removed_inactive' });
    }

    // Determinar data/hora do evento
    const whenStr = task.followup_due_at || (task.due_date ? `${task.due_date}T09:00:00` : null);
    const start = whenStr ? new Date(whenStr) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return Response.json({ success: false, reason: 'Tarefa sem data válida' });
    }
    const end = new Date(start.getTime() + 30 * 60000); // 30 min

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ success: false, reason: 'Google Calendar não conectado' });
    }
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const eventBody = {
      summary: `🔔 Follow-up: ${task.client_name || task.title}`,
      description: [
        `CRM NR22 | Follow-up`,
        task.title ? `\n${task.title}` : '',
        task.description ? `\n📝 ${task.description}` : '',
        `\n🔗 Tarefa ID: ${taskId}`,
      ].join(''),
      start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
      colorId: '5', // banana (follow-up)
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
      extendedProperties: { private: { crm_task_id: taskId } },
    };

    let gcalRes;
    let action;

    if (task.google_calendar_event_id) {
      const checkRes = await fetch(`${GCAL}/events/${task.google_calendar_event_id}`, { method: 'GET', headers });
      if (checkRes.status === 404 || checkRes.status === 410) {
        gcalRes = await fetch(`${GCAL}/events`, { method: 'POST', headers, body: JSON.stringify(eventBody) });
        action = 'created_after_missing';
      } else if (checkRes.ok) {
        gcalRes = await fetch(`${GCAL}/events/${task.google_calendar_event_id}`, { method: 'PUT', headers, body: JSON.stringify(eventBody) });
        action = 'updated';
      } else {
        return Response.json({ success: false, error: `GCal check ${checkRes.status}` });
      }
    } else {
      // anti-duplicata por crm_task_id
      const searchRes = await fetch(
        `${GCAL}/events?privateExtendedProperty=crm_task_id%3D${encodeURIComponent(taskId)}&maxResults=1`,
        { method: 'GET', headers }
      );
      if (searchRes.ok) {
        const s = await searchRes.json();
        if (s.items && s.items.length > 0) {
          gcalRes = await fetch(`${GCAL}/events/${encodeURIComponent(s.items[0].id)}`, { method: 'PUT', headers, body: JSON.stringify(eventBody) });
          action = 'updated_existing';
        }
      }
      if (!gcalRes) {
        gcalRes = await fetch(`${GCAL}/events`, { method: 'POST', headers, body: JSON.stringify(eventBody) });
        action = 'created';
      }
    }

    if (!gcalRes.ok) {
      const errorText = await gcalRes.text();
      return Response.json({ success: false, error: `Google Calendar: ${gcalRes.status} ${errorText}` }, { status: 502 });
    }

    const gcalData = await gcalRes.json();
    if (gcalData.id) {
      await base44.asServiceRole.entities.Task.update(taskId, {
        google_calendar_synced: true,
        google_calendar_event_id: gcalData.id,
      });
      return Response.json({ success: true, action, event_id: gcalData.id, event_link: gcalData.htmlLink });
    }

    return Response.json({ success: false, error: gcalData.error?.message || 'Erro desconhecido' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});