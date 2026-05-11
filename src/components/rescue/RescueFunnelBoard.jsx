import React from 'react';
import { Clock, MessageSquare, CheckCircle, Calendar, TrendingUp, XCircle, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'pendente', label: 'Pendente', icon: Clock, color: '#888' },
  { key: 'mensagem_enviada', label: 'Msg Enviada', icon: MessageSquare, color: '#00bfff' },
  { key: 'resposta_recebida', label: 'Respondeu', icon: CheckCircle, color: '#00ff88' },
  { key: 'agendado', label: 'Agendado', icon: Calendar, color: '#ff9500' },
  { key: 'convertido', label: 'Convertido', icon: TrendingUp, color: '#00ff88' },
  { key: 'sem_resposta', label: 'Sem Resp.', icon: AlertCircle, color: '#ff4444' },
  { key: 'descartado', label: 'Descartado', icon: XCircle, color: '#444' },
];

export default function RescueFunnelBoard({ sequences, onSelect, selectedId }) {
  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = sequences.filter(seq => seq.funnel_status === s.key);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {STAGES.map(stage => {
          const Icon = stage.icon;
          const items = byStage[stage.key] || [];
          return (
            <div key={stage.key} className="w-44 shrink-0">
              {/* Column header */}
              <div className="rounded-t-xl px-3 py-2 flex items-center justify-between"
                style={{ background: `${stage.color}18`, border: `1px solid ${stage.color}33`, borderBottom: 'none' }}>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3" style={{ color: stage.color }} />
                  <span className="text-[10px] font-black" style={{ color: stage.color }}>{stage.label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-500">{items.length}</span>
              </div>

              {/* Cards */}
              <div className="rounded-b-xl p-2 min-h-[200px] space-y-2"
                style={{ background: '#0f0f0f', border: `1px solid ${stage.color}22`, borderTop: 'none' }}>
                {items.map(seq => (
                  <button key={seq.id} onClick={() => onSelect(seq)}
                    className="w-full text-left rounded-lg p-2 transition-all"
                    style={{
                      background: selectedId === seq.id ? `${stage.color}22` : '#1a1a1a',
                      border: `1px solid ${selectedId === seq.id ? stage.color : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <p className="text-[11px] font-black text-white truncate">{seq.client_name}</p>
                    {seq.inactive_days > 0 && (
                      <p className="text-[9px] text-slate-600 mt-0.5">{seq.inactive_days}d inativo</p>
                    )}
                    {seq.ai_score > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <div className="flex-1 h-1 rounded-full bg-slate-800">
                          <div className="h-1 rounded-full" style={{ width: `${seq.ai_score}%`, background: stage.color }} />
                        </div>
                        <span className="text-[9px]" style={{ color: stage.color }}>{seq.ai_score}</span>
                      </div>
                    )}
                  </button>
                ))}
                {items.length === 0 && (
                  <p className="text-[10px] text-slate-700 text-center pt-4">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}