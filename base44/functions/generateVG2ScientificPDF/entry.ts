import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      success: false,
      blocked: true,
      error: 'Geração científica por IA bloqueada: envie uma fonte primária ou documento oficial verificável para produzir o material sem referências, faixas ou casos inventados.'
    }, { status: 422 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});