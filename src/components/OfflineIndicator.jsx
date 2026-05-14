import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-red-900/90 border-b border-red-700 backdrop-blur-sm px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-white text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Modo Offline — Dados em sincronização quando conectar</span>
      </div>
    </div>
  );
}