import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const clientId = body.client_id;
    const rawPhone = body.client_phone || body.phone;
    const message = body.message || body.message_content;
    if (!rawPhone || !message) return Response.json({ error: 'message e phone são obrigatórios' }, { status: 400 });

    let phone = String(rawPhone).replace(/\.0+$/, '').replace(/\D/g, '');
    if (!phone.startsWith('55') && [10, 11].includes(phone.length)) phone = `55${phone}`;
    if (phone.length < 12 || phone.length > 13) return Response.json({ error: 'Número de telefone inválido' }, { status: 422 });

    let clientName = body.client_name || 'Contato WhatsApp';
    if (clientId) {
      const clients = await base44.entities.Client.filter({ id: clientId });
      const client = clients[0];
      clientName = client?.full_name || client?.first_name || client?.clinic_name || clientName;
    }

    const draft = await base44.entities.PendingMessage.create({
      canal: 'whatsapp', channel: 'whatsapp', cliente_id: clientId, recipient_id: clientId,
      destinatario_nome: clientName, recipient_name: clientName,
      destinatario_contato: phone, recipient_phone: phone,
      mensagem: String(message), message_content: String(message),
      status: 'aguardando_aprovacao', aprovado_por_nathan: false,
      criado_por_agente: 'sendWhatsAppMessage', data_criacao: new Date().toISOString(),
      contexto: 'mensagem_whatsapp_pendente', context: 'mensagem_whatsapp_pendente', priority: 'media'
    });

    return Response.json({ success: true, pending_message_id: draft.id, status: 'aguardando_aprovacao', sent: false, message: 'Rascunho preparado. Nenhum envio realizado.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});