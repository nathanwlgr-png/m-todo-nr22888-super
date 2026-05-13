/**
 * AIOnDemandWrapper — Wrapper para qualquer ação de IA
 *
 * Regras:
 * 1. Verifica cache de 30 dias antes de qualquer chamada
 * 2. Se cache válido → usa cache, zero crédito
 * 3. Se sem cache → mostra aviso de custo, aguarda confirmação
 * 4. Registra AuditLog em todo uso
 * 5. NUNCA chama IA automaticamente
 */
import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { AICache } from '@/lib/AICache';
import { base44 } from '@/api/base44Client';

const COST_LABELS = {
  low: { label: '~1-2 créditos', color: '#00ff88' },
  medium: { label: '~3-5 créditos', color: '#ff9500' },
  high: { label: '~8-15 créditos', color: '#ff4444' },
};

export default function AIOnDemandWrapper({
  cacheType,          // string único: 'clinic_search', 'client_analysis', etc.
  cacheParams = {},   // params para chave do cache
  costLevel = 'medium', // 'low' | 'medium' | 'high'
  actionLabel = 'Executar IA',
  icon,
  onRun,              // async fn que executa a IA e retorna resultado
  onResult,           // fn(result, fromCache) chamada com o resultado
  children,           // renderiza o botão customizado se fornecido
  className = '',
}) {
  const [status, setStatus] = useState('idle'); // idle | confirm | running | done | error
  const [fromCache, setFromCache] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  const handleClick = async () => {
    // 1. Verificar cache
    const cached = AICache.get(cacheType, cacheParams);
    if (cached) {
      const days = AICache.daysLeft(cacheType, cacheParams);
      setFromCache(true);
      setDaysLeft(days);
      setStatus('done');
      onResult?.(cached, true);
      return;
    }

    // 2. Sem cache → pedir confirmação
    setStatus('confirm');
  };

  const handleConfirm = async () => {
    setStatus('running');
    setFromCache(false);

    try {
      const result = await onRun();

      // 3. Salvar no cache
      AICache.set(cacheType, cacheParams, result);

      // 4. Registrar AuditLog (sem aguardar)
      try {
        await base44.entities.AuditLog.create({
          action: 'ia_analysis',
          module: cacheType,
          user_email: 'system',
          success: true,
        });
      } catch {}

      setStatus('done');
      onResult?.(result, false);
    } catch (err) {
      setStatus('error');
      console.error('[AIOnDemand] Erro:', err);
    }
  };

  const cost = COST_LABELS[costLevel];

  // Botão idle
  if (status === 'idle') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${className}`}
        style={{
          background: 'rgba(120,80,255,0.1)',
          border: '1px solid rgba(120,80,255,0.3)',
          color: '#a78bfa',
        }}
      >
        {icon || <Sparkles className="w-3.5 h-3.5" />}
        {actionLabel}
      </button>
    );
  }

  // Confirmação de custo
  if (status === 'confirm') {
    return (
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)' }}
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black text-white">Confirmar uso de IA</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Esta ação consumirá{' '}
              <span style={{ color: cost.color }} className="font-bold">{cost.label}</span>{' '}
              da sua conta.
            </p>
            <p className="text-[10px] text-slate-500">O resultado ficará em cache por 30 dias.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 text-xs font-black py-1.5 rounded-lg"
            style={{ background: 'rgba(255,107,0,0.8)', color: '#fff' }}
          >
            Confirmar e executar
          </button>
          <button
            onClick={() => setStatus('idle')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Executando
  if (status === 'running') {
    return (
      <div className="flex items-center gap-2 text-xs text-purple-300 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Executando IA...
      </div>
    );
  }

  // Concluído
  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-xs py-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        {fromCache ? (
          <span className="text-green-400 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Cache válido — {daysLeft} dias restantes · Zero crédito
          </span>
        ) : (
          <span className="text-green-400 font-bold">IA executada e resultado cacheado por 30 dias</span>
        )}
        <button
          onClick={() => setStatus('idle')}
          className="text-[10px] text-slate-500 underline ml-1"
        >
          Refazer
        </button>
      </div>
    );
  }

  // Erro
  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 py-1">
        <AlertCircle className="w-3.5 h-3.5" />
        Erro ao executar IA.
        <button onClick={() => setStatus('idle')} className="underline">Tentar novamente</button>
      </div>
    );
  }

  return null;
}