/**
 * phoneUtils — Validação e formatação de telefones para WhatsApp
 * Padrão: 55 + DDD (2 dígitos) + número (8-9 dígitos) = 12-13 dígitos total
 */

/**
 * Limpa e formata o telefone para padrão WhatsApp
 * Remove: espaços, parênteses, traços, pontos, .0 do Excel
 * Adiciona: código Brasil 55 se necessário
 * Retorna null se inválido
 */
export function formatPhoneForWhatsApp(raw) {
  if (!raw) return null;

  // Converter para string e remover ".0" do Excel (ex: "14999999999.0")
  let phone = String(raw).replace(/\.0+$/, '').replace(/\D/g, '');

  if (!phone) return null;

  // Remover prefixo "0" inicial (ex: "014999999999")
  if (phone.startsWith('0') && phone.length > 11) {
    phone = phone.slice(1);
  }

  // Se começar com "55" e tiver 12-13 dígitos → já está correto
  if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
    return phone;
  }

  // Se tiver 10-11 dígitos (sem código país) → adicionar 55
  if (phone.length === 10 || phone.length === 11) {
    return '55' + phone;
  }

  // Se tiver 8-9 dígitos (sem DDD!) → inválido (não temos como completar)
  if (phone.length < 10) return null;

  // Se já começa com 55 mas com dígitos errados
  if (phone.startsWith('55') && phone.length > 13) {
    // Tenta remover excesso
    return phone.slice(0, 13);
  }

  return null;
}

/**
 * Valida se o número é um WhatsApp válido (celular brasileiro)
 * Celular: DDD (2d) + 9 + número (8d) = 11d → com 55 = 13d
 * Fixo:    DDD (2d) + número (8d) = 10d → com 55 = 12d (sem WhatsApp)
 */
export function isValidWhatsApp(phone) {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return false;
  // Celular: 13 dígitos APENAS (55 + DDD(2) + 9 + número(8))
  // 12 dígitos = FIXO (sem WhatsApp)
  return formatted.length === 13;
}

/**
 * Gera link wa.me seguro
 * Retorna null se número inválido (nunca gera link quebrado)
 */
export function buildWhatsAppUrl(phone, message = '') {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return null;

  const base = `https://wa.me/${formatted}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}

/**
 * Exibe número formatado para UI (ex: (14) 99167-6428)
 */
export function displayPhone(phone) {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return phone || '—';
  const digits = formatted.startsWith('55') ? formatted.slice(2) : formatted;
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}