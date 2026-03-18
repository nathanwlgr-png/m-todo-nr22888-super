import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar todos os dados
    const [clients, sales, equipment, consumables, campaigns, mobSync] = await Promise.all([
      base44.entities.Client.list('-updated_date', 1000).catch(() => []),
      base44.entities.Sale.list('-sale_date', 1000).catch(() => []),
      base44.entities.Equipment.list('-updated_date', 1000).catch(() => []),
      base44.entities.Consumable.list('-updated_date', 1000).catch(() => []),
      base44.entities.Campaign.list('-updated_date', 1000).catch(() => []),
      base44.entities.MobVendedorSync.list('-overall_score', 1000).catch(() => [])
    ]);

    // Estruturar dados por categoria
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        system: 'mobVendedor',
        total_records: {
          clients: clients.length,
          sales: sales.length,
          equipment: equipment.length,
          consumables: consumables.length,
          campaigns: campaigns.length,
          mob_inventory: mobSync.length
        }
      },
      
      clientes: {
        total: clients.length,
        data: clients.map(c => ({
          id: c.id,
          nome: c.first_name,
          clinic_name: c.clinic_name,
          email: c.email,
          phone: c.phone,
          city: c.city,
          cnpj: c.cnpj,
          status: c.status,
          type: c.client_type,
          equipment_sold: c.equipment_sold,
          last_contact: c.last_contact_date,
          purchase_score: c.purchase_score
        }))
      },

      vendas: {
        total: sales.length,
        data: sales.map(s => ({
          id: s.id,
          client_id: s.client_id,
          client_name: s.client_name,
          equipment: s.equipment_name,
          value: s.sale_value,
          status: s.status,
          date: s.sale_date,
          payment_terms: s.payment_terms
        }))
      },

      equipamentos: {
        total: equipment.length,
        data: equipment.map(e => ({
          id: e.id,
          name: e.name,
          category: e.category,
          price: e.price,
          monthly_bonus: e.monthly_bonus,
          specifications: e.specifications,
          lifecycle_months: e.lifecycle_months,
          is_active: e.is_active
        }))
      },

      consumiveis: {
        total: consumables.length,
        data: consumables.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          unit_price: c.unit_price,
          unit_type: c.unit_type,
          stock_quantity: c.stock_quantity,
          supplier: c.supplier,
          compatible_equipment: c.compatible_equipment
        }))
      },

      campanhas: {
        total: campaigns.length,
        data: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          target_audience: c.target_audience,
          created_date: c.created_date,
          start_date: c.start_date,
          end_date: c.end_date
        }))
      },

      inventario_mobvendedor: {
        total: mobSync.length,
        data: mobSync.map(m => ({
          id: m.id,
          equipment_id: m.equipment_id,
          equipment_name: m.equipment_name,
          category: m.category,
          stock: m.stock_quantity,
          price: m.price,
          monthly_sales: m.monthly_sales,
          quarterly_sales: m.quarterly_sales,
          yearly_sales: m.yearly_sales,
          total_revenue: m.total_revenue,
          supplier: m.supplier,
          last_sync: m.last_sync
        }))
      }
    };

    // Upload do arquivo JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileResult = await base44.integrations.Core.UploadFile({
      file: jsonContent
    }).catch(() => null);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      export_summary: exportData.metadata,
      file_url: fileResult?.file_url || null,
      data_preview: {
        total_clientes: exportData.clientes.total,
        total_vendas: exportData.vendas.total,
        total_equipamentos: exportData.equipamentos.total,
        total_consumiveis: exportData.consumiveis.total,
        total_campanhas: exportData.campanhas.total,
        total_inventario_mob: exportData.inventario_mobvendedor.total
      }
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});