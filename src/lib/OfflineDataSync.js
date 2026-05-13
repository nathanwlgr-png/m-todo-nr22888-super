// OfflineDataSync — sincronização otimizada com retry automático
import { OfflineManager, isOnline } from './OfflineManager';
import { base44 } from '@/api/base44Client';

export class OfflineDataSync {
  static async syncAllEntities() {
    if (!isOnline()) {
      console.log('[SYNC] Offline - aguardando conexão');
      return { synced: 0, failed: 0, pending: 0 };
    }

    let synced = 0, failed = 0;
    const entities = ['Client', 'Task', 'Visit', 'Sale', 'Lead', 'Equipment', 'ConsumableOrder'];

    for (const entity of entities) {
      try {
        const localData = await OfflineManager.listEntities(entity);
        if (localData.length === 0) continue;

        // Batch sync - máx 50 registros por vez
        const batches = [];
        for (let i = 0; i < localData.length; i += 50) {
          batches.push(localData.slice(i, i + 50));
        }

        for (const batch of batches) {
          try {
            // Fetch online
            const onlineData = await base44.entities[entity].list('-updated_date', 1000).catch(() => []);
            
            // Merge inteligente - resolver conflitos por timestamp
            for (const local of batch) {
              const online = onlineData.find(o => o.id === local.id);
              if (!online || local._cached_at > online.updated_date) {
                // Enviar para server
                if (local.id) {
                  await base44.entities[entity].update(local.id, local).catch(() => {
                    failed++;
                  });
                }
              }
            }
            synced += batch.length - failed;
          } catch (batchError) {
            console.warn(`[SYNC] Batch error em ${entity}:`, batchError);
            failed += batch.length;
          }
        }
      } catch (error) {
        console.warn(`[SYNC] Error em ${entity}:`, error);
      }
    }

    // Processar fila de sync após sincronização de entidades
    const pending = await this.processSyncQueue();

    return { synced, failed, pending };
  }

  static async processSyncQueue() {
    const pendingOps = await OfflineManager.getPendingOperations();
    if (pendingOps.length === 0) return 0;

    let processed = 0;

    for (const op of pendingOps) {
      if (op._retry_count >= 3) {
        await OfflineManager.markOperationSynced(op.id);
        continue;
      }

      try {
        const { entity, action, data } = op;
        
        if (action === 'create') {
          await base44.entities[entity].create(data);
        } else if (action === 'update') {
          await base44.entities[entity].update(data.id, data);
        } else if (action === 'delete') {
          await base44.entities[entity].delete(data.id);
        }

        await OfflineManager.markOperationSynced(op.id);
        processed++;
      } catch (error) {
        console.warn('[SYNC] Operation failed:', op.id, error);
        // Incrementar retry count
        const db = await OfflineManager.initDB();
        const updated = { ...op, _retry_count: (op._retry_count || 0) + 1 };
        await db.put('SyncQueue', updated);
      }
    }

    await OfflineManager.clearSyncedOperations();
    return processed;
  }

  static async cacheForOffline() {
    try {
      const entities = ['Client', 'Equipment', 'ConsumableOrder'];
      
      for (const entity of entities) {
        const data = await base44.entities[entity].list('-updated_date', 500).catch(() => []);
        if (data.length > 0) {
          await OfflineManager.bulkSaveEntity(entity, data);
          await OfflineManager.cacheData(`${entity}_cached`, true, 30 * 24 * 60 * 60 * 1000);
        }
      }

      await OfflineManager.setMeta('last_full_sync', Date.now());
      console.log('[SYNC] Cache offline atualizado');
      return true;
    } catch (error) {
      console.warn('[SYNC] Cache error:', error);
      return false;
    }
  }
}

// Auto-sync quando voltar online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SYNC] Conexão restaurada - sincronizando...');
    OfflineDataSync.syncAllEntities().then(result => {
      console.log('[SYNC] Resultado:', result);
    });
  });
}