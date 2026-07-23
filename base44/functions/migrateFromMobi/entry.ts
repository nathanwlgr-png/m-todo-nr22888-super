import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    return Response.json({
      success: false,
      disabled: true,
      destructive_action_blocked: true,
      message: 'Migração automática e geração de dados simulados foram desativadas. Nenhum dado foi alterado.'
    }, { status: 409 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});