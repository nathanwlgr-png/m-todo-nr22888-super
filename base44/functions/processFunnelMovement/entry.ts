import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id, stage_name, from_stage } = await req.json().catch(() => ({}));
    const validStages = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];
    if (!client_id || !validStages.includes(stage_name)) {
      return Response.json({ error: 'client_id e stage_name válido são obrigatórios' }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.Client.get(client_id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    await base44.asServiceRole.entities.Client.update(client_id, { pipeline_stage: stage_name });
    const shouldAutomate = from_stage !== stage_name && stage_name === 'qualificado';
    let taskCreated = false;
    let messageQueued = false;

    if (shouldAutomate) {
      const taskTitle = 'Follow-up automático — Lead qualificado';
      const pendingTasks = await base44.asServiceRole.entities.Task.filter({ client_id, status: 'pendente' });
      if (!pendingTasks.some(task => task.auto_created && task.title === taskTitle)) {
        const dueDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
        await base44.asServiceRole.entities.Task.create({
          client_id,
          client_name: client.clinic_name || client.full_name || client.first_name,
          title: taskTitle,
          description: `Criado pela automação lead_status_change: ${from_stage || 'sem etapa'} → qualificado`,
          due_date: dueDate,
          status: 'pendente',
          priority: 'alta',
          type: 'follow_up',
          auto_created: true,
          assigned_to: user.email,
          assigned_to_name: user.full_name,
        });
        taskCreated = true;
      }

      const pendingMessages = await base44.asServiceRole.entities.PendingMessage.filter({ recipient_id: client_id });
      const context = 'Automação lead_status_change — lead qualificado';
      if (!pendingMessages.some(message => message.context === context && ['pending', 'aguardando_aprovacao'].includes(message.status))) {
        const recipientName = client.clinic_name || client.full_name || client.first_name;
        const message = `Olá, ${client.first_name || recipientName}! Agora que avançamos na qualificação, posso alinhar os próximos passos para a solução Seamaty mais adequada à sua rotina?`;
        await base44.asServiceRole.entities.PendingMessage.create({
          canal: 'whatsapp',
          channel: 'whatsapp',
          destinatario_nome: recipientName,
          destinatario_contato: client.phone || '',
          cliente_id: client_id,
          recipient_id: client_id,
          recipient_name: recipientName,
          recipient_phone: client.phone || '',
          contexto: context,
          context,
          mensagem: message,
          message_content: message,
          status: 'aguardando_aprovacao',
          criado_por_agente: 'lead_status_change',
          priority: 'alta',
          data_criacao: new Date().toISOString(),
        });
        messageQueued = true;
      }
    }

    return Response.json({
      success: true,
      client_id,
      from_stage: from_stage || client.pipeline_stage,
      stage_name,
      automation_triggered: shouldAutomate,
      task_created: taskCreated,
      whatsapp_queued: messageQueued,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});