import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, client_id, event_type } = await req.json();

    // Get Calendly config
    const integrations = await base44.entities.Integration.filter({ provider: 'calendly' });
    const calendlyConfig = integrations[0];

    if (!calendlyConfig || calendlyConfig.status !== 'active') {
      return Response.json({ error: 'Calendly não configurado' }, { status: 400 });
    }

    const apiKey = calendlyConfig.config.api_key;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    if (action === 'get_scheduling_link') {
      const client = await base44.entities.Client.get(client_id);

      // Get user's event types
      const eventTypesResponse = await fetch(
        'https://api.calendly.com/event_types?user=' + calendlyConfig.config.user_uri,
        { headers }
      );
      const eventTypes = await eventTypesResponse.json();

      const selectedEvent = event_type 
        ? eventTypes.collection.find(e => e.slug === event_type)
        : eventTypes.collection[0];

      // Create scheduling link with prefilled data
      const link = `${selectedEvent.scheduling_url}?name=${encodeURIComponent(client.first_name)}&email=${encodeURIComponent(client.email || '')}`;

      return Response.json({
        success: true,
        scheduling_link: link,
        event_type: selectedEvent
      });
    }

    if (action === 'get_scheduled_events') {
      const inviteesResponse = await fetch(
        `https://api.calendly.com/scheduled_events?user=${calendlyConfig.config.user_uri}&status=active`,
        { headers }
      );
      const events = await inviteesResponse.json();

      // Map to visits
      for (const event of events.collection) {
        const inviteesResp = await fetch(event.uri + '/invitees', { headers });
        const invitees = await inviteesResp.json();

        for (const invitee of invitees.collection) {
          // Try to find matching client
          const clients = await base44.entities.Client.filter({ email: invitee.email });
          
          if (clients.length > 0) {
            const client = clients[0];
            
            // Check if visit already exists
            const existingVisits = await base44.entities.Visit.filter({
              client_id: client.id,
              scheduled_date: event.start_time
            });

            if (existingVisits.length === 0) {
              await base44.asServiceRole.entities.Visit.create({
                client_id: client.id,
                client_name: client.first_name,
                scheduled_date: event.start_time,
                duration_minutes: (new Date(event.end_time) - new Date(event.start_time)) / 60000,
                visit_type: 'demonstracao',
                location: event.location?.join_url || 'Online',
                status: 'agendada',
                notes: `Agendado via Calendly: ${event.name}`
              });
            }
          }
        }
      }

      return Response.json({
        success: true,
        events_synced: events.collection.length
      });
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('Calendly sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});