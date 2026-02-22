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

  // Query online - busca paginada para suportar grandes volumes
  const { data: onlineClients = [], isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Buscar em lotes para evitar timeout e limite de memória
      const PAGE_SIZE = 500;
      let allClients = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const batch = await base44.entities.Client.list('-updated_date', PAGE_SIZE, skip);
        if (!batch || batch.length === 0) break;
        allClients = [...allClients, ...batch];
        skip += PAGE_SIZE;
        hasMore = batch.length === PAGE_SIZE;
      }

      // Salvar no cache (com proteção contra localStorage cheio)
      try {
        const cacheData = { clients: allClients, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedClients(allClients);
      } catch (e) {
        // localStorage cheio - salva versão reduzida (só campos essenciais)
        try {
          const slim = allClients.map(c => ({
            id: c.id, first_name: c.first_name, full_name: c.full_name,
            clinic_name: c.clinic_name, city: c.city, phone: c.phone,
            status: c.status, purchase_score: c.purchase_score,
            pipeline_stage: c.pipeline_stage, email: c.email,
            updated_date: c.updated_date
          }));
          localStorage.setItem(CACHE_KEY, JSON.stringify({ clients: slim, timestamp: Date.now() }));
          setCachedClients(allClients);
        } catch (_) {
          setCachedClients(allClients);
        }
      }

      return allClients;
    },
    enabled: !offlineMode,
    staleTime: 5 * 60 * 1000,
    retry: 1
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
      // Busca direta pelo ID via filter
      const result = await base44.entities.Client.filter({ id: clientId });
      return result?.[0] || null;
    },
    enabled: !isOffline && !!clientId,
    retry: 1
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
    const PAGE_SIZE = 500;
    let allClients = [];
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.entities.Client.list('-updated_date', PAGE_SIZE, skip);
      if (!batch || batch.length === 0) break;
      allClients = [...allClients, ...batch];
      skip += PAGE_SIZE;
      hasMore = batch.length === PAGE_SIZE;
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ clients: allClients, timestamp: Date.now() }));
    } catch (_) {}
    return { success: true, count: allClients.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}