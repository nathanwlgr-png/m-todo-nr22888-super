import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const hashValue = async (value) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const sanitize = (request) => {
  const { access_token, verification_code, verification_session_hash, ...safe } = request;
  return safe;
};

const engagementFor = (views, selectedItems = []) => {
  if (selectedItems.length || views >= 2) return { interest_level: 'quente', engagement_score: selectedItems.length ? 85 : 70 };
  if (views === 1) return { interest_level: 'morno', engagement_score: 40 };
  return { interest_level: 'frio', engagement_score: 10 };
};

const loadSafeCatalog = async (base44) => {
  const rows = await base44.asServiceRole.entities.ProductCatalog.list('nome_produto', 500);
  return rows.filter((item) => item.ativo !== false).map((item) => ({
    id: item.id,
    source: 'ProductCatalog',
    name: item.nome_produto,
    category: item.linha || item.categoria,
    image_url: item.imagem_url || ''
  }));
};

const syncTemperature = async (base44, request, engagement, selectedItems = []) => {
  const nextAction = selectedItems.length ? 'Contatar sobre os produtos selecionados no catálogo' : engagement.interest_level === 'quente' ? 'Fazer contato consultivo agora' : 'Acompanhar interesse no catálogo';
  if (request.lead_id) {
    const lead = await base44.asServiceRole.entities.Lead.get(request.lead_id).catch(() => null);
    if (lead) await base44.asServiceRole.entities.Lead.update(lead.id, {
      stage: 'em_contato', status: 'contatado',
      predictive_score: Math.max(lead.predictive_score || 0, engagement.engagement_score),
      conversion_probability: Math.max(lead.conversion_probability || 0, engagement.engagement_score),
      priority_level: engagement.interest_level === 'quente' ? 'high' : 'medium',
      next_best_action: nextAction,
      engagement_metrics: { ...(lead.engagement_metrics || {}), website_visits: request.views_count || 0, documents_viewed: selectedItems.length, last_engagement: new Date().toISOString() }
    });
  }
  if (request.client_id) {
    const client = await base44.asServiceRole.entities.Client.get(request.client_id).catch(() => null);
    if (client) await base44.asServiceRole.entities.Client.update(client.id, {
      status: engagement.interest_level,
      engagement_score: Math.max(client.engagement_score || 0, engagement.engagement_score),
      next_action: nextAction
    });
  }
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
    if (body.action === 'load') {
      const duplicateLoad = body.view_id && request.last_view_id === body.view_id;
      if (duplicateLoad) {
        return Response.json({ request: { id: request.id, client_code: request.client_code, client_name: request.client_name, status: request.status, expires_at: request.expires_at, views_count: request.views_count || 0, interest_level: request.interest_level || 'frio', engagement_score: request.engagement_score || 10 } });
      }
      const viewedAt = new Date().toISOString();
      const viewsCount = (request.views_count || 0) + 1;
      const engagement = engagementFor(viewsCount, request.selected_items || []);
      const history = [...(request.change_history || []), { changed_at: viewedAt, action: 'aberto', actor: 'destinatario' }];
      const tracked = { ...request, views_count: viewsCount, last_view_id: body.view_id || '', first_viewed_at: request.first_viewed_at || viewedAt, last_viewed_at: viewedAt, ...engagement, change_history: history };
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { views_count: viewsCount, last_view_id: body.view_id || '', first_viewed_at: tracked.first_viewed_at, last_viewed_at: viewedAt, ...engagement, change_history: history });
      await syncTemperature(base44, tracked, engagement, request.selected_items || []);
      return Response.json({ request: { id: request.id, client_code: request.client_code, client_name: request.client_name, status: request.status, expires_at: request.expires_at, views_count: viewsCount, ...engagement } });
    }
    if (body.action === 'verify') {
      if (String(body.code || '').trim() !== request.verification_code) return Response.json({ error: 'Código incorreto' }, { status: 403 });
      const sessionToken = crypto.randomUUID();
      const now = new Date().toISOString();
      const history = [...(request.change_history || []), { changed_at: now, action: 'codigo_verificado', actor: 'cliente' }];
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { verification_session_hash: await hashValue(sessionToken), verified_at: now, change_history: history });
      const products = await loadSafeCatalog(base44);
      return Response.json({ request: sanitize({ ...request, verified_at: now, change_history: history }), session_token: sessionToken, products });
    }
    if (!body.session_token || await hashValue(body.session_token) !== request.verification_session_hash) return Response.json({ error: 'Confirmação necessária' }, { status: 403 });
    if (body.action === 'update_selection') {
      if (request.status === 'validado') return Response.json({ error: 'Seleção já validada' }, { status: 409 });
      const items = (body.selected_items || []).slice(0, 500).map((item) => ({ product_id: String(item.product_id || ''), product_source: String(item.product_source || ''), product_name: String(item.product_name || ''), category: String(item.category || ''), image_url: String(item.image_url || ''), quantity: Math.max(1, Math.min(999, Number(item.quantity) || 1)) }));
      const change = body.change || {};
      const history = [...(request.change_history || []), { changed_at: new Date().toISOString(), action: ['adicionado', 'removido', 'quantidade_alterada'].includes(change.action) ? change.action : 'quantidade_alterada', product_id: change.product_id, product_name: change.product_name, quantity: change.quantity, actor: 'cliente' }];
      const revision = (request.revision || 0) + 1;
      const engagement = engagementFor(request.views_count || 0, items);
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { selected_items: items, change_history: history, revision, ...engagement });
      await syncTemperature(base44, request, engagement, items);
      return Response.json({ request: sanitize({ ...request, selected_items: items, change_history: history, revision, ...engagement }) });
    }
    if (body.action === 'submit') {
      if (!request.selected_items?.length) return Response.json({ error: 'Selecione pelo menos um item' }, { status: 400 });
      const now = new Date().toISOString();
      const history = [...(request.change_history || []), { changed_at: now, action: 'assinado', actor: 'cliente' }, { changed_at: now, action: 'enviado', actor: 'cliente' }];
      const engagement = engagementFor(request.views_count || 0, request.selected_items || []);
      await base44.asServiceRole.entities.CatalogRequest.update(request.id, { status: 'aguardando_validacao', submitted_at: now, signed_at: now, signature_method: request.sent_via === 'telegram' ? 'telegram_code' : 'whatsapp_code', change_history: history, ...engagement });
      await syncTemperature(base44, request, engagement, request.selected_items || []);
      return Response.json({ success: true, signed_at: now, ...engagement });
    }
    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});