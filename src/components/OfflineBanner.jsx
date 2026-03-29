import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (online && !showBack) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white transition-all ${
      online ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {online ? (
        <><Wifi className="w-4 h-4" /> Conexão restaurada!</>
      ) : (
        <><WifiOff className="w-4 h-4" /> Você está offline — dados em cache disponíveis</>
      )}
    </div>
  );
}