import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if ((body.action || 'draft') === 'status') {
      const posts = await base44.entities.InstagramPost.filter({ created_by_id: user.id }, '-scheduled_at', 50);
      return Response.json({ connected: true, publishing_enabled: false, posts });
    }
    if (!body.caption) return Response.json({ error: 'Legenda obrigatória' }, { status: 400 });

    const message = [body.caption, ...(body.hashtags || []).map((tag) => `#${String(tag).replace(/^#/, '')}`)].join('\n');
    const draft = await base44.entities.PendingMessage.create({
      canal: 'outro',
      destinatario_nome: 'Instagram Business NR22888',
      contexto: 'rascunho_instagram',
      mensagem: message,
      status: 'aguardando_aprovacao',
      criado_por_agente: 'instagramPublish',
      aprovado_por_nathan: false,
      data_criacao: new Date().toISOString(),
      priority: 'media',
      context: JSON.stringify({ image_url: body.image_url || '', requested_action: body.action || 'draft' }),
      message_content: message
    });

    return Response.json({ success: true, status: 'aguardando_aprovacao', pending_message_id: draft.id, published: false, message: 'Rascunho preparado. Nenhuma publicação foi realizada.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});