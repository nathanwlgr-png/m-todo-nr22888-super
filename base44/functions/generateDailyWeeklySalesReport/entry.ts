import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { report_type, recipients } = body; // 'daily' ou 'weekly'

    // Fetch data
    const sales = await base44.entities.Sale.list('-sale_date');
    const leads = await base44.entities.Lead.list('-created_date');
    const goals = await base44.entities.SalesGoal.filter({ status: 'active' });

    // Filtrar por período
    const now = new Date();
    let startDate = new Date();
    
    if (report_type === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (report_type === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    }

    const periodSales = sales.filter(s => 
      s.sale_date && new Date(s.sale_date) >= startDate
    );

    const totalValue = periodSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const salesCount = periodSales.length;
    const avgValue = salesCount > 0 ? totalValue / salesCount : 0;

    // Gerar HTML do relatório
    const periodLabel = report_type === 'daily' ? 'Últimas 24 horas' : 'Últimos 7 dias';
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .kpi { background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .kpi-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 8px; text-align: left; font-weight: bold; font-size: 12px; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .footer { text-align: center; color: #6b7280; font-size: 11px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
    .green { color: #059669; }
    .orange { color: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório de Vendas ${report_type === 'daily' ? 'Diário' : 'Semanal'}</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">Período: ${periodLabel}</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-value green">${salesCount}</div>
        <div class="kpi-label">Vendas Fechadas</div>
      </div>
      <div class="kpi">
        <div class="kpi-value green">R$ ${(totalValue / 1000).toFixed(1)}k</div>
        <div class="kpi-label">Valor Total</div>
      </div>
      <div class="kpi">
        <div class="kpi-value orange">R$ ${(avgValue / 1000).toFixed(1)}k</div>
        <div class="kpi-label">Ticket Médio</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${leads.length}</div>
        <div class="kpi-label">Total de Leads</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🏆 Top 5 Vendedores</div>
      <table>
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Vendas</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${periodSales
            .reduce((acc, s) => {
              const vendor = s.salesperson || 'Sem vendedor';
              const existing = acc.find(a => a.name === vendor);
              if (existing) {
                existing.count += 1;
                existing.value += s.sale_value || 0;
              } else {
                acc.push({ name: vendor, count: 1, value: s.sale_value || 0 });
              }
              return acc;
            }, [])
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(v => `<tr><td>${v.name}</td><td>${v.count}</td><td>R$ ${(v.value / 1000).toFixed(1)}k</td></tr>`)
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">📈 Produtos Mais Vendidos</div>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${periodSales
            .reduce((acc, s) => {
              const product = s.equipment_name || 'Outros';
              const existing = acc.find(a => a.name === product);
              if (existing) {
                existing.count += 1;
                existing.value += s.sale_value || 0;
              } else {
                acc.push({ name: product, count: 1, value: s.sale_value || 0 });
              }
              return acc;
            }, [])
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(p => `<tr><td>${p.name}</td><td>${p.count}</td><td>R$ ${(p.value / 1000).toFixed(1)}k</td></tr>`)
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Relatório gerado automaticamente pelo CRM NR22888 em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Enviar email
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Relatório ${report_type === 'daily' ? 'Diário' : 'Semanal'} de Vendas - ${new Date().toLocaleDateString('pt-BR')}`,
          body: htmlReport,
          from_name: 'CRM NR22888'
        });
      }
    }

    return Response.json({
      success: true,
      report_type,
      period: periodLabel,
      sales_count: salesCount,
      total_value: totalValue,
      average_value: avgValue,
      recipients_sent: recipients?.length || 0
    });
  } catch (error) {
    console.error('Error in generateDailyWeeklySalesReport:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});