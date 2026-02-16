import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_name, event_params, client_id } = await req.json();

    // Get Google Analytics config
    const integrations = await base44.entities.Integration.filter({ provider: 'google_analytics' });
    const gaConfig = integrations[0];

    if (!gaConfig || gaConfig.status !== 'active') {
      return Response.json({ error: 'Google Analytics não configurado' }, { status: 400 });
    }

    const measurementId = gaConfig.config.measurement_id;
    const apiSecret = gaConfig.config.api_secret;

    // Get client data if provided
    let clientData = {};
    if (client_id) {
      const client = await base44.entities.Client.get(client_id);
      clientData = {
        client_status: client.status,
        client_type: client.client_type,
        city: client.city,
        pipeline_stage: client.pipeline_stage
      };
    }

    // Send event to Google Analytics 4
    const payload = {
      client_id: user.email,
      events: [{
        name: event_name,
        params: {
          ...event_params,
          ...clientData,
          user_email: user.email,
          timestamp: Date.now()
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao enviar evento para GA4');
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});