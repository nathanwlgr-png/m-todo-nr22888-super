import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const GCAL = 'https://www.googleapis.com/calendar/v3';
const CONNECTOR_ID = '6a6031d8a6b552c19b90098b';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      action = 'create',
      visit_id,
      client_name,
      clinic_name,
      phone,
      address,
      scheduled_date,
      visit_type,
      notes,
      vet_email,          // e-mail do veterinário para convite
      duration_minutes = 60,
    } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // ── CHECK AVAILABILITY ──────────────────────────────────────────────────
    if (action === 'check_availability') {
      const startTime = new Date(scheduled_date);
      const endTime = new Date(startTime.getTime() + duration_minutes * 60 * 1000);

      const freeBusyRes = await fetch(`${GCAL}/freeBusy`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
          items: [{ id: 'primary' }],
        }),
      });

      if (!freeBusyRes.ok) {
        const err = await freeBusyRes.text();
        throw new Error('FreeBusy API error: ' + err);
      }

      const freeBusyData = await freeBusyRes.json();
      const busy = freeBusyData.calendars?.primary?.busy || [];

      if (busy.length > 0) {
        return Response.json({
          available: false,
          conflicts: busy.map(b => ({
            start: b.start,
            end: b.end,
          })),
        });
      }

      return Response.json({ available: true, conflicts: [] });
    }

    // ── CREATE EVENT ────────────────────────────────────────────────────────
    if (action === 'create') {
      const visitTypeLabels = {
        primeira_visita: 'Primeira Visita',
        demonstracao: 'Demonstração Técnica',
        followup: 'Follow-up',
        fechamento: 'Fechamento',
      };

      const typeLabel = visitTypeLabels[visit_type] || visit_type;
      const title = `🏥 ${typeLabel} — ${client_name}${clinic_name ? ' (' + clinic_name + ')' : ''}`;

      const startTime = new Date(scheduled_date);
      const endTime = new Date(startTime.getTime() + duration_minutes * 60 * 1000);

      const description = [
        `Tipo: ${typeLabel}`,
        `Cliente: ${client_name}`,
        clinic_name ? `Clínica: ${clinic_name}` : '',
        phone ? `WhatsApp: ${phone}` : '',
        address ? `Endereço: ${address}` : '',
        notes ? `Observações: ${notes}` : '',
        '',
        `Gerado automaticamente pelo CRM NR22 | Visita ID: ${visit_id}`,
      ].filter(l => l !== null && l !== undefined && !(l === '' && notes === '' && !clinic_name && !phone && !address)).join('\n');

      // Montar attendees: apenas o vet se o e-mail for informado
      const attendees = [];
      if (vet_email && vet_email.includes('@')) {
        attendees.push({
          email: vet_email,
          displayName: `Dr(a). ${client_name}`,
          responseStatus: 'needsAction',
        });
      }

      const colorMap = {
        fechamento: '11',    // vermelho
        demonstracao: '6',   // tangerina
        followup: '5',       // banana
        primeira_visita: '1', // azul
      };

      const event = {
        summary: title,
        description,
        location: address || '',
        start: { dateTime: startTime.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
        colorId: colorMap[visit_type] || '1',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 1440 },
            { method: 'email', minutes: 1440 },
          ],
        },
        ...(attendees.length > 0 && {
          attendees,
          guestsCanModifyEvent: false,
          guestsCanSeeOtherGuests: false,
          sendUpdates: 'all', // dispara convite por e-mail para o veterinário
        }),
        extendedProperties: {
          private: { crm_visit_id: visit_id || '' },
        },
      };

      const calRes = await fetch(`${GCAL}/calendars/primary/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });

      if (!calRes.ok) {
        const err = await calRes.text();
        throw new Error('Google Calendar error: ' + err);
      }

      const calEvent = await calRes.json();

      // Atualizar visita no CRM
      if (visit_id) {
        await base44.asServiceRole.entities.Visit.update(visit_id, {
          google_calendar_synced: true,
          google_calendar_event_id: calEvent.id,
        });
        await base44.asServiceRole.entities.CalendarEventLink.create({ user_id: user.id, user_email: user.email, visit_id, event_id: calEvent.id, calendar_id: 'primary', sync_status: 'synced', last_synced_at: new Date().toISOString() });
      }

      return Response.json({
        success: true,
        event_id: calEvent.id,
        event_link: calEvent.htmlLink,
        invite_sent: attendees.length > 0,
        vet_email: vet_email || null,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});