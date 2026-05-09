import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { caption, image_url, hashtags = [], campaign = 'Geral', scheduled_at } = body;

    // Verificar token
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    const businessAccountId = Deno.env.get('INSTAGRAM_BUSINESS_ACCOUNT_ID');

    if (!accessToken || !businessAccountId) {
      throw new Error('Instagram não configurado. Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID nos secrets.');
    }

    if (!caption) throw new Error('Caption vazio');
    if (!image_url) throw new Error('Imagem obrigatória');

    // Texto final com hashtags
    const fullCaption = caption + '\n\n' + hashtags.map(h => `#${h}`).join(' ');

    // Step 1: Upload da imagem
    let mediaId;
    try {
      const uploadResponse = await fetch(
        `https://graph.instagram.com/v18.0/${businessAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url,
            caption: fullCaption,
            access_token: accessToken,
          }),
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Instagram API error: ${error.error?.message}`);
      }

      const uploadData = await uploadResponse.json();
      mediaId = uploadData.id;
    } catch (error) {
      throw new Error(`Falha ao fazer upload: ${error.message}`);
    }

    // Step 2: Publicar
    let publishResponse;
    if (scheduled_at) {
      // Agendar
      publishResponse = await fetch(
        `https://graph.instagram.com/v18.0/${businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: mediaId,
            scheduled_publish_time: new Date(scheduled_at).getTime() / 1000,
            access_token: accessToken,
          }),
        }
      );
    } else {
      // Publicar agora
      publishResponse = await fetch(
        `https://graph.instagram.com/v18.0/${businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: mediaId,
            access_token: accessToken,
          }),
        }
      );
    }

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Falha ao publicar: ${error.error?.message}`);
    }

    const publishData = await publishResponse.json();
    const postId = publishData.id;

    // Salvar registro
    await base44.asServiceRole.entities.InstagramPost?.create({
      post_content: caption,
      image_url,
      hashtags,
      instagram_post_id: postId,
      instagram_link: `https://instagram.com/p/${postId}`,
      post_status: scheduled_at ? 'agendado' : 'publicado',
      scheduled_at: scheduled_at || null,
      campaign,
    }).catch(() => {});

    return Response.json({
      success: true,
      post_id: postId,
      instagram_link: `https://instagram.com/p/${postId}`,
      status: scheduled_at ? 'agendado' : 'publicado',
    });

  } catch (error) {
    // Salvar erro
    const body = await req.json();
    if (body.campaign) {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.InstagramPost?.create({
        post_content: body.caption,
        image_url: body.image_url,
        hashtags: body.hashtags,
        post_status: 'erro',
        campaign: body.campaign,
        error_message: error.message,
      }).catch(() => {});
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});