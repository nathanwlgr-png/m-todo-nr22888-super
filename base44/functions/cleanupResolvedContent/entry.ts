import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const DAYS = 60;
const resolvedPending = ['rejected', 'rejeitado', 'sent', 'manual_sent_confirmed', 'enviado_manual', 'convertido'];
const cutoffIso = () => new Date(Date.now() - DAYS * 86400000).toISOString();
const isOld = (record, cutoff) => String(record.created_date || record.data_criacao || '') < cutoff;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'preview';
    if (!['preview', 'notify'].includes(action)) {
      return Response.json({
        error: 'Exclusão física desativada. Use apenas preview ou notify.',
        destructive_action_blocked: true
      }, { status: 409 });
    }

    const service = base44.asServiceRole;
    const cutoff = cutoffIso();
    const pending = await service.entities.PendingMessage.list('-created_date', 1000);
    const whatsapp = await service.entities.WhatsAppMessage.list('-created_date', 1000);
    const pendingCandidates = pending.filter((item) => resolvedPending.includes(item.status) && isOld(item, cutoff));
    const whatsappCandidates = whatsapp.filter((item) => ['sent', 'delivered', 'read', 'failed'].includes(item.status) && isOld(item, cutoff));
    const result = {
      days: DAYS,
      cutoff,
      pending: pendingCandidates.length,
      whatsapp: whatsappCandidates.length,
      total: pendingCandidates.length + whatsappCandidates.length,
      deleted: 0
    };

    if (action === 'notify') {
      await service.entities.Alert.create({
        user_email: user.email,
        title: 'Revisão de conteúdo antigo',
        message: `${result.total} itens antigos aguardam revisão manual. Nenhum registro foi apagado.`,
        type: 'task_overdue',
        priority: 'baixa',
        link_to: '/',
        read: false,
        dismissed: false
      });
    }

    return Response.json({ success: true, ...result, deletion_enabled: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});