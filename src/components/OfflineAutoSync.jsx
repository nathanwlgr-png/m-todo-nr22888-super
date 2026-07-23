import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncPendingOperations } from '@/lib/offlineOperations';

export default function OfflineAutoSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    let running = false;
    let retryTimer = null;

    const schedule = (delay = 0) => {
      window.clearTimeout(retryTimer);
      if (active && navigator.onLine) retryTimer = window.setTimeout(sync, delay);
    };

    const sync = async () => {
      if (!active || running || !navigator.onLine) return;
      running = true;
      try {
        const result = await syncPendingOperations();
        if (!active) return;
        if (result.synced > 0) {
          await queryClient.invalidateQueries();
          toast.success(`${result.synced} registros offline sincronizados`);
        }
        if (result.quarantined > 0) {
          toast.error(`${result.quarantined} registros foram preservados para revisão`);
        }
        if (result.pending > 0) schedule(30000);
      } catch (_) {
        if (active) schedule(30000);
      } finally {
        running = false;
      }
    };

    const handleOnline = () => schedule(0);
    const handleQueueChange = () => schedule(5000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') schedule(0);
    };

    schedule(1500);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline-queue-changed', handleQueueChange);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline-queue-changed', handleQueueChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [queryClient]);

  return null;
}