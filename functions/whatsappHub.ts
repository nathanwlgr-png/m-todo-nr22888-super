import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN') || '';
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_ID') || '';
const WEBHOOK_VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_TOKEN') || 'nr22_webhook_2026';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Webhook verification from WhatsApp
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // Handle incoming messages
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];
        const contact = value?.contacts?.[0];
        
        if (message && contact) {
          const phoneNumber = message.from;
          const messageText = message.text?.body || '';
          const messageType = message.type;
          
          // Get or create Lead/Client
          let client = null;
          try {
            const existingClients = await base44.entities.Client.filter({ phone: phoneNumber });
            if (existingClients.length === 0) {
              // Auto-create client from WhatsApp
              client = await base44.entities.Client.create({
                first_name: contact.profile?.name || 'WhatsApp User',
                phone: phoneNumber,
                lead_source: 'whatsapp',
                status: 'morno',
                pipeline_stage: 'lead'
              });
            } else {
              client = existingClients[0];
            }
          } catch (error) {
            console.error('Client creation error:', error);
          }

          // Save message to log
          try {
            await base44.entities.AutomatedMessageLog.create({
              client_id: client?.id,
              client_phone: phoneNumber,
              message_type: 'whatsapp_incoming',
              message_content: messageText,
              sent_status: 'enviada',
              sent_at: new Date().toISOString(),
              response_received: true
            });
          } catch (e) {
            console.error('Log error:', e);
          }

          // Process message for actions (scheduling, proposal, etc)
          const lowerMsg = messageText.toLowerCase();
          
          if (lowerMsg.includes('agendar') || lowerMsg.includes('marcar')) {
            await sendWhatsAppMessage(phoneNumber, 
              '📅 Para agendar uma visita, informe:\n- Data preferida\n- Horário\n- Assunto da visita');
          } else if (lowerMsg.includes('proposta') || lowerMsg.includes('orçamento')) {
            await sendWhatsAppMessage(phoneNumber,
              '💼 Vou gerar uma proposta personalizada! Me diga:\n- Equipamento de interesse\n- Necessidades técnicas\n- Orçamento disponível');
          } else if (lowerMsg.includes('dúvida') || lowerMsg.includes('como') || lowerMsg.includes('quanto')) {
            // AI-powered FAQ response
            const aiResponse = await generateAIResponse(messageText, client?.id);
            await sendWhatsAppMessage(phoneNumber, aiResponse);
          } else {
            // Default welcome response
            await sendWhatsAppMessage(phoneNumber,
              '👋 Olá! Bem-vindo ao CRM NR22.\n\n📌 Posso ajudar com:\n- 📅 Agendar visita\n- 💼 Gerar proposta\n- ❓ Responder dúvidas\n- 📝 Criar tarefa\n\nO que você precisa?');
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('WhatsApp Hub Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function sendWhatsAppMessage(phoneNumber, message) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;
  
  try {
    const response = await fetch(`https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
  }
}

async function generateAIResponse(question, clientId) {
  try {
    const base44 = createClientFromRequest(new Request('http://dummy', { method: 'GET' }));
    
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um assistente de vendas de laboratórios veterinários. Responda de forma curta e profissional em português sobre: "${question}". Máximo 2 linhas.`,
      add_context_from_internet: false
    });
    
    return response || 'Ótima pergunta! Entre em contato com nosso time para detalhes específicos.';
  } catch (error) {
    return 'Ótima pergunta! Entre em contato com nosso time para detalhes específicos.';
  }
}