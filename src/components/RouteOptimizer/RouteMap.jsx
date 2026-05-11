import React from 'react';
import { MapPin, Navigation, Clock, Star } from 'lucide-react';

const STATUS_COLORS = {
  quente: '#ff4444',
  morno: '#ff9500',
  frio: '#00bfff',
};

const VISIT_TYPE_LABEL = {
  primeira_visita: '1ª Visita',
  demonstracao: 'Demo',
  followup: 'Follow-up',
  fechamento: 'Fechamento',
};

export default function RouteMap({ route, startLocation }) {
  if (!route || route.length === 0) {
    return (
      <div className="rounded-2xl flex flex-col items-center justify-center py-16"
        style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
        <Navigation className="w-10 h-10 text-orange-800 mb-3" />
        <p className="text-sm text-slate-600">Nenhuma rota para exibir</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
      {/* Mapa visual estilizado (sem dependência de API externa) */}
      <div className="relative p-4" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)', minHeight: 200 }}>
        {/* Grid de fundo estilo mapa */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,107,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        {/* Header do mapa */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Rota Otimizada — {route.length} paradas</p>
          </div>
          <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Linha da rota visual */}
        <div className="relative z-10">
          {/* Ponto de partida */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                style={{ background: 'rgba(0,255,136,0.2)', border: '2px solid #00ff88', color: '#00ff88' }}>
                🏠
              </div>
              <div className="w-0.5 h-4 mt-1" style={{ background: 'rgba(255,107,0,0.3)' }} />
            </div>
            <div className="pt-1">
              <p className="text-xs font-black text-green-400">Partida</p>
              <p className="text-[10px] text-slate-500">{startLocation || 'Ponto de origem'}</p>
            </div>
          </div>

          {/* Paradas */}
          {route.map((stop, idx) => {
            const isLast = idx === route.length - 1;
            const statusColor = STATUS_COLORS[stop.client_status] || '#888';
            return (
              <div key={stop.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                    style={{ background: `${statusColor}22`, border: `2px solid ${statusColor}`, color: statusColor }}>
                    {stop.optimized_position}
                  </div>
                  {!isLast && <div className="w-0.5 h-6 mt-1" style={{ background: 'rgba(255,107,0,0.25)' }} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${statusColor}33` }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-black text-white truncate">{stop.client_name}</p>
                      {stop.suggested_time && (
                        <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />{stop.suggested_time}
                        </span>
                      )}
                    </div>
                    {stop.clinic_name && (
                      <p className="text-[10px] text-slate-500 truncate">{stop.clinic_name}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {stop.location && (
                        <p className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />{stop.location}
                        </p>
                      )}
                      {stop.visit_type && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(255,107,0,0.15)', color: '#ff9500' }}>
                          {VISIT_TYPE_LABEL[stop.visit_type] || stop.visit_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ponto final */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
              style={{ background: 'rgba(0,191,255,0.2)', border: '2px solid #00bfff', color: '#00bfff' }}>
              🏁
            </div>
            <div className="pt-1">
              <p className="text-xs font-black text-blue-400">Retorno</p>
              <p className="text-[10px] text-slate-500">{startLocation || 'Base'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}