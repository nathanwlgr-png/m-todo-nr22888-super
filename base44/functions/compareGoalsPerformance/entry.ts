import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { goals, sales } = body;

    if (!goals || goals.length === 0) {
      return Response.json({ comparison: [], summary: '' });
    }

    const comparison = goals.map(goal => {
      let current = 0;

      if (goal.metric_type === 'sales_value') {
        // Filtrar vendas do período
        const goalSales = sales.filter(s => {
          if (!s.sale_date || !goal.start_date || !goal.end_date) return true;
          const saleDate = new Date(s.sale_date);
          return saleDate >= new Date(goal.start_date) && saleDate <= new Date(goal.end_date);
        });
        current = goalSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      } else if (goal.metric_type === 'sales_count') {
        const goalSales = sales.filter(s => {
          if (!s.sale_date || !goal.start_date || !goal.end_date) return true;
          const saleDate = new Date(s.sale_date);
          return saleDate >= new Date(goal.start_date) && saleDate <= new Date(goal.end_date);
        });
        current = goalSales.length;
      }

      return {
        goal: goal.title,
        period: goal.goal_type === 'individual' ? `${goal.assigned_to}` : 'Time',
        metric_type: goal.metric_type,
        current,
        target: goal.target_value
      };
    });

    const totalCompletion = comparison.length > 0
      ? Math.round(comparison.reduce((sum, c) => sum + (c.current / c.target * 100), 0) / comparison.length)
      : 0;

    const summary = totalCompletion >= 100
      ? '✅ Todas as metas atingidas!'
      : totalCompletion >= 75
      ? '📈 No caminho certo para atingir as metas'
      : '⚠️ Esforço adicional necessário para alcançar as metas';

    return Response.json({ comparison, summary });
  } catch (error) {
    console.error('Error in compareGoalsPerformance:', error);
    return Response.json({
      comparison: [],
      summary: 'Erro ao calcular metas',
      error: error.message
    }, { status: 500 });
  }
});