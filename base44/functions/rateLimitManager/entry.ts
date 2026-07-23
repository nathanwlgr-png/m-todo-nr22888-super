import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestsPerMinute = Math.max(1, Math.min(Number(body.requests_per_minute) || 10, 60));
    const lastRequestAt = Number(body.last_request_at) || 0;
    const minimumDelay = Math.ceil(60000 / requestsPerMinute);
    const elapsed = Math.max(0, Date.now() - lastRequestAt);
    const waitMs = Math.max(0, Math.min(minimumDelay - elapsed, 5000));

    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));

    return Response.json({
      success: true,
      allowed: true,
      waited_ms: waitMs,
      next_request_at: Date.now(),
      requests_per_minute: requestsPerMinute
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});