import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Divide uma mensagem longa em partes menores para envio no WhatsApp
 * O WhatsApp tem limite de ~4096 caracteres por mensagem
 * Esta função divide de forma inteligente, preservando palavras e parágrafos
 */
function splitMessageIntoChunks(text, maxLen = 3800) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  const paragraphs = text.split('\n');
  let current = '';

  for (const para of paragraphs) {
    // Se o parágrafo sozinho já excede o limite, divide por frases
    if (para.length > maxLen) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = '';
      }
      // Divide o parágrafo longo em partes menores
      let remaining = para;
      while (remaining.length > maxLen) {
        const cut = remaining.lastIndexOf(' ', maxLen);
        const breakAt = cut > 0 ? cut : maxLen;
        chunks.push(remaining.slice(0, breakAt).trim());
        remaining = remaining.slice(breakAt).trim();
      }
      current = remaining;
    } else {
      const candidate = current ? current + '\n' + para : para;
      if (candidate.length > maxLen) {
        if (current.trim()) chunks.push(current.trim());
        current = para;
      } else {
        current = candidate;
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message, phone, client_id, client_name } = await req.json();

    if (!message || !phone) {
      return Response.json({ error: 'message e phone são obrigatórios' }, { status: 400 });
    }

    // Divide a mensagem em partes
    const chunks = splitMessageIntoChunks(message);
    const totalChunks = chunks.length;

    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      let part = chunks[i];

      // Adiciona indicador de parte se houver mais de uma
      if (totalChunks > 1) {
        part = `_(${i + 1}/${totalChunks})_\n\n` + part;
      }

      // Monta link direto para o WhatsApp
      const encodedMsg = encodeURIComponent(part);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`;

      // Registra cada parte enviada
      if (client_id) {
        await base44.asServiceRole.entities.WhatsAppMessage.create({
          contact_id: client_id,
          contact_name: client_name || '',
          contact_phone: phone,
          direction: 'sent',
          message: part,
          status: 'sent',
          automated: false
        });
      }

      results.push({
        part: i + 1,
        total: totalChunks,
        length: part.length,
        whatsapp_url: whatsappUrl,
        text: part
      });
    }

    return Response.json({
      success: true,
      total_chunks: totalChunks,
      original_length: message.length,
      chunks: results
    });

  } catch (error) {
    console.error('Erro whatsappSendChunked:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});