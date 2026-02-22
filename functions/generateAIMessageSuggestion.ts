import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, channel, template, actionType } = await req.json();

    if (!clientId || !channel) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar dados do cliente
    const client = await base44.entities.Client.filter({ id: clientId });
    const clientData = client[0];

    if (!clientData) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const prompt = `
Você é um especialista em vendas e comunicação. Gere uma mensagem ${channel === 'email' ? 'de email' : 'de WhatsApp'} personalizada e persuasiva para o seguinte cliente:

Cliente: ${clientData.full_name || clientData.first_name}
Empresa: ${clientData.clinic_name || clientData.razao_social || 'Clínica/Empresa'}
Status: ${clientData.status}
Equipamento de interesse: ${clientData.equipment_interest || 'Não especificado'}
Dores principais: ${clientData.main_pains?.join(', ') || 'Não identificadas'}
Score de compra: ${clientData.purchase_score || 'Não calculado'}

${actionType === 'follow_up' ? 'Este é um follow-up após uma visita ou contato anterior. Reforce o relacionamento e próximos passos.' : ''}
${actionType === 'proposal' ? 'Este é um follow-up sobre uma proposta enviada. Gere urgência e interesse.' : ''}
${actionType === 'reactivation' ? 'Este cliente está inativo há mais de 30 dias. Reative o interesse de forma estratégica.' : ''}
${actionType === 'welcome' ? 'Este é um primeiro contato com novo lead. Crie interesse e agende conversa.' : ''}

${channel === 'whatsapp' ? 'Mantenha a mensagem concisa (máximo 500 caracteres), use emojis estrategicamente e linguagem casual mas profissional.' : 'Crie um email com assunto e corpo, mantendo tom profissional e persuasivo.'}

${channel === 'email' ? 'Responda em JSON com: {"subject": "assunto", "body": "corpo do email"}' : 'Responda apenas com a mensagem WhatsApp.'}
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: channel === 'email' ? {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' }
        }
      } : undefined
    });

    return Response.json({
      suggestion: response,
      clientName: clientData.full_name || clientData.first_name,
      channel
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});