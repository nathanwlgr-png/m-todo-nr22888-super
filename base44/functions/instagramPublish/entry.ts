import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const connectorId = '6a5efcdbac896b7758ca5c9c';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action || 'publish';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    const accountResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
    const account = await accountResponse.json();
    if (!accountResponse.ok) throw new Error(account.error?.message || 'Não foi possível acessar a conta Instagram Business.');

    if (action === 'status') {
      const posts = await base44.entities.InstagramPost.filter({ created_by_id: user.id }, '-scheduled_at', 50);
      return Response.json({ connected: true, account, posts });
    }

    if (action === 'schedule') {
      if (!body.caption || !body.image_url || !body.scheduled_at) throw new Error('Legenda, imagem e data são obrigatórias.');
      const post = await base44.entities.InstagramPost.create({
        post_content: body.caption,
        image_url: body.image_url,
        hashtags: body.hashtags || [],
        campaign: body.campaign || 'Oferta NR22888',
        post_status: 'agendado',
        scheduled_at: body.scheduled_at,
        instagram_account_id: account.id,
        instagram_username: account.username
      });
      return Response.json({ success: true, status: 'agendado', post });
    }

    let post = null;
    let caption = body.caption;
    let imageUrl = body.image_url;
    let hashtags = body.hashtags || [];
    if (body.post_id) {
      post = await base44.entities.InstagramPost.get(body.post_id);
      caption = post.post_content;
      imageUrl = post.image_url;
      hashtags = post.hashtags || [];
      await base44.entities.InstagramPost.update(post.id, { post_status: 'publicando', error_message: '' });
    }
    if (!caption || !imageUrl) throw new Error('Legenda e imagem são obrigatórias.');

    const cleanTags = hashtags.map((tag) => `#${String(tag).replace(/^#/, '')}`).join(' ');
    const fullCaption = `${caption}\n\n${cleanTags}`.trim();
    const mediaParams = new URLSearchParams({ image_url: imageUrl, caption: fullCaption, access_token: accessToken });
    const mediaResponse = await fetch(`https://graph.instagram.com/${account.id}/media?${mediaParams}`, { method: 'POST' });
    const media = await mediaResponse.json();
    if (!mediaResponse.ok) throw new Error(media.error?.message || 'Falha ao preparar a publicação.');

    const publishParams = new URLSearchParams({ creation_id: media.id, access_token: accessToken });
    const publishResponse = await fetch(`https://graph.instagram.com/${account.id}/media_publish?${publishParams}`, { method: 'POST' });
    const published = await publishResponse.json();
    if (!publishResponse.ok) throw new Error(published.error?.message || 'Falha ao publicar no Instagram.');

    const detailResponse = await fetch(`https://graph.instagram.com/${published.id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`);
    const detail = await detailResponse.json();
    const publishedData = {
      post_status: 'publicado',
      published_at: new Date().toISOString(),
      instagram_post_id: published.id,
      instagram_link: detail.permalink || ''
    };
    const saved = post
      ? await base44.entities.InstagramPost.update(post.id, publishedData)
      : await base44.entities.InstagramPost.create({
          post_content: caption,
          image_url: imageUrl,
          hashtags,
          campaign: body.campaign || 'Oferta NR22888',
          ...publishedData,
          instagram_account_id: account.id,
          instagram_username: account.username
        });

    return Response.json({ success: true, status: 'publicado', post: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});