import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, ShieldAlert, X } from 'lucide-react';

const CONFIRM_TEXT = 'CONFIRMAR LIMPEZA SEGURA';

export default function BotaoLimpezaCRM() {
  const [status, setStatus] = useState('idle'); // idle | confirm | loading | success | error
  const [resultado, setResultado] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');

  const executarLimpeza = async () => {
    if (confirmInput.trim() !== CONFIRM_TEXT) return;
    setStatus('loading');
    setResultado(null);
    try {
      const res = await base44.functions.invoke('limpezaCompletaCRM', {});
      const data = res.data;
      if (data.success) {
        setStatus('success');
        setResultado(data);
        setConfirmInput('');
        setTimeout(() => setStatus('idle'), 10000);
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
          <p className="text-xs font-bold text-emerald-400">Auditoria segura concluída!</p>
          <p className="text-[10px] text-emerald-300 mt-0.5">
            📞 {resultado.phonesFixed} telefones · 🔧 {resultado.defaultsFixed} defaults ·
            🔍 {resultado.duplicatesQueued} duplicatas enviadas para revisão (nada arquivado)
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

  if (status === 'confirm') {
    const ok = confirmInput.trim() === CONFIRM_TEXT;
    return (
      <div className="w-full rounded-xl p-3 bg-[#0f0f11] border border-purple-500/40 space-y-2">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-300">Confirmação obrigatória</p>
            <ul className="text-[9px] text-slate-400 mt-1 space-y-0.5 list-disc list-inside">
              <li>Normaliza telefones e preenche campos padrão vazios</li>
              <li>Detecta duplicatas e envia para revisão humana</li>
              <li><span className="text-emerald-400">NÃO apaga clientes</span></li>
              <li><span className="text-emerald-400">NÃO arquiva duplicatas sem aprovação</span></li>
              <li>Tudo é registrado em log de auditoria</li>
            </ul>
          </div>
          <button onClick={() => { setStatus('idle'); setConfirmInput(''); }} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-500">Para executar, digite exatamente: <span className="font-mono text-purple-400">{CONFIRM_TEXT}</span></p>
        <input
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={CONFIRM_TEXT}
          className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500/60"
        />
        <button
          onClick={executarLimpeza}
          disabled={!ok}
          className={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
            ok ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Executar auditoria segura
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStatus('confirm')}
      className="w-full rounded-xl p-3 bg-[#0f0f11] border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
        <div className="text-left">
          <p className="text-xs font-black text-purple-400 group-hover:text-purple-300">🧹 Limpar Base de Dados (Modo Seguro)</p>
          <p className="text-[9px] text-slate-500">Normalizar · Detectar duplicatas · Revisão humana · Sem apagar</p>
        </div>
      </div>
      <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">Revisar</span>
    </button>
  );
}