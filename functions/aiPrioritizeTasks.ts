import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all tasks
    const tasks = await base44.entities.Task.list();
    const clients = await base44.entities.Client.list();
    const leads = await base44.entities.Lead.list();

    const prioritizedTasks = [];

    for (const task of tasks) {
      if (task.status !== 'pendente') continue;

      // Find related client or lead
      const client = clients.find(c => c.id === task.client_id);
      const lead = leads.find(l => l.id === task.client_id);
      const entity = client || lead;

      let score = 0;
      let reasons = [];

      // Hot client/lead: +30
      if (entity?.status === 'quente' || entity?.ai_score > 70) {
        score += 30;
        reasons.push('Cliente/Lead quente');
      }

      // High priority task: +20
      if (task.priority === 'alta') {
        score += 20;
        reasons.push('Prioridade alta definida');
      }

      // Overdue: +25
      if (task.due_date && new Date(task.due_date) < new Date()) {
        score += 25;
        reasons.push('Tarefa atrasada');
      }

      // Due today: +15
      const today = new Date().toISOString().split('T')[0];
      if (task.due_date === today) {
        score += 15;
        reasons.push('Vence hoje');
      }

      // Auto-created (from automation): +10
      if (task.auto_created) {
        score += 10;
        reasons.push('Criada automaticamente por IA');
      }

      // Client at risk of churn: +20
      if (entity?.ai_sales_intelligence?.churn_risk > 60) {
        score += 20;
        reasons.push('Cliente com risco de churn');
      }

      // High conversion probability: +15
      if (entity?.ai_sales_intelligence?.conversion_probability > 70) {
        score += 15;
        reasons.push('Alta probabilidade de conversão');
      }

      if (score > 50) {
        prioritizedTasks.push({
          task_id: task.id,
          task_title: task.title,
          client_name: task.client_name,
          ai_priority_score: Math.min(score, 100),
          reasons,
          due_date: task.due_date,
          assigned_to: task.assigned_to
        });
      }
    }

    // Sort by score
    prioritizedTasks.sort((a, b) => b.ai_priority_score - a.ai_priority_score);

    // Create alerts for top priority tasks
    const topTasks = prioritizedTasks.slice(0, 5);
    
    for (const task of topTasks) {
      if (task.ai_priority_score > 70) {
        // Check if alert already exists
        const existingAlerts = await base44.entities.Alert.filter({
          link_to: `Tasks?highlight=${task.task_id}`,
          read: false
        });

        if (existingAlerts.length === 0) {
          await base44.asServiceRole.entities.Alert.create({
            user_email: task.assigned_to || user.email,
            title: '🎯 Tarefa Prioritária IA',
            message: `"${task.task_title}" - Score: ${task.ai_priority_score}. ${task.reasons.join(', ')}`,
            type: 'task_overdue',
            priority: 'alta',
            link_to: `Tasks?highlight=${task.task_id}`
          });
        }
      }
    }

    return Response.json({
      success: true,
      prioritized_tasks: prioritizedTasks,
      total_tasks: tasks.length,
      high_priority_count: prioritizedTasks.filter(t => t.ai_priority_score > 70).length
    });

  } catch (error) {
    console.error('AI prioritization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});