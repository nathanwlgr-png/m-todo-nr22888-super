/**
 * OfflineBanner — Aviso fixo de modo offline com status de sincronização
 */
import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { OfflineManager } from '@/lib/OfflineManager';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const onOnline = async () => {
      setIsOffline(false);
      // Auto-sincroniza operações pendentes ao voltar online
      await autoSync();
    };
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Verifica pendências ao montar
    OfflineManager.getPendingOperations().then(ops => setPending(ops.length));

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const autoSync = async () => {
    const ops = await OfflineManager.getPendingOperations();
    if (ops.length === 0) return;

    setSyncing(true);
    let ok = 0, fail = 0;

    for (const op of ops) {
      try {
        if (op.action === 'create') {
          await base44.entities[op.entity].create(op.data);
        } else if (op.action === 'update') {
          await base44.entities[op.entity].update(op.data.id, op.data);
        }
        await OfflineManager.markOperationSynced(op.id);
        ok++;
      } catch {
        fail++;
      }
    }

    await OfflineManager.clearSyncedOperations();
    setSyncing(false);
    setPending(fail);

    if (ok > 0) toast.success(`✅ ${ok} ações sincronizadas com o servidor!`);
    if (fail > 0) toast.warning(`⚠️ ${fail} ações falharam — tente novamente.`);
  };

  if (!isOffline && pending === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2"
      style={{
        background: isOffline ? 'rgba(180,40,0,0.95)' : 'rgba(200,120,0,0.95)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2">
        {syncing ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <WifiOff className="w-4 h-4 text-white" />
        )}
        <span className="text-xs font-black text-white">
          {syncing
            ? 'Sincronizando dados...'
            : isOffline
            ? 'Modo offline — dados locais'
            : `${pending} ação(ões) pendentes de sync`}
        </span>
      </div>

      {!isOffline && pending > 0 && (
        <button
          onClick={autoSync}
          disabled={syncing}
          className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      )}
    </div>
  );
}