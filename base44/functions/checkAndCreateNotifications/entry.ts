import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getAutomationEmail, getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getOptionalUser(base44);
    if (isForbiddenManualUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { dry_run = false } = await req.json().catch(() => ({}));
    const notificationEmail = await getAutomationEmail(base44, user);

    const now = new Date();
    const notifications = [];

    // Buscar apenas o necessário, com limites agressivos
    const [clients, tasks, visits] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ status: 'quente' }, '-updated_date', 30),
      base44.asServiceRole.entities.Task.filter({ status: 'pendente' }, '-due_date', 20),
      base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }, 'scheduled_date', 10),
    ]);

    // 1. Clientes quentes sem contato há 7+ dias
    const cutoff7d = new Date(now);
    cutoff7d.setDate(cutoff7d.getDate() - 7);
    for (const c of clients) {
      const last = c.last_contact_date ? new Date(c.last_contact_date) : null;
      if (!last || last < cutoff7d) {
        notifications.push({
          user_email: notificationEmail,
          title: '🔥 Cliente Quente Sem Contato',
          message: `${c.first_name} (${c.clinic_name || c.city}) está há 7+ dias sem contato`,
          type: 'client_cold',
          priority: 'alta',
          link_to: `ClientProfile?id=${c.id}`
        });
      }
    }

    // 2. Tarefas atrasadas (resumo único)
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
    if (overdue.length > 0) {
      notifications.push({
        user_email: notificationEmail,
        title: '⚠️ Tarefas Atrasadas',
        message: `${overdue.length} tarefa(s) atrasada(s) precisam de atenção`,
        type: 'task_overdue',
        priority: 'alta',
        link_to: 'TasksUnified'
      });
    }

    // 3. Visitas nas próximas 24h
    const in24h = new Date(now);
    in24h.setHours(in24h.getHours() + 24);
    for (const v of visits) {
      const vDate = new Date(v.scheduled_date);
      if (vDate > now && vDate <= in24h) {
        const hrs = Math.round((vDate - now) / 3600000);
        notifications.push({
          user_email: notificationEmail,
          title: '📅 Visita em Breve',
          message: `Visita com ${v.client_name} em ${hrs}h`,
          type: 'task_overdue',
          priority: 'alta',
          link_to: 'ScheduledAgenda'
        });
      }
    }

    if (notifications.length === 0) {
      return Response.json({ success: true, notifications_created: 0 });
    }

    // Deduplicar contra alertas existentes (só últimos 20)
    const existing = await base44.asServiceRole.entities.Alert.filter(
      { user_email: notificationEmail, read: false }, '-created_date', 20
    );

    const toCreate = notifications.filter(n =>
      !existing.some(e => e.title === n.title && e.message === n.message)
    );

    // Criar em paralelo somente na execução real.
    if (!dry_run) {
      await Promise.all(toCreate.map(n => base44.asServiceRole.entities.Alert.create(n)));
    }

    return Response.json({ success: true, notifications_created: dry_run ? 0 : toCreate.length, detected: toCreate.length, dry_run });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});