const sellerOf = (sale) => sale.salesperson || sale.created_by_id || 'Não identificado';
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export function getSellers(sales) {
  return [...new Set(sales.map(sellerOf))].sort((a, b) => a.localeCompare(b));
}

export function buildDailySales(sales, goals, seller, days = 14) {
  const closed = sales.filter((sale) => sale.status === 'fechada' && (seller === 'all' || sellerOf(sale) === seller));
  const relevantGoals = goals.filter((goal) => goal.goal_type === 'team' || seller === 'all' || goal.assigned_to === seller);
  const valueGoals = relevantGoals.filter((goal) => goal.metric_type === 'sales_value');

  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const key = dayKey(date);
    const value = closed.filter((sale) => sale.sale_date === key).reduce((sum, sale) => sum + (sale.sale_value || 0), 0);
    const target = valueGoals.reduce((sum, goal) => {
      if (goal.start_date && key < goal.start_date) return sum;
      if (goal.end_date && key > goal.end_date) return sum;
      const start = new Date(`${goal.start_date || key}T00:00:00`);
      const end = new Date(`${goal.end_date || key}T00:00:00`);
      const duration = Math.max(1, Math.floor((end - start) / 86400000) + 1);
      return sum + (goal.target_value || 0) / duration;
    }, 0);
    return { date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), vendas: value, meta: Math.round(target) };
  });

  const achieved = relevantGoals.filter((goal) => goal.status === 'completed' || (goal.current_value || 0) >= (goal.target_value || Infinity)).length;
  const target = valueGoals.reduce((sum, goal) => sum + (goal.target_value || 0), 0);
  const current = valueGoals.reduce((sum, goal) => sum + (goal.current_value || 0), 0);
  return { daily, achieved, totalGoals: relevantGoals.length, progress: target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0 };
}