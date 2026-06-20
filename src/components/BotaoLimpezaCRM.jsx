import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BotaoLimpezaCRM() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resultado, setResultado] = useState(null);

  const executarLimpeza = async () => {
    if (status === 'loading') return;
    const confirmado = window.confirm('Confirma executar a limpeza segura? Ela não apaga dados, mas pode normalizar telefones e arquivar duplicatas prováveis.');
    if (!confirmado) return;
    setStatus('loading');
    setResultado(null);

    try {
      const res = await base44.functions.invoke('limpezaCompletaCRM', {});
      const data = res.data;
      if (data.success) {
        setStatus('success');
        setResultado(data);
        setTimeout(() => setStatus('idle'), 8000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  if (status === 'success' && resultado) {
    return (
      <div className="w-full rounded-xl p-3 bg-emerald-900/30 border border-emerald-500/40 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-400">Limpeza concluída!</p>
          <p className="text-[10px] text-emerald-300 mt-0.5">
            📞 {resultado.phonesFixed} telefones · 🔧 {resultado.defaultsFixed} defaults · 
            🔁 {resultado.merged} duplicatas arquivadas
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full rounded-xl p-3 bg-red-900/30 border border-red-500/40 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <p className="text-xs text-red-400">Erro na limpeza. Tente novamente.</p>
      </div>
    );
  }

  return (
    <button
      onClick={executarLimpeza}
      disabled={status === 'loading'}
      className="w-full rounded-xl p-3 bg-[#0f0f11] border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-2">
        {status === 'loading'
          ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          : <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
        }
        <div className="text-left">
          <p className="text-xs font-black text-purple-400 group-hover:text-purple-300">
            {status === 'loading' ? 'Limpando base...' : '🧹 Limpar Base de Dados'}
          </p>
          <p className="text-[9px] text-slate-500">
            {status === 'loading' ? 'Removendo duplicatas e corrigindo dados...' : 'Normalizar · Deduplicar · Arquivar · Auto a cada 3 dias'}
          </p>
        </div>
      </div>
      {status !== 'loading' && (
        <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">Executar</span>
      )}
    </button>
  );
}