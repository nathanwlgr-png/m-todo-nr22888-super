import React from 'react';
import { TrendingDown, Clock, Fuel, MapPin, CheckCircle } from 'lucide-react';

export default function RouteStats({ stats }) {
  if (!stats) return null;

  const distanceValue = Number(stats.estimated_km);
  const hasDistance = Number.isFinite(distanceValue) && distanceValue > 0;

  const items = [
    {
      icon: MapPin,
      label: 'Distância est.',
      value: hasDistance ? `~${distanceValue} km` : 'distância não calculada',
      color: '#ff9500',
    },
    {
      icon: TrendingDown,
      label: 'Km economizados',
      value: hasDistance ? `${stats.estimated_km_saved || 0} km` : 'não calculada',
      color: '#00ff88',
    },
    {
      icon: Fuel,
      label: 'Combustível poupado',
      value: hasDistance ? `~${(stats.estimated_fuel_saved_liters || 0).toFixed(1)}L` : 'não calculada',
      color: '#00bfff',
    },
    {
      icon: Clock,
      label: 'Tempo no trânsito',
      value: hasDistance ? `~${stats.total_drive_minutes || 0} min` : 'não calculada',
      color: '#ff6b00',
    },
  ];

  return (
    <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
      <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-3">📊 Economia da Rota</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center"
            style={{ background: '#1a1a1a', border: `1px solid ${color}33` }}>
            <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
            <p className="text-sm font-black" style={{ color }}>{value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {stats.route_summary && (
        <div className="rounded-xl p-2.5 flex items-start gap-2"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-xs text-green-300">{stats.route_summary}</p>
        </div>
      )}
    </div>
  );
}