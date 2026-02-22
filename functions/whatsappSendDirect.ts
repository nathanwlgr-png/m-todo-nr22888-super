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

    // Formata número para WhatsApp
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 11 ? cleanPhone : null;

    if (!formattedPhone) {
      return Response.json({ error: 'Formato de telefone inválido' }, { status: 400 });
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