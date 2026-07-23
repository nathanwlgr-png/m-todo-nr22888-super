import React from 'react';

const outcomes = [
  { value: 'Visita positiva', label: 'Positiva', color: '#22c55e' },
  { value: 'Visita neutra', label: 'Neutra', color: '#60a5fa' },
  { value: 'Cliente ausente ou sem contato', label: 'Sem contato', color: '#f59e0b' },
];

export default function VisitOutcomeActions({ disabled, completed, onComplete }) {
  if (completed) {
    return <div className="mt-2 py-3 rounded-xl text-center text-sm font-black text-green-400 border border-green-500/40 bg-green-500/10">Visita concluída</div>;
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-slate-400 mb-2">Concluir visita com resultado:</p>
      <div className="grid grid-cols-3 gap-2">
        {outcomes.map(outcome => (
          <button
            key={outcome.value}
            disabled={disabled}
            onClick={() => onComplete(outcome.value)}
            className="min-h-12 rounded-xl text-xs font-black disabled:opacity-50"
            style={{ background: `${outcome.color}18`, border: `1px solid ${outcome.color}66`, color: outcome.color }}
          >
            {outcome.label}
          </button>
        ))}
      </div>
    </div>
  );
}