import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CACHE_KEY = 'mobvendedor_cache';
const CACHE_TTL = 3600000; // 1 hora
const cache = new Map();

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verificar cache
    const cachedSync = getCachedData('mobi_sync_equipment');
    if (cachedSync) {
      return Response.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: cachedSync,
        from_cache: true
      });
    }

    // Buscar dados apenas se cache expirou
    const syncData = await base44.integrations.Core.InvokeLLM({
      prompt: `Simule dados do sistema mobVendedor para sincronização - MÍNIMO E ESSENCIAL:
      - 5 equipamentos com estoque, preço, vendas do mês
      - Retorne APENAS JSON estruturado.`,
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
                supplier: { type: "string" }
              }
            }
          }
        }
      }
    });

    const equipments = syncData.equipments || [];
    if (equipments.length === 0) {
      return Response.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: { equipments_synced: 0, sync_errors: 0, clients_updated: 0, sales_enriched: 0 }
      });
    }

    // Sincronizar em lote
    const syncRecords = equipments.map(eq => ({
      equipment_id: eq.equipment_id,
      equipment_name: eq.equipment_name,
      category: eq.category,
      stock_quantity: eq.stock_quantity,
      price: eq.price,
      monthly_sales: eq.monthly_sales,
      supplier: eq.supplier,
      last_sync: new Date().toISOString(),
      sync_status: 'success',
      external_data: eq
    }));

    let syncedCount = 0;
    for (const record of syncRecords) {
      try {
        const existing = await base44.entities.MobVendedorSync.filter({
          equipment_id: record.equipment_id
        }).catch(() => []);

        if (existing?.length > 0) {
          await base44.entities.MobVendedorSync.update(existing[0].id, record);
        } else {
          await base44.entities.MobVendedorSync.create(record);
        }
        syncedCount++;
      } catch (e) {
        console.error(`Erro ao sincronizar ${record.equipment_id}:`, e);
      }
    }

    const summary = {
      equipments_synced: syncedCount,
      sync_errors: equipments.length - syncedCount,
      clients_updated: 0,
      sales_enriched: 0
    };

    // Cache resultado
    setCachedData('mobi_sync_equipment', summary);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});