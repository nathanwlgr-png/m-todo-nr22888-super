import React, { useMemo, useState } from 'react';
import { Brain, CalendarDays, Clipboard, Flame, ShieldCheck, Target, Zap } from 'lucide-react';
import { buildConsultativeApproach } from '@/lib/seamatyConsultativeSales';

const InfoBox = ({ label, value, tone = 'slate' }) => {
  const colors = {
    orange: 'border-orange-500/25 bg-orange-500/8 text-orange-200',
    green: 'border-green-500/25 bg-green-500/8 text-green-200',
    purple: 'border-purple-500/25 bg-purple-500/8 text-purple-200',
    blue: 'border-blue-500/25 bg-blue-500/8 text-blue-200',
    slate: 'border-white/10 bg-white/5 text-slate-200',
  };
  return (
    <div className={`rounded-2xl p-3 border ${colors[tone]}`}>
      <p className="text-[9px] uppercase tracking-widest font-black opacity-70 mb-1">{label}</p>
      <p className="text-xs md:text-sm font-bold leading-relaxed whitespace-pre-wrap">{value || 'base ainda não alimentada'}</p>
    </div>
  );
};

export default function AbordagemInteligente({ client }) {
  const approach = useMemo(() => buildConsultativeApproach(client), [client]);
  const [draft, setDraft] = useState(approach.openingPhrase);

  return (
    <section className="rounded-2xl p-4 space-y-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.22)' }}>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-orange-500/12 border border-orange-500/25 flex items-center justify-center">
          <Brain className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Abordagem Inteligente</p>
          <p className="text-[11px] text-slate-500">Camada consultiva SEAMATY — visual, sem salvar e sem envio automático</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <InfoBox label="Número numerológico" value={approach.numerologyText} tone="purple" />
        <InfoBox label="Melhores dias de venda" value={approach.bestDaysText} tone="blue" />
        <InfoBox label="Dica numerológica" value={approach.numerologyTip} tone="purple" />
        <InfoBox label="Estilo de decisão" value={approach.decisionStyle} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <InfoBox label="Status comercial" value={approach.status} tone="orange" />
        <InfoBox label="Pipeline" value={approach.pipeline} tone="orange" />
        <InfoBox label="Score" value={String(approach.score || 0)} tone="green" />
        <InfoBox label="Equipamento" value={approach.equipmentInterest} tone="blue" />
      </div>

      <InfoBox label="Próxima ação existente" value={approach.nextAction} tone="green" />

      <div className="grid md:grid-cols-3 gap-2">
        <div className="rounded-2xl p-3 border border-orange-500/25 bg-orange-500/8">
          <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-orange-300" /><p className="text-[9px] uppercase tracking-widest font-black text-orange-300">Técnica recomendada</p></div>
          <p className="text-sm font-black text-white">{approach.technique}</p>
          <p className="text-[11px] text-slate-400 mt-1">{approach.techniqueReason}</p>
        </div>
        <div className="rounded-2xl p-3 border border-green-500/25 bg-green-500/8">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-green-300" /><p className="text-[9px] uppercase tracking-widest font-black text-green-300">Gatilho ético sugerido</p></div>
          <p className="text-sm font-black text-white">{approach.ethicalTrigger}</p>
          <p className="text-[11px] text-slate-400 mt-1">Sem pressão falsa, sem dado inventado.</p>
        </div>
        <div className="rounded-2xl p-3 border border-red-500/25 bg-red-500/8">
          <div className="flex items-center gap-2 mb-1"><Flame className="w-4 h-4 text-red-300" /><p className="text-[9px] uppercase tracking-widest font-black text-red-300">Objeção provável</p></div>
          <p className="text-sm font-black text-white">{approach.likelyObjection}</p>
        </div>
      </div>

      <div className="rounded-2xl p-3 border border-blue-500/25 bg-blue-500/8">
        <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-blue-300" /><p className="text-[9px] uppercase tracking-widest font-black text-blue-300">Frase de abertura sugerida</p></div>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} className="w-full rounded-xl p-3 text-sm text-slate-100 bg-black/35 border border-white/10 focus:outline-none focus:border-blue-400/50" />
        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><CalendarDays className="w-3 h-3" />Texto editável localmente. Não salva no banco e não envia automaticamente.</p>
      </div>
    </section>
  );
}