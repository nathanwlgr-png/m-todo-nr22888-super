/**
 * Utilitário central para envio WhatsApp com chunks
 * Garante que mensagens longas sejam divididas em partes < 1500 chars
 * e que NENHUM conteúdo seja perdido ou truncado.
 */

const MAX_CHUNK = 1500;

/**
 * Divide texto em chunks seguros para WhatsApp (URL encoding)
 * Quebra por parágrafo → sentença → palavra
 */
export function splitWhatsAppMessage(text, maxLen = MAX_CHUNK) {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (normalized.length <= maxLen) return [normalized];

  const chunks = [];
  const paragraphs = normalized.split('\n');
  let current = '';

  for (const para of paragraphs) {
    if (para.length > maxLen) {
      if (current.trim()) { chunks.push(current.trim()); current = ''; }
      const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > maxLen) {
          if (current.trim()) { chunks.push(current.trim()); current = ''; }
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

/**
 * Formata telefone para padrão internacional BR
 */
export function formatPhoneBR(phone) {
  const clean = phone.replace(/\D/g, '');
  // Remove o 55 duplicado e garante apenas um 55 no início
  const withoutCode = clean.startsWith('55') ? clean.slice(2) : clean;
  return `55${withoutCode}`;
}

/**
 * Gera URL do WhatsApp para um chunk
 */
export function whatsAppUrl(phone, text) {
  return `https://wa.me/${formatPhoneBR(phone)}?text=${encodeURIComponent(text)}`;
}

/**
 * Abre o WhatsApp. Se a mensagem couber em 1 chunk, abre direto.
 * Se tiver múltiplos chunks, abre o primeiro e retorna todos os chunks
 * para que o UI possa apresentar os demais ao usuário.
 * @returns {{ chunks: string[], total: number }}
 */
export function openWhatsAppChunked(phone, message) {
  const chunks = splitWhatsAppMessage(message);
  if (chunks.length === 0) return { chunks: [], total: 0 };

  window.open(whatsAppUrl(phone, chunks[0]), '_blank');
  return { chunks, total: chunks.length };
}