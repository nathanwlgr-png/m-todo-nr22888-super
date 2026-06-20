import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Aceita tanto "phone"/"client_phone" para compatibilidade
    const client_id    = body.client_id;
    const client_phone = body.client_phone || body.phone;
    const message      = body.message;
    const auto_log     = body.auto_log !== false; // default true

    if (!message || !client_phone) {
      return Response.json({ error: 'Parâmetros obrigatórios: message e phone (ou client_phone)' }, { status: 400 });
    }

    // Normalizar telefone (remove não-dígitos, remove .0 do Excel, adiciona 55 se necessário)
    let phone = String(client_phone).replace(/\.0+$/, '').replace(/\D/g, '');
    if (!phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) {
      phone = '55' + phone;
    }

    if (phone.length < 12) {
      return Response.json({ error: 'Número de telefone inválido (mínimo 12 dígitos com código país)' }, { status: 422 });
    }

    // Gerar link wa.me (padrão principal seguro)
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Log automático no CRM (salva histórico independente do envio)
    if (auto_log && client_id) {
      try {
        // Buscar nome do cliente
        let clientName = '';
        const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
        if (clients && clients.length > 0) {
          clientName = clients[0].full_name || clients[0].first_name || clients[0].clinic_name || '';
        }

        await base44.asServiceRole.entities.AutomatedMessageLog.create({
          client_id,
          client_name: clientName,
          client_phone: phone,
          message_type: 'whatsapp',
          message_content: message,
          trigger_reason: 'Link WhatsApp preparado no CRM (envio manual)',
          sent_status: 'prepared',
          prepared_at: new Date().toISOString(),
          automation_enabled: false,
          success: true
        });
      } catch (logErr) {
        // Log falhou mas não bloqueia resposta
        console.warn('[sendWhatsAppMessage] Log falhou:', logErr.message);
      }
    }

    return Response.json({
      success: true,
      wa_url: waUrl,
      phone_formatted: phone,
      timestamp: new Date().toISOString(),
      message_id: Math.random().toString(36).substring(7),
      status: 'prepared',
      note: 'Link preparado. NÃO marca como enviado. Confirmar envio manualmente após abrir o WhatsApp.'
    });

  } catch (error) {
    console.error('[sendWhatsAppMessage] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});