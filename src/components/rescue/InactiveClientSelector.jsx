import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Clock, TrendingDown, Phone, ChevronRight, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  quente: '#ff4444', morno: '#ff9500', frio: '#00bfff'
};

export default function InactiveClientSelector({ clients, loading, onSelect, onRefresh, threshold, onThresholdChange }) {
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-8 h-9 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }} />
        </div>
        <select value={threshold} onChange={e => onThresholdChange(Number(e.target.value))}
          className="h-9 px-2 rounded-xl text-xs text-white focus:outline-none"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}>
          <option value={15}>+15 dias</option>
          <option value={30}>+30 dias</option>
          <option value={60}>+60 dias</option>
          <option value={90}>+90 dias</option>
        </select>
        <button onClick={onRefresh} className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}>
          <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-xs text-slate-600 mb-2">{filtered.length} clientes inativos</p>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map(c => (
          <button key={c.id} onClick={() => onSelect(c)}
            className="w-full text-left rounded-xl p-3 transition-all hover:opacity-80"
            style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.15)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-black text-white truncate">{c.name}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                    style={{ color: STATUS_COLORS[c.status] || '#888', background: `${STATUS_COLORS[c.status] || '#888'}22` }}>
                    {c.status}
                  </span>
                </div>
                {c.clinic_name && <p className="text-[10px] text-slate-500 truncate">{c.clinic_name}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-orange-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {c.inactive_days}d sem contato
                  </span>
                  {c.city && <span className="text-[10px] text-slate-600">{c.city}</span>}
                  {c.phone && <Phone className="w-2.5 h-2.5 text-green-500" />}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-700 shrink-0" />
            </div>
          </button>
        ))}
        {filtered.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-600 py-8">Nenhum cliente inativo encontrado</p>
        )}
      </div>
    </div>
  );
}