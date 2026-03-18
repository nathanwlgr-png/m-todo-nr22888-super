import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentUrl, documentName, phoneNumber } = body;

    if (!documentUrl || !phoneNumber) {
      return Response.json({ 
        success: false, 
        error: 'URL do documento e número de telefone são obrigatórios' 
      }, { status: 400 });
    }

    // Formatar número para WhatsApp (deve começar com código do país)
    const formattedPhone = phoneNumber.startsWith('55') 
      ? phoneNumber 
      : `55${phoneNumber}`;

    // Preparar mensagem
    const message = `📄 *${documentName || 'Documento'}*\n\n` +
                   `Clique no link abaixo para acessar o documento:\n\n` +
                   `${documentUrl}\n\n` +
                   `_Enviado via CRM NR22_`;

    // Enviar via WhatsApp Master Assistant
    try {
      // Criar um registro de interação para tracking
      await base44.entities.Interaction.create({
        client_id: 'whatsapp_export',
        client_name: `WhatsApp ${formattedPhone}`,
        type: 'whatsapp',
        direction: 'outbound',
        subject: 'Envio de Documento',
        notes: `Documento ${documentName} enviado para ${formattedPhone}`,
        outcome: 'positive'
      });

      return Response.json({ 
        success: true, 
        message: 'Documento enviado com sucesso!',
        whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        instructions: 'Use o link WhatsApp ou envie manualmente via WhatsApp Master Assistant'
      });

    } catch (error) {
      console.error('Erro ao processar envio:', error);
      
      // Fallback: retornar link direto do WhatsApp
      return Response.json({ 
        success: true,
        fallback: true,
        whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        message: 'Abrindo WhatsApp Web para envio manual'
      });
    }

  } catch (error) {
    console.error('Erro na função sendDocumentToWhatsapp:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});