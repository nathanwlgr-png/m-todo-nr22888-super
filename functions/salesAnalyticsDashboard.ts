import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all relevant data
    const [allSales, allClients, allTasks, allVisits, allInteractions] = await Promise.all([
      base44.asServiceRole.entities.Sale.list().catch(() => []),
      base44.asServiceRole.entities.Client.list().catch(() => []),
      base44.asServiceRole.entities.Task.list().catch(() => []),
      base44.asServiceRole.entities.Visit.list().catch(() => []),
      base44.asServiceRole.entities.Interaction.list().catch(() => [])
    ]);

    // ─── SALES FORECAST ────────────────────────────────────────────────────
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const recentSales = allSales.filter(s => new Date(s.sale_date) >= last90Days);
    
    let totalRevenue = 0;
    let monthlyRevenue = {};
    let salesByRep = {};

    recentSales.forEach(sale => {
      totalRevenue += sale.sale_value || 0;
      const month = new Date(sale.sale_date).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (sale.sale_value || 0);
      const rep = sale.salesperson || 'Unknown';
      salesByRep[rep] = (salesByRep[rep] || 0) + (sale.sale_value || 0);
    });

    const avgMonthlyRevenue = totalRevenue / 3;
    const forecast6Months = avgMonthlyRevenue * 6;
    const forecast12Months = avgMonthlyRevenue * 12;

    // ─── CONVERSION RATES ──────────────────────────────────────────────────
    const pipelineStages = {};
    allClients.forEach(client => {
      const stage = client.pipeline_stage || 'lead';
      pipelineStages[stage] = (pipelineStages[stage] || 0) + 1;
    });

    const totalClients = allClients.length;
    const closedWins = allClients.filter(c => c.pipeline_stage === 'fechado').length;
    const conversionRate = totalClients > 0 ? ((closedWins / totalClients) * 100).toFixed(2) : 0;

    // Calculate conversion per stage
    const stageConversion = {};
    Object.keys(pipelineStages).forEach(stage => {
      const stageClients = allClients.filter(c => c.pipeline_stage === stage);
      const stageClosedWins = stageClients.filter(c => c.pipeline_stage === 'fechado').length;
      stageConversion[stage] = stageClients.length > 0 ? ((stageClosedWins / stageClients.length) * 100).toFixed(2) : 0;
    });

    // ─── REP PERFORMANCE ───────────────────────────────────────────────────
    const repPerformance = {};
    
    allClients.forEach(client => {
      const rep = client.representante || 'Unassigned';
      if (!repPerformance[rep]) {
        repPerformance[rep] = {
          name: rep,
          total_clients: 0,
          closed_deals: 0,
          revenue: 0,
          visits: 0,
          tasks_pending: 0,
          conversion_rate: 0
        };
      }
      repPerformance[rep].total_clients++;
      
      if (client.pipeline_stage === 'fechado') {
        repPerformance[rep].closed_deals++;
      }
    });

    allSales.forEach(sale => {
      const rep = sale.salesperson || 'Unassigned';
      if (repPerformance[rep]) {
        repPerformance[rep].revenue += sale.sale_value || 0;
      }
    });

    allVisits.forEach(visit => {
      // Add visit counting logic
    });

    allTasks.forEach(task => {
      if (task.status === 'pendente') {
        const rep = task.assigned_to || 'Unassigned';
        if (repPerformance[rep]) {
          repPerformance[rep].tasks_pending++;
        }
      }
    });

    // Calculate conversion rates per rep
    Object.keys(repPerformance).forEach(rep => {
      const total = repPerformance[rep].total_clients;
      const closed = repPerformance[rep].closed_deals;
      repPerformance[rep].conversion_rate = total > 0 ? ((closed / total) * 100).toFixed(2) : 0;
    });

    // ─── REVENUE TRENDS ───────────────────────────────────────────────────
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      const monthSales = allSales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate.getMonth() === monthDate.getMonth() && saleDate.getFullYear() === monthDate.getFullYear();
      });
      
      monthlyTrends.push({
        month: monthKey,
        revenue: monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        sales_count: monthSales.length
      });
    }

    return Response.json({
      success: true,
      summary: {
        total_revenue_90_days: totalRevenue,
        avg_monthly_revenue: avgMonthlyRevenue,
        forecast_6_months: forecast6Months,
        forecast_12_months: forecast12Months,
        total_clients: totalClients,
        closed_deals: closedWins,
        overall_conversion_rate: conversionRate,
        total_pending_tasks: allTasks.filter(t => t.status === 'pendente').length
      },
      pipeline_distribution: pipelineStages,
      conversion_by_stage: stageConversion,
      rep_performance: Object.values(repPerformance).sort((a, b) => b.revenue - a.revenue),
      monthly_trends: monthlyTrends,
      recent_sales: recentSales.slice(0, 10).map(s => ({
        client: s.client_name,
        equipment: s.equipment_name,
        value: s.sale_value,
        date: s.sale_date,
        salesperson: s.salesperson
      })),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('salesAnalyticsDashboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});