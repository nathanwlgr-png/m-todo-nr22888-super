import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, automationConfig } = await req.json();

    if (action === 'enable') {
      return await enableAutomation(base44, user.email, automationConfig);
    } else if (action === 'disable') {
      return await disableAutomation(base44, user.email);
    } else if (action === 'get_status') {
      return await getAutomationStatus(base44, user.email);
    } else if (action === 'execute_now') {
      return await executeAutomationNow(base44, user.email);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enableAutomation(base44, userEmail, config) {
  try {
    // Get or create automation settings
    const settings = await base44.entities.AutomationSettings.filter({ user_email: userEmail }).catch(() => []);
    
    const automationData = {
      user_email: userEmail,
      automation_enabled: true,
      message_types_enabled: config.message_types_enabled || {
        turbo_venda: true,
        follow_up: true,
        conquistar: false,
        reativacao: false,
        proposta: false,
        lembranca_visita: false
      },
      send_time: config.send_time || '09:00',
      max_messages_per_day: config.max_messages_per_day || 20,
      avoid_time_ranges: config.avoid_time_ranges || []
    };

    if (settings.length === 0) {
      await base44.entities.AutomationSettings.create(automationData);
    } else {
      await base44.entities.AutomationSettings.update(settings[0].id, automationData);
    }

    return Response.json({
      success: true,
      message: '✅ Automação ativada com sucesso'
    });
  } catch (error) {
    console.error('Enable error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function disableAutomation(base44, userEmail) {
  try {
    const settings = await base44.entities.AutomationSettings.filter({ user_email: userEmail }).catch(() => []);
    
    if (settings.length > 0) {
      await base44.entities.AutomationSettings.update(settings[0].id, {
        automation_enabled: false
      });
    }

    return Response.json({
      success: true,
      message: '✅ Automação desativada'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function getAutomationStatus(base44, userEmail) {
  try {
    const settings = await base44.entities.AutomationSettings.filter({ user_email: userEmail }).catch(() => []);
    
    return Response.json({
      success: true,
      enabled: settings.length > 0 && settings[0].automation_enabled,
      config: settings.length > 0 ? settings[0] : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function executeAutomationNow(base44, userEmail) {
  try {
    const settings = await base44.entities.AutomationSettings.filter({ 
      user_email: userEmail,
      automation_enabled: true
    }).catch(() => []);

    if (settings.length === 0) {
      return Response.json({ success: false, message: 'Automação não está ativada' });
    }

    const config = settings[0];
    const allClients = await base44.entities.Client.list().catch(() => []);
    let sentCount = 0;

    // Filter clients that need follow-up
    const clientsToContact = allClients.filter(c => {
      if (!c.last_contact_date) return config.message_types_enabled.follow_up;
      const daysSince = Math.floor((new Date() - new Date(c.last_contact_date)) / (1000 * 60 * 60 * 24));
      return daysSince > 7;
    }).slice(0, config.max_messages_per_day);

    for (const client of clientsToContact) {
      if (sentCount >= config.max_messages_per_day) break;

      try {
        // Generate personalized message based on client status
        let messageContent = '';
        
        if (config.message_types_enabled.turbo_venda && client.status === 'quente') {
          messageContent = `🚀 ${client.first_name}! Temos uma oportunidade imperdível para sua clínica. Quer conversar?`;
        } else if (config.message_types_enabled.follow_up && daysSince > 7) {
          messageContent = `👋 ${client.first_name}! Estava pensando em você. Como vai a clínica? Posso ajudar em algo?`;
        } else if (config.message_types_enabled.reativacao && client.status === 'frio') {
          messageContent = `💡 ${client.first_name}, senti sua falta! Temos novidades que podem interessar. Bora conversar?`;
        }

        if (messageContent && client.phone) {
          // Log the automated message
          await base44.entities.AutomatedMessageLog.create({
            client_id: client.id,
            client_phone: client.phone,
            client_name: client.first_name,
            message_type: 'turbo_venda',
            message_content: messageContent,
            trigger_reason: 'Automatic scheduled automation',
            sent_status: 'pendente',
            automation_enabled: true
          });

          sentCount++;
        }
      } catch (e) {
        console.error(`Error processing client ${client.id}:`, e);
      }
    }

    return Response.json({
      success: true,
      message: `✅ ${sentCount} mensagens agendadas`,
      sent_count: sentCount
    });
  } catch (error) {
    console.error('Execute error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}