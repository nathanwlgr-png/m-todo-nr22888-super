import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2d5589e6f59c31e605d3d3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Busca dados do CRM
    const [clients, leads, sales] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Sale.list()
    ]);

    const newClients = clients.filter(c => c.created_date && new Date(c.created_date) >= weekAgo);
    const newLeads = leads.filter(l => l.created_date && new Date(l.created_date) >= weekAgo);
    const closedDeals = sales.filter(s =>
      s.created_date && new Date(s.created_date) >= weekAgo && s.status === 'fechada'
    );
    const totalRevenue = closedDeals.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const pipeline = {};
    for (const c of clients) {
      const stage = c.pipeline_stage || 'lead';
      pipeline[stage] = (pipeline[stage] || 0) + 1;
    }

    const periodStr = `${weekAgo.toLocaleDateString('pt-BR')} – ${now.toLocaleDateString('pt-BR')}`;

    // Obtém token do usuário
    let sheetsUrl = null;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

      // 1. Cria nova planilha
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: `Relatório Semanal CRM – ${periodStr}` },
          sheets: [
            { properties: { title: 'KPIs' } },
            { properties: { title: 'Funil' } },
            { properties: { title: 'Vendas' } }
          ]
        })
      });
      const sheet = await createRes.json();
      const spreadsheetId = sheet.spreadsheetId;
      sheetsUrl = sheet.spreadsheetUrl;

      // 2. Escreve dados nas abas
      const kpiRows = [
        ['Métrica', 'Valor', 'Período'],
        ['Novos Leads', newLeads.length, periodStr],
        ['Novos Clientes', newClients.length, periodStr],
        ['Vendas Fechadas', closedDeals.length, periodStr],
        ['Receita Total (R$)', totalRevenue, periodStr],
        ['Clientes Quentes', hotClients, periodStr],
        ['Total Clientes', clients.length, periodStr],
        ['Gerado em', now.toLocaleString('pt-BR'), '']
      ];

      const funnelRows = [
        ['Estágio', 'Quantidade'],
        ...Object.entries(pipeline).map(([stage, count]) => [stage, count])
      ];

      const salesRows = [
        ['Cliente', 'Equipamento', 'Valor (R$)', 'Data'],
        ...closedDeals.map(s => [
          s.client_name || '-',
          s.equipment_name || '-',
          s.sale_value || 0,
          s.sale_date || '-'
        ])
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: 'KPIs!A1', values: kpiRows },
            { range: 'Funil!A1', values: funnelRows },
            { range: 'Vendas!A1', values: salesRows }
          ]
        })
      });
    } catch (sheetsErr) {
      console.error('Google Sheets não conectado para este usuário:', sheetsErr.message);
    }

    // Envia e-mail com HTML
    const htmlReport = `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#1f2937}
  h1{color:#4f46e5;border-bottom:3px solid #4f46e5;padding-bottom:10px}
  h2{color:#374151;margin-top:30px}
  .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
  .kpi{background:#f3f4f6;border-radius:12px;padding:16px;text-align:center}
  .kpi .value{font-size:2rem;font-weight:bold;color:#4f46e5}
  .kpi .label{font-size:.85rem;color:#6b7280;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#4f46e5;color:white;padding:10px;text-align:left}
  td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
  .sheets-link{display:inline-block;background:#10b981;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;margin:16px 0}
  .footer{color:#9ca3af;font-size:12px;margin-top:40px;text-align:center}
</style></head><body>
  <h1>📊 Relatório Semanal de Vendas</h1>
  <p><strong>Período:</strong> ${periodStr}</p>
  ${sheetsUrl ? `<a class="sheets-link" href="${sheetsUrl}" target="_blank">📊 Abrir no Google Sheets</a>` : ''}
  <h2>📈 KPIs da Semana</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="value">${newLeads.length}</div><div class="label">Novos Leads</div></div>
    <div class="kpi"><div class="value">${newClients.length}</div><div class="label">Novos Clientes</div></div>
    <div class="kpi"><div class="value" style="color:#10b981">R$ ${totalRevenue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="label">Receita Fechada</div></div>
    <div class="kpi"><div class="value">${closedDeals.length}</div><div class="label">Vendas Fechadas</div></div>
    <div class="kpi"><div class="value" style="color:#ef4444">${hotClients}</div><div class="label">Clientes Quentes</div></div>
    <div class="kpi"><div class="value">${clients.length}</div><div class="label">Total Clientes</div></div>
  </div>
  <h2>🗂️ Funil de Vendas</h2>
  <table><tr><th>Estágio</th><th>Quantidade</th></tr>
    ${Object.entries(pipeline).map(([s,c])=>`<tr><td>${s}</td><td><strong>${c}</strong></td></tr>`).join('')}
  </table>
  <h2>💰 Vendas Fechadas</h2>
  <table><tr><th>Cliente</th><th>Produto</th><th>Valor</th></tr>
    ${closedDeals.map(s=>`<tr><td>${s.client_name||'-'}</td><td>${s.equipment_name||'-'}</td><td>R$ ${(s.sale_value||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td></tr>`).join('')||'<tr><td colspan="3" style="text-align:center;color:#9ca3af">Nenhuma venda esta semana</td></tr>'}
  </table>
  <div class="footer">Relatório automático · CRM NR22 · SEAMATY Brasil</div>
</body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `📊 Relatório Semanal de Vendas – ${periodStr}`,
      body: htmlReport,
      from_name: 'CRM NR22 – SEAMATY Brasil'
    });

    return Response.json({
      success: true,
      period: periodStr,
      email_sent_to: user.email,
      sheets_url: sheetsUrl,
      summary: {
        new_leads: newLeads.length,
        new_clients: newClients.length,
        closed_deals: closedDeals.length,
        total_revenue: totalRevenue
      }
    });

  } catch (error) {
    console.error('syncWeeklyReportToSheets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});