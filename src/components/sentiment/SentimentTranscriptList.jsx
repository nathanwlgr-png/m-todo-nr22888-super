import React from 'react';
import { Loader2, MessageSquare } from 'lucide-react';

const META = {
  positive: { label: 'Positivo', color: '#22c55e' },
  neutral: { label: 'Neutro', color: '#f59e0b' },
  negative: { label: 'Negativo', color: '#ef4444' },
};

export default function SentimentTranscriptList({ items, selected, loading, analyzing, onSelect, onAnalyze }) {
  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
  if (!items.length) return <p className="text-xs text-slate-500">Nenhuma conversa registrada para este cliente.</p>;
  return <div className="space-y-2">
    {items.map(item => {
      const meta = META[item.sentiment];
      return <article key={`${item.source}-${item.id}`} onClick={() => onSelect(item)} className="rounded-xl p-3 cursor-pointer" style={{ background: selected?.id === item.id ? '#1f1f1f' : '#181818', border: `1px solid ${meta?.color || '#333'}` }}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="flex items-center gap-1 text-[9px] text-slate-500"><MessageSquare className="w-3 h-3" />{item.direction === 'received' || item.direction === 'inbound' ? 'Cliente' : 'Representante'}</span>
          {meta ? <span className="text-[9px] font-black" style={{ color: meta.color }}>{meta.label}{item.sentiment_confidence ? ` · ${Math.round(item.sentiment_confidence)}%` : ''}</span> : <button onClick={event => { event.stopPropagation(); onAnalyze(item); }} disabled={analyzing === item.id} className="text-[9px] font-black text-purple-400 disabled:opacity-50">{analyzing === item.id ? 'Analisando...' : 'Analisar sentimento'}</button>}
        </div>
        <p className="text-xs text-slate-300 whitespace-pre-wrap">{item.text}</p>
      </article>;
    })}
  </div>;
}