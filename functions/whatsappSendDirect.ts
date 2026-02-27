import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Envia mensagem via WhatsApp direto
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return Response.json({ error: 'Telefone e mensagem obrigatórios' }, { status: 400 });
    }

    // Formata número para WhatsApp (aceita com ou sem DDI 55)
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    // Se não começa com 55, adiciona DDI Brasil
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    // Aceita 12 ou 13 dígitos (55 + DDD + número)
    if (formattedPhone.length < 12 || formattedPhone.length > 13) {
      return Response.json({ error: 'Formato de telefone inválido. Use: 11999999999 ou 5511999999999' }, { status: 400 });
    }

    // Abre WhatsApp Web com mensagem
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    return Response.json({
      success: true,
      whatsappUrl,
      phone: formattedPhone,
      messagePreview: message.substring(0, 100)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});