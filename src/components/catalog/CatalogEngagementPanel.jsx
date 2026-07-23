import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Eye, Clock, Download, FileText, Flame, ChevronDown, ChevronUp, Search, Loader2, Inbox
} from 'lucide-react';

const INTEREST = {
  muito_alto: { label: 'Muito alto', color: 'bg-red-100 text-red-700 border-red-200', order: 5 },
  alto: { label: 'Alto', color: 'bg-orange-100 text-orange-700 border-orange-200', order: 4 },
  medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', order: 3 },
  baixo: { label: 'Baixo', color: 'bg-slate-100 text-slate-600 border-slate-200', order: 2 },
  nenhum: { label: 'Sem interesse', color: 'bg-slate-100 text-slate-400 border-slate-200', order: 1 },
};

function fmtTime(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function CatalogEngagementPanel() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['catalog-engagements'],
    queryFn: () => base44.entities.DocumentEngagement.list('-last_viewed_at', 500).catch(() => []),
  });

  // Agrupar por cliente
  const groups = useMemo(() => {
    const map = {};
    engagements.forEach(e => {
      const key = e.client_id || e.client_name || 'sem_cliente';
      if (!map[key]) {
        map[key] = {
          client_id: e.client_id,
          client_name: e.client_name || 'Cliente não identificado',
          docs: [],
          total_views: 0,
          total_time: 0,
          downloads: 0,
          top_interest: 0,
          last_viewed: null,
        };
      }
      const g = map[key];
      g.docs.push(e);
      g.total_views += e.views_count || 0;
      g.total_time += e.time_spent_seconds || 0;
      if (e.downloaded) g.downloads += 1;
      const io = INTEREST[e.interest_level]?.order || 0;
      if (io > g.top_interest) g.top_interest = io;
      if (e.last_viewed_at && (!g.last_viewed || new Date(e.last_viewed_at) > new Date(g.last_viewed))) {
        g.last_viewed = e.last_viewed_at;
      }
    });

    let arr = Object.values(map);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(g => g.client_name.toLowerCase().includes(q));
    }
    // Ordenar por maior engajamento (interesse, depois views)
    return arr.sort((a, b) => (b.top_interest - a.top_interest) || (b.total_views - a.total_views));
  }, [engagements, search]);

  const totals = useMemo(() => ({
    clients: groups.length,
    views: engagements.reduce((s, e) => s + (e.views_count || 0), 0),
    downloads: engagements.filter(e => e.downloaded).length,
    hot: engagements.filter(e => ['muito_alto', 'alto'].includes(e.interest_level)).length,
  }), [groups, engagements]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="w-4 h-4" />} label="Clientes" value={totals.clients} color="text-slate-700" />
        <StatCard icon={<Eye className="w-4 h-4" />} label="Aberturas" value={totals.views} color="text-blue-600" />
        <StatCard icon={<Download className="w-4 h-4" />} label="Downloads" value={totals.downloads} color="text-green-600" />
        <StatCard icon={<Flame className="w-4 h-4" />} label="Sinais quentes" value={totals.hot} color="text-red-600" />
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Inbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum catálogo rastreado ainda.</p>
            <p className="text-xs mt-1">Envie um catálogo por WhatsApp com link rastreável para começar a medir o interesse.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const key = g.client_id || g.client_name;
            const isOpen = expanded[key];
            const interestBadge = Object.values(INTEREST).find(i => i.order === g.top_interest);
            return (
              <Card key={key} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                  className="w-full text-left"
                >
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate flex items-center gap-2">
                          {g.client_name}
                          {interestBadge && g.top_interest >= 4 && (
                            <Badge className={`text-xs border ${interestBadge.color}`}>
                              <Flame className="w-3 h-3 mr-0.5" /> {interestBadge.label}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {g.docs.length} catálogo(s)</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {g.total_views} aberturas</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(g.total_time)}</span>
                          {g.downloads > 0 && <span className="flex items-center gap-1 text-green-600"><Download className="w-3 h-3" /> {g.downloads}</span>}
                          <span>· Última: {fmtDate(g.last_viewed)}</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </div>
                  </CardHeader>
                </button>

                {isOpen && (
                  <CardContent className="pt-0 space-y-2">
                    {g.docs.sort((a, b) => new Date(b.last_viewed_at || 0) - new Date(a.last_viewed_at || 0)).map(d => {
                      const ib = INTEREST[d.interest_level];
                      return (
                        <div key={d.id} className="flex items-start justify-between gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.document_title || 'Documento'}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {d.views_count || 0}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(d.time_spent_seconds)}</span>
                              {d.downloaded && <span className="flex items-center gap-1 text-green-600"><Download className="w-3 h-3" /> baixado</span>}
                              {d.sent_via && <span>via {d.sent_via}</span>}
                              <span>· {fmtDate(d.last_viewed_at)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {ib && <Badge className={`text-xs border ${ib.color}`}>{ib.label}</Badge>}
                            {typeof d.engagement_score === 'number' && (
                              <span className="text-xs font-mono text-slate-400">{d.engagement_score}pts</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`flex items-center gap-1.5 ${color}`}>{icon}<span className="text-xs text-slate-500">{label}</span></div>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}