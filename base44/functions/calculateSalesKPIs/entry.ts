import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leads, sales } = body;

    // Conversão
    const convertedLeads = leads.filter(l => l.stage === 'convertido').length;
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

    // Ticket médio e total
    const totalSalesValue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const averageDealValue = sales.length > 0 ? totalSalesValue / sales.length : 0;

    // Ciclo de vendas
    const cycleDays = sales
      .filter(s => s.sale_date)
      .map(s => {
        const lead = leads.find(l => l.id === s.client_id);
        if (!lead || !lead.created_date) return 0;
        const days = Math.floor((new Date(s.sale_date) - new Date(lead.created_date)) / (1000 * 60 * 60 * 24));
        return days;
      })
      .filter(d => d > 0);
    const averageCycleDays = cycleDays.length > 0 
      ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length)
      : 0;

    // Meta mensal (assumir 100k por padrão)
    const monthlyGoal = 100000;
    const monthlyGoalProgress = Math.min(Math.round((totalSalesValue / monthlyGoal) * 100), 100);

    return Response.json({
      conversion_rate: conversionRate,
      converted_count: convertedLeads,
      total_leads: leads.length,
      average_deal_value: averageDealValue,
      total_sales_value: totalSalesValue,
      average_cycle_days: averageCycleDays,
      monthly_goal: monthlyGoal,
      monthly_goal_progress: monthlyGoalProgress
    });
  } catch (error) {
    console.error('Error in calculateSalesKPIs:', error);
    return Response.json({
      conversion_rate: 0,
      converted_count: 0,
      total_leads: 0,
      average_deal_value: 0,
      total_sales_value: 0,
      average_cycle_days: 0,
      monthly_goal: 0,
      monthly_goal_progress: 0,
      error: error.message
    }, { status: 500 });
  }
});