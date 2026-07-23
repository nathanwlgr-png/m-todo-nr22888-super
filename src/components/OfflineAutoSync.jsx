import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncPendingOperations } from '@/lib/offlineOperations';

export default function OfflineAutoSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const result = await syncPendingOperations();
      if (!active || result.synced === 0) return;
      await queryClient.invalidateQueries();
      toast.success(`${result.synced} registros offline sincronizados`);
    };
    const initialSync = window.setTimeout(sync, 1500);
    window.addEventListener('online', sync);
    return () => {
      active = false;
      window.clearTimeout(initialSync);
      window.removeEventListener('online', sync);
    };
  }, [queryClient]);

  return null;
}