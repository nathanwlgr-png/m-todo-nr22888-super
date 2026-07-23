/**
 * OfflineSyncButton — Botão manual "Sincronizar dados offline"
 * - Baixa Client, Lead, Task, Visit, Sale, Equipment, ConsumableOrder
 * - Salva no IndexedDB via OfflineManager
 * - Mostra quantidade salva
 * - ZERO IA / ZERO crédito
 */
import * as React from 'react';
const { useState } = React;
import { CloudDownload, CheckCircle2, WifiOff, Loader2, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { OfflineManager } from '@/lib/OfflineManager';
import { syncPendingOperations } from '@/lib/offlineOperations';
import { toast } from 'sonner';

export default function OfflineSyncButton({ compact = false, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null); // { counts, total }

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setResult(null);

    const queueResult = await syncPendingOperations();
    const counts = {};
    let total = 0;

    // Lista de entidades para sincronizar com seus limites
    const entityConfig = [
      { name: 'Client',          limit: 500 },
      { name: 'Lead',            limit: 300 },
      { name: 'Task',            limit: 200 },
      { name: 'Visit',           limit: 200 },
      { name: 'Sale',            limit: 150 },
      { name: 'Equipment',       limit: 50  },
      { name: 'ConsumableOrder', limit: 150 },
    ];

    for (const { name, limit } of entityConfig) {
      try {
        const records = await base44.entities[name].list('-updated_date', limit);
        if (records && records.length > 0) {
          await OfflineManager.bulkSaveEntity(name, records);
          counts[name] = records.length;
          total += records.length;
        } else {
          counts[name] = 0;
        }
      } catch (err) {
        console.warn(`[OfflineSync] Falha em ${name}:`, err);
        counts[name] = 0;
      }
    }

    await OfflineManager.setMeta('last_full_sync', new Date().toISOString());

    setSyncing(false);
    setResult({ counts, total, uploaded: queueResult.synced, failed: queueResult.failed });
    onSyncComplete?.();
    toast.success(queueResult.synced > 0
      ? `${queueResult.synced} ações enviadas e ${total} registros atualizados`
      : `${total} registros salvos para uso offline`);
  };

  if (compact) {
    return (
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
        style={{
          background: result ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,0,0.1)',
          border: result ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,107,0,0.3)',
          color: result ? '#00ff88' : '#ff9500',
        }}
      >
        {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudDownload className="w-3 h-3" />}
        {syncing ? 'Baixando...' : result ? `${result.total} salvos` : 'Sincronizar offline'}
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-black text-white">Dados Offline</p>
        </div>
        {result && (
          <span className="text-xs font-bold text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {result.uploaded > 0 ? `${result.uploaded} enviados` : `${result.total} salvos`}
          </span>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-1 mb-3">
          {Object.entries(result.counts).map(([entity, count]) => (
            <div key={entity} className="flex items-center justify-between px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] text-slate-400">{entity}</span>
              <span className="text-[10px] font-bold text-orange-300">{count}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={syncing || !navigator.onLine}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all"
        style={{
          background: !navigator.onLine
            ? 'rgba(100,100,100,0.3)'
            : syncing
            ? 'rgba(255,107,0,0.3)'
            : 'linear-gradient(135deg, #ff6b00, #ff9500)',
          color: !navigator.onLine ? '#666' : '#fff',
        }}
      >
        {syncing ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Baixando dados...</>
        ) : !navigator.onLine ? (
          <><WifiOff className="w-4 h-4" />Sem internet</>
        ) : (
          <><CloudDownload className="w-4 h-4" />Sincronizar dados offline</>
        )}
      </button>

      <p className="text-[10px] text-slate-500 text-center mt-2">
        Sem IA · Sem crédito · Dados ficam por 30 dias
      </p>
    </div>
  );
}