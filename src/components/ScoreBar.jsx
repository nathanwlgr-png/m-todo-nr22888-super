import React from 'react';
import { Progress } from "@/components/ui/progress";

export default function ScoreBar({ score, label = "Score de Compra" }) {
  const getColor = (value) => {
    if (value >= 70) return 'bg-emerald-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-red-400';
  };

  const getLabel = (value) => {
    if (value >= 70) return 'Alta probabilidade';
    if (value >= 40) return 'Média probabilidade';
    return 'Baixa probabilidade';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-800">{score}%</span>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{getLabel(score)}</span>
    </div>
  );
}