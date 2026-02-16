import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);

  // Detectar mudanças de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData(); // Auto-sync quando voltar online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

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
      const pendingEntries = await base44.entities.OfflineDataEntry.filter({ synced: false });
      setPendingCount(pendingEntries.length);
      return pendingEntries;
    } catch (error) {
      console.error('Erro ao verificar dados pendentes:', error);
      return [];
    }
  }, []);

  // Sincronizar dados offline
  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false };

    setIsSyncing(true);
    try {
      const pendingEntries = await checkPendingData();
      
      if (pendingEntries.length === 0) {
        setLastSyncTime(new Date());
        return { success: true, synced: 0 };
      }

      const result = await base44.functions.invoke('syncOfflineData', {
        entries: pendingEntries
      });

      if (result.data.success) {
        setLastSyncTime(new Date());
        setPendingCount(0);
        
        if (result.data.conflicts?.length > 0) {
          setConflicts(result.data.conflicts);
        }

        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('offline-data-synced', {
          detail: { count: result.data.synced }
        }));

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
      await base44.functions.invoke('resolveDataConflict', {
        conflict_id: conflictId,
        resolution // 'keep_local', 'keep_server', 'merge'
      });

      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      return { success: true };
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Auto-check pendentes a cada 30 segundos
  useEffect(() => {
    checkPendingData();
    const interval = setInterval(checkPendingData, 30000);
    return () => clearInterval(interval);
  }, [checkPendingData]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    conflicts,
    syncNow: syncPendingData,
    resolveConflict,
    checkPendingData
  };
}