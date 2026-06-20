import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ListChecks } from 'lucide-react';

const PENDENCIAS = [
  { label: 'GPS físico em tablet/celular', tag: 'DISPOSITIVO REAL' },
  { label: '423 clientes sem coordenada validada', tag: 'APROVAÇÃO HUMANA' },
  { label: 'Geocode depende da Geocoding API (Google Cloud)', tag: 'CONFIG NATHAN' },
  { label: '29 produtos sem foto oficial', tag: 'UPLOAD MANUAL' },
  { label: 'Gmail / Drive / Docs / Instagram', tag: 'CONEXÃO MANUAL' },
  { label: 'Telegram bot — teste real', tag: 'DISPOSITIVO REAL' },
  { label: 'WhatsApp: status corrigido (aberto ≠ enviado)', tag: 'OK', done: true },
  { label: 'Geocode SAFE: nunca aplica coordenada direto', tag: 'OK', done: true },
  { label: 'Limpeza CRM blindada (sem arquivar sozinha)', tag: 'OK', done: true },
  { label: 'Automação de geocode pausada', tag: 'OK', done: true },
  { label: 'Limpeza automática agora roda só em auditoria', tag: 'OK', done: true },
  { label: 'RouteOptimizer corrigido (formato + sem coordenada)', tag: 'OK', done: true },
  { label: 'Radar competitivo não envia WhatsApp automático', tag: 'OK', done: true },
  { label: 'autoFixSystem não deleta (só dispensa, reversível)', tag: 'OK', done: true },
  { label: 'Agentes blindados em campos críticos', tag: 'OK', done: true },
];

export default function PendenciasPara100() {
  const [open, setOpen] = useState(false);
  const pend = PENDENCIAS.filter(p => !p.done).length;

  return (
    <div className="rounded-xl bg-[#0f0f11] border border-amber-500/30">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-400">Pendências para 100%</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">{pend} pendentes</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {PENDENCIAS.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
              <span className={p.done ? 'text-emerald-300' : 'text-slate-300'}>
                {p.done ? '✓ ' : '○ '}{p.label}
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                p.done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{p.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}