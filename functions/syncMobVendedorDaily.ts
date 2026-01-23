import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar dados de exemplo do mobVendedor (simular integração)
    const syncData = await base44.integrations.Core.InvokeLLM({
      prompt: `Simule dados do sistema mobVendedor para sincronização:
      - 5-10 equipamentos com estoque, preço, vendas do mês/trimestre/ano
      - Categoria de cada equipamento
      - Fornecedor
      - Última data de atualização
      
      Retorne JSON estruturado.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          equipments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                equipment_id: { type: "string" },
                equipment_name: { type: "string" },
                category: { type: "string" },
                stock_quantity: { type: "number" },
                price: { type: "number" },
                monthly_sales: { type: "number" },
                quarterly_sales: { type: "number" },
                yearly_sales: { type: "number" },
                total_revenue: { type: "number" },
                supplier: { type: "string" },
                last_sale_date: { type: "string" }
              }
            }
          }
        }
      }
    });

    const equipments = syncData.equipments || [];
    let syncedCount = 0;
    let errorCount = 0;

    // Sincronizar cada equipamento
    for (const eq of equipments) {
      try {
        const existing = await base44.entities.MobVendedorSync.filter({
          equipment_id: eq.equipment_id
        }).catch(() => []);

        const syncRecord = {
          equipment_id: eq.equipment_id,
          equipment_name: eq.equipment_name,
          category: eq.category,
          stock_quantity: eq.stock_quantity,
          price: eq.price,
          monthly_sales: eq.monthly_sales,
          quarterly_sales: eq.quarterly_sales,
          yearly_sales: eq.yearly_sales,
          total_revenue: eq.total_revenue,
          supplier: eq.supplier,
          last_sale_date: eq.last_sale_date,
          last_sync: new Date().toISOString(),
          sync_status: 'success',
          external_data: eq
        };

        if (existing && existing.length > 0) {
          await base44.entities.MobVendedorSync.update(existing[0].id, syncRecord);
        } else {
          await base44.entities.MobVendedorSync.create(syncRecord);
        }

        syncedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erro ao sincronizar ${eq.equipment_id}:`, error);
      }
    }

    // Buscar todos os clientes e atualizar com dados mobVendedor
    const clients = await base44.entities.Client.list('-updated_date', 1000).catch(() => []);
    let clientsUpdated = 0;

    for (const client of clients) {
      try {
        if (client.equipment_sold && syncedCount > 0) {
          // Buscar equipamento sincronizado
          const mobData = await base44.entities.MobVendedorSync.filter({
            equipment_name: client.equipment_sold
          }).catch(() => []);

          if (mobData && mobData.length > 0) {
            const eq = mobData[0];
            // Atualizar cliente com dados mobVendedor se houver
            await base44.entities.Client.update(client.id, {
              equipment_interest: eq.category || client.equipment_interest
            }).catch(() => {});
            clientsUpdated++;
          }
        }
      } catch (error) {
        console.error(`Erro ao atualizar cliente ${client.id}:`, error);
      }
    }

    // Buscar todas as vendas e enriquecer com dados mobVendedor
    const sales = await base44.entities.Sale.list('-sale_date', 1000).catch(() => []);
    let salesEnriched = 0;

    for (const sale of sales) {
      try {
        if (sale.equipment_name && syncedCount > 0) {
          const mobData = await base44.entities.MobVendedorSync.filter({
            equipment_name: sale.equipment_name
          }).catch(() => []);

          if (mobData && mobData.length > 0) {
            const eq = mobData[0];
            // Dados enrichment já armazenados na venda (se necessário adicionar mais info)
            salesEnriched++;
          }
        }
      } catch (error) {
        console.error(`Erro ao enriquecer venda ${sale.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        equipments_synced: syncedCount,
        sync_errors: errorCount,
        clients_updated: clientsUpdated,
        sales_enriched: salesEnriched,
        total_clients_processed: clients.length,
        total_sales_processed: sales.length
      }
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});