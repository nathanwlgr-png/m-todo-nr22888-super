import { base44 } from '@/api/base44Client';
import { OfflineManager } from '@/lib/OfflineManager';

const localId = () => `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export async function listWithOfflineCache(entity, sort, limit) {
  if (!navigator.onLine) return OfflineManager.listEntities(entity);
  try {
    const records = await base44.entities[entity].list(sort, limit);
    await OfflineManager.bulkSaveEntity(entity, records || []);
    return records || [];
  } catch (_) {
    return OfflineManager.listEntities(entity);
  }
}

export async function createWithOfflineQueue(entity, data) {
  if (navigator.onLine) {
    try {
      const created = await base44.entities[entity].create(data);
      await OfflineManager.saveEntity(entity, created);
      return { record: created, queued: false };
    } catch (_) {
      // A conexão pode cair antes de navigator.onLine atualizar.
    }
  }

  const record = { ...data, id: localId(), _offline_pending: true };
  await OfflineManager.saveEntity(entity, record);
  await OfflineManager.queueOperation({ entity, action: 'create', data, local_id: record.id });
  return { record, queued: true };
}

export async function updateWithOfflineQueue(entity, id, data) {
  if (navigator.onLine && !String(id).startsWith('offline-')) {
    try {
      const updated = await base44.entities[entity].update(id, data);
      await OfflineManager.saveEntity(entity, updated);
      return { record: updated, queued: false };
    } catch (_) {
      // Preserva a alteração localmente se a rede falhar durante a chamada.
    }
  }

  const current = await OfflineManager.getEntity(entity, id);
  const record = { ...(current || { id }), ...data, _offline_pending: true };
  await OfflineManager.saveEntity(entity, record);
  await OfflineManager.queueOperation({ entity, action: 'update', record_id: id, data });
  return { record, queued: true };
}

const resolveReferences = (value, idMap) => {
  if (typeof value === 'string') return idMap.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => resolveReferences(item, idMap));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveReferences(item, idMap)]));
  }
  return value;
};

let syncInFlight = null;

async function performPendingSync() {
  if (!navigator.onLine) return { synced: 0, failed: 0, pending: (await OfflineManager.getPendingOperations()).length };

  const operations = await OfflineManager.getPendingOperations();
  const savedMap = await OfflineManager.getMeta('offline_id_map') || {};
  const createdIds = new Map(Object.entries(savedMap));
  let synced = 0;
  let failed = 0;

  for (const operation of operations) {
    try {
      if (operation.action === 'create') {
        const data = resolveReferences(operation.data, createdIds);
        const created = await base44.entities[operation.entity].create(data);
        await OfflineManager.saveEntity(operation.entity, created);
        if (operation.local_id) {
          createdIds.set(operation.local_id, created.id);
          await OfflineManager.setMeta('offline_id_map', Object.fromEntries(createdIds));
          await OfflineManager.deleteEntity(operation.entity, operation.local_id);
        }
      } else if (operation.action === 'update') {
        const recordId = createdIds.get(operation.record_id) || operation.record_id;
        if (String(recordId).startsWith('offline-')) throw new Error('Registro local ainda não criado');
        const data = resolveReferences(operation.data, createdIds);
        const updated = await base44.entities[operation.entity].update(recordId, data);
        await OfflineManager.saveEntity(operation.entity, updated);
      } else if (operation.action === 'delete') {
        const recordId = createdIds.get(operation.record_id) || operation.record_id;
        await base44.entities[operation.entity].delete(recordId);
        await OfflineManager.deleteEntity(operation.entity, operation.record_id);
      }
      await OfflineManager.markOperationSynced(operation.id);
      synced += 1;
    } catch (_) {
      failed += 1;
    }
  }

  await OfflineManager.clearSyncedOperations();
  await OfflineManager.setMeta('last_queue_sync', new Date().toISOString());
  return { synced, failed, pending: failed };
}

export function syncPendingOperations() {
  if (!syncInFlight) syncInFlight = performPendingSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
}