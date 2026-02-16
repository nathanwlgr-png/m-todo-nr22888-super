import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { message, channel, notification_type, data } = await req.json();

    // Get Slack config
    const integrations = await base44.asServiceRole.entities.Integration.filter({ provider: 'slack' });
    const slackConfig = integrations[0];

    if (!slackConfig || slackConfig.status !== 'active') {
      return Response.json({ error: 'Slack não configurado' }, { status: 400 });
    }

    const webhookUrl = slackConfig.config.webhook_url;
    const defaultChannel = channel || slackConfig.config.default_channel || '#vendas';

    // Build message based on type
    let slackMessage = {};

    switch (notification_type) {
      case 'new_hot_lead':
        slackMessage = {
          channel: defaultChannel,
          username: 'CRM Bot',
          icon_emoji: ':fire:',
          attachments: [{
            color: '#ff0000',
            title: '🔥 NOVO LEAD QUENTE!',
            fields: [
              { title: 'Nome', value: data.name, short: true },
              { title: 'Score', value: data.score, short: true },
              { title: 'Empresa', value: data.company, short: true },
              { title: 'Cidade', value: data.city, short: true },
              { title: 'Interesse', value: data.interest, short: false }
            ],
            footer: 'CRM NR22',
            ts: Math.floor(Date.now() / 1000)
          }]
        };
        break;

      case 'sale_closed':
        slackMessage = {
          channel: defaultChannel,
          username: 'CRM Bot',
          icon_emoji: ':moneybag:',
          attachments: [{
            color: '#00ff00',
            title: '💰 VENDA FECHADA!',
            fields: [
              { title: 'Cliente', value: data.client_name, short: true },
              { title: 'Valor', value: `R$ ${data.value?.toLocaleString('pt-BR')}`, short: true },
              { title: 'Equipamento', value: data.equipment, short: true },
              { title: 'Vendedor', value: data.salesperson, short: true }
            ],
            footer: 'CRM NR22',
            ts: Math.floor(Date.now() / 1000)
          }]
        };
        break;

      case 'task_reminder':
        slackMessage = {
          channel: defaultChannel,
          username: 'CRM Bot',
          icon_emoji: ':bell:',
          text: `🔔 *Lembrete de Tarefa*\n\n${message}\n\nCliente: ${data.client_name}\nPrazo: ${data.due_date}`
        };
        break;

      default:
        slackMessage = {
          channel: defaultChannel,
          username: 'CRM Bot',
          icon_emoji: ':robot_face:',
          text: message
        };
    }

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar mensagem para Slack');
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Slack notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});