import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lead_id } = await req.json().catch(() => ({}));
    if (!lead_id) return Response.json({ error: 'lead_id é obrigatório' }, { status: 400 });
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    const score = Number(lead.predictive_score || 0);
    if (score < 80) return Response.json({ success: true, skipped: true, reason: 'score_below_80' });

    const linkTo = `/LeadProfile?id=${lead.id}`;
    const existing = await base44.asServiceRole.entities.Alert.filter({ type: 'high_score_lead', link_to: linkTo, dismissed: false });
    const users = await base44.asServiceRole.entities.User.list();
    const recipients = [...new Set([lead.assigned_to, ...users.filter((item) => item.role === 'admin').map((item) => item.email)].filter(Boolean))];
    const leadName = lead.full_name || lead.company || 'Lead sem nome';

    if (!existing.length && recipients.length) {
      await base44.asServiceRole.entities.Alert.bulkCreate(recipients.map((email) => ({
        user_email: email, title: 'Lead com alto score de compra',
        message: `Lead ${leadName} atingiu score ${score}. Revise e priorize o contato.`,
        type: 'high_score_lead', priority: 'alta', link_to: linkTo, read: false, dismissed: false
      })));
    }

    return Response.json({ success: true, score, crm_alerts: existing.length ? 0 : recipients.length, external_messages_sent: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});