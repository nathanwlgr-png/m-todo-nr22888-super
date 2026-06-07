import React from 'react';
import { AlertCircle, TrendingUp, Users, Zap, CheckCircle2 } from 'lucide-react';

export default function Score4x4Display({ score, isLoading = false }) {
  if (isLoading || !score) {
    return (
      <div className="rounded-xl p-4 bg-slate-900 border border-slate-700 animate-pulse h-40" />
    );
  }

  const { totalScore, maxScore, percentage, dimensions, category, categoryColor, nextAction, breakdown } = score;

  const getDimensionIcon = (dim) => {
    const icons = {
      potential: <TrendingUp className="w-4 h-4" />,
      moment: <Zap className="w-4 h-4" />,
      relationship: <Users className="w-4 h-4" />,
      execution: <CheckCircle2 className="w-4 h-4" />
    };
    return icons[dim] || null;
  };

  const getDimensionLabel = (dim) => {
    const labels = {
      potential: 'Potencial',
      moment: 'Momento',
      relationship: 'Relacionamento',
      execution: 'Execução'
    };
    return labels[dim] || dim;
  };

  return (
    <div className="rounded-2xl p-4 bg-slate-950 border-2 shadow-xl space-y-4" style={{ borderColor: categoryColor + '60' }}>
      {/* Cabeçalho com score total */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">🎯 Motor 4x4</p>
          <p className="text-3xl font-black" style={{ color: categoryColor }}>
            {totalScore}/{maxScore}
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-slate-200">{percentage}%</p>
          <p className="text-xs font-bold mt-1 px-3 py-1 rounded-full text-white" style={{ backgroundColor: categoryColor }}>
            {category}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: categoryColor
          }}
        />
      </div>

      {/* Dimensões 4x4 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(dimensions).map(([key, value]) => (
          <div key={key} className="p-2 rounded-lg bg-slate-900 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              {getDimensionIcon(key)}
              <span className="text-xs font-bold text-slate-400">{getDimensionLabel(key)}</span>
            </div>
            <p className="text-lg font-black text-slate-100">{value}/40</p>
          </div>
        ))}
      </div>

      {/* Próxima Ação */}
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: categoryColor }} />
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 mb-1">Próxima Ação</p>
          <p className="text-sm font-bold text-slate-200">{nextAction}</p>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="text-xs space-y-1 p-2 bg-slate-900/30 rounded-lg border border-slate-700">
        {Object.entries(breakdown).map(([key, value]) => (
          <p key={key} className="text-slate-400">
            <span className="font-bold text-slate-300">{key.replace('Note', '')}:</span> {value}
          </p>
        ))}
      </div>
    </div>
  );
}