import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active automation rules
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({ active: true });
    
    if (!rules || rules.length === 0) {
      return Response.json({ message: 'No active automation rules', processed: 0 });
    }

    let processed = 0;
    const results = [];

    for (const rule of rules) {
      try {
        const executionResult = await processRule(base44, rule);
        if (executionResult) {
          processed++;
          results.push({
            rule_id: rule.id,
            rule_name: rule.name,
            status: 'success',
            count: executionResult.count || 0
          });
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error.message);
        results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update last_execution timestamp
    for (const rule of rules) {
      await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
        last_execution: new Date().toISOString()
      });
    }

    return Response.json({
      message: 'Automation rules processed successfully',
      processed,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

async function processRule(base44, rule) {
  switch (rule.trigger_type) {
    case 'visit_completed':
      return await handleVisitCompleted(base44, rule);
    case 'days_without_interaction':
      return await handleDaysWithoutInteraction(base44, rule);
    case 'score_threshold':
      return await handleScoreThreshold(base44, rule);
    case 'lead_created':
      return await handleLeadCreated(base44, rule);
    case 'status_change':
      return await handleStatusChange(base44, rule);
    default:
      console.warn(`Unknown trigger type: ${rule.trigger_type}`);
      return null;
  }
}

async function handleVisitCompleted(base44, rule) {
  const daysOffset = rule.trigger_condition?.days_offset || 2;
  const targetDate = new Date(Date.now() - daysOffset * 24 * 60 * 60 * 1000);

  // Find visits completed around the target date
  const visits = await base44.asServiceRole.entities.Visit.filter({
    status: 'realizada'
  });

  const targetVisits = visits.filter(v => {
    const visitDate = new Date(v.scheduled_date);
    const diffDays = Math.floor((Date.now() - visitDate.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays >= daysOffset - 1 && diffDays <= daysOffset + 1;
  });

  let executed = 0;
  for (const visit of targetVisits) {
    if (rule.action_type === 'send_email') {
      executed += await sendFollowUpEmail(base44, visit.client_id, rule.action_config);
    } else if (rule.action_type === 'create_task') {
      executed += await createFollowUpTask(base44, visit.client_id, rule.action_config);
    } else if (rule.action_type === 'send_whatsapp') {
      executed += await sendWhatsAppMessage(base44, visit.client_id, rule.action_config);
    }
  }

  return { count: executed };
}

async function handleDaysWithoutInteraction(base44, rule) {
  const days = rule.trigger_condition?.days || 30;
  const targetDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const clients = await base44.asServiceRole.entities.Client.list();
  let executed = 0;

  for (const client of clients) {
    const lastContactDate = client.last_contact_date ? new Date(client.last_contact_date) : null;
    
    if (!lastContactDate || lastContactDate < targetDate) {
      if (rule.action_type === 'update_client_status') {
        await base44.asServiceRole.entities.Client.update(client.id, {
          status: rule.action_config?.status || 'frio'
        });
        executed++;
      } else if (rule.action_type === 'create_task') {
        await createFollowUpTask(base44, client.id, rule.action_config);
        executed++;
      } else if (rule.action_type === 'send_alert') {
        await createAlert(base44, client.full_name, `Cliente ${client.full_name} sem interação há ${days} dias`);
        executed++;
      }
    }
  }

  return { count: executed };
}

async function handleScoreThreshold(base44, rule) {
  const minScore = rule.trigger_condition?.min_score || 0;
  const maxScore = rule.trigger_condition?.max_score || 100;

  const clients = await base44.asServiceRole.entities.Client.list();
  let executed = 0;

  for (const client of clients) {
    const score = client.purchase_score || 0;
    
    if (score >= minScore && score <= maxScore) {
      if (rule.action_type === 'create_task') {
        await createFollowUpTask(base44, client.id, rule.action_config);
        executed++;
      } else if (rule.action_type === 'send_alert') {
        await createAlert(base44, client.full_name, `Score do cliente: ${score}`);
        executed++;
      } else if (rule.action_type === 'send_whatsapp') {
        await sendWhatsAppMessage(base44, client.id, rule.action_config);
        executed++;
      }
    }
  }

  return { count: executed };
}

async function handleLeadCreated(base44, rule) {
  // Get leads created in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const leads = await base44.asServiceRole.entities.Lead.filter({
    stage: 'novo'
  });

  const recentLeads = leads.filter(lead => 
    new Date(lead.created_date) > yesterday
  );

  let executed = 0;
  for (const lead of recentLeads) {
    if (rule.action_type === 'send_whatsapp') {
      await sendWhatsAppToLead(base44, lead, rule.action_config);
      executed++;
    } else if (rule.action_type === 'create_task') {
      await createTaskForLead(base44, lead.id, rule.action_config);
      executed++;
    }
  }

  return { count: executed };
}

async function handleStatusChange(base44, rule) {
  // This would typically require tracking historical changes
  // For now, we'll handle it as a manual trigger check
  const { from_status, to_status } = rule.trigger_condition;

  const clients = await base44.asServiceRole.entities.Client.list();
  let executed = 0;

  for (const client of clients) {
    if (client.pipeline_stage === to_status) {
      if (rule.action_type === 'create_task') {
        await createFollowUpTask(base44, client.id, rule.action_config);
        executed++;
      } else if (rule.action_type === 'send_email') {
        await sendFollowUpEmail(base44, client.id, rule.action_config);
        executed++;
      }
    }
  }

  return { count: executed };
}

// Helper Functions
async function sendFollowUpEmail(base44, clientId, config) {
  try {
    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client?.email) return 0;

    // Call email sending function
    await base44.asServiceRole.functions.invoke('sendFollowUpEmail', {
      client_id: clientId,
      client_email: client.email,
      template: config?.template || 'default'
    });

    return 1;
  } catch (error) {
    console.error('Error sending email:', error);
    return 0;
  }
}

async function sendWhatsAppMessage(base44, clientId, config) {
  try {
    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client?.phone) return 0;

    await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
      phone: client.phone,
      template: config?.template || 'welcome',
      client_name: client.first_name
    });

    return 1;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return 0;
  }
}

