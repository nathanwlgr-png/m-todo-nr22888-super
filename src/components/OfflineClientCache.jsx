import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'nr22_offline_clients';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Sistema de cache offline para clientes
 * Permite acesso aos dados mesmo sem internet
 */
export function useOfflineClients() {
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [cachedClients, setCachedClients] = useState([]);

  // Monitorar conexão
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

  // Carregar cache ao iniciar
  useEffect(() => {
    const loadCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < CACHE_EXPIRY) {
            setCachedClients(data.clients);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
      }
    };
    loadCache();
  }, []);

  // Query online - BUSCAR TODOS OS CLIENTES SEM LIMITE
  const { data: onlineClients = [], isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Buscar TODOS os clientes (máximo 10.000)
      const clients = await base44.entities.Client.list('-updated_date', 10000);
      
      // Salvar no cache
      const cacheData = {
        clients: clients,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedClients(clients);
      
      return clients;
    },
    enabled: !offlineMode,
    staleTime: 5 * 60 * 1000,
    retry: 0
  });

  return {
    clients: offlineMode || isError ? cachedClients : onlineClients,
    isOffline: offlineMode,
    isLoading: !offlineMode && isLoading,
    isCached: offlineMode || isError,
    cacheAge: (() => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          const hours = Math.floor((Date.now() - data.timestamp) / (60 * 60 * 1000));
          return hours;
        }
      } catch {}
      return null;
    })()
  };
}

/**
 * Hook para dados offline de um cliente específico
 */
export function useOfflineClient(clientId) {
  const [client, setClient] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline && clientId) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          const found = data.clients.find(c => c.id === clientId);
          setClient(found || null);
        }
      } catch (error) {
        console.error('Erro ao carregar cliente offline:', error);
      }
    }
  }, [clientId, isOffline]);

  const { data: onlineClient, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.list('-updated_date', 10000);
      return clients.find(c => c.id === clientId) || null;
    },
    enabled: !isOffline && !!clientId,
    retry: 0
  });

  return {
    client: isOffline ? client : onlineClient,
    isOffline,
    isLoading: !isOffline && isLoading
  };
}

/**
 * Limpar cache manualmente
 */
export function clearOfflineCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Forçar atualização do cache
 */
export async function forceUpdateCache() {
  try {
    // Buscar TODOS os clientes
    const clients = await base44.entities.Client.list('-updated_date', 10000);
    const cacheData = {
      clients: clients,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    return { success: true, count: clients.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}