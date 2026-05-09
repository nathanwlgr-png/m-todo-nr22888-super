// Offline Manager — IndexedDB + Service Worker + Sync Queue
import { openDB } from 'idb';

const DB_NAME = 'SeamtyOfflineDB';
const DB_VERSION = 1;

export class OfflineManager {
  static async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Entities
        ['Client', 'Lead', 'Sale', 'Equipment', 'ConsumableOrder', 'Visit', 'Task'].forEach(entity => {
          if (!db.objectStoreNames.contains(entity)) {
            db.createObjectStore(entity, { keyPath: 'id' });
          }
        });
        // Sync Queue
        if (!db.objectStoreNames.contains('SyncQueue')) {
          db.createObjectStore('SyncQueue', { keyPath: 'id', autoIncrement: true });
        }
        // Cache
        if (!db.objectStoreNames.contains('CacheStore')) {
          db.createObjectStore('CacheStore', { keyPath: 'key' });
        }
      }
    });
  }

  static async saveEntity(entityName, data) {
    const db = await this.initDB();
    await db.put(entityName, { ...data, _cached_at: new Date() });
  }

  static async getEntity(entityName, id) {
    const db = await this.initDB();
    return db.get(entityName, id);
  }

  static async listEntities(entityName) {
    const db = await this.initDB();
    return db.getAll(entityName);
  }

  static async queueSync(operation) {
    const db = await this.initDB();
    await db.add('SyncQueue', { ...operation, _queued_at: new Date(), _synced: false });
  }

  static async getSyncQueue() {
    const db = await this.initDB();
    return db.getAll('SyncQueue');
  }

  static async markSynced(id) {
    const db = await this.initDB();
    const queue = await db.get('SyncQueue', id);
    if (queue) await db.put('SyncQueue', { ...queue, _synced: true });
  }

  static async cacheData(key, data, ttl = 2592000000) { // 30 dias
    const db = await this.initDB();
    await db.put('CacheStore', {
      key,
      value: data,
      _cached_at: new Date(),
      _expires_at: new Date(Date.now() + ttl)
    });
  }

  static async getCachedData(key) {
    const db = await this.initDB();
    const cached = await db.get('CacheStore', key);
    if (cached && new Date() < new Date(cached._expires_at)) {
      return cached.value;
    }
    if (cached) await db.delete('CacheStore', key);
    return null;
  }

  static async clearExpiredCache() {
    const db = await this.initDB();
    const all = await db.getAll('CacheStore');
    const now = new Date();
    for (const item of all) {
      if (now > new Date(item._expires_at)) {
        await db.delete('CacheStore', item.key);
      }
    }
  }

  static registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error:', err));
    }
  }
}

export const isOnline = () => navigator.onLine;
export const isOffline = () => !navigator.onLine;