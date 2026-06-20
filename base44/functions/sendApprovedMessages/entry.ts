import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Buscar mensagens aprovadas mas não enviadas
    const approvedMessages = await base44.asServiceRole.entities.PendingMessage.filter({
      status: 'approved'
    });

    let sentCount = 0;
    const whatsappLinks = [];

    for (const msg of approvedMessages) {
      try {
        const finalContent = msg.edited_content || msg.message_content;

        if (msg.channel === 'whatsapp') {
          // WhatsApp é envio manual: preparar link seguro e NÃO marcar como enviado
          const phone = String(msg.recipient_phone || '').replace(/\.0+$/, '').replace(/\D/g, '');
          const phoneIntl = phone.startsWith('55') ? phone : `55${phone}`;
          const waUrl = `https://wa.me/${phoneIntl}?text=${encodeURIComponent(finalContent)}`;

          await base44.asServiceRole.entities.PendingMessage.update(msg.id, {
            status: 'ready_to_send',
            wa_url: waUrl,
            prepared_at: new Date().toISOString()
          });

          whatsappLinks.push({
            id: msg.id,
            recipient_name: msg.recipient_name,
            recipient_phone: phoneIntl,
            wa_url: waUrl
          });
        } else if (msg.channel === 'email') {
          // Email pode ser enviado pelo sistema
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: msg.recipient_id,
            subject: msg.email_subject || 'Mensagem NR22',
            body: finalContent
          });

          await base44.asServiceRole.entities.PendingMessage.update(msg.id, {
            status: 'sent',
            sent_at: new Date().toISOString()
          });
        }

        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar mensagem ${msg.id}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      sent: sentCount,
      whatsapp_links: whatsappLinks,
      message: `${sentCount} mensagem(ns) processada(s). WhatsApp fica pronto para envio manual; email é enviado automaticamente.`
    });

  } catch (error) {
    console.error('Erro no envio de mensagens:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});