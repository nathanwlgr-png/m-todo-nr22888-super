import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function SaneamentoConversaoSeguro() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('prepararSaneamentoConversao', { limit: 50 });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="rounded-xl p-3 bg-[#0f0f11] border border-emerald-500/30 space-y-3">
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Botão Verde 100%</p>
          <p className="text-[11px] text-slate-400 leading-tight">Cria sugestões automáticas para telefone, próxima ação e produto — sempre em fila de aprovação.</p>
        </div>
      </div>

      <Button onClick={run} disabled={loading} className="w-full min-h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-black">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
        Preparar saneamento seguro
      </Button>

      {result?.success && (
        <div className="rounded-lg p-2 bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-200">
          <div className="flex items-center gap-1 font-black text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> {result.created} sugestões criadas</div>
          <p className="mt-1">Sem telefone: {result.gaps?.semTelefone || 0} · Sem próxima ação: {result.gaps?.semProximaAcao || 0} · Sem produto: {result.gaps?.semProduto || 0}</p>
          <p className="mt-1 text-emerald-400">Nenhum cliente foi alterado.</p>
        </div>
      )}
    </div>
  );
}