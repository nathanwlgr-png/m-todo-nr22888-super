import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { trigger_type, event_data } = await req.json().catch(() => ({}));

    if (!trigger_type) {
      return Response.json({ error: 'trigger_type required' }, { status: 400 });
    }

    // Buscar todas as regras ativas para este gatilho
    const rules = await base44.entities.AutomationRule.filter({
      trigger_type,
      enabled: true
    }).catch(() => []);

    let totalExecuted = 0;
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const rule of rules) {
      const startTime = Date.now();
      let status = 'success';
      let resultData = {};
      let errorMessage = null;
      let affectedEntities = {};

      try {
        // Validar condições do gatilho
        if (!validateTriggerConditions(rule.trigger_conditions, event_data)) {
          continue; // Pular para próxima regra
        }

        // Verificar frequência
        if (rule.frequency !== 'on_each_event' && rule.last_triggered) {
          const hoursSinceLastTrigger = (Date.now() - new Date(rule.last_triggered).getTime()) / (1000 * 60 * 60);
          
          if (rule.frequency === 'daily' && hoursSinceLastTrigger < 24) continue;
          if (rule.frequency === 'weekly' && hoursSinceLastTrigger < 168) continue;
        }

        // Executar ação
        if (rule.action_type === 'create_task') {
          affectedEntities = await executeTaskCreation(base44, rule, event_data);
        } else if (rule.action_type === 'send_notification') {
          affectedEntities = await executeSendNotification(base44, rule, event_data);
        } else if (rule.action_type === 'send_email') {
          affectedEntities = await executeSendEmail(base44, rule, event_data);
        } else if (rule.action_type === 'update_client') {
          affectedEntities = await executeUpdateClient(base44, rule, event_data);
        }

        resultData = affectedEntities;
        successCount++;

        // Atualizar regra com timestamp e contadores
        await base44.entities.AutomationRule.update(rule.id, {
          last_triggered: new Date().toISOString(),
          execution_count: (rule.execution_count || 0) + 1,
          success_count: (rule.success_count || 0) + 1
        }).catch(() => {});

      } catch (error) {
        status = 'failed';
        errorMessage = error.message;
        failureCount++;

        // Incrementar contador de falhas
        await base44.entities.AutomationRule.update(rule.id, {
          failure_count: (rule.failure_count || 0) + 1
        }).catch(() => {});
      }

      const executionTimeMs = Date.now() - startTime;

      // Registrar execução
      await base44.entities.AutomationLog.create({
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_type: rule.trigger_type,
        action_type: rule.action_type,
        status,
        event_data,
        result_data: resultData,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs,
        affected_entities: affectedEntities
      }).catch(() => {});

      totalExecuted++;
      results.push({
        rule_id: rule.id,
        rule_name: rule.name,
        status,
        execution_time_ms: executionTimeMs,
        affected_entities: affectedEntities
      });
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      trigger_type,
      summary: {
        rules_found: rules.length,
        rules_executed: totalExecuted,
        success_count: successCount,
        failure_count: failureCount
      },
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function validateTriggerConditions(conditions, eventData) {
  if (!conditions || !eventData) return true;

  // Validar cada condição
  for (const [key, expectedValue] of Object.entries(conditions)) {
    const actualValue = eventData[key];

    if (typeof expectedValue === 'object' && expectedValue.operator) {
      const { operator, value } = expectedValue;
      
      if (operator === 'less_than' && actualValue >= value) return false;
      if (operator === 'greater_than' && actualValue <= value) return false;
      if (operator === 'equals' && actualValue !== value) return false;
      if (operator === 'includes' && !String(actualValue).includes(value)) return false;
    } else {
      if (actualValue !== expectedValue) return false;
    }
  }

  return true;
}

async function executeTaskCreation(base44, rule, eventData) {
  const template = rule.action_config?.task_template || {};
  const dueDateOffset = template.due_days_offset || 1;
  const dueDate = new Date(Date.now() + dueDateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Interpolação de variáveis
  let title = template.title || 'Tarefa Automática';
  let description = template.description || '';

  if (eventData) {
    title = interpelateVariables(title, eventData);
    description = interpelateVariables(description, eventData);
  }

  const task = await base44.entities.Task.create({
    title,
    description,
    type: template.type || 'outro',
    priority: template.priority || 'media',
    due_date: dueDate,
    status: 'pendente',
    auto_created: true,
    client_id: eventData?.client_id,
    assigned_to: eventData?.assigned_to || rule.action_config?.notification_config?.assign_to_emails?.[0]
  });

  return { tasks_created: 1 };
}

async function executeSendNotification(base44, rule, eventData) {
  const config = rule.action_config?.notification_config || {};
  const channels = config.channels || ['in_app'];
  const assignees = config.assign_to_emails || [];

  let title = config.title || rule.name;
  let message = config.message_template || '';

  if (eventData) {
    title = interpelateVariables(title, eventData);
    message = interpelateVariables(message, eventData);
  }

  let notificationCount = 0;

  // Enviar notificações in-app
  if (channels.includes('in_app')) {
    for (const email of assignees) {
      await base44.entities.Alert.create({
        user_email: email,
        title,
        message,
        type: 'automation_alert',
        priority: 'media',
        link_to: eventData?.link_to
      }).catch(() => {});
      notificationCount++;
    }
  }

  // Enviar emails
  if (channels.includes('email')) {
    for (const email of assignees) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: title,
        body: message
      }).catch(() => {});
      notificationCount++;
    }
  }

  return { notifications_sent: notificationCount };
}

async function executeSendEmail(base44, rule, eventData) {
  const config = rule.action_config?.email_config || {};
  const recipients = config.recipients || [];

  let subject = config.subject || rule.name;
  let body = config.body_template || '';

  if (eventData) {
    subject = interpelateVariables(subject, eventData);
    body = interpelateVariables(body, eventData);
  }

  let emailCount = 0;

  for (const email of recipients) {
    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body
    }).catch(() => {});
    emailCount++;
  }

  return { emails_sent: emailCount };
}

async function executeUpdateClient(base44, rule, eventData) {
  if (!eventData?.client_id) return { clients_updated: 0 };

  const updates = rule.action_config?.update_fields || {};
  await base44.entities.Client.update(eventData.client_id, updates).catch(() => {});

  return { clients_updated: 1 };
}

function interpelateVariables(text, data) {
  if (!text) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }
  
  return result;
}