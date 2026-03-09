import React, { useState, useMemo } from 'react';
// useState already imported above
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Brain, TrendingUp, Route, FileText, Clock, Target, Zap, Users } from 'lucide-react';

export default function IntelligenceDashboard() {
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedClient, setSelectedClient] = useState('all');

  const { data: sales = [] } = useQuery({ queryKey: ['sales-intel'], queryFn: () => base44.entities.Sale.list('-sale_date', 300) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients-intel'], queryFn: () => base44.entities.Client.list('-updated_date', 300) });
  const { data: routes = [] } = useQuery({ queryKey: ['routes-intel'], queryFn: () => base44.entities.OptimizedRoute.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-intel'], queryFn: () => base44.entities.Task.list('-created_date', 300) });
  const { data: interactions = [] } = useQuery({ queryKey: ['interactions-intel'], queryFn: () => base44.entities.Interaction.list('-created_date', 200) });

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(selectedPeriod));
    return d;
  }, [selectedPeriod]);

  const filteredSales = useMemo(() => sales.filter(s => {
    const dateOk = !s.sale_date || new Date(s.sale_date) >= cutoffDate;
    const spOk = selectedSalesperson === 'all' || s.salesperson === selectedSalesperson;
    const cOk = selectedClient === 'all' || s.client_id === selectedClient;
    return dateOk && spOk && cOk;
  }), [sales, cutoffDate, selectedSalesperson, selectedClient]);

  const filteredClients = useMemo(() => clients.filter(c =>
    selectedSalesperson === 'all' || c.representante === selectedSalesperson
  ), [clients, selectedSalesperson]);

  const salespersons = useMemo(() => [...new Set(clients.map(c => c.representante).filter(Boolean))], [clients]);

  // KPIs
  const closedSales = filteredSales.filter(s => s.status === 'fechada' || s.status === 'entregue');
  const conversionRate = filteredSales.length > 0 ? ((closedSales.length / filteredSales.length) * 100).toFixed(1) : 0;
  const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const proposalROI = (totalRevenue * 0.3).toFixed(0);
  const totalRouteKm = routes.reduce((sum, r) => sum + (r.route_data?.total_distance_km || 0), 0);
  const kmSaved = (totalRouteKm * 0.25).toFixed(0);
  const automatedTasks = tasks.filter(t => t.auto_created).length;
  const timeSaved = (automatedTasks * 0.5).toFixed(1);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const m = {};
    filteredSales.forEach(s => {
      if (!s.sale_date) return;
      const key = s.sale_date.substring(0, 7);
      if (!m[key]) m[key] = { month: key, fechadas: 0, propostas: 0 };
      if (s.status === 'fechada' || s.status === 'entregue') m[key].fechadas++;
      else m[key].propostas++;
    });
    return Object.values(m).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [filteredSales]);

  // Client distribution
  const statusData = useMemo(() => {
    const c = { quente: 0, morno: 0, frio: 0 };
    filteredClients.forEach(cl => { if (c[cl.status] !== undefined) c[cl.status]++; });
    return [
      { name: 'Quente 🔥', value: c.quente, color: '#ef4444' },
      { name: 'Morno 🌡️', value: c.morno, color: '#f97316' },
      { name: 'Frio ❄️', value: c.frio, color: '#3b82f6' },
    ];
  }, [filteredClients]);

  // Route chart data
  const routeData = routes.slice(-8).map((r, i) => ({
    name: r.name ? r.name.substring(0, 12) : `Rota ${i + 1}`,
    km: parseFloat(r.route_data?.total_distance_km?.toFixed(1) || 0),
    visitas: r.client_ids?.length || 0,
  }));

  const kpis = [
    { label: 'Taxa Conversão IA', value: `${conversionRate}%`, sub: `${closedSales.length} vendas fechadas`, icon: Target, from: 'from-indigo-500', to: 'to-indigo-700' },
    { label: 'Km Economizados', value: `${kmSaved} km`, sub: `${routes.length} rotas otimizadas`, icon: Route, from: 'from-emerald-500', to: 'to-emerald-700' },
    { label: 'ROI Propostas IA', value: `R$${(proposalROI / 1000).toFixed(0)}K`, sub: `30% de R$${(totalRevenue / 1000).toFixed(0)}K fechado`, icon: FileText, from: 'from-purple-500', to: 'to-purple-700' },
    { label: 'Horas Economizadas', value: `${timeSaved}h`, sub: `${automatedTasks} tarefas automatizadas`, icon: Clock, from: 'from-amber-500', to: 'to-amber-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Dashboard de Inteligência IA
          </h1>
          <p className="text-sm text-slate-500">KPIs de performance e impacto das ferramentas de IA</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Vendedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos vendedores</SelectItem>
              {salespersons.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clients.slice(0, 60).map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name}{c.clinic_name ? ` · ${c.clinic_name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className={`bg-gradient-to-br ${kpi.from} ${kpi.to} text-white`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 opacity-80" />
                <Badge className="bg-white/20 text-white text-[10px]">IA</Badge>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{kpi.label}</p>
              <p className="text-[10px] opacity-60">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Tendência de Vendas Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="fechadas" stroke="#6366f1" fill="#e0e7ff" name="Fechadas" />
                <Area type="monotone" dataKey="propostas" stroke="#8b5cf6" fill="#ede9fe" name="Propostas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Distribuição de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600">{item.name}</span>
                    <span className="font-bold text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Efficiency */}
      {routeData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="w-4 h-4 text-emerald-600" />
              Eficiência das Rotas Otimizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={routeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="km" fill="#10b981" name="Km" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitas" fill="#6366f1" name="Visitas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Dark summary */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold">Resumo do Impacto da IA</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Clientes com Score IA', value: clients.filter(c => c.purchase_score > 0).length, icon: Brain },
              { label: 'Análises Sentimento', value: interactions.filter(i => i.sentiment).length, icon: TrendingUp },
              { label: 'Rotas Criadas', value: routes.length, icon: Route },
              { label: 'Tarefas Auto-Criadas', value: automatedTasks, icon: Zap },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                <item.icon className="w-4 h-4 text-indigo-300 mx-auto mb-1" />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-[10px] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}