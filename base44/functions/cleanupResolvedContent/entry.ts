import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DAYS = 60;
const resolvedPending = ['rejected', 'rejeitado', 'sent', 'manual_sent_confirmed', 'enviado_manual', 'convertido'];
const cutoffIso = () => new Date(Date.now() - DAYS * 86400000).toISOString();
const isOld = (record, cutoff) => String(record.created_date || record.data_criacao || '') < cutoff;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'preview';
    const service = base44.asServiceRole;
    const cutoff = cutoffIso();
    const pending = await service.entities.PendingMessage.list('-created_date', 1000);
    const whatsapp = await service.entities.WhatsAppMessage.list('-created_date', 1000);
    const pendingCandidates = pending.filter((item) => resolvedPending.includes(item.status) && isOld(item, cutoff));
    const whatsappCandidates = whatsapp.filter((item) => ['sent', 'delivered', 'read', 'failed'].includes(item.status) && isOld(item, cutoff));
    const result = { days: DAYS, cutoff, pending: pendingCandidates.length, whatsapp: whatsappCandidates.length, total: pendingCandidates.length + whatsappCandidates.length };

    if (action === 'notify') {
      const users = await service.entities.User.list();
      for (const user of users.filter((item) => item.role === 'admin')) {
        await service.entities.Alert.create({ user_email: user.email, title: 'Revisão semanal de limpeza', message: `${result.total} itens resolvidos há mais de ${DAYS} dias podem ser revisados. Nada foi apagado.`, type: 'task_overdue', priority: 'baixa', link_to: '/', read: false, dismissed: false });
      }
      return Response.json({ success: true, ...result, notified: true });
    }

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (action === 'delete') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (body.confirmation !== 'APAGAR RESOLVIDOS 60 DIAS') return Response.json({ error: 'Confirmação inválida' }, { status: 400 });
      if (pendingCandidates.length) await service.entities.PendingMessage.deleteMany({ id: { $in: pendingCandidates.map((item) => item.id) } });
      if (whatsappCandidates.length) await service.entities.WhatsAppMessage.deleteMany({ id: { $in: whatsappCandidates.map((item) => item.id) } });
      return Response.json({ success: true, deleted: result.total, ...result });
    }
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});