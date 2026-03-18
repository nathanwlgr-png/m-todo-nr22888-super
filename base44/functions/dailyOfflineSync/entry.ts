// Sincronização Diária Completa - Dashboard Offline
// Salva snapshot de clientes, vendas, leads, tarefas, histórico no localStorage via flag
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permite ser chamado por automação (sem user) ou por usuário
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const body = await req.json().catch(() => ({}));
    const { manual = false } = body;

    // Admin-check se chamado manualmente por usuário autenticado
    if (manual && user && user.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    // Buscar TODOS os dados necessários em paralelo
    const [clients, leads, sales, tasks, visits, interactions, whatsappMessages] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 500).catch(() => []),
      base44.asServiceRole.entities.Lead.list('-created_date', 300).catch(() => []),
      base44.asServiceRole.entities.Sale.list('-sale_date', 200).catch(() => []),
      base44.asServiceRole.entities.Task.filter({ status: 'pendente' }).catch(() => []),
      base44.asServiceRole.entities.Visit.list('-scheduled_date', 100).catch(() => []),
      base44.asServiceRole.entities.Interaction.list('-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.WhatsAppMessage.list('-created_date', 100).catch(() => []),
    ]);

    // Montar snapshot enriquecido: para cada cliente, incluir histórico de vendas e visitas
    const clientsEnriched = clients.map(c => {
      const clientSales = sales.filter(s => s.client_id === c.id);
      const clientVisits = visits.filter(v => v.client_id === c.id);
      const clientTasks = tasks.filter(t => t.client_id === c.id);
      const clientInteractions = interactions.filter(i => i.client_id === c.id);
      const clientMessages = whatsappMessages.filter(m => m.contact_id === c.id);
      return {
        ...c,
        _sales: clientSales,
        _visits: clientVisits,
        _tasks: clientTasks,
        _interactions: clientInteractions.slice(0, 10),
        _messages: clientMessages.slice(0, 10),
        _total_revenue: clientSales.reduce((s, v) => s + (v.sale_value || 0), 0),
        _last_sale: clientSales[0] || null,
        _last_visit: clientVisits[0] || null,
      };
    });

    // Montar leads enriquecidos
    const leadsEnriched = leads.map(l => ({
      ...l,
      _interactions: interactions.filter(i => i.client_id === l.id).slice(0, 5),
    }));

    // Estatísticas rápidas para dashboard offline
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlySales = sales.filter(s => s.sale_date?.startsWith(thisMonth));

    const stats = {
      total_clients: clients.length,
      hot_clients: clients.filter(c => c.status === 'quente').length,
      warm_clients: clients.filter(c => c.status === 'morno').length,
      cold_clients: clients.filter(c => c.status === 'frio').length,
      total_leads: leads.length,
      new_leads: leads.filter(l => l.stage === 'novo').length,
      qualified_leads: leads.filter(l => l.stage === 'qualificado').length,
      total_sales: sales.length,
      closed_sales: sales.filter(s => s.status === 'fechada' || s.status === 'entregue').length,
      monthly_revenue: monthlySales.reduce((s, v) => s + (v.sale_value || 0), 0),
      total_revenue: sales.reduce((s, v) => s + (v.sale_value || 0), 0),
      pending_tasks: tasks.length,
      high_priority_tasks: tasks.filter(t => t.priority === 'alta').length,
      visits_this_month: visits.filter(v => v.scheduled_date?.startsWith(thisMonth)).length,
      pipeline: {
        lead: clients.filter(c => c.pipeline_stage === 'lead').length,
        qualificado: clients.filter(c => c.pipeline_stage === 'qualificado').length,
        proposta: clients.filter(c => c.pipeline_stage === 'proposta').length,
        negociacao: clients.filter(c => c.pipeline_stage === 'negociacao').length,
        fechado: clients.filter(c => c.pipeline_stage === 'fechado').length,
      }
    };

    // Identificar clientes que precisam de atenção
    const today = now.toISOString().split('T')[0];
    const attention = {
      birthdays_today: clients.filter(c => c.birthdate?.slice(5) === today.slice(5)),
      overdue_tasks: tasks.filter(t => t.due_date && t.due_date < today),
      cold_no_contact: clients.filter(c => {
        if (c.status !== 'frio') return false;
        if (!c.last_contact_date) return true;
        const days = Math.floor((now - new Date(c.last_contact_date)) / 86400000);
        return days > 14;
      }).slice(0, 20),
      hot_no_next_action: clients.filter(c => c.status === 'quente' && !c.next_action).slice(0, 10),
    };

    const snapshot = {
      generated_at: now.toISOString(),
      sync_date: today,
      version: '3.0',
      stats,
      attention,
      clients: clientsEnriched,
      leads: leadsEnriched,
      sales: sales.slice(0, 200),
      tasks: tasks.slice(0, 200),
      visits: visits.slice(0, 100),
    };

    // Salvar snapshot na entidade MobVendedorSync para persistência
    const existingSync = await base44.asServiceRole.entities.MobVendedorSync
      .filter({ sync_type: 'daily_offline_snapshot' })
      .catch(() => []);

    const syncPayload = {
      sync_type: 'daily_offline_snapshot',
      sync_date: today,
      total_clients: clients.length,
      total_leads: leads.length,
      total_sales: sales.length,
      data_json: JSON.stringify(snapshot).substring(0, 100000), // Limit 100KB
      status: 'completed',
      last_sync: now.toISOString(),
    };

    if (existingSync.length > 0) {
      await base44.asServiceRole.entities.MobVendedorSync.update(existingSync[0].id, syncPayload).catch(() => {});
    } else {
      await base44.asServiceRole.entities.MobVendedorSync.create(syncPayload).catch(() => {});
    }

    return Response.json({
      success: true,
      sync_date: today,
      stats,
      snapshot_size: JSON.stringify(snapshot).length,
      clients_synced: clients.length,
      leads_synced: leads.length,
      sales_synced: sales.length,
      tasks_synced: tasks.length,
      message: `Sync completo: ${clients.length} clientes, ${leads.length} leads, ${sales.length} vendas`,
    });

  } catch (error) {
    console.error('Erro dailyOfflineSync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});