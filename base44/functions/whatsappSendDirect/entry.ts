import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone, message, client_id, client_name } = await req.json().catch(() => ({}));
    if (!phone || !message) return Response.json({ error: 'Telefone e mensagem obrigatórios' }, { status: 400 });
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) return Response.json({ error: 'Formato de telefone inválido' }, { status: 400 });

    const draft = await base44.entities.PendingMessage.create({
      canal: 'whatsapp', channel: 'whatsapp', cliente_id: client_id,
      destinatario_nome: client_name || 'Contato WhatsApp', destinatario_contato: cleanPhone,
      recipient_id: client_id, recipient_name: client_name || 'Contato WhatsApp', recipient_phone: cleanPhone,
      contexto: 'whatsapp_direct_convertido_em_rascunho', context: 'whatsapp_direct_convertido_em_rascunho',
      mensagem: String(message), message_content: String(message),
      status: 'aguardando_aprovacao', criado_por_agente: 'whatsappSendDirect',
      aprovado_por_nathan: false, data_criacao: new Date().toISOString(), priority: 'media'
    });

    return Response.json({ success: true, pending_message_id: draft.id, status: 'aguardando_aprovacao', sent: false, message: 'Rascunho preparado. Nenhum envio realizado.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});