import React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Cores por temperatura/status
const getTempColor = (clinic, isActive) => {
  if (isActive) return { border: 'border-blue-600', badge: 'bg-blue-900 text-blue-200', dot: '🔵' };
  const s = (clinic.seamaty_priority || clinic.priority || '').toLowerCase();
  if (s === 'quente' || s === 'hot') return { border: 'border-green-600', badge: 'bg-green-900 text-green-200', dot: '🟢' };
  if (s === 'morno' || s === 'warm') return { border: 'border-yellow-600', badge: 'bg-yellow-900 text-yellow-200', dot: '🟡' };
  return { border: 'border-slate-700', badge: 'bg-slate-800 text-slate-400', dot: '🔴' };
};

export default function CacaClinicCard({ clinic, isActive, onRegister }) {
  const colors = getTempColor(clinic, isActive);

  return (
    <div className={`rounded-xl border bg-slate-900 p-3 flex items-start justify-between gap-3 ${colors.border}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm">{colors.dot}</span>
          <p className="font-bold text-orange-200 text-sm truncate">{clinic.name || 'Sem nome'}</p>
          {isActive && <Badge className="text-[9px] bg-blue-900 text-blue-200 px-1 py-0">CLIENTE</Badge>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-orange-600" />
          <p className="text-xs text-orange-600 truncate">
            {clinic.city || '—'}{clinic.distance != null ? ` • ${clinic.distance.toFixed(1)}km` : ''}
          </p>
        </div>
        {clinic.phone && <p className="text-xs text-slate-400 mt-0.5">📞 {clinic.phone}</p>}
        {clinic.segment && (
          <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-400">
            {clinic.segment}
          </span>
        )}
      </div>
      <Button
        size="sm"
        onClick={onRegister}
        className="bg-orange-600 hover:bg-orange-700 shrink-0 h-8 text-xs px-3"
      >
        <Plus className="w-3 h-3 mr-1" /> Cadastrar
      </Button>
    </div>
  );
}