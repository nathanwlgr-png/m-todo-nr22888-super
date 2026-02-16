import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOfflineSync } from '@/components/hooks/useOfflineSync';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, 
  Database, Cloud, ArrowUpDown 
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function OfflineSyncService() {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    conflicts,
    syncNow,
    resolveConflict
  } = useOfflineSync();

  // Auto-sync a cada 5 minutos se online e houver dados pendentes
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    const interval = setInterval(() => {
      syncNow();
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [isOnline, pendingCount, syncNow]);

  const handleManualSync = async () => {
    const result = await syncNow();
    if (result.success) {
      toast.success(`${result.synced || 0} registros sincronizados!`);
    } else {
      toast.error('Falha na sincronização');
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Bar */}
      <Card className={`p-4 border-2 ${
        isOnline 
          ? 'bg-green-50 border-green-300' 
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Online</p>
                  <p className="text-xs text-green-600">
                    {lastSyncTime 
                      ? `Última sync: ${moment(lastSyncTime).fromNow()}`
                      : 'Nunca sincronizado'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">Offline</p>
                  <p className="text-xs text-amber-600">Dados salvos localmente</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Database className="w-3 h-3 mr-1" />
                {pendingCount} pendentes
              </Badge>
            )}

            {isOnline && (
              <Button
                onClick={handleManualSync}
                disabled={isSyncing || pendingCount === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress durante sync */}
        {isSyncing && (
          <div className="mt-3 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse" style={{width: '60%'}} />
          </div>
        )}
      </Card>

      {/* Conflitos */}
      {conflicts.length > 0 && (
        <Card className="p-4 border-2 border-orange-300 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-orange-800 mb-2">
                Conflitos Detectados ({conflicts.length})
              </h4>
              
              <div className="space-y-2">
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="p-3 bg-white rounded border border-orange-200">
                    <p className="text-sm text-slate-700 mb-2">
                      <strong>{conflict.entity_type}</strong> modificado offline e online
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'keep_local')}
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Manter Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'keep_server')}
                      >
                        <Cloud className="w-3 h-3 mr-1" />
                        Manter Servidor
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveConflict(conflict.id, 'merge')}
                      >
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        Mesclar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sucesso quando tudo sincronizado */}
      {isOnline && pendingCount === 0 && !isSyncing && lastSyncTime && (
        <Card className="p-3 bg-emerald-50 border border-emerald-300">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Todos os dados estão sincronizados</span>
          </div>
        </Card>
      )}
    </div>
  );
}