import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body.confirmed_by_user !== true) {
      return Response.json({ error: 'Confirmação humana obrigatória para preparar rascunhos' }, { status: 409 });
    }

    const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 500);
    const pending = await base44.asServiceRole.entities.PendingMessage.filter({ status: 'aguardando_aprovacao' }, '-created_date', 500);
    const cutoff = Date.now() - 30 * 86400000;
    const drafts = clients.filter((client) => {
      const lastContact = client.last_contact_follow_up_date || client.last_contact_date;
      const inactive = !lastContact || new Date(lastContact).getTime() < cutoff;
      const open = !['fechado', 'perdido'].includes(client.pipeline_stage);
      const duplicate = pending.some((item) => item.cliente_id === client.id && item.contexto === 'follow_up_inativo_30d');
      return client.email && inactive && open && !duplicate;
    }).slice(0, 50).map((client) => {
      const name = client.first_name || client.full_name || 'Cliente';
      const message = `Olá ${name}. Preparamos este contato para retomar nossa conversa e entender se existe algum ponto técnico ou comercial que precisa de esclarecimento.`;
      return {
        canal: 'email', channel: 'email', destinatario_nome: name,
        destinatario_contato: client.email, cliente_id: client.id,
        contexto: 'follow_up_inativo_30d', context: 'follow_up_inativo_30d',
        mensagem: message, message_content: message,
        email_subject: `Retomada de contato — ${name}`,
        status: 'aguardando_aprovacao', criado_por_agente: 'followUpInactiveClients',
        aprovado_por_nathan: false, data_criacao: new Date().toISOString(), priority: 'media'
      };
    });

    if (drafts.length) await base44.asServiceRole.entities.PendingMessage.bulkCreate(drafts);
    return Response.json({ success: true, drafts_created: drafts.length, messages_sent: 0, message: 'Rascunhos preparados. Nenhum envio realizado.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});