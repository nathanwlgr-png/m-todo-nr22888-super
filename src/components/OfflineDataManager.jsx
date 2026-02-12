import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CACHE_KEYS = {
  clients: 'nr22_offline_clients',
  visits: 'nr22_offline_visits',
  tasks: 'nr22_offline_tasks',
  interactions: 'nr22_offline_interactions',
  sales: 'nr22_offline_sales'
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Cache universal para todas entidades
 */
export function useOfflineData(entityName, limit = 200) {
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [cachedData, setCachedData] = useState([]);
  const cacheKey = CACHE_KEYS[entityName.toLowerCase()] || `nr22_offline_${entityName.toLowerCase()}`;

  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadCache = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < CACHE_EXPIRY) {
            setCachedData(data.items);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
      }
    };
    loadCache();
  }, [cacheKey]);

  const { data: onlineData = [], isLoading, isError } = useQuery({
    queryKey: [entityName.toLowerCase()],
    queryFn: async () => {
      const items = await base44.entities[entityName].list('-updated_date', limit);
      
      const cacheData = {
        items: items,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setCachedData(items);
      
      return items;
    },
    enabled: !offlineMode,
    staleTime: 5 * 60 * 1000,
    retry: 0
  });

  return {
    data: offlineMode || isError ? cachedData : onlineData,
    isOffline: offlineMode,
    isLoading: !offlineMode && isLoading,
    isCached: offlineMode || isError
  };
}

/**
 * Atualizar item no cache local
 */
export function updateLocalCache(entityName, itemId, updateData) {
  const cacheKey = CACHE_KEYS[entityName.toLowerCase()] || `nr22_offline_${entityName.toLowerCase()}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      const itemIndex = data.items.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        data.items[itemIndex] = { ...data.items[itemIndex], ...updateData };
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erro ao atualizar cache local:', error);
    return false;
  }
}

/**
 * Adicionar item ao cache local
 */
export function addToLocalCache(entityName, itemData) {
  const cacheKey = CACHE_KEYS[entityName.toLowerCase()] || `nr22_offline_${entityName.toLowerCase()}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    const data = cached ? JSON.parse(cached) : { items: [], timestamp: Date.now() };
    
    const newItem = {
      ...itemData,
      id: 'offline_' + Date.now(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    data.items.unshift(newItem);
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    return newItem;
  } catch (error) {
    console.error('Erro ao adicionar ao cache:', error);
    return null;
  }
}

/**
 * Forçar atualização completa de todos os caches
 */
export async function syncAllData() {
  const results = { success: [], failed: [] };
  
  try {
    // Clients
    const clients = await base44.entities.Client.list('-updated_date', 200);
    localStorage.setItem(CACHE_KEYS.clients, JSON.stringify({
      items: clients,
      timestamp: Date.now()
    }));
    results.success.push('Clients');

    // Visits
    const visits = await base44.entities.Visit.list('-scheduled_date', 100);
    localStorage.setItem(CACHE_KEYS.visits, JSON.stringify({
      items: visits,
      timestamp: Date.now()
    }));
    results.success.push('Visits');

    // Tasks
    const tasks = await base44.entities.Task.list('-due_date', 100);
    localStorage.setItem(CACHE_KEYS.tasks, JSON.stringify({
      items: tasks,
      timestamp: Date.now()
    }));
    results.success.push('Tasks');

    // Interactions
    const interactions = await base44.entities.Interaction.list('-created_date', 150);
    localStorage.setItem(CACHE_KEYS.interactions, JSON.stringify({
      items: interactions,
      timestamp: Date.now()
    }));
    results.success.push('Interactions');

    // Sales
    const sales = await base44.entities.Sale.list('-sale_date', 100);
    localStorage.setItem(CACHE_KEYS.sales, JSON.stringify({
      items: sales,
      timestamp: Date.now()
    }));
    results.success.push('Sales');

    return {
      success: true,
      synced: results.success.length,
      entities: results.success
    };
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obter estatísticas do cache
 */
export function getCacheStats() {
  const stats = {};
  
  Object.entries(CACHE_KEYS).forEach(([name, key]) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        const hours = Math.floor((Date.now() - data.timestamp) / (60 * 60 * 1000));
        stats[name] = {
          count: data.items?.length || 0,
          age: hours,
          size: (cached.length / 1024).toFixed(1) + ' KB'
        };
      }
    } catch {}
  });
  
  return stats;
}