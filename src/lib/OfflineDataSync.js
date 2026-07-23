// OfflineDataSync — sincronização otimizada com retry automático
import { OfflineManager, isOnline } from './OfflineManager';
import { base44 } from '@/api/base44Client';

export class OfflineDataSync {
  static syncPromise = null;

  static syncAllEntities() {
    if (!isOnline()) return Promise.resolve({ synced: 0, failed: 0, pending: 0 });
    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = this.runSync().finally(() => {
      this.syncPromise = null;
    });
    return this.syncPromise;
  }

  static async runSync() {
    await this.migrateLegacyEditQueue();
    const queued = await OfflineManager.getPendingOperations();
    if (queued.length === 0) return { synced: 0, failed: 0, pending: 0 };

    const result = await this.processSyncQueue();
    if (result.pending === 0) {
      await this.cacheForOffline();
      await OfflineManager.setMeta('last_full_sync', Date.now());
    }
    await OfflineManager.setMeta('last_sync_attempt', Date.now());
    return result;
  }

  static async migrateLegacyEditQueue() {
    if (typeof localStorage === 'undefined') return;
    const key = 'nr22_edit_queue';
    const legacy = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(legacy) || legacy.length === 0) return;

    for (const edit of legacy) {
      if (!edit.synced && edit.entityName && edit.entityId) {
        await OfflineManager.queueOperation({
          operation_id: `legacy-${edit.id}`,
          entity: edit.entityName,
          action: 'update',
          data: { id: edit.entityId, ...edit.updateData },
          description: edit.clientName || 'Edição offline migrada',
        });
      }
    }
    localStorage.removeItem(key);
  }

  static async processSyncQueue() {
    const pendingOps = await OfflineManager.getPendingOperations();
    let processed = 0;
    let failed = 0;

    for (const op of pendingOps) {
      if (!isOnline()) break;

      try {
        const { entity, action, data } = op;
        const entityApi = base44.entities[entity];
        if (!entityApi || !['create', 'update', 'delete'].includes(action)) {
          throw new Error('Operação offline inválida');
        }

        if (action === 'create') {
          await entityApi.create(data);
        } else if (action === 'update') {
          const { id, ...changes } = data || {};
          if (!id) throw new Error('Atualização offline sem identificador');
          await entityApi.update(id, changes);
        } else {
          if (!data?.id) throw new Error('Exclusão offline sem identificador');
          await entityApi.delete(data.id);
        }

        await OfflineManager.markOperationSynced(op.id);
        processed++;
      } catch (error) {
        failed++;
        await OfflineManager.markOperationFailed(op.id, error);
        console.warn('[SYNC] Operação preservada para nova tentativa:', op.id, error);
      }
    }

    await OfflineManager.clearSyncedOperations();
    const pending = (await OfflineManager.getPendingOperations()).length;
    return { synced: processed, failed, pending };
  }

  static async cacheForOffline() {
    const entityConfig = [
      ['Client', 500], ['Lead', 300], ['Task', 200], ['Visit', 200],
      ['Sale', 150], ['Equipment', 50], ['ConsumableOrder', 150],
    ];

    for (const [entity, limit] of entityConfig) {
      try {
        const data = await base44.entities[entity].list('-updated_date', limit);
        if (data.length > 0) await OfflineManager.bulkSaveEntity(entity, data);
      } catch (error) {
        console.warn(`[SYNC] Cache de ${entity} será atualizado depois:`, error);
      }
    }
    return true;
  }
}