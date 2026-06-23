import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const tasks = await base44.asServiceRole.entities.Task.list('-due_date', 500).catch(() => []);
    const dueTasks = tasks.filter((task) => {
      if (task.status !== 'pendente') return false;
      if (task.type !== 'follow_up') return false;
      if (!task.source_visit_id) return false;
      if (task.followup_alert_sent === true) return false;
      const dueAt = task.followup_due_at ? new Date(task.followup_due_at) : new Date(`${task.due_date}T12:00:00.000Z`);
      return dueAt <= now;
    }).slice(0, 50);

    if (dueTasks.length === 0) {
      return Response.json({ success: true, alerts_created: 0 });
    }

    const users = await base44.asServiceRole.entities.User.list().catch(() => []);
    const admins = users.filter((user) => user.email && user.role === 'admin').map((user) => user.email);
    const fallbackRecipients = admins.length > 0 ? admins : ['nathan.wlgr@gmail.com'];
    let alertsCreated = 0;

    for (const task of dueTasks) {
      for (const email of fallbackRecipients) {
        await base44.asServiceRole.entities.Alert.create({
          user_email: email,
          title: `Follow-up 48h: ${task.client_name || 'clínica'}`,
          message: `${task.title}\n\n${task.description || 'Retomar contato após visita.'}`,
          type: 'high_score_lead',
          priority: task.priority === 'alta' ? 'alta' : 'media',
          link_to: task.client_id ? `/ClientProfile?id=${task.client_id}` : '/TasksUnified',
          read: false,
          dismissed: false
        });
        alertsCreated++;
      }

      await base44.asServiceRole.entities.Task.update(task.id, {
        followup_alert_sent: true,
        followup_alert_sent_at: now.toISOString()
      });
    }

    return Response.json({ success: true, tasks_processed: dueTasks.length, alerts_created: alertsCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});