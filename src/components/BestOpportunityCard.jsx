import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, MapPin, Calendar, ChevronRight, Zap } from 'lucide-react';

export default function BestOpportunityCard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['best-opp-clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 50),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['best-opp-analysis', clients[0]?.id],
    queryFn: async () => {
      if (!clients[0]) return null;
      const res = await base44.functions.invoke('analyzeSeamatyOpportunity', {
        client_id: clients[0].id,
      });
      return { ...res.data, client_id: clients[0].id };
    },
    enabled: !!clients[0],
  });

  if (!analysis || isLoading) return null;

  return (
    <Link to={`/ClientProfile?id=${analysis.client_id}`}>
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,68,68,0.08)', border: '2px solid rgba(255,68,68,0.3)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">🎯 Melhor Oportunidade</p>
            <p className="text-sm font-black text-white mt-1">{analysis.clinic_name}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{analysis.city}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-red-400">{analysis.score}</p>
            <p className="text-[10px] text-slate-500">Score</p>
          </div>
        </div>

        <div className="rounded-xl p-2.5 mb-3" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <p className="text-[10px] text-slate-400">Equipamento:</p>
          <p className="text-sm font-black text-green-400">{analysis.recommended_equipment}</p>
          <p className="text-[10px] text-slate-500 mt-1">{analysis.reason}</p>
        </div>

        {analysis.insights && analysis.insights.length > 0 && (
          <div className="text-[10px] text-slate-400 mb-2">
            <p className="text-[9px] font-bold text-slate-500 mb-1">Contexto:</p>
            <p>{analysis.insights[0]}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={e => {
            e.preventDefault();
            const phone = clients[0]?.phone?.replace(/\D/g, '');
            if (phone) window.open(`https://wa.me/${phone}`, '_blank');
          }}
            className="py-2 px-2 rounded-lg text-center text-[11px] font-black flex flex-col items-center gap-1"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button onClick={e => {
            e.preventDefault();
            window.open(`/SmartRouteOptimizer?city=${encodeURIComponent(analysis.city)}`, '_blank');
          }}
            className="py-2 px-2 rounded-lg text-center text-[11px] font-black flex flex-col items-center gap-1"
            style={{ background: 'rgba(0,191,255,0.15)', color: '#00bfff' }}>
            <MapPin className="w-3.5 h-3.5" />
            Rota
          </button>
          <Link to={`/ScheduledAgenda?client_id=${analysis.client_id}`}>
            <div className="py-2 px-2 rounded-lg text-center text-[11px] font-black flex flex-col items-center gap-1"
              style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500' }}>
              <Calendar className="w-3.5 h-3.5" />
              Visita
            </div>
          </Link>
        </div>

        <p className="text-[10px] text-slate-500">Próxima ação: {analysis.next_action}</p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-600">Toque para abrir cliente</span>
          <ChevronRight className="w-3.5 h-3.5 text-red-600" />
        </div>
      </div>
    </Link>
  );
}