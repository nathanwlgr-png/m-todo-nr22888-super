import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getAutomationEmail, getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getOptionalUser(base44);
    if (isForbiddenManualUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { dry_run = false } = await req.json().catch(() => ({}));
    const recipientEmail = await getAutomationEmail(base44, user);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    const pending = await base44.asServiceRole.entities.Task.filter({ status: 'pendente' }, 'due_date', 200);
    const tasks = pending
      .filter((task) => !task.assigned_to || task.assigned_to === recipientEmail)
      .sort((a, b) => {
        const followUpA = a.type === 'follow_up' ? 0 : 1;
        const followUpB = b.type === 'follow_up' ? 0 : 1;
        if (followUpA !== followUpB) return followUpA - followUpB;
        return String(a.due_date || '9999-12-31').localeCompare(String(b.due_date || '9999-12-31'));
      });

    const overdue = tasks.filter((task) => task.due_date && task.due_date < today);
    const followUps = tasks.filter((task) => task.type === 'follow_up');
    const details = tasks.slice(0, 10).map((task, index) => {
      const due = task.due_date ? ` — ${task.due_date < today ? 'ATRASADA' : task.due_date}` : '';
      const client = task.client_name ? ` (${task.client_name})` : '';
      return `${index + 1}. ${task.title}${client}${due}`;
    });
    const summary = tasks.length === 0
      ? 'Nenhuma tarefa pendente. Agenda livre para novas oportunidades.'
      : `${tasks.length} tarefa(s) pendente(s), ${followUps.length} follow-up(s) e ${overdue.length} atrasada(s).`;
    const message = [`LEMBRETE DIÁRIO NR22888 — ${today}`, summary, ...details, tasks.length > 10 ? `+ ${tasks.length - 10} tarefa(s) no CRM.` : '', 'Abrir: Tarefas Unificadas'].filter(Boolean).join('\n');
    const title = `Tarefas pendentes — ${today}`;

    if (dry_run) {
      return Response.json({ success: true, dry_run: true, pending: tasks.length, follow_ups: followUps.length, overdue: overdue.length, message });
    }

    const existing = await base44.asServiceRole.entities.Alert.filter({ user_email: recipientEmail, title }, '-created_date', 1);
    if (existing.length === 0) {
      await base44.asServiceRole.entities.Alert.create({
        user_email: recipientEmail,
        title,
        message,
        type: 'task_overdue',
        priority: overdue.length > 0 ? 'alta' : 'media',
        link_to: 'TasksUnified',
        read: false,
        dismissed: false
      });
    }

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return Response.json({ error: 'Telegram não configurado', crm_created: existing.length === 0 }, { status: 500 });

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(10000)
    });
    const telegram = await telegramResponse.json();
    if (!telegram.ok) return Response.json({ error: telegram.description || 'Falha no Telegram', crm_created: existing.length === 0 }, { status: 502 });

    return Response.json({ success: true, pending: tasks.length, follow_ups: followUps.length, overdue: overdue.length, crm_created: existing.length === 0, telegram_sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});