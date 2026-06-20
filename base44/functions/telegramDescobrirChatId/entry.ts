import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      return Response.json({
        success: false,
        status: 'sem_token',
        message: 'TELEGRAM_BOT_TOKEN não configurado.',
      });
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();

    if (!data.ok) {
      return Response.json({
        success: false,
        status: 'erro_telegram',
        message: data.description || 'Falha ao consultar o Telegram.',
      });
    }

    // Extrai chats únicos das mensagens recebidas
    const chats = {};
    for (const upd of data.result || []) {
      const msg = upd.message || upd.edited_message || upd.channel_post;
      const chat = msg?.chat;
      if (chat && chat.id) {
        chats[chat.id] = {
          chat_id: chat.id,
          tipo: chat.type,
          nome: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'sem nome',
        };
      }
    }

    const lista = Object.values(chats);

    if (lista.length === 0) {
      return Response.json({
        success: false,
        status: 'sem_conversas',
        message: 'Nenhuma conversa encontrada. Abra o Telegram, mande uma mensagem (ex: "oi") para o seu bot e tente novamente.',
      });
    }

    return Response.json({
      success: true,
      status: 'ok',
      chats: lista,
      message: `${lista.length} chat(s) encontrado(s). Copie o chat_id correto e atualize o secret TELEGRAM_CHAT_ID.`,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});