async function sendWhatsAppToLead(base44, lead, config) {
  try {
    if (!lead?.phone) return 0;

    await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
      phone: lead.phone,
      template: config?.template || 'welcome_lead',
      client_name: lead.full_name
    });

    return 1;
  } catch (error) {
    console.error('Error sending WhatsApp to lead:', error);
    return 0;
  }
}

async function createFollowUpTask(base44, clientId, config) {
  try {
    const client = await base44.asServiceRole.entities.Client.get(clientId);
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config?.days_offset || 7));

    await base44.asServiceRole.entities.Task.create({
      client_id: clientId,
      client_name: client?.full_name || 'Unknown',
      title: config?.title || 'Follow-up automático',
      description: `Tarefa criada automaticamente pela regra: ${config?.description || ''}`,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pendente',
      priority: config?.priority || 'media',
      type: config?.type || 'follow_up',
      auto_created: true
    });

    return 1;
  } catch (error) {
    console.error('Error creating task:', error);
    return 0;
  }
}

async function createTaskForLead(base44, leadId, config) {
  try {
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config?.days_offset || 1));

    // Create as a Task associated with the lead
    await base44.asServiceRole.entities.Task.create({
      client_id: leadId,
      client_name: lead?.full_name || 'New Lead',
      title: config?.title || 'Qualificar novo lead',
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pendente',
      priority: config?.priority || 'alta',
      type: 'follow_up',
      auto_created: true
    });

    return 1;
  } catch (error) {
    console.error('Error creating task for lead:', error);
    return 0;
  }
}

async function createAlert(base44, clientName, message) {
  try {
    // Create an alert for the first admin user
    const users = await base44.asServiceRole.entities.User.list();
    const adminUser = users.find(u => u.role === 'admin');

    if (adminUser) {
      await base44.asServiceRole.entities.Alert.create({
        user_email: adminUser.email,
        title: `Automação: ${clientName}`,
        message: message,
        type: 'automation',
        priority: 'media',
        read: false
      });
    }

    return 1;
  } catch (error) {
    console.error('Error creating alert:', error);
    return 0;
  }
}