import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw } from 'lucide-react';
import { getCacheStats, syncAllData } from './OfflineDataManager';
import { toast } from 'sonner';

export default function OfflineDataViewer() {
  const [syncing, setSyncing] = React.useState(false);
  const [stats, setStats] = React.useState({});

  React.useEffect(() => {
    setStats(getCacheStats());
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAllData();
      if (result.success) {
        toast.success(`✅ ${result.synced} entidades sincronizadas!`);
        setStats(getCacheStats());
      } else {
        toast.error('Erro ao sincronizar');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const totalRecords = Object.values(stats).reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-bold text-blue-900">Dados Salvos Localmente</h3>
            <p className="text-sm text-blue-700">{totalRecords} registros disponíveis offline</p>
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing || !navigator.onLine}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Dados Offline
            </>
          )}
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(stats).map(([entity, data]) => (
          <Card key={entity} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-800 capitalize">{entity}</h4>
              <Badge className="bg-blue-100 text-blue-700">{data.count}</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>📦 Tamanho: {data.size}</p>
              <p>🕐 Atualizado há {data.age}h</p>
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(stats).length === 0 && (
        <Card className="p-6 text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-3">Nenhum dado offline salvo</p>
          <Button onClick={handleSync} disabled={!navigator.onLine}>
            Sincronizar Dados
          </Button>
        </Card>
      )}
    </div>
  );
}