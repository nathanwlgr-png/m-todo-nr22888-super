import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { trigger_type, entity_id, trigger_data } = await req.json();

    // Buscar workflows ativos para este trigger
    const workflows = await base44.asServiceRole.entities.WorkflowRule.filter({
      is_active: true,
      trigger_type: trigger_type
    });

    const results = [];

    for (const workflow of workflows) {
      // Verificar condições
      let conditionsMet = true;
      
      if (workflow.trigger_conditions) {
        const conditions = workflow.trigger_conditions;
        
        // Verificar status change
        if (conditions.to_status && trigger_data?.new_status !== conditions.to_status) {
          conditionsMet = false;
        }
        
        if (conditions.from_status && trigger_data?.old_status !== conditions.from_status) {
          conditionsMet = false;
        }
      }

      if (!conditionsMet) continue;

      // Executar ações
      for (const action of workflow.actions || []) {
        try {
          let actionResult;

          switch (action.action_type) {
            case 'create_task':
              actionResult = await base44.asServiceRole.entities.Task.create({
                title: action.action_data.title,
                description: action.action_data.description,
                client_id: entity_id,
                priority: action.action_data.priority || 'media',
                status: 'pending',
                due_date: new Date(Date.now() + (action.action_data.due_date_days || 0) * 86400000).toISOString()
              });
              break;

            case 'create_alert':
              actionResult = await base44.asServiceRole.entities.Alert.create({
                user_email: trigger_data?.assigned_to || user.email,
                title: action.action_data.title,
                message: action.action_data.message || `Workflow: ${workflow.name}`,
                type: action.action_data.type || 'info',
                priority: action.action_data.priority || 'media',
                link_to: `ClientProfile?id=${entity_id}`
              });
              break;

            case 'send_message':
              const client = await base44.asServiceRole.entities.Client.get(entity_id);
              if (client?.phone) {
                const message = action.action_data.template?.replace('{nome}', client.first_name);
                actionResult = await base44.asServiceRole.entities.PendingMessage.create({
                  recipient_id: entity_id,
                  recipient_name: client.first_name,
                  recipient_phone: client.phone,
                  channel: action.action_data.channel || 'whatsapp',
                  message_content: message,
                  context: `Workflow: ${workflow.name}`,
                  ai_reasoning: `Disparado automaticamente por workflow`,
                  priority: 'media',
                  status: 'pending'
                });
              }
              break;

            case 'update_client':
              actionResult = await base44.asServiceRole.entities.Client.update(
                entity_id,
                action.action_data
              );
              break;

            case 'notify_user':
              actionResult = await base44.asServiceRole.entities.Alert.create({
                user_email: trigger_data?.assigned_to || user.email,
                title: '🔔 Notificação Automática',
                message: action.action_data.message,
                type: 'info',
                priority: 'media'
              });
              break;
          }

          results.push({
            workflow: workflow.name,
            action: action.action_type,
            success: true,
            result: actionResult
          });

        } catch (error) {
          results.push({
            workflow: workflow.name,
            action: action.action_type,
            success: false,
            error: error.message
          });
        }
      }

      // Atualizar contador
      await base44.asServiceRole.entities.WorkflowRule.update(workflow.id, {
        execution_count: (workflow.execution_count || 0) + 1,
        last_execution: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      workflows_executed: workflows.length,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});