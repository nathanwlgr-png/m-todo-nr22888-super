import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const hashValue = async (value) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const sanitize = (request) => {
  const { access_token, verification_code, verification_session_hash, ...safe } = request;
  return safe;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const records = await base44.asServiceRole.entities.CatalogRequest.filter({ id: body.request_id }, '-updated_date', 1).catch(() => []);
    const request = records[0];
    if (!request || request.client_code !== body.client_code || request.access_token !== body.access_token) return Response.json({ error: 'Link inválido' }, { status: 404 });
    if (!request.expires_at || new Date(request.expires_at).getTime() <= Date.now()) {
      if (request.status !== 'expirado') await base44.asServiceRole.entities.CatalogRequest.update(request.id, { status: 'expirado' });
      return Response.json({ error: 'Este link expirou. Solicite um novo ao vendedor.' }, { status: 410 });
    }
    if (body.action === 'load') return Response.json({ request: { id: request.id, client_code: request.client_code, client_name: request.client_name, status: request.status, expires_at: request.expires_at } });
    if (body.action === 'verify') {
      if (String(body.code || '').trim() !== request.verification_code) return Response.json({ error: 'Código incorreto' }, { status: 403 });
      const sessionToken = crypto.randomUUID();
      const now = new Date().toISOString();
      const history = [...(request.change_history || []), { changed_at: now, action: 'codigo_verificado', actor: 'cliente' }];
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { verification_session_hash: await hashValue(sessionToken), verified_at: now, change_history: history });
      return Response.json({ request: sanitize({ ...request, verified_at: now, change_history: history }), session_token: sessionToken });
    }
    if (!body.session_token || await hashValue(body.session_token) !== request.verification_session_hash) return Response.json({ error: 'Confirmação necessária' }, { status: 403 });
    if (body.action === 'update_selection') {
      if (request.status === 'validado') return Response.json({ error: 'Seleção já validada' }, { status: 409 });
      const items = (body.selected_items || []).slice(0, 500).map((item) => ({ product_id: String(item.product_id || ''), product_source: String(item.product_source || ''), product_name: String(item.product_name || ''), category: String(item.category || ''), image_url: String(item.image_url || ''), quantity: Math.max(1, Math.min(999, Number(item.quantity) || 1)) }));
      const change = body.change || {};
      const history = [...(request.change_history || []), { changed_at: new Date().toISOString(), action: ['adicionado', 'removido', 'quantidade_alterada'].includes(change.action) ? change.action : 'quantidade_alterada', product_id: change.product_id, product_name: change.product_name, quantity: change.quantity, actor: 'cliente' }];
      const revision = (request.revision || 0) + 1;
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { selected_items: items, change_history: history, revision });
      return Response.json({ request: sanitize({ ...request, selected_items: items, change_history: history, revision }) });
    }
    if (body.action === 'submit') {
      if (!request.selected_items?.length) return Response.json({ error: 'Selecione pelo menos um item' }, { status: 400 });
      const now = new Date().toISOString();
      const history = [...(request.change_history || []), { changed_at: now, action: 'assinado', actor: 'cliente' }, { changed_at: now, action: 'enviado', actor: 'cliente' }];
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { status: 'aguardando_validacao', submitted_at: now, signed_at: now, signature_method: 'whatsapp_code', change_history: history });
      return Response.json({ success: true, signed_at: now });
    }
    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});