import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const OFFLINE_CACHE_KEY = 'crm_nr22_offline_snapshot';
const OFFLINE_META_KEY = 'crm_nr22_offline_meta';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    try {
      const meta = JSON.parse(localStorage.getItem(OFFLINE_META_KEY) || '{}');
      return meta.last_sync ? new Date(meta.last_sync) : null;
    } catch (_e) { return null; }
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [offlineStats, setOfflineStats] = useState(() => {
    try {
      const meta = JSON.parse(localStorage.getItem(OFFLINE_META_KEY) || '{}');
      return meta.stats || null;
    } catch (_e) { return null; }
  });

  // Detectar mudanças de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Contar dados pendentes de sync
  const checkPendingData = useCallback(async () => {
    try {
      const pendingEntries = await base44.entities.OfflineDataEntry?.filter({ synced: false }).catch(() => []);
      setPendingCount(pendingEntries?.length || 0);
      return pendingEntries || [];
    } catch {
      return [];
    }
  }, []);

  // Salvar snapshot no localStorage para acesso offline
  const saveSnapshotLocally = useCallback((snapshot) => {
    try {
      // Salvar metadados separados (leve)
      const meta = {
        last_sync: snapshot.generated_at,
        sync_date: snapshot.sync_date,
        stats: snapshot.stats,
        version: snapshot.version,
      };
      localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(meta));

      // Salvar snapshot completo (dividido se necessário)
      const snapshotStr = JSON.stringify(snapshot);
      if (snapshotStr.length < 4 * 1024 * 1024) { // < 4MB
        localStorage.setItem(OFFLINE_CACHE_KEY, snapshotStr);
      } else {
        // Salvar apenas dados essenciais
        const light = { ...snapshot, clients: snapshot.clients?.slice(0, 100), sales: snapshot.sales?.slice(0, 100) };
        localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(light));
      }

      setLastSyncTime(new Date(snapshot.generated_at));
      setOfflineStats(snapshot.stats);
    } catch (e) {
      console.warn('Erro ao salvar snapshot local:', e);
    }
  }, []);

  // Carregar snapshot do localStorage
  const loadOfflineSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  // Sync completo: buscar snapshot do servidor e salvar localmente
  const syncFullSnapshot = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false };
    setIsSyncing(true);
    try {
      const res = await base44.functions.invoke('dailyOfflineSync', { manual: false });
      if (res.data?.success) {
        // Buscar snapshot do servidor (salvo no MobVendedorSync)
        const syncRecords = await base44.entities.MobVendedorSync
          ?.filter({ sync_type: 'daily_offline_snapshot' })
          .catch(() => []);

        if (syncRecords?.length > 0 && syncRecords[0].data_json) {
          try {
            const snapshot = JSON.parse(syncRecords[0].data_json);
            saveSnapshotLocally(snapshot);
          } catch {}
        }

        // Salvar stats diretamente
        const meta = {
          last_sync: new Date().toISOString(),
          sync_date: res.data.sync_date,
          stats: res.data.stats,
          version: '3.0',
        };
        localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(meta));
        setLastSyncTime(new Date());
        setOfflineStats(res.data.stats);

        window.dispatchEvent(new CustomEvent('offline-snapshot-updated', { detail: res.data }));
        return { success: true, ...res.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro sync snapshot:', error);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, saveSnapshotLocally]);

  // Sincronizar dados offline pendentes (entradas de formulário)
  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false };
    setIsSyncing(true);
    try {
      const pendingEntries = await checkPendingData();
      if (pendingEntries.length === 0) {
        setLastSyncTime(new Date());
        return { success: true, synced: 0 };
      }

      const result = await base44.functions.invoke('syncOfflineData', { entries: pendingEntries });

      if (result.data?.success) {
        setLastSyncTime(new Date());
        setPendingCount(0);
        if (result.data.conflicts?.length > 0) setConflicts(result.data.conflicts);
        window.dispatchEvent(new CustomEvent('offline-data-synced', { detail: { count: result.data.synced } }));
        return { success: true, synced: result.data.synced, conflicts: result.data.conflicts };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, checkPendingData]);

  // Resolver conflito manualmente
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      await base44.functions.invoke('resolveDataConflict', { conflict_id: conflictId, resolution });
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Auto-check pendentes a cada 30 segundos
  useEffect(() => {
    checkPendingData();
    const interval = setInterval(checkPendingData, 30000);
    return () => clearInterval(interval);
  }, [checkPendingData]);

  // Verificar se snapshot local está desatualizado (mais de 24h)
  const isSnapshotStale = useCallback(() => {
    if (!lastSyncTime) return true;
    const hours = (Date.now() - lastSyncTime.getTime()) / 3600000;
    return hours > 24;
  }, [lastSyncTime]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    conflicts,
    offlineStats,
    syncNow: syncPendingData,
    syncFullSnapshot,
    loadOfflineSnapshot,
    isSnapshotStale,
    resolveConflict,
    checkPendingData,
  };
}