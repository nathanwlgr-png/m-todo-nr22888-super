import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Beaker } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function BotaoMaquinaInsumos() {
  const qc = useQueryClient();
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const rodar = async () => {
    setRodando(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('motorRecompraInsumos', {});
      setResultado(res?.data?.rascunhos_criados ?? 0);
      qc.invalidateQueries({ queryKey: ['pending-messages'] });
    } catch (_e) {
      setResultado(0);
    } finally {
      setRodando(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={rodar}
        disabled={rodando}
        className="w-full rounded-xl p-3 bg-teal-500/10 border border-teal-500/30 flex items-center gap-2 text-left disabled:opacity-60"
      >
        {rodando
          ? <Loader2 className="w-4 h-4 text-teal-300 animate-spin" />
          : <Beaker className="w-4 h-4 text-teal-300" />}
        <div>
          <p className="text-xs font-black text-teal-300">🧪 Máquina de Insumos</p>
          <p className="text-[10px] text-slate-400">
            {rodando ? 'Detectando recompras…' : 'Preparar recompras de reagentes'}
          </p>
        </div>
      </button>
      {resultado !== null && (
        <div className="rounded-lg p-2 bg-teal-500/10 border border-teal-500/30 text-[11px] text-teal-200 text-center font-bold">
          {resultado > 0
            ? `🧪 ${resultado} recompra(s) prontas na Fila de Aprovação do WhatsApp.`
            : '✅ Nenhum cliente no ciclo de recompra agora.'}
        </div>
      )}
    </div>
  );
}