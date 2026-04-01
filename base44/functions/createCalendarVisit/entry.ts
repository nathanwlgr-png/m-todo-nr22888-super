import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      visit_id,
      client_name,
      clinic_name,
      phone,
      address,
      scheduled_date,
      visit_type,
      notes,
    } = body;

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const visitTypeLabels = {
      primeira_visita: 'Primeira Visita',
      demonstracao: 'Demonstração Técnica',
      followup: 'Follow-up',
      fechamento: 'Fechamento',
    };

    const typeLabel = visitTypeLabels[visit_type] || visit_type;
    const title = `🏥 ${typeLabel} — ${client_name}${clinic_name ? ' (' + clinic_name + ')' : ''}`;

    const startTime = new Date(scheduled_date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora

    const description = [
      `Tipo: ${typeLabel}`,
      `Cliente: ${client_name}`,
      clinic_name ? `Clínica: ${clinic_name}` : '',
      phone ? `Telefone: ${phone}` : '',
      address ? `Endereço: ${address}` : '',
      notes ? `Observações: ${notes}` : '',
      `\nVisita ID: ${visit_id}`,
    ].filter(Boolean).join('\n');

    const event = {
      summary: title,
      description,
      location: address || '',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 1440 }, // 1 dia antes
        ],
      },
    };

    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!calRes.ok) {
      const err = await calRes.text();
      throw new Error('Google Calendar error: ' + err);
    }

    const calEvent = await calRes.json();

    // Atualizar visita com o ID do evento no Google Calendar
    if (visit_id) {
      await base44.asServiceRole.entities.Visit.update(visit_id, {
        google_calendar_synced: true,
        google_calendar_event_id: calEvent.id,
      });
    }

    return Response.json({ success: true, event_id: calEvent.id, event_link: calEvent.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});