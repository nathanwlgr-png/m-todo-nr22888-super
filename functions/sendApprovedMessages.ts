import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar mensagens aprovadas mas não enviadas
    const approvedMessages = await base44.asServiceRole.entities.PendingMessage.filter({
      status: 'approved'
    });

    let sentCount = 0;

    for (const msg of approvedMessages) {
      try {
        const finalContent = msg.edited_content || msg.message_content;

        if (msg.channel === 'whatsapp') {
          // Criar registro de WhatsApp
          await base44.asServiceRole.entities.WhatsAppMessage.create({
            contact_id: msg.recipient_id,
            contact_name: msg.recipient_name,
            contact_phone: msg.recipient_phone,
            direction: 'sent',
            message: finalContent,
            status: 'sent',
            automated: true
          });
        } else if (msg.channel === 'email') {
          // Enviar email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: msg.recipient_id,
            subject: msg.email_subject || 'Mensagem NR22',
            body: finalContent
          });
        }

        // Marcar como enviada
        await base44.asServiceRole.entities.PendingMessage.update(msg.id, {
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar mensagem ${msg.id}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      sent: sentCount,
      message: `${sentCount} mensagem(ns) enviada(s) com sucesso!`
    });

  } catch (error) {
    console.error('Erro no envio de mensagens:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});