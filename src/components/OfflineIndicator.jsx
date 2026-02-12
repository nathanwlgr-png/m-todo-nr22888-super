import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';
import { forceUpdateCache } from './OfflineClientCache';

export default function OfflineIndicator({ cacheAge, clientsCount }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('✅ Conexão restaurada!');
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('📴 Modo Offline ativado - usando dados salvos');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await forceUpdateCache();
      if (result.success) {
        toast.success(`✅ Cache atualizado! ${result.count} clientes salvos`);
        window.location.reload();
      } else {
        toast.error('Erro ao atualizar cache');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOffline && cacheAge === null) return null;

  return (
    <Card className={`p-3 ${isOffline ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'} border-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-5 h-5 text-orange-600" />
          ) : (
            <Database className="w-5 h-5 text-blue-600" />
          )}
          <div>
            {isOffline ? (
              <>
                <p className="text-sm font-bold text-orange-900">📴 Modo Offline</p>
                <p className="text-xs text-orange-700">
                  Usando dados salvos • {clientsCount} clientes disponíveis
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-blue-900">💾 Cache Ativo</p>
                <p className="text-xs text-blue-700">
                  {clientsCount} clientes salvos {cacheAge !== null && `• há ${cacheAge}h`}
                </p>
              </>
            )}
          </div>
        </div>
        {!isOffline && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="border-blue-300 text-blue-700"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </>
            )}
          </Button>
        )}
      </div>
      {isOffline && (
        <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
          ⚠️ Sem conexão - dados podem estar desatualizados. Edições serão perdidas.
        </div>
      )}
    </Card>
  );
}