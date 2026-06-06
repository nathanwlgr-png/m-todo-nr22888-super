import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';

export default function SeamatyOpportunityCard({ clientId }) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['seamaty-opp', clientId],
    queryFn: () => base44.functions.invoke('analyzeSeamatyOpportunity', { client_id: clientId }),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading || !analysis?.data) return null;

  const opp = analysis.data;

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">🎯 OPORTUNIDADE SEAMATY</p>

      {/* Score e Equipamento */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)' }}>
          <p className="text-[10px] text-slate-400">Score Compra</p>
          <p className="text-lg font-black text-red-400">{opp.score}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <p className="text-[10px] text-slate-400">Equipamento</p>
          <p className="text-lg font-black text-green-400">{opp.recommended_equipment}</p>
        </div>
      </div>

      {/* Potenciais */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2.5 text-center" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            <p className="text-[10px] text-slate-500">Potencial</p>
          </div>
          <p className="text-sm font-black text-orange-400">R$ {(opp.financial_potential || 0).toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <p className="text-[10px] text-slate-500">Recorrência</p>
          </div>
          <p className="text-sm font-black text-green-400">{Math.round(opp.recurrence_potential || 0)}%</p>
        </div>
      </div>

      {/* Temperatura */}
      <div className="rounded-xl p-3 mb-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <p className="text-[10px] font-bold text-slate-400">Temperatura do Lead</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
            <div className="h-1.5 rounded-full transition-all" 
              style={{ 
                width: `${opp.lead_temperature || 0}%`,
                background: opp.lead_temperature > 70 ? '#ff4444' : opp.lead_temperature > 40 ? '#ff9500' : '#64748b'
              }} />
          </div>
          <span className="text-[10px] font-black w-8 text-right">{Math.round(opp.lead_temperature || 0)}%</span>
        </div>
      </div>

      {/* Motivos */}
      {opp.insights && opp.insights.length > 0 && (
        <div className="text-[11px] space-y-1 p-2.5 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(168,85,247,0.2)' }}>
          <p className="text-[9px] font-bold text-purple-400 mb-1.5">Motivos da Recomendação:</p>
          {opp.insights.map((insight, i) => (
            <p key={i} className="text-slate-400">✓ {insight}</p>
          ))}
        </div>
      )}
    </div>
  );
}