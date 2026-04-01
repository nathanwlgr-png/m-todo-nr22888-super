import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GCal = 'https://www.googleapis.com/calendar/v3/calendars/primary';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const body = await req.json();
    const { action } = body;

    // ── SYNC VISITS TO GOOGLE CALENDAR ──────────────────────────────────────
    if (action === 'sync_visits') {
      const visits = await base44.asServiceRole.entities.Visit.filter({ status: 'agendada' });
      const results = [];

      for (const visit of visits) {
        const start = new Date(visit.scheduled_date);
        const end = new Date(start.getTime() + (visit.duration_minutes || 60) * 60000);

        const eventBody = {
          summary: `🏥 Visita: ${visit.client_name}`,
          description: `CRM NR22 | Tipo: ${visit.visit_type || 'visita'}\n${visit.notes || ''}`,
          location: visit.location || '',
          start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'popup', minutes: 15 },
              { method: 'email', minutes: 1440 }, // 24h antes
            ],
          },
          colorId: visit.visit_type === 'fechamento' ? '11' : visit.visit_type === 'demonstracao' ? '6' : '1',
          extendedProperties: { private: { crm_visit_id: visit.id } },
        };

        let gcalRes;
        if (visit.google_calendar_event_id) {
          // Update existing event
          gcalRes = await fetch(`${GCal}/events/${visit.google_calendar_event_id}`, {
            method: 'PUT', headers, body: JSON.stringify(eventBody),
          });
        } else {
          // Create new event
          gcalRes = await fetch(`${GCal}/events`, {
            method: 'POST', headers, body: JSON.stringify(eventBody),
          });
        }

        const gcalData = await gcalRes.json();
        if (gcalData.id) {
          await base44.asServiceRole.entities.Visit.update(visit.id, {
            google_calendar_synced: true,
            google_calendar_event_id: gcalData.id,
          });
          results.push({ visit_id: visit.id, event_id: gcalData.id, client: visit.client_name });
        }
      }

      await base44.asServiceRole.integrations.Core.AnalyticsTrack({
        eventName: 'google_calendar_sync_success',
        properties: {
          action: 'sync_visits',
          synced_count: results.length,
        },
      }).catch(() => {});

      return Response.json({ success: true, synced: results.length, results });
    }

    // ── SYNC TASKS TO GOOGLE CALENDAR ───────────────────────────────────────
    if (action === 'sync_tasks') {
      const tasks = await base44.asServiceRole.entities.Task.filter({ status: 'pendente' });
      const results = [];

      for (const task of tasks) {
        if (!task.due_date) continue;
        const eventBody = {
          summary: `✅ ${task.title}`,
          description: `CRM NR22 | Cliente: ${task.client_name || ''}\n${task.description || ''}`,
          start: { date: task.due_date },
          end: { date: task.due_date },
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 480 }, { method: 'email', minutes: 1440 }],
          },
          colorId: task.priority === 'alta' ? '11' : task.priority === 'media' ? '5' : '2',
          extendedProperties: { private: { crm_task_id: task.id } },
        };

        const gcalRes = await fetch(`${GCal}/events`, {
          method: 'POST', headers, body: JSON.stringify(eventBody),
        });
        const gcalData = await gcalRes.json();
        if (gcalData.id) {
          results.push({ task_id: task.id, event_id: gcalData.id, title: task.title });
        }
      }

      await base44.asServiceRole.integrations.Core.AnalyticsTrack({
        eventName: 'google_calendar_sync_success',
        properties: {
          action: 'sync_tasks',
          synced_count: results.length,
        },
      }).catch(() => {});

      return Response.json({ success: true, synced: results.length, results });
    }

    // ── GET UPCOMING EVENTS FROM GOOGLE CALENDAR ────────────────────────────
    if (action === 'get_events') {
      const now = new Date().toISOString();
      const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const url = `${GCal}/events?timeMin=${now}&timeMax=${maxDate}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      return Response.json({ success: true, events: data.items || [] });
    }

    // ── IMPORT FROM GOOGLE CALENDAR (create visits in CRM) ──────────────────
    if (action === 'import_from_calendar') {
      const { event_id, client_id, client_name } = body;
      // Fetch the specific event
      const res = await fetch(`${GCal}/events/${event_id}`, { headers });
      const event = await res.json();

      if (!event.id) return Response.json({ error: 'Event not found' }, { status: 404 });

      const scheduledDate = event.start?.dateTime || event.start?.date + 'T09:00:00';
      const newVisit = await base44.asServiceRole.entities.Visit.create({
        client_id: client_id || '',
        client_name: client_name || event.summary || 'Google Calendar',
        scheduled_date: scheduledDate,
        duration_minutes: 60,
        visit_type: 'primeira_visita',
        location: event.location || '',
        notes: event.description || '',
        status: 'agendada',
        google_calendar_synced: true,
        google_calendar_event_id: event.id,
      });

      await base44.asServiceRole.integrations.Core.AnalyticsTrack({
        eventName: 'google_calendar_sync_success',
        properties: {
          action: 'import_from_calendar',
          client_name: client_name || event.summary || 'Google Calendar',
          event_id,
        },
      }).catch(() => {});

      return Response.json({ success: true, visit: newVisit });
    }

    // ── DELETE EVENT ─────────────────────────────────────────────────────────
    if (action === 'delete_event') {
      const { event_id } = body;
      await fetch(`${GCal}/events/${event_id}`, { method: 'DELETE', headers });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});