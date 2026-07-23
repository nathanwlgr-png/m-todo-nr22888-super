import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body.dry_run === true) {
      return Response.json({ success: true, dry_run: true, messages_sent: 0, message: 'Validação concluída sem criar rascunho e sem envio.' });
    }

    const draft = await base44.entities.PendingMessage.create({
      canal: 'telegram',
      channel: 'telegram',
      destinatario_nome: 'Canal Telegram configurado',
      contexto: 'teste_telegram_seguro',
      context: 'Teste de integração sem envio externo',
      mensagem: 'Rascunho de teste do Telegram NR22888. Nenhum envio foi realizado.',
      message_content: 'Rascunho de teste do Telegram NR22888. Nenhum envio foi realizado.',
      status: 'aguardando_aprovacao',
      criado_por_agente: 'testTelegramBot',
      aprovado_por_nathan: false,
      data_criacao: new Date().toISOString(),
      priority: 'baixa'
    });

    return Response.json({ success: true, pending_message_id: draft.id, messages_sent: 0, message: 'Rascunho de teste preparado. Nenhum envio realizado.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});