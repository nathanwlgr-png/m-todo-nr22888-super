import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekAgoStr = weekAgo.toISOString();

    // Fetch all data in parallel
    const [clients, leads, sales] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Sale.list()
    ]);

    // Filter this week's data
    const newClients = clients.filter(c => c.created_date && new Date(c.created_date) >= weekAgo);
    const newLeads = leads.filter(l => l.created_date && new Date(l.created_date) >= weekAgo);
    const closedDeals = sales.filter(s =>
      s.created_date && new Date(s.created_date) >= weekAgo && s.status === 'fechada'
    );
    const totalRevenue = closedDeals.reduce((sum, s) => sum + (s.sale_value || 0), 0);

    // Pipeline summary
    const pipelineByStage = {};
    for (const c of clients) {
      const stage = c.pipeline_stage || 'lead';
      if (!pipelineByStage[stage]) pipelineByStage[stage] = 0;
      pipelineByStage[stage]++;
    }

    // Hot clients
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const coldClients = clients.filter(c => c.status === 'frio').length;

    // By representante
    const byRep = {};
    for (const c of newClients) {
      const rep = c.representante || 'Sem representante';
      if (!byRep[rep]) byRep[rep] = 0;
      byRep[rep]++;
    }

    const periodStr = `${weekAgo.toLocaleDateString('pt-BR')} – ${now.toLocaleDateString('pt-BR')}`;

    const htmlReport = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #1f2937; }
  h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
  .kpi { background: #f3f4f6; border-radius: 12px; padding: 16px; text-align: center; }
  .kpi .value { font-size: 2rem; font-weight: bold; color: #4f46e5; }
  .kpi .label { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }
  .revenue { color: #10b981 !important; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #4f46e5; color: white; padding: 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:hover td { background: #f9fafb; }
  .footer { color: #9ca3af; font-size: 12px; margin-top: 40px; text-align: center; }
</style></head>
<body>
  <h1>📊 Relatório Semanal de Vendas</h1>
  <p><strong>Período:</strong> ${periodStr}</p>
  <p>Gerado em: ${now.toLocaleString('pt-BR')}</p>

  <h2>📈 KPIs da Semana</h2>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="value">${newLeads.length}</div>
      <div class="label">Novos Leads</div>
    </div>
    <div class="kpi">
      <div class="value">${newClients.length}</div>
      <div class="label">Novos Clientes</div>
    </div>
    <div class="kpi">
      <div class="value revenue">R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="label">Receita Fechada</div>
    </div>
    <div class="kpi">
      <div class="value">${closedDeals.length}</div>
      <div class="label">Vendas Fechadas</div>
    </div>
    <div class="kpi">
      <div class="value" style="color:#ef4444">${hotClients}</div>
      <div class="label">Clientes Quentes</div>
    </div>
    <div class="kpi">
      <div class="value" style="color:#6b7280">${coldClients}</div>
      <div class="label">Clientes Frios</div>
    </div>
  </div>

  <h2>🗂️ Funil de Vendas (Total)</h2>
  <table>
    <tr><th>Estágio</th><th>Quantidade</th></tr>
    ${Object.entries(pipelineByStage).map(([stage, count]) =>
      `<tr><td>${stage}</td><td><strong>${count}</strong></td></tr>`
    ).join('')}
  </table>

  <h2>👥 Novos Clientes por Representante</h2>
  <table>
    <tr><th>Representante</th><th>Novos Clientes</th></tr>
    ${Object.entries(byRep).map(([rep, count]) =>
      `<tr><td>${rep}</td><td><strong>${count}</strong></td></tr>`
    ).join('')}
  </table>

  <h2>💰 Vendas Fechadas esta Semana</h2>
  <table>
    <tr><th>Cliente</th><th>Produto</th><th>Valor</th></tr>
    ${closedDeals.map(s =>
      `<tr><td>${s.client_name || '-'}</td><td>${s.equipment_name || '-'}</td><td>R$ ${(s.sale_value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>`
    ).join('') || '<tr><td colspan="3" style="text-align:center;color:#9ca3af">Nenhuma venda fechada esta semana</td></tr>'}
  </table>

  <div class="footer">Relatório automático gerado pelo CRM NR22 · SEAMATY Brasil</div>
</body>
</html>`;

    // Send to admin emails
    const adminEmails = ['nathan.wlgr@gmail.com'];
    for (const email of adminEmails) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `📊 Relatório Semanal de Vendas – ${periodStr}`,
        body: htmlReport,
        from_name: 'CRM NR22 – SEAMATY Brasil'
      });
    }

    return Response.json({
      success: true,
      period: periodStr,
      summary: {
        new_leads: newLeads.length,
        new_clients: newClients.length,
        closed_deals: closedDeals.length,
        total_revenue: totalRevenue
      }
    });

  } catch (error) {
    console.error('Error in weeklySalesReport:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});