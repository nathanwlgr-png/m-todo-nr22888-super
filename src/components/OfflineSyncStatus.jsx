import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useOfflineEdits } from './OfflineDataSync';
import { toast } from 'sonner';

export default function OfflineSyncStatus() {
  const { pendingEdits, syncPendingEdits, clearQueue, syncing, hasPendingEdits } = useOfflineEdits();

  if (!hasPendingEdits) return null;

  return (
    <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-700" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              📝 {pendingEdits.length} Edições Pendentes
            </p>
            <p className="text-xs text-amber-700">
              Aguardando sincronização
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={syncPendingEdits}
            disabled={syncing || !navigator.onLine}
            className="border-amber-400 text-amber-700"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sincronizar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm('Descartar todas as edições pendentes?')) {
                clearQueue();
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {pendingEdits.slice(0, 5).map((edit) => (
          <div key={edit.id} className="flex items-center gap-2 p-2 bg-white rounded text-xs">
            {edit.synced ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-600" />
            )}
            <span className="flex-1 text-slate-700">
              {edit.clientName || edit.entityName} - {new Date(edit.timestamp).toLocaleString('pt-BR')}
            </span>
            <Badge variant="outline" className="text-xs">
              {edit.entityName}
            </Badge>
          </div>
        ))}
        {pendingEdits.length > 5 && (
          <p className="text-xs text-amber-700 text-center pt-1">
            + {pendingEdits.length - 5} mais
          </p>
        )}
      </div>

      {!navigator.onLine && (
        <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          <span>Sincronização automática quando voltar online</span>
        </div>
      )}
    </Card>
  );
}