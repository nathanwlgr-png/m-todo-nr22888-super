// OfflineManager v2 — IndexedDB + SyncQueue + AICache
import { openDB } from 'idb';

const DB_NAME = 'SeamtyOfflineDB';
const DB_VERSION = 2;

export const OFFLINE_ENTITIES = [
  'Client',
  'Lead',
  'Task',
  'Visit',
  'Sale',
  'Equipment',
  'ConsumableOrder',
];

export class OfflineManager {
  static async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Entities
        OFFLINE_ENTITIES.forEach(entity => {
          if (!db.objectStoreNames.contains(entity)) {
            db.createObjectStore(entity, { keyPath: 'id' });
          }
        });
        // SyncQueue — operações pendentes
        if (!db.objectStoreNames.contains('SyncQueue')) {
          const sq = db.createObjectStore('SyncQueue', { keyPath: 'id', autoIncrement: true });
          sq.createIndex('entity', 'entity');
          sq.createIndex('synced', '_synced');
        }
        // CacheStore — cache de dados online
        if (!db.objectStoreNames.contains('CacheStore')) {
          db.createObjectStore('CacheStore', { keyPath: 'key' });
        }
        // Metadata
        if (!db.objectStoreNames.contains('Meta')) {
          db.createObjectStore('Meta', { keyPath: 'key' });
        }
      }
    });
  }

  // ─── ENTITY OPERATIONS ───────────────────────────────────────────

  static async bulkSaveEntity(entityName, records) {
    const db = await this.initDB();
    const tx = db.transaction(entityName, 'readwrite');
    await Promise.all(records.map(r => tx.store.put({ ...r, _cached_at: Date.now() })));
    await tx.done;
    return records.length;
  }

  static async saveEntity(entityName, data) {
    const db = await this.initDB();
    await db.put(entityName, { ...data, _cached_at: Date.now() });
  }

  static async getEntity(entityName, id) {
    const db = await this.initDB();
    return db.get(entityName, id);
  }

  static async listEntities(entityName) {
    const db = await this.initDB();
    return db.getAll(entityName);
  }

  static async countEntities(entityName) {
    const db = await this.initDB();
    return db.count(entityName);
  }

  static async clearEntity(entityName) {
    const db = await this.initDB();
    await db.clear(entityName);
  }

  // ─── SYNC QUEUE ───────────────────────────────────────────────────

  // Entidades críticas que NUNCA devem ser descartadas da fila
  static CRITICAL_ENTITIES = ['Client', 'Lead', 'Visit', 'Sale', 'Task'];
  static QUEUE_HARD_LIMIT = 500;   // limite aumentado de 200 → 500
  static QUEUE_TRIM_TO    = 400;   // ao limpar, manter as 400 mais recentes

  static async queueOperation(operation) {
    // operation: { entity, action, data, description }
    const db = await this.initDB();
    
    const pending = await this.getPendingOperations();
    if (pending.length >= this.QUEUE_HARD_LIMIT) {
      // Separar críticas e não-críticas
      const critical = pending.filter(op => this.CRITICAL_ENTITIES.includes(op.entity));
      const nonCritical = pending.filter(op => !this.CRITICAL_ENTITIES.includes(op.entity));

      // Calcular quantas não-críticas precisamos remover para voltar ao limite
      const removeCount = pending.length - this.QUEUE_TRIM_TO;
      
      if (removeCount > 0) {
        // Só descartar não-críticas, ordenadas pelas mais antigas
        const sorted = nonCritical.sort((a, b) => a._queued_at - b._queued_at);
        const toDelete = sorted.slice(0, removeCount);

        if (toDelete.length > 0) {
          console.warn(`[OFFLINE] SyncQueue: descartando ${toDelete.length} ops não-críticas antigas (limite ${this.QUEUE_HARD_LIMIT} atingido)`);
          const tx = db.transaction('SyncQueue', 'readwrite');
          await Promise.all(toDelete.map(op => tx.store.delete(op.id)));
          await tx.done;
        }

        // Se ainda lotado (só críticas), registrar aviso mas NÃO descartar
        const remaining = await this.getPendingOperations();
        if (remaining.length >= this.QUEUE_HARD_LIMIT) {
          console.error(`[OFFLINE] SyncQueue CHEIO com ${remaining.length} ops críticas — não descartando. Sincronize o dispositivo!`);
          // Salvar alerta no Meta para UI exibir
          await this.setMeta('sync_queue_overflow', {
            count: remaining.length,
            at: Date.now(),
            message: 'Fila offline cheia! Conecte-se à internet para sincronizar dados críticos.'
          });
        }
      }
    }
    
    await db.add('SyncQueue', {
      ...operation,
      _queued_at: Date.now(),
      _synced: false,
      _retry_count: 0,
    });
  }

  static async getPendingOperations() {
    const db = await this.initDB();
    const all = await db.getAll('SyncQueue');
    return all.filter(op => !op._synced);
  }

  static async markOperationSynced(id) {
    const db = await this.initDB();
    const op = await db.get('SyncQueue', id);
    if (op) await db.put('SyncQueue', { ...op, _synced: true, _synced_at: Date.now() });
  }

  static async clearSyncedOperations() {
    const db = await this.initDB();
    const all = await db.getAll('SyncQueue');
    const synced = all.filter(op => op._synced);
    await Promise.all(synced.map(op => db.delete('SyncQueue', op.id)));
    return synced.length;
  }

  // ─── CACHE STORE ─────────────────────────────────────────────────

  static async cacheData(key, data, ttlMs = 30 * 24 * 60 * 60 * 1000) {
    const db = await this.initDB();
    await db.put('CacheStore', {
      key,
      value: data,
      _cached_at: Date.now(),
      _expires_at: Date.now() + ttlMs,
    });
  }

  static async getCachedData(key) {
    const db = await this.initDB();
    const cached = await db.get('CacheStore', key);
    if (!cached) return null;
    if (Date.now() > cached._expires_at) {
      await db.delete('CacheStore', key);
      return null;
    }
    return cached.value;
  }

  // ─── METADATA ─────────────────────────────────────────────────────

  static async setMeta(key, value) {
    const db = await this.initDB();
    await db.put('Meta', { key, value, _at: Date.now() });
  }

  static async getMeta(key) {
    const db = await this.initDB();
    const r = await db.get('Meta', key);
    return r ? r.value : null;
  }

  // ─── STATUS ───────────────────────────────────────────────────────

  static async getOfflineStatus() {
    const counts = {};
    for (const entity of OFFLINE_ENTITIES) {
      counts[entity] = await this.countEntities(entity);
    }
    const lastSync = await this.getMeta('last_full_sync');
    const pending = (await this.getPendingOperations()).length;
    return { counts, lastSync, pending };
  }

  // ─── SERVICE WORKER ───────────────────────────────────────────────

  static registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('[SW] Registered:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Nova versão disponível');
              }
            });
          });
        })
        .catch(err => console.warn('[SW] Error:', err));
    }
  }
}

export const isOnline = () => navigator.onLine;
export const isOffline = () => !navigator.onLine;