import { useEffect, useState } from 'react';

const OFFLINE_STORAGE_KEY = 'seamaty_offline_data_';
const SYNC_PENDING_KEY = 'seamaty_sync_pending_';

export function useOfflineData(key, defaultValue = null) {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const [synced, setSynced] = useState(true);

  // Save data locally
  const saveOffline = (value) => {
    try {
      const newData = typeof value === 'function' ? value(data) : value;
      setData(newData);
      localStorage.setItem(OFFLINE_STORAGE_KEY + key, JSON.stringify(newData));
      
      // Mark as pending sync
      const pending = JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) || '{}');
      pending[key] = Date.now();
      localStorage.setItem(SYNC_PENDING_KEY, JSON.stringify(pending));
      
      setSynced(false);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  // Mark as synced
  const markSynced = () => {
    try {
      const pending = JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) || '{}');
      delete pending[key];
      localStorage.setItem(SYNC_PENDING_KEY, JSON.stringify(pending));
      setSynced(true);
    } catch (error) {
      console.error('Error marking synced:', error);
    }
  };

  // Get pending syncs
  const getPendingSyncs = () => {
    try {
      return JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) || '{}');
    } catch {
      return {};
    }
  };

  // Clear data
  const clear = () => {
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY + key);
      setData(defaultValue);
      markSynced();
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  return {
    data,
    saveOffline,
    markSynced,
    getPendingSyncs,
    clear,
    synced,
  };
}

// Auto cleanup old data after 30 days
export function useOfflineCleanup() {
  useEffect(() => {
    const cleanupOldData = () => {
      try {
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(SYNC_PENDING_KEY)) {
            const value = JSON.parse(localStorage.getItem(key) || '{}');
            Object.entries(value).forEach(([dataKey, timestamp]) => {
              if (now - timestamp > thirtyDays) {
                localStorage.removeItem(OFFLINE_STORAGE_KEY + dataKey);
                delete value[dataKey];
              }
            });
            localStorage.setItem(key, JSON.stringify(value));
          }
        }
      } catch (error) {
        console.error('Error cleaning offline data:', error);
      }
    };

    cleanupOldData();
    const interval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Daily

    return () => clearInterval(interval);
  }, []);
}