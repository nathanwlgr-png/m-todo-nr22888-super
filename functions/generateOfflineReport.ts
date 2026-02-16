import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Buscar todas as entradas offline do usuário
    const entries = await base44.entities.OfflineDataEntry.filter({
      user_email: user.email
    });

    // Agrupar por período (últimos 30 dias)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentEntries = entries.filter(e => new Date(e.entry_date) >= thirtyDaysAgo);

    // Calcular métricas
    const visits = recentEntries.filter(e => e.entry_type === 'visita');
    const sales = recentEntries.filter(e => e.entry_type === 'venda');

    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.sale_value) || 0), 0);
    const conversionRate = visits.length > 0 ? ((sales.length / visits.length) * 100).toFixed(1) : 0;

    // Agrupar visitas por cidade
    const visitsByCity = {};
    visits.forEach(v => {
      if (v.city) {
        visitsByCity[v.city] = (visitsByCity[v.city] || 0) + 1;
      }
    });

    // Agrupar vendas por equipamento
    const salesByEquipment = {};
    sales.forEach(s => {
      if (s.equipment_sold) {
        salesByEquipment[s.equipment_sold] = (salesByEquipment[s.equipment_sold] || 0) + 1;
      }
    });

    // Desempenho diário
    const dailyPerformance = {};
    recentEntries.forEach(e => {
      if (!dailyPerformance[e.entry_date]) {
        dailyPerformance[e.entry_date] = { date: e.entry_date, visits: 0, sales: 0, revenue: 0 };
      }
      if (e.entry_type === 'visita') dailyPerformance[e.entry_date].visits++;
      if (e.entry_type === 'venda') {
        dailyPerformance[e.entry_date].sales++;
        dailyPerformance[e.entry_date].revenue += parseFloat(e.sale_value || 0);
      }
    });

    // Criar relatório
    const report = {
      seller_email: user.email,
      seller_name: user.full_name,
      period_start: thirtyDaysAgo.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
      total_visits: visits.length,
      total_sales: sales.length,
      conversion_rate: parseFloat(conversionRate),
      total_revenue: totalRevenue,
      average_ticket: sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : 0,
      visits_by_city: visitsByCity,
      sales_by_equipment: salesByEquipment,
      daily_performance: Object.values(dailyPerformance).sort((a, b) => new Date(a.date) - new Date(b.date)),
      is_offline_data: true,
      generated_at: new Date().toISOString()
    };

    // Salvar relatório
    await base44.entities.OfflinePerformanceReport.create(report);

    return new Response(JSON.stringify({
      success: true,
      report,
      message: `Relatório gerado: ${report.total_visits} visitas, ${report.total_sales} vendas, ${report.conversion_rate}% conversão`
    }), { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});