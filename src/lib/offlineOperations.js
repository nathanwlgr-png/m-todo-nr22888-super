import { base44 } from '@/api/base44Client';
import { OfflineManager } from '@/lib/OfflineManager';

const localId = () => `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const MAX_SYNC_RETRIES = 3;
const SYNC_BATCH_SIZE = 20;
const SYNC_PRIORITY = { Visit: 0, Task: 1 };
const IDEMPOTENT_ENTITIES = new Set(['Visit', 'Task']);
const READ_ONLY_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by_id']);
const sanitizeData = (data = {}) => Object.fromEntries(
  Object.entries(data).filter(([key]) => !READ_ONLY_FIELDS.has(key) && !key.startsWith('_'))
);

const getErrorStatus = (error) => Number(error?.status || error?.response?.status || error?.statusCode || 0);
const isPermanentError = (error) => {
  const status = getErrorStatus(error);
  return status >= 400 && status < 500 && ![408, 425, 429].includes(status);
};

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
  const cleanData = sanitizeData(data);
  if (navigator.onLine) {
    try {
      const created = await base44.entities[entity].create(cleanData);
      await OfflineManager.saveEntity(entity, created);
      return { record: created, queued: false };
    } catch (error) {
      if (isPermanentError(error)) throw error;
      // A conexão pode cair antes de navigator.onLine atualizar.
    }
  }

  const operationId = localId();
  const queuedData = IDEMPOTENT_ENTITIES.has(entity)
    ? { ...cleanData, offline_operation_id: operationId }
    : cleanData;
  const record = { ...queuedData, id: operationId, _offline_pending: true };
  await OfflineManager.saveEntity(entity, record);
  await OfflineManager.queueOperation({
    entity,
    action: 'create',
    data: queuedData,
    local_id: record.id,
    operation_id: operationId,
  });
  return { record, queued: true };
}

export async function updateWithOfflineQueue(entity, id, data) {
  const cleanData = sanitizeData(data);
  if (navigator.onLine && !String(id).startsWith('offline-')) {
    try {
      const updated = await base44.entities[entity].update(id, cleanData);
      await OfflineManager.saveEntity(entity, updated);
      return { record: updated, queued: false };
    } catch (error) {
      if (isPermanentError(error)) throw error;
      // Preserva a alteração localmente se a rede falhar durante a chamada.
    }
  }

  const current = await OfflineManager.getEntity(entity, id);
  const record = { ...(current || { id }), ...cleanData, _offline_pending: true };
  await OfflineManager.saveEntity(entity, record);
  await OfflineManager.queueOperation({ entity, action: 'update', record_id: id, data: cleanData });
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
  if (!navigator.onLine) {
    return { synced: 0, failed: 0, quarantined: 0, pending: (await OfflineManager.getPendingOperations()).length };
  }

  const operations = (await OfflineManager.getPendingOperations()).sort((a, b) => {
    const priority = (SYNC_PRIORITY[a.entity] ?? 2) - (SYNC_PRIORITY[b.entity] ?? 2);
    return priority || (a._queued_at || 0) - (b._queued_at || 0);
  });
  const savedMap = await OfflineManager.getMeta('offline_id_map') || {};
  const createdIds = new Map(Object.entries(savedMap));
  let synced = 0;
  let failed = 0;
  let quarantined = 0;

  for (let start = 0; start < operations.length && navigator.onLine; start += SYNC_BATCH_SIZE) {
    const batch = operations.slice(start, start + SYNC_BATCH_SIZE);
    for (const operation of batch) {
      try {
        if (operation.action === 'create') {
          const operationId = operation.operation_id || operation.local_id;
          const resolved = sanitizeData(resolveReferences(operation.data, createdIds));
          const data = IDEMPOTENT_ENTITIES.has(operation.entity) && operationId
            ? { ...resolved, offline_operation_id: operationId }
            : resolved;
          let created = null;
          if (IDEMPOTENT_ENTITIES.has(operation.entity) && operationId) {
            const existing = await base44.entities[operation.entity].filter({ offline_operation_id: operationId }, '-created_date', 1);
            created = existing?.[0] || null;
          }
          if (!created) created = await base44.entities[operation.entity].create(data);
          await OfflineManager.saveEntity(operation.entity, created);
          if (operation.local_id) {
            createdIds.set(operation.local_id, created.id);
            await OfflineManager.setMeta('offline_id_map', Object.fromEntries(createdIds));
            await OfflineManager.deleteEntity(operation.entity, operation.local_id);
          }
        } else if (operation.action === 'update') {
          const recordId = createdIds.get(operation.record_id) || operation.record_id;
          if (String(recordId).startsWith('offline-')) throw new Error('Registro local ainda não criado');
          const data = sanitizeData(resolveReferences(operation.data, createdIds));
          const updated = await base44.entities[operation.entity].update(recordId, data);
          await OfflineManager.saveEntity(operation.entity, updated);
        } else if (operation.action === 'delete') {
          const recordId = createdIds.get(operation.record_id) || operation.record_id;
          await base44.entities[operation.entity].delete(recordId);
          await OfflineManager.deleteEntity(operation.entity, operation.record_id);
        }
        await OfflineManager.markOperationSynced(operation.id);
        synced += 1;
      } catch (error) {
        const retryCount = (operation._retry_count || 0) + 1;
        const terminal = isPermanentError(error) || retryCount >= MAX_SYNC_RETRIES;
        await OfflineManager.recordOperationFailure(operation.id, error, terminal);
        failed += 1;
        if (terminal) quarantined += 1;
      }
    }
  }

  await OfflineManager.clearSyncedOperations();
  await OfflineManager.setMeta('last_queue_sync', new Date().toISOString());
  const pending = (await OfflineManager.getPendingOperations()).length;
  return { synced, failed, quarantined, pending };
}

export function syncPendingOperations() {
  if (!syncInFlight) syncInFlight = performPendingSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
}