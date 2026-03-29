import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { date, start_location, action } = body;

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    if (action === 'fetch_calendar_visits') {
      // Fetch events from Google Calendar for the target date
      const startOfDay = `${targetDate}T00:00:00-03:00`;
      const endOfDay = `${targetDate}T23:59:59-03:00`;

      const calResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!calResponse.ok) {
        const err = await calResponse.text();
        return Response.json({ error: `Google Calendar error: ${err}` }, { status: 400 });
      }

      const calData = await calResponse.json();
      const events = (calData.items || []).map(e => ({
        id: e.id,
        title: e.summary || 'Sem título',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location || null,
        description: e.description || null,
        status: e.status,
      }));

      return Response.json({ events, date: targetDate });
    }

    if (action === 'optimize_route') {
      const { visits } = body;
      if (!visits || visits.length === 0) {
        return Response.json({ error: 'Nenhuma visita fornecida' }, { status: 400 });
      }

      // Use AI to optimize the route
      const prompt = `Você é um especialista em logística e otimização de rotas no Brasil.

Tenho ${visits.length} visitas para realizar no dia ${targetDate}.
Ponto de partida: ${start_location || 'Centro da cidade'}

Visitas:
${visits.map((v, i) => `${i + 1}. Cliente: ${v.client_name || v.title}
   Endereço: ${v.address || v.location || 'Endereço não informado'}
   Horário agendado: ${v.scheduled_time || v.start || 'Flexível'}
   Duração estimada: ${v.duration || 60} minutos`).join('\n\n')}

Por favor:
1. Ordene as visitas pela melhor sequência geográfica para minimizar deslocamento
2. Considere o trânsito típico de São Paulo/Brasil nos horários indicados
3. Estime o horário ideal de cada visita na rota otimizada
4. Calcule o tempo total de deslocamento estimado
5. Sugira o melhor ponto de partida para cada trecho
6. Adicione alertas de trânsito se relevante (horário de pico, etc)

Retorne um JSON com a estrutura:
{
  "optimized_visits": [
    {
      "order": 1,
      "client_name": "nome",
      "address": "endereço",
      "suggested_time": "HH:MM",
      "travel_time_from_prev": "X min",
      "distance_from_prev": "X km",
      "traffic_alert": "alerta ou null",
      "original_scheduled": "horário original"
    }
  ],
  "total_distance_km": número,
  "total_travel_time_min": número,
  "route_summary": "resumo da rota",
  "departure_time": "HH:MM",
  "tips": ["dica1", "dica2"]
}`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            optimized_visits: { type: 'array', items: { type: 'object' } },
            total_distance_km: { type: 'number' },
            total_travel_time_min: { type: 'number' },
            route_summary: { type: 'string' },
            departure_time: { type: 'string' },
            tips: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return Response.json({ optimized_route: result, date: targetDate });
    }

    if (action === 'create_calendar_event') {
      const { visit } = body;
      const event = {
        summary: `Visita: ${visit.client_name}`,
        location: visit.address || '',
        description: `Visita comercial agendada pelo CRM NR22\n\nCliente: ${visit.client_name}\nEquipamento: ${visit.equipment_interest || 'A definir'}\nNotas: ${visit.notes || ''}`,
        start: { dateTime: visit.start_datetime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: visit.end_datetime, timeZone: 'America/Sao_Paulo' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      const createResp = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!createResp.ok) {
        const err = await createResp.text();
        return Response.json({ error: `Erro ao criar evento: ${err}` }, { status: 400 });
      }

      const created = await createResp.json();
      return Response.json({ success: true, event_id: created.id, event_link: created.htmlLink });
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});