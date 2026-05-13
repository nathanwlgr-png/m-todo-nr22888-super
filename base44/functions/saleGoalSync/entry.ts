// saleGoalSync — Automation: Sale criada/fechada → atualiza SalesGoal automaticamente
// Trigger: entity automation na entidade Sale (create + update)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Payload do entity automation: { event, data, old_data, changed_fields }
    const { event, data: sale, old_data } = body;

    if (!sale) return Response.json({ skipped: 'sem dados de venda' });

    // Só processar vendas fechadas ou entregues
    const validStatuses = ['fechada', 'entregue'];
    const isNowClosed = validStatuses.includes(sale.status);
    const wasClosed = old_data ? validStatuses.includes(old_data.status) : false;

    // Evitar dupla contagem: só processa se ACABOU de fechar
    if (!isNowClosed) return Response.json({ skipped: 'venda não está fechada' });
    if (event?.type === 'update' && wasClosed) return Response.json({ skipped: 'já estava fechada antes — evitando duplicata' });

    const saleValue = sale.sale_value || 0;
    const saleCount = 1;
    const salesperson = sale.salesperson || sale.created_by || '';
    const today = new Date().toISOString().split('T')[0];

    // Buscar metas ativas vigentes
    const activeGoals = await base44.asServiceRole.entities.SalesGoal.filter({
      status: 'active',
    }).catch(() => []);

    const relevantGoals = activeGoals.filter(g => {
      // Meta deve estar dentro do período
      const startOk = !g.start_date || g.start_date <= today;
      const endOk = !g.end_date || g.end_date >= today;
      if (!startOk || !endOk) return false;

      // Meta de equipe: sempre relevante
      if (g.goal_type === 'team') return true;

      // Meta individual: verificar se é do vendedor desta venda
      if (g.goal_type === 'individual' && g.assigned_to && salesperson) {
        return g.assigned_to === salesperson || salesperson.includes(g.assigned_to);
      }
      return g.goal_type === 'individual'; // sem assigned_to definido
    });

    if (relevantGoals.length === 0) {
      return Response.json({ skipped: 'nenhuma meta vigente encontrada' });
    }

    const updated = [];

    for (const goal of relevantGoals) {
      let increment = 0;

      if (goal.metric_type === 'sales_value') {
        increment = saleValue;
      } else if (goal.metric_type === 'sales_count') {
        increment = saleCount;
      } else {
        continue; // visits_count e tasks_count não se aplicam aqui
      }

      if (increment <= 0) continue;

      const currentValue = (goal.current_value || 0) + increment;
      const isCompleted = currentValue >= (goal.target_value || 1);

      await base44.asServiceRole.entities.SalesGoal.update(goal.id, {
        current_value: currentValue,
        status: isCompleted ? 'completed' : 'active',
      });

      updated.push({ goal_id: goal.id, title: goal.title, new_value: currentValue, completed: isCompleted });
    }

    // Registrar no AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'api_call',
      module: 'saleGoalSync',
      user_email: salesperson || 'system',
      success: true,
      input_size: JSON.stringify(sale).length,
      output_size: JSON.stringify(updated).length,
    }).catch(() => null);

    return Response.json({ success: true, goals_updated: updated.length, details: updated });

  } catch (error) {
    console.error('saleGoalSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});