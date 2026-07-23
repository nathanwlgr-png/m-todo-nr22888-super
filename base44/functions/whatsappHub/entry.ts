import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      success: false,
      disabled: true,
      messages_sent: 0,
      commercial_records_changed: 0,
      message: 'Webhook legado desativado. Use o WhatsApp Hub manual e PendingMessage com aprovação humana.'
    }, { status: 409 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});