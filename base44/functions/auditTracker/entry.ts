import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      module,
      action,
      used_ia = false,
      estimated_credits = 0,
      success = true,
      error_message = null,
      execution_time_ms = 0,
    } = body;

    // Registra auditoria
    await base44.entities.AuditLog.create({
      action: action || 'api_call',
      module: module || 'unknown',
      user_email: user.email,
      duration_ms: execution_time_ms,
      cost_credits: estimated_credits,
      success,
      error_message,
      input_size: 0,
      output_size: 0,
    });

    return Response.json({
      success: true,
      message: 'Auditoria registrada',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});