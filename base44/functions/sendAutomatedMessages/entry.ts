import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { confirmed_by_user } = await req.json().catch(() => ({}));
    if (confirmed_by_user !== true) {
      return Response.json({
        success: false,
        requires_confirmation: true,
        message: 'Confirmação humana obrigatória para preparar rascunhos.'
      }, { status: 409 });
    }

    const result = await base44.functions.invoke('automaticMessageScheduler', {
      action: 'execute_now',
      confirmed_by_user: true
    });
    return Response.json(result?.data || result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});