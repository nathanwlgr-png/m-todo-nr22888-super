import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { equipment_list } = await req.json().catch(() => ({}));

    if (!equipment_list || !Array.isArray(equipment_list)) {
      return Response.json({ 
        error: 'Invalid payload - equipment_list array required',
        synced: 0 
      }, { status: 400 });
    }

    const synced = [];
    const errors = [];

    for (const item of equipment_list) {
      try {
        const existing = await base44.entities.MobVendedorInventory.filter({
          equipment_id: item.equipment_id
        }).catch(() => []);

        // Determina status de estoque
        const stock = item.current_stock || 0;
        const minimum = item.minimum_stock || 5;
        let stock_status = 'normal';

        if (stock === 0) stock_status = 'critical';
        else if (stock <= minimum) stock_status = 'low';
        else if (stock >= minimum * 3) stock_status = 'high';

        const data = {
          equipment_id: item.equipment_id,
          equipment_name: item.equipment_name,
          current_stock: stock,
          minimum_stock: minimum,
          stock_status: stock_status,
          price: item.price || 0,
          last_updated: new Date().toISOString(),
          sync_status: 'success',
          external_data: item
        };

        if (existing && existing.length > 0) {
          // Update
          await base44.entities.MobVendedorInventory.update(existing[0].id, data);
        } else {
          // Create
          await base44.entities.MobVendedorInventory.create(data);
        }

        synced.push({
          equipment_id: item.equipment_id,
          status: 'synced',
          stock_status: stock_status
        });
      } catch (error) {
        errors.push({
          equipment_id: item.equipment_id,
          error: error.message
        });
      }
    }

    // Criar alertas para estoque crítico
    const criticalItems = synced.filter(s => s.stock_status === 'critical');
    if (criticalItems.length > 0) {
      for (const item of criticalItems) {
        try {
          await base44.entities.Alert.create({
            user_email: user.email,
            title: `Estoque Crítico: ${item.equipment_id}`,
            message: `O equipamento ${item.equipment_id} está com estoque zerado`,
            type: 'low_stock',
            priority: 'alta',
            read: false
          });
        } catch (e) {
          // Ignora erro ao criar alerta
        }
      }
    }

    return Response.json({
      success: true,
      synced: synced.length,
      errors: errors.length,
      details: {
        synced_items: synced,
        errors: errors,
        critical_items: criticalItems.length
      }
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      synced: 0 
    }, { status: 500 });
  }
});