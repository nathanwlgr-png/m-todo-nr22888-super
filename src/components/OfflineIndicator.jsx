import { useEffect } from 'react';
import { OfflineDataSync } from '@/lib/OfflineDataSync';

export default function OfflineIndicator() {
  useEffect(() => {
    const synchronize = () => {
      if (!navigator.onLine) return;
      OfflineDataSync.syncAllEntities()
        .then((result) => window.dispatchEvent(new CustomEvent('nr22888:offline-sync', { detail: result })))
        .catch((error) => console.warn('[SYNC] Nova tentativa será feita na próxima conexão:', error));
    };

    synchronize();
    window.addEventListener('online', synchronize);
    return () => window.removeEventListener('online', synchronize);
  }, []);

  return null;
}