import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target, Phone, MapPin, TrendingUp, Zap, AlertTriangle,
  ChevronRight, RefreshCw, Filter, ArrowLeft, Star, Clock
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const PRIORITY_CONFIG = {
  urgente:   { label: 'URGENTE',   color: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/40',    glow: 'shadow-red-500/20'  },
  quente:    { label: 'QUENTE',    color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' },
  potencial: { label: 'POTENCIAL', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/20' },
  frio:      { label: 'FRIO',      color: 'bg-slate-500',  text: 'text-slate-400',  border: 'border-slate-500/40',  glow: 'shadow-slate-500/10' },
};

const ACTION_ICONS = {
  venda_equipamento: '🔬',
  follow_up:         '📞',
  reposicao_insumo:  '📦',
};

function ScoreBar({ score }) {
  const color = score >= 75 ? 'bg-red-500' : score >= 60 ? 'bg-orange-500' : score >= 40 ? 'bg-yellow-500' : 'bg-slate-500';
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ClientCard({ item, rank }) {
  const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.frio;
  const actionIcon = ACTION_ICONS[item.action_type] || '⚡';

  return (
    <Link to={`/ClientProfile?id=${item.id}`}>
      <div className={`rounded-xl p-3 bg-[#0f0f11] border ${cfg.border} shadow-lg ${cfg.glow} hover:scale-[1.01] transition-transform`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Rank badge */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
              ${rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-slate-400 text-black' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">{item.city}</span>
                <Clock className="w-3 h-3 text-slate-500 flex-shrink-0 ml-1" />
                <span className="text-[10px] text-slate-400">{item.last_contact}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <span className={`text-lg font-black ${cfg.text}`}>{item.score}</span>
            <span className={`text-[9px] block ${cfg.text}`}>pts</span>
          </div>
        </div>

        <ScoreBar score={item.score} />

        {/* Action + KPIs */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base">{actionIcon}</span>
            <span className="text-[10px] text-slate-300 truncate">{item.action_description}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cfg.color} text-white`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {item.potential_value > 0 && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">💰 Potencial</span>
            <span className="text-[10px] font-black text-emerald-400">
              R$ {(item.potential_value / 1000).toFixed(0)}k
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function RankingOportunidades() {
  const [filter, setFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['ranking-clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 150),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['ranking-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100),
    staleTime: 120000,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['ranking-consumables'],
    queryFn: () => base44.entities.ConsumableOrder.filter({ status: 'ativo' }),
    staleTime: 120000,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['ranking-leads'],
    queryFn: () => base44.entities.Lead.filter({ stage: 'qualificado' }),
    staleTime: 120000,
  });

  const { data: rankingData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ranking-dia', clients.length, sales.length],
    queryFn: async () => {
      if (clients.length === 0) return null;
      const res = await base44.functions.invoke('calculateRankingDoDia', {
        clients,
        sales,
        leads,
        consumables,
      });
      return res.data;
    },
    enabled: clients.length > 0,
    staleTime: 300000,
  });

  const priorities = rankingData?.priorities || [];
  const summary = rankingData?.summary || {};
  const insights = rankingData?.insights || [];

  const filtered = filter === 'all' ? priorities : priorities.filter(p => p.priority === filter);

  const totalPotential = priorities.reduce((a, c) => a + (c.potential_value || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24 flex flex-col items-center p-3">
      <div className="w-full max-w-xl space-y-3">

        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-[#0f0f11] border border-orange-500/25">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-black text-orange-400 flex items-center justify-center gap-2">
              <Target className="w-5 h-5" /> Ranking do Dia
            </h1>
            <p className="text-[10px] text-orange-500 font-bold tracking-widest uppercase">Top Oportunidades Comerciais</p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="text-slate-400 hover:text-white h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { key: 'urgente',   label: 'Urgente',   icon: '🔴', color: 'border-red-500/30',    text: 'text-red-400'    },
            { key: 'quente',    label: 'Quente',    icon: '🟠', color: 'border-orange-500/30', text: 'text-orange-400' },
            { key: 'potencial', label: 'Potencial', icon: '🟡', color: 'border-yellow-500/30', text: 'text-yellow-400' },
            { key: 'insumos',   label: 'Insumos',   icon: '📦', color: 'border-cyan-500/30',   text: 'text-cyan-400'   },
          ].map(({ key, label, icon, color, text }) => (
            <div key={key} className={`rounded-xl p-2 bg-[#0f0f11] border ${color} text-center`}>
              <p className="text-base">{icon}</p>
              <p className={`text-lg font-black ${text}`}>
                {key === 'insumos' ? (summary.consumables || 0) : (summary[key] || 0)}
              </p>
              <p className="text-[9px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Potencial total */}
        {totalPotential > 0 && (
          <div className="rounded-xl p-3 bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-emerald-300">Potencial TOP 10</span>
            </div>
            <span className="text-base font-black text-emerald-400">
              R$ {(totalPotential / 1000).toFixed(0)}k
            </span>
          </div>
        )}

        {/* Insights IA */}
        {insights.length > 0 && (
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-purple-500/30 space-y-1">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">🧠 Insights do Dia</p>
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-200">{ins}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all', 'urgente', 'quente', 'potencial', 'frio'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all flex-shrink-0
                ${filter === f ? 'bg-orange-500 text-white' : 'bg-[#0f0f11] border border-slate-700 text-slate-400 hover:border-orange-500/50'}`}
            >
              {f === 'all' ? '🏆 Todos' : f === 'urgente' ? '🔴 Urgente' : f === 'quente' ? '🟠 Quente' : f === 'potencial' ? '🟡 Potencial' : '❄️ Frio'}
            </button>
          ))}
        </div>

        {/* Lista de clientes */}
        {isLoading || isFetching ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-24 rounded-xl animate-pulse bg-[#0f0f11]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl p-8 bg-[#0f0f11] border border-slate-800 text-center">
            <Target className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nenhuma oportunidade encontrada</p>
            <p className="text-slate-600 text-xs mt-1">Adicione clientes para gerar o ranking</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, idx) => (
              <ClientCard key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        )}

        {/* CTA Ação */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('Clients')}>
            <div className="rounded-xl p-3 bg-[#0f0f11] border border-emerald-500/30 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-emerald-400">Ver Clientes</span>
            </div>
          </Link>
          <Link to={createPageUrl('GenerateWhatsAppIntegrated')}>
            <div className="rounded-xl p-3 bg-[#0f0f11] border border-purple-500/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black text-purple-400">Gerar SPIN</span>
            </div>
          </Link>
        </div>

        {rankingData?.generated_at && (
          <p className="text-center text-[9px] text-slate-700">
            Gerado em {new Date(rankingData.generated_at).toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
}