import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radar, ChevronRight, Flame, ShieldAlert } from 'lucide-react';

// Widget compacto SAFE — resumo do monitoramento de concorrência no DashboardSniper.
export default function RadarConcorrenciaWidget() {
  const { data: comps = [] } = useQuery({
    queryKey: ['competitor-tracker-widget'],
    queryFn: () => base44.entities.CompetitorTracker.filter({ ativo: true }, '-ultima_investigacao', 50).catch(() => []),
    staleTime: 60000,
  });

  const quentes = comps.filter(c => c.status_monitoramento === 'oportunidade_quente');
  const criticos = comps.filter(c => c.nivel_ameaca === 'critico' || c.nivel_ameaca === 'alto');

  return (
    <Link to="/PainelConcorrencia">
      <div className="rounded-2xl p-4 bg-[#0f0f11] border border-red-500/25 shadow-lg hover:border-red-500/45 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-red-400" />
            <span className="text-sm font-black text-red-300 uppercase tracking-widest">Radar Concorrência</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </div>

        {comps.length === 0 ? (
          <p className="text-xs text-slate-400">Toque para cadastrar e investigar concorrentes (Idexx, Heska, Zoetis, Biocom, Biobrasil…) por Instagram, site, Google e CNPJ.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2 bg-white/5 text-center">
              <p className="text-lg font-black text-white">{comps.length}</p>
              <p className="text-[10px] text-slate-400">Monitorados</p>
            </div>
            <div className="rounded-xl p-2 bg-orange-500/10 text-center">
              <p className="text-lg font-black text-orange-300 flex items-center justify-center gap-1"><Flame className="w-3.5 h-3.5" />{quentes.length}</p>
              <p className="text-[10px] text-orange-300/80">Oportunidades</p>
            </div>
            <div className="rounded-xl p-2 bg-red-500/10 text-center">
              <p className="text-lg font-black text-red-300 flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{criticos.length}</p>
              <p className="text-[10px] text-red-300/80">Ameaça alta</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}