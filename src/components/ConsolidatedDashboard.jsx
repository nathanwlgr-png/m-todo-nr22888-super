import * as React from 'react';
const { useState, useMemo } = React;
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const REPRESENTANTES = ['Todos', 'Nathan', 'Luan', 'Gabriel', 'Rosa'];
const PERIODOS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const META_MENSAL = 210000;

export default function ConsolidatedDashboard() {
  const [periodo, setPeriodo] = useState(6);
  const [vendedor, setVendedor] = useState('Todos');
  const [expanded, setExpanded] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['dash-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['dash-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 200),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['dash-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200),
    staleTime: 120000,
  });

  // Gera os meses do período
  const months = useMemo(() => {
    return Array.from({ length: periodo }, (_, i) => {
      const d = subMonths(new Date(), periodo - 1 - i);
      return {
        key: format(d, 'yyyy-MM'),
        label: format(d, 'MMM/yy', { locale: ptBR }),
        start: startOfMonth(d),
        end: endOfMonth(d),
      };
    });
  }, [periodo]);

  // Leads convertidos por mês
  const leadsConvertidosData = useMemo(() => {
    return months.map(m => {
      const converted = clients.filter(c => {
        const d = parseISO(c.created_date || '2000-01-01');
        const byRep = vendedor === 'Todos' || c.representante === vendedor;
        return byRep && isWithinInterval(d, { start: m.start, end: m.end }) && c.pipeline_stage !== 'perdido';
      }).length;
      return { mes: m.label, convertidos: converted };
    });
  }, [clients, months, vendedor]);

  // Receita prevista vs realizada por mês
  const receitaData = useMemo(() => {
    return months.map(m => {
      const salesMonth = sales.filter(s => {
        const d = parseISO(s.sale_date || s.created_date || '2000-01-01');
        const byRep = vendedor === 'Todos' || s.salesperson === vendedor;
        return byRep && isWithinInterval(d, { start: m.start, end: m.end });
      });
      const realizada = salesMonth
        .filter(s => ['fechada', 'entregue'].includes(s.status))
        .reduce((a, s) => a + (s.sale_value || 0), 0);
      const prevista = salesMonth
        .filter(s => s.status === 'proposta' || s.status === 'aguardando_assinatura')
        .reduce((a, s) => a + (s.sale_value || 0), 0);
      return {
        mes: m.label,
        realizada: Math.round(realizada / 1000),
        prevista: Math.round((realizada + prevista) / 1000),
        meta: Math.round(META_MENSAL / 1000),
      };
    });
  }, [sales, months, vendedor]);

  // Ocupação de visitas por mês
  const visitasData = useMemo(() => {
    return months.map(m => {
      const monthVisits = visits.filter(v => {
        const d = parseISO(v.scheduled_date || '2000-01-01');
        return isWithinInterval(d, { start: m.start, end: m.end });
      });
      const total = monthVisits.length;
      const realizadas = monthVisits.filter(v => v.status === 'realizada').length;
      const taxa = total > 0 ? Math.round((realizadas / total) * 100) : 0;
      return { mes: m.label, agendadas: total, realizadas, taxa };
    });
  }, [visits, months]);

  // Pipeline por estágio
  const pipelineData = useMemo(() => {
    const filtered = vendedor === 'Todos' ? clients : clients.filter(c => c.representante === vendedor);
    const stages = { lead: 0, qualificado: 0, proposta: 0, negociacao: 0, fechado: 0 };
    filtered.forEach(c => { if (stages[c.pipeline_stage] !== undefined) stages[c.pipeline_stage]++; });
    return Object.entries(stages).map(([stage, count]) => ({ stage, count }));
  }, [clients, vendedor]);

  // KPIs do período total
  const kpis = useMemo(() => {
    const filteredSales = vendedor === 'Todos' ? sales : sales.filter(s => s.salesperson === vendedor);
    const totalRealizada = filteredSales
      .filter(s => ['fechada', 'entregue'].includes(s.status))
      .reduce((a, s) => a + (s.sale_value || 0), 0);
    const totalVisitas = visits.length;
    const realizadas = visits.filter(v => v.status === 'realizada').length;
    const taxaGeral = totalVisitas > 0 ? Math.round((realizadas / totalVisitas) * 100) : 0;
    return { totalRealizada, taxaGeral, totalVisitas, realizadas };
  }, [sales, visits, vendedor]);

  return (
    <Card className="mb-4 border-indigo-200">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base text-indigo-800">Dashboard Consolidado</CardTitle>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Filtros:</span>
            </div>
            <Select value={String(periodo)} onValueChange={v => setPeriodo(Number(v))}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map(p => (
                  <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendedor} onValueChange={setVendedor}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPRESENTANTES.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Receita', value: `R$${(kpis.totalRealizada/1000).toFixed(0)}k`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Tx Visitas', value: `${kpis.taxaGeral}%`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Visitas', value: kpis.totalVisitas, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Realizadas', value: kpis.realizadas, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl p-2 text-center`}>
                <k.icon className={`w-4 h-4 ${k.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico 1: Leads Convertidos */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">📊 Leads Convertidos por Mês</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={leadsConvertidosData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="convertidos" fill="#6366f1" radius={[4, 4, 0, 0]} name="Convertidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico 2: Receita Prevista vs Realizada */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">💰 Receita (R$ mil) — Prevista vs Realizada vs Meta</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={receitaData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => `R$${v}k`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="realizada" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Realizada" />
                <Line type="monotone" dataKey="prevista" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Prevista" />
                <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Meta" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico 3: Taxa de Ocupação Visitas */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">📅 Ocupação de Visitas (%)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={visitasData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, name) => name === 'taxa' ? `${v}%` : v} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="agendadas" fill="#c7d2fe" radius={[2, 2, 0, 0]} name="Agendadas" />
                <Bar dataKey="realizadas" fill="#6366f1" radius={[2, 2, 0, 0]} name="Realizadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pipeline por Estágio */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">🔁 Pipeline por Estágio</p>
            <div className="flex gap-1">
              {pipelineData.map((s, i) => (
                <div key={s.stage} className="flex-1 text-center">
                  <div
                    className="rounded-lg py-2 text-white text-xs font-bold"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {s.count}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 capitalize">{s.stage}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}