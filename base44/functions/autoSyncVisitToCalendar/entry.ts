import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GCal = 'https://www.googleapis.com/calendar/v3/calendars/primary';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Pode ser chamado por automação de entidade OU manualmente
    const { event, data, entity_id } = body;

    // Obter token do Google Calendar
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (e) {
      console.log('Google Calendar não conectado:', e.message);
      return Response.json({ success: false, reason: 'Google Calendar não conectado' });
    }

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Obter dados da visita
    let visit = data;
    const visitId = entity_id || event?.entity_id || data?.id;

    // Se não temos dados completos, buscar do banco
    if (!visit?.id && visitId) {
      visit = await base44.asServiceRole.entities.Visit.get(visitId).catch(() => null);
    }

    if (!visit) {
      return Response.json({ success: false, reason: 'Visita não encontrada' });
    }

    // Garantir que temos um ID válido
    const finalVisitId = visit.id || visitId;
    if (!finalVisitId) {
      return Response.json({ success: false, reason: 'ID da visita não encontrado' });
    }

    // Somente sincroniza visitas agendadas
    if (visit.status && visit.status !== 'agendada') {
      // Se foi cancelada e tinha evento, deletar do Google Calendar
      if (visit.status === 'cancelada' && visit.google_calendar_event_id) {
        await fetch(`${GCal}/events/${visit.google_calendar_event_id}`, { method: 'DELETE', headers }).catch(() => {});
        await base44.asServiceRole.entities.Visit.update(finalVisitId, {
          google_calendar_synced: false,
          google_calendar_event_id: null,
        }).catch(() => {});
        await base44.asServiceRole.integrations.Core.AnalyticsTrack({
          eventName: 'google_calendar_sync_success',
          properties: {
            action: 'deleted',
            visit_id: finalVisitId,
            client_name: visit.client_name,
            visit_type: visit.visit_type || 'visita',
          },
        }).catch(() => {});
        return Response.json({ success: true, action: 'deleted' });
      }
      return Response.json({ success: true, reason: 'Visita não agendada, ignorada' });
    }

    const start = new Date(visit.scheduled_date);
    const end = new Date(start.getTime() + (visit.duration_minutes || 60) * 60000);

    const colorMap = {
      fechamento: '11',     // vermelho
      demonstracao: '6',    // turquesa
      followup: '5',        // banana
      primeira_visita: '1', // azul
    };

    const eventBody = {
      summary: `🏥 Visita: ${visit.client_name}`,
      description: [
        `CRM NR22 | Tipo: ${visit.visit_type || 'visita'}`,
        visit.notes ? `\n📝 ${visit.notes}` : '',
        visit.location ? `\n📍 ${visit.location}` : '',
        `\n🔗 Visita ID: ${visit.id}`,
      ].join(''),
      location: visit.location || '',
      start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },   // 24h
          { method: 'popup', minutes: 60 },      // 1h
          { method: 'popup', minutes: 15 },      // 15min
        ],
      },
      colorId: colorMap[visit.visit_type] || '1',
      extendedProperties: { private: { crm_visit_id: visit.id } },
    };

    let gcalRes;
    let action;

    if (visit.google_calendar_event_id) {
      // Atualizar evento existente
      gcalRes = await fetch(`${GCal}/events/${visit.google_calendar_event_id}`, {
        method: 'PUT', headers, body: JSON.stringify(eventBody),
      });
      action = 'updated';
    } else {
      // Criar novo evento
      gcalRes = await fetch(`${GCal}/events`, {
        method: 'POST', headers, body: JSON.stringify(eventBody),
      });
      action = 'created';
    }

    const gcalData = await gcalRes.json();

    if (gcalData.id) {
      await base44.asServiceRole.entities.Visit.update(finalVisitId, {
        google_calendar_synced: true,
        google_calendar_event_id: gcalData.id,
      });

      console.log(`✅ Visita ${visit.client_name} sincronizada (${action}) - Event ID: ${gcalData.id}`);

      await base44.asServiceRole.integrations.Core.AnalyticsTrack({
        eventName: 'google_calendar_sync_success',
        properties: {
          action,
          visit_id: finalVisitId,
          client_name: visit.client_name,
          visit_type: visit.visit_type || 'visita',
          event_id: gcalData.id,
        },
      }).catch(() => {});

      return Response.json({
        success: true,
        action,
        event_id: gcalData.id,
        client: visit.client_name,
        event_link: gcalData.htmlLink,
      });
    }

    console.error('Erro Google Calendar:', gcalData);
    return Response.json({ success: false, error: gcalData.error?.message || 'Erro desconhecido' });

  } catch (error) {
    console.error('autoSyncVisitToCalendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});