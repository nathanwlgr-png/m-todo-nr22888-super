import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Divide uma mensagem longa em partes menores para envio no WhatsApp
 * O WhatsApp tem limite de ~4096 caracteres por mensagem
 * Esta função divide de forma inteligente, preservando palavras e parágrafos
 */
// Divide mensagem em partes de até MAX_LEN chars, quebrando em parágrafos/frases
// para garantir que NENHUM conteúdo seja perdido ou truncado
const MAX_CHUNK = 1500; // seguro para WhatsApp web URL + wa.me

function splitMessageIntoChunks(text, maxLen = MAX_CHUNK) {
  if (!text) return [];
  // Normaliza quebras de linha
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (normalized.length <= maxLen) return [normalized];

  const chunks = [];
  const paragraphs = normalized.split('\n');
  let current = '';

  for (const para of paragraphs) {
    // Parágrafo individual maior que maxLen → dividir em sentenças/palavras
    if (para.length > maxLen) {
      if (current.trim()) { chunks.push(current.trim()); current = ''; }
      // Tenta dividir por sentença (. ! ?)
      const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > maxLen) {
          if (current.trim()) { chunks.push(current.trim()); current = ''; }
          // Sentença ainda grande → divide por palavra
          if (sentence.length > maxLen) {
            let rem = sentence.trim();
            while (rem.length > maxLen) {
              const cut = rem.lastIndexOf(' ', maxLen);
              const breakAt = cut > 0 ? cut : maxLen;
              chunks.push(rem.slice(0, breakAt).trim());
              rem = rem.slice(breakAt).trim();
            }
            current = rem;
          } else {
            current = sentence.trim();
          }
        } else {
          current = current ? current + ' ' + sentence.trim() : sentence.trim();
        }
      }
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
  return chunks.filter(c => c.length > 0);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message, phone, client_id, client_name } = await req.json();

    if (!message) {
      return Response.json({ error: 'message é obrigatório', success: false }, { status: 400 });
    }
    if (!phone) {
      // Retorna sucesso mas sem link
      return Response.json({ success: true, total_chunks: 0, original_length: message.length, chunks: [], info: 'phone não fornecido, mensagem não enviada' });
    }

    // Divide a mensagem em partes
    const chunks = splitMessageIntoChunks(message);
    const totalChunks = chunks.length;

    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      const part = chunks[i]; // sem cabeçalho, sem indicador de parte

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