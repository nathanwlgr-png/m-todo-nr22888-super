import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    // 1. Quem é o token?
    const who = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    const whoText = await who.text();
    const scopes = who.headers.get('x-oauth-scopes');

    // 2. Tentar criar UMA issue direto
    const create = await fetch('https://api.github.com/repos/nathanwlgr-png/nr22888-sistema/issues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'NR22888-CRM' },
      body: JSON.stringify({ title: 'debug-token-test', body: 'debug' }),
    });
    const createText = await create.text();

    return Response.json({
      token_prefix: accessToken.slice(0, 8),
      who_status: who.status,
      who_body: whoText.slice(0, 200),
      scopes,
      create_status: create.status,
      create_body: createText.slice(0, 300),
      rate_remaining: create.headers.get('x-ratelimit-remaining'),
      retry_after: create.headers.get('retry-after'),
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});