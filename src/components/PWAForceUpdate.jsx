import * as React from 'react';
const { useState } = React;
import { RefreshCw } from 'lucide-react';

/**
 * Botão que força o service worker a pular a fila de espera e
 * limpa todos os caches do PWA. Ideal para resolver 404 em rotas novas.
 */
export default function PWAForceUpdate({ className = '' }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const forceUpdate = async () => {
    setLoading(true);
    try {
      // 1. Limpa todos os caches do browser
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // 2. Manda mensagem para o SW ativo pular a fila
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
          await reg.update();
        }
      }

      setDone(true);
      // Recarrega após 1s para pegar o novo SW
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.error('[PWAForceUpdate]', e);
      window.location.reload();
    }
  };

  return (
    <button
      onClick={forceUpdate}
      disabled={loading || done}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${className}`}
      style={{
        background: done ? 'rgba(0,255,136,0.12)' : 'rgba(255,107,0,0.1)',
        border: done ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,107,0,0.25)',
        color: done ? '#00ff88' : '#ff9500',
        opacity: loading ? 0.6 : 1,
      }}
      title="Limpa cache do PWA e força atualização"
    >
      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      {done ? 'Atualizado!' : loading ? 'Atualizando...' : 'Forçar atualização PWA'}
    </button>
  );
}