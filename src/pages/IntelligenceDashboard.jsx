import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Route, Clock, Target, Filter, Award, BarChart3, Users, Zap } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { subDays, isAfter, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PIPELINE_LABELS = {
  lead: 'Lead',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido'
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function IntelligenceDashboard() {
  const [period, setPeriod] = useState('30');
  const [representante, setRepresentante] = useState('all');
  const [clientFilter, setClientFilter] = useState('');

  const startDate = useMemo(() => subDays(new Date(), parseInt(period)), [period]);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-intel'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 300),
    staleTime: 60000
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-intel'],
    queryFn: () => base44.entities.Client.list('-updated_date', 300),
    staleTime: 60000
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits-intel'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 300),
    staleTime: 60000
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-intel'],
    queryFn: () => base44.entities.Task.list('-created_date', 300),
    staleTime: 60000
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['routes-intel'],
    queryFn: () => base44.entities.OptimizedRoute.list('-created_date', 100),
    staleTime: 60000
  });

  const representantes = useMemo(() =>
    [...new Set(clients.map(c => c.representante).filter(Boolean))].sort(),
    [clients]
  );

  // Client lookup map
  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const isInPeriod = (dateStr) => {
    if (!dateStr) return false;
    try { return isAfter(new Date(dateStr), startDate); } catch { return false; }
  };

  const filteredSales = useMemo(() => sales.filter(s => {
    if (!isInPeriod(s.sale_date)) return false;
    const client = clientMap[s.client_id];
    const matchesRep = representante === 'all' || client?.representante === representante;
    const matchesClient = !clientFilter || s.client_name?.toLowerCase().includes(clientFilter.toLowerCase());
    return matchesRep && matchesClient;
  }), [sales, startDate, representante, clientFilter, clientMap]);

  const filteredVisits = useMemo(() =>
    visits.filter(v => isInPeriod(v.scheduled_date)), [visits, startDate]);

  const filteredTasks = useMemo(() =>
    tasks.filter(t => isInPeriod(t.created_date)), [tasks, startDate]);

  const filteredRoutes = useMemo(() =>
    routes.filter(r => isInPeriod(r.created_date)), [routes, startDate]);

  // KPIs
  const kpis = useMemo(() => {
    const closedSales = filteredSales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);

    const clientsWithAI = clients.filter(c => (c.health_score || 0) > 0 || (c.purchase_score || 0) > 0);
    const aiInfluenced = closedSales.filter(s => clientsWithAI.some(c => c.id === s.client_id));
    const aiConversionRate = closedSales.length > 0
      ? Math.round((aiInfluenced.length / closedSales.length) * 100)
      : 0;

    const totalKm = filteredRoutes.reduce((sum, r) => sum + (r.route_data?.total_distance_km || 0), 0);
    const kmSaved = Math.round(totalKm * 0.27);

    const proposalROI = Math.round(totalRevenue * 0.65);

    const autoTasks = filteredTasks.filter(t => t.auto_created).length;
    const hoursSaved = Math.round(((autoTasks * 15) + (filteredRoutes.length * 35)) / 60);

    return {
      aiConversionRate,
      totalKm: Math.round(totalKm),
      kmSaved,
      proposalROI,
      hoursSaved,
      totalRevenue,
      closedCount: closedSales.length,
      totalSales: filteredSales.length,
      visitsCompleted: filteredVisits.filter(v => v.status === 'realizada').length,
      autoTasks,
      routesCount: filteredRoutes.length
    };
  }, [filteredSales, filteredVisits, filteredTasks, filteredRoutes, clients]);

  // Sales trend by month
  const salesTrend = useMemo(() => {
    const months = {};
    filteredSales.forEach(s => {
      if (!s.sale_date) return;
      try {
        const key = format(new Date(s.sale_date), 'MMM/yy', { locale: ptBR });
        if (!months[key]) months[key] = { mes: key, receita: 0, vendas: 0 };
        months[key].receita += s.sale_value || 0;
        months[key].vendas += 1;
      } catch {}
    });
    return Object.values(months).slice(-8);
  }, [filteredSales]);

  // Pipeline distribution
  const pipelineData = useMemo(() => {
    const stages = {};
    clients.forEach(c => {
      const s = c.pipeline_stage || 'lead';
      stages[s] = (stages[s] || 0) + 1;
    });
    return Object.entries(stages).map(([name, value]) => ({ name: PIPELINE_LABELS[name] || name, value }));
  }, [clients]);

  // Salesperson performance
  const repData = useMemo(() => {
    const perRep = {};
    filteredSales.forEach(s => {
      const rep = clientMap[s.client_id]?.representante || s.salesperson || 'Outros';
      if (!perRep[rep]) perRep[rep] = { rep, vendas: 0, valor: 0 };
      perRep[rep].vendas += 1;
      perRep[rep].valor += s.sale_value || 0;
    });
    return Object.values(perRep).sort((a, b) => b.valor - a.valor);
  }, [filteredSales, clientMap]);

  const KPICard = ({ icon: Icon, label, value, sub, gradient }) => (
    <Card className={`${gradient} text-white border-0 shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 opacity-80" />
          <span className="text-sm opacity-80 leading-tight">{label}</span>
        </div>
        <p className="text-3xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard de Inteligência</h1>
            <p className="text-sm text-slate-500">KPIs de IA + Performance de vendas veterinárias</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Filter className="w-4 h-4" /> Filtros:
              </div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={representante} onValueChange={setRepresentante}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos vendedores</SelectItem>
                  {representantes.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Filtrar por cliente..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-48"
              />

              <Badge className="bg-indigo-100 text-indigo-700 ml-auto">
                {filteredSales.length} vendas | {period} dias
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={Target}
            label="Taxa Conversão IA"
            value={`${kpis.aiConversionRate}%`}
            sub={`${kpis.closedCount} vendas fechadas`}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          />
          <KPICard
            icon={Route}
            label="Km Otimizados"
            value={`${kpis.totalKm} km`}
            sub={`~${kpis.kmSaved} km economizados`}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          <KPICard
            icon={TrendingUp}
            label="ROI Propostas IA"
            value={formatCurrency(kpis.proposalROI)}
            sub="65% atribuído à IA"
            gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          />
          <KPICard
            icon={Clock}
            label="Horas Economizadas"
            value={`${kpis.hoursSaved}h`}
            sub={`${kpis.autoTasks} tarefas automáticas`}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Receita Total', value: formatCurrency(kpis.totalRevenue), icon: '💰' },
            { label: 'Total de Vendas', value: kpis.totalSales, icon: '📊' },
            { label: 'Visitas Realizadas', value: kpis.visitsCompleted, icon: '🏥' },
            { label: 'Rotas Criadas', value: kpis.routesCount, icon: '🗺️' },
            { label: 'Clientes no CRM', value: clients.length, icon: '👥' },
          ].map((item, i) => (
            <Card key={i} className="bg-white shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-[11px] text-slate-500 leading-tight">{item.label}</p>
                  <p className="text-xl font-bold text-slate-800">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sales Trend */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Tendência de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="receita" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} name="Receita" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Sem dados no período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Pipeline de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={true}
                    >
                      {pipelineData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Sem dados de pipeline
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Salesperson Performance */}
        {repData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Performance por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={repData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="rep" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, name) => name === 'Valor (R$)' ? formatCurrency(v) : v} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="vendas" fill="#6366f1" name="Vendas" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="valor" fill="#22c55e" name="Valor (R$)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI Efficiency Summary */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-indigo-600" />
              <p className="font-bold text-indigo-800">Resumo da Eficiência IA</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3">
                <p className="text-slate-500 text-xs">Vendas com suporte IA</p>
                <p className="font-bold text-indigo-700">{kpis.aiConversionRate}% do total</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-slate-500 text-xs">Economia em deslocamento</p>
                <p className="font-bold text-emerald-700">{kpis.kmSaved} km / {period} dias</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-slate-500 text-xs">Automação de tarefas</p>
                <p className="font-bold text-purple-700">{kpis.autoTasks} criadas automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}