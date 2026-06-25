import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { consumables = [] } = body;

    let alertsGenerated = 0;

    // Para cada consumível ativo
    for (const consumable of consumables) {
      if (consumable.status !== 'ativo') continue;
      if (consumable.alert_generated) continue;

      const lastOrder = new Date(consumable.last_order_date);
      const daysInterval = consumable.reorder_interval_days || 30;
      const nextOrder = new Date(lastOrder.getTime() + daysInterval * 24 * 60 * 60 * 1000);
      const alertDate = new Date(nextOrder.getTime() - (consumable.alert_days_before || 7) * 24 * 60 * 60 * 1000);

      // Se chegou na data de alerta
      if (new Date() >= alertDate) {
        await base44.asServiceRole.entities.ConsumableOrder.update(consumable.id, {
          alert_generated: true,
          alert_generated_date: new Date().toISOString(),
          next_reorder_date: nextOrder.toISOString().split('T')[0],
        }).catch(() => {});

        alertsGenerated++;
      }
    }

    return Response.json({
      alerts_generated: alertsGenerated,
      processed: consumables.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});