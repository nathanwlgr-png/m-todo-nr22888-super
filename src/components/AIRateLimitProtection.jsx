import React, { useEffect, useState } from 'react';
import { rateLimitManager } from '@/components/rateLimitManager';

export default function AIRateLimitProtection() {
  const [stats, setStats] = useState({
    queueLength: 0,
    activeRequests: 0,
    lastRequestTime: null
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        queueLength: rateLimitManager.queue.length,
        activeRequests: rateLimitManager.activeRequests,
        lastRequestTime: rateLimitManager.lastRequestTime
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar apenas se houver fila
  if (stats.queueLength === 0 && stats.activeRequests === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs shadow-lg">
      <p>🔄 Processando: {stats.activeRequests} | Fila: {stats.queueLength}</p>
    </div>
  );
}