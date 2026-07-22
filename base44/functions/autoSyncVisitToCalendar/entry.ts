import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

const GCal = 'https://www.googleapis.com/calendar/v3/calendars/primary';
const CONNECTOR_ID = '6a6031d8a6b552c19b90098b';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const user = await getOptionalUser(base44);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (isForbiddenManualUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Pode ser chamado por automação de entidade OU manualmente
    const { event, data, entity_id, validate_only = false } = body;

    // ─── PROTEÇÃO ANTI-LOOP ──────────────────────────────────────────
    // A automação dispara em create E update da Visit.
    // Quando esta função atualiza google_calendar_event_id/synced,
    // isso gera outro update que re-dispara a automação.
    // Se os changed_fields contiverem APENAS campos de sync, ignorar para evitar loop.
    const changedFields = body?.changed_fields || [];
    const SYNC_ONLY_FIELDS = ['google_calendar_synced', 'google_calendar_event_id'];
    if (
      changedFields.length > 0 &&
      changedFields.every(f => SYNC_ONLY_FIELDS.includes(f))
    ) {
      console.log('[SYNC] Ignorando — mudança foi só em campos de sync (loop prevention)');
      return Response.json({ success: true, action: 'skipped_sync_loop' });
    }

    // Obter token do Google Calendar
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
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

    // Sincroniza visitas agendadas e remarcadas.
    const activeStatuses = ['agendada', 'remarcada'];
    if (visit.status && !activeStatuses.includes(visit.status)) {
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
    if (!visit.scheduled_date || Number.isNaN(start.getTime())) {
      return Response.json({ success: false, reason: 'Data da visita inválida' }, { status: 400 });
    }
    const durationMinutes = Number(visit.duration_minutes) > 0 ? Number(visit.duration_minutes) : 60;
    const end = new Date(start.getTime() + durationMinutes * 60000);

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
        `\n🔗 Visita ID: ${finalVisitId}`,
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
      extendedProperties: { private: { crm_visit_id: finalVisitId } },
    };

    if (validate_only) {
      return Response.json({ success: true, action: 'validated', visit_id: finalVisitId });
    }

    let gcalRes;
    let action;

    if (visit.google_calendar_event_id) {
      // Verificar se o evento ainda existe no Google Calendar antes de tentar atualizar
      const checkRes = await fetch(`${GCal}/events/${visit.google_calendar_event_id}`, {
        method: 'GET', headers
      });

      if (checkRes.status === 404 || checkRes.status === 410) {
        // Evento foi deletado externamente — tratar como novo
        console.log(`[SYNC] Evento ${visit.google_calendar_event_id} não encontrado no GCal — criando novo`);
        gcalRes = await fetch(`${GCal}/events`, {
          method: 'POST', headers, body: JSON.stringify(eventBody),
        });
        action = 'created_after_missing';
      } else if (!checkRes.ok) {
        const errBody = await checkRes.text();
        console.error(`[SYNC] Erro ao verificar evento existente (${checkRes.status}):`, errBody);
        return Response.json({ success: false, error: `GCal check failed: ${checkRes.status}` });
      } else {
        // Evento existe — atualizar com PUT (idempotente)
        gcalRes = await fetch(`${GCal}/events/${visit.google_calendar_event_id}`, {
          method: 'PUT', headers, body: JSON.stringify(eventBody),
        });
        action = 'updated';
      }
    } else {
      // Sem event_id — criar novo evento
      // Proteção anti-duplicata: buscar por crm_visit_id nas propriedades privadas
      const searchRes = await fetch(
        `${GCal}/events?privateExtendedProperty=crm_visit_id%3D${encodeURIComponent(finalVisitId)}&maxResults=1`,
        { method: 'GET', headers }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          // Evento já existe: atualizar os dados e recuperar o vínculo sem duplicar.
          const existingId = searchData.items[0].id;
          gcalRes = await fetch(`${GCal}/events/${encodeURIComponent(existingId)}`, {
            method: 'PUT', headers, body: JSON.stringify(eventBody),
          });
          action = 'updated_existing';
        }
      }

      if (!gcalRes) {
        gcalRes = await fetch(`${GCal}/events`, {
          method: 'POST', headers, body: JSON.stringify(eventBody),
        });
        action = 'created';
      }
    }

    if (!gcalRes.ok) {
      const errorText = await gcalRes.text();
      console.error(`[SYNC] Google Calendar respondeu ${gcalRes.status}:`, errorText);
      return Response.json({ success: false, error: `Google Calendar: ${gcalRes.status}` }, { status: 502 });
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