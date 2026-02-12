import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Database, Download } from 'lucide-react';
import { toast } from 'sonner';
import { forceUpdateCache } from './OfflineClientCache';
import { syncAllData, getCacheStats } from './OfflineDataManager';

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
      toast.info('Sincronizando todos os dados...');
      const result = await syncAllData();
      
      if (result.success) {
        toast.success(`✅ ${result.synced} entidades sincronizadas!`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Erro ao sincronizar');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const stats = getCacheStats();
  const totalCached = Object.values(stats).reduce((acc, s) => acc + s.count, 0);

  if (!isOffline && cacheAge === null) return null;

  return (
    <Card className={`p-3 ${isOffline ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'} border-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-5 h-5 text-orange-600" />
          ) : (
            <Download className="w-5 h-5 text-blue-600" />
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
                <p className="text-sm font-bold text-blue-900">💾 Dados Offline Disponíveis</p>
                <p className="text-xs text-blue-700">
                  {totalCached} registros salvos localmente
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
          ⚠️ Sem conexão - Edições serão salvas e sincronizadas quando voltar online
        </div>
      )}
      {!isOffline && Object.keys(stats).length > 0 && (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {Object.entries(stats).map(([entity, data]) => (
            <div key={entity} className="bg-blue-100 rounded p-1 text-center">
              <p className="text-xs font-bold text-blue-900">{data.count}</p>
              <p className="text-xs text-blue-700 capitalize">{entity}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}