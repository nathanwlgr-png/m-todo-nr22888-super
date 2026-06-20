import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * testTelegramBot — Teste real do bot do Telegram (SAFE).
 * Envia uma mensagem de "echo" para validar token + chat_id configurados.
 * NÃO altera nenhum dado do CRM. Só confirma se o bot responde.
 *
 * Secrets esperados: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!token || !token.trim()) {
      return Response.json({
        success: false,
        status: 'sem_token',
        message: 'TELEGRAM_BOT_TOKEN não configurado. Configure o secret para testar.',
      });
    }
    if (!chatId || !chatId.trim()) {
      return Response.json({
        success: false,
        status: 'sem_chat_id',
        message: 'TELEGRAM_CHAT_ID não configurado. Configure o secret para testar.',
      });
    }

    // 1. Valida o bot (getMe)
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) });
    const meData = await meRes.json();
    if (!meData.ok) {
      return Response.json({
        success: false,
        status: 'token_invalido',
        message: 'Token do bot inválido ou revogado.',
        detalhe: meData.description || '',
      });
    }

    // 2. Envia mensagem de teste
    const texto = `✅ NR22888 — Teste real do bot OK\nBot: @${meData.result?.username || 'bot'}\n${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    const sendData = await sendRes.json();

    if (!sendData.ok) {
      return Response.json({
        success: false,
        status: 'envio_falhou',
        bot: meData.result?.username,
        message: 'Bot válido, mas o envio falhou. Verifique o TELEGRAM_CHAT_ID.',
        detalhe: sendData.description || '',
      });
    }

    return Response.json({
      success: true,
      status: 'ok',
      bot: meData.result?.username,
      message: `Mensagem de teste enviada com sucesso para o chat ${chatId}.`,
    });
  } catch (error) {
    return Response.json({ success: false, status: 'erro', error: error.message }, { status: 500 });
  }
});