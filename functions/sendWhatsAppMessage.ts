import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id, client_phone, message, auto_log } = await req.json();

    if (!message || !client_phone) {
      return Response.json({ error: 'Parâmetros obrigatórios faltando' }, { status: 400 });
    }

    // Enviar via integração ou API WhatsApp (usando Twilio, Wati, etc)
    // Por enquanto, simular envio
    const sendResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      message_id: Math.random().toString(36).substring(7)
    };

    // Log automático da mensagem se auto_log = true
    if (auto_log) {
      const logData = {
        client_id: client_id,
        client_name: '', // Será preenchido pela busca do cliente
        client_phone: client_phone,
        message_type: 'whatsapp',
        message_content: message,
        trigger_reason: 'Enviado manualmente do CRM',
        sent_status: 'enviada',
        sent_at: new Date().toISOString(),
        automation_enabled: false,
        success: true
      };

      // Buscar nome do cliente
      const client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);
      if (client) {
        logData.client_name = client.full_name || client.clinic_name;
      }

      // Criar log
      await base44.asServiceRole.entities.AutomatedMessageLog.create(logData);
    }

    return Response.json(sendResponse);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});