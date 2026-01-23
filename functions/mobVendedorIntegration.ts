import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, credentials } = body;

    if (action === 'test_connection') {
      // Testar conexão com Target Sistemas
      const { username, password, distributor_id } = credentials;

      try {
        const authResponse = await fetch('https://api.mobvendedor.com.br/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (!authResponse.ok) {
          return Response.json({ 
            success: false, 
            error: 'Falha na autenticação Target Sistemas' 
          }, { status: 401 });
        }

        const authData = await authResponse.json();
        const token = authData.token;

        // Testar acesso a endpoint de estoque
        const stockResponse = await fetch('https://api.mobvendedor.com.br/inventory/stock', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Distributor-ID': distributor_id || ''
          }
        });

        if (!stockResponse.ok) {
          return Response.json({ 
            success: false, 
            error: 'Erro ao acessar dados de estoque' 
          }, { status: 400 });
        }

        return Response.json({ 
          success: true, 
          message: 'Conexão estabelecida com sucesso',
          token 
        });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }
    }

    if (action === 'sync_equipment') {
      // Sincronizar equipamentos e estoque
      const { token, distributor_id } = credentials;

      try {
        // Buscar dados de estoque
        const stockResponse = await fetch('https://api.mobvendedor.com.br/inventory/stock', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Distributor-ID': distributor_id || ''
          }
        });

        if (!stockResponse.ok) {
          throw new Error('Erro ao buscar estoque');
        }

        const stockData = await stockResponse.json();

        // Sincronizar cada equipamento
        const results = [];
        for (const item of stockData.items || []) {
          try {
            const existing = await base44.asServiceRole.entities.MobVendedorSync.list();
            const existingItem = existing.find(e => e.equipment_id === item.id);

            const syncData = {
              equipment_id: item.id,
              equipment_name: item.name,
              category: item.category,
              stock_quantity: item.quantity,
              price: item.price,
              supplier: item.supplier,
              last_sync: new Date().toISOString(),
              sync_status: 'success',
              external_data: JSON.stringify(item)
            };

            if (existingItem) {
              await base44.asServiceRole.entities.MobVendedorSync.update(existingItem.id, syncData);
              results.push({ id: item.id, action: 'updated' });
            } else {
              await base44.asServiceRole.entities.MobVendedorSync.create(syncData);
              results.push({ id: item.id, action: 'created' });
            }
          } catch (error) {
            results.push({ id: item.id, action: 'error', error: error.message });
          }
        }

        return Response.json({ 
          success: true, 
          synced: results.length,
          results 
        });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }
    }

    if (action === 'sync_sales') {
      // Sincronizar dados de vendas
      const { token, distributor_id } = credentials;

      try {
        const salesResponse = await fetch('https://api.mobvendedor.com.br/sales/monthly', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Distributor-ID': distributor_id || ''
          }
        });

        if (!salesResponse.ok) {
          throw new Error('Erro ao buscar vendas');
        }

        const salesData = await salesResponse.json();

        // Atualizar dados de vendas
        const results = [];
        for (const sale of salesData.sales || []) {
          try {
            const existing = await base44.asServiceRole.entities.MobVendedorSync.list();
            const item = existing.find(e => e.equipment_id === sale.product_id);

            if (item) {
              await base44.asServiceRole.entities.MobVendedorSync.update(item.id, {
                monthly_sales: sale.month_total || 0,
                quarterly_sales: sale.quarter_total || 0,
                yearly_sales: sale.year_total || 0,
                total_revenue: sale.total_revenue || 0,
                last_sale_date: sale.last_sale_date,
                last_sync: new Date().toISOString()
              });
              results.push({ id: sale.product_id, status: 'updated' });
            }
          } catch (error) {
            results.push({ id: sale.product_id, status: 'error', error: error.message });
          }
        }

        return Response.json({ 
          success: true, 
          updated: results.length,
          results 
        });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});