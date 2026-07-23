import React, { useState } from 'react';

const SEGMENTS = ['VIP', 'Champions', 'Potential', 'Nurture', 'At Risk', 'Cold', 'Dormant'];

export default function SentimentActions({ selected, currentSegment, saving, onAddNote, onUpdateSegment }) {
  const [note, setNote] = useState('');
  const [segment, setSegment] = useState(currentSegment || 'Nurture');
  if (!selected?.sentiment) return <p className="text-[10px] text-slate-500">Selecione uma conversa analisada para registrar uma ação contextual.</p>;
  return <div className="space-y-2 pt-3 border-t border-slate-800">
    <p className="text-[10px] font-black text-orange-400 uppercase">Agir com base no sentimento</p>
    <textarea value={note} onChange={event => setNote(event.target.value)} rows={2} placeholder="Ex.: Cliente demonstrou preocupação com prazo; retomar com cronograma." className="w-full rounded-xl p-2.5 text-xs text-slate-300 bg-slate-900 border border-slate-700" />
    <button onClick={() => onAddNote(note, selected.sentiment).then(() => setNote(''))} disabled={!note.trim() || saving} className="w-full py-2 rounded-xl text-xs font-black text-blue-400 border border-blue-500/30 disabled:opacity-50">Salvar nota contextual</button>
    <div className="flex gap-2">
      <select value={segment} onChange={event => setSegment(event.target.value)} className="flex-1 rounded-xl px-2 text-xs text-slate-300 bg-slate-900 border border-slate-700">
        {SEGMENTS.map(item => <option key={item}>{item}</option>)}
      </select>
      <button onClick={() => onUpdateSegment(segment)} disabled={saving} className="px-3 py-2 rounded-xl text-xs font-black text-green-400 border border-green-500/30 disabled:opacity-50">Atualizar segmento</button>
    </div>
  </div>;
}