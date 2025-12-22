import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  TrendingUp,
  Users,
  Calendar,
  CheckSquare,
  DollarSign,
  Target,
  MapPin,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';

const COLORS = {
  quente: '#ef4444',
  morno: '#eab308',
  frio: '#60a5fa',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b'
};

export default function SalesAnalytics() {
  const navigate = useNavigate();

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  // KPIs principais
  const kpis = useMemo(() => {
    const totalRevenue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const closedSales = sales.filter(s => s.status === 'fechada');
    const closedRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgDealSize = closedSales.length > 0 ? closedRevenue / closedSales.length : 0;
    const conversionRate = clients.length > 0 ? (closedSales.length / clients.length * 100) : 0;

    return {
      totalRevenue,
      closedRevenue,
      avgDealSize,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalClients: clients.length,
      totalSales: closedSales.length,
      activeVisits: visits.filter(v => v.status === 'agendada').length,
      pendingTasks: tasks.filter(t => t.status === 'pendente').length
    };
  }, [clients, sales, visits, tasks]);

  // Funil de vendas por status
  const funnelData = useMemo(() => {
    const statusCount = {
      quente: clients.filter(c => c.status === 'quente').length,
      morno: clients.filter(c => c.status === 'morno').length,
      frio: clients.filter(c => c.status === 'frio').length
    };

    return [
      { name: 'Quentes', value: statusCount.quente, color: COLORS.quente },
      { name: 'Mornos', value: statusCount.morno, color: COLORS.morno },
      { name: 'Frios', value: statusCount.frio, color: COLORS.frio }
    ].filter(item => item.value > 0);
  }, [clients]);

  // Receita por status
  const revenueByStatus = useMemo(() => {
    const grouped = { quente: 0, morno: 0, frio: 0 };
    clients.forEach(c => {
      grouped[c.status || 'morno'] += c.projected_revenue || 0;
    });

    return [
      { name: 'Quentes', value: grouped.quente, color: COLORS.quente },
      { name: 'Mornos', value: grouped.morno, color: COLORS.morno },
      { name: 'Frios', value: grouped.frio, color: COLORS.frio }
    ];
  }, [clients]);

  // Tendência de vendas (últimos 6 meses)
  const salesTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthSales = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate.getMonth() === date.getMonth() && 
               saleDate.getFullYear() === date.getFullYear() &&
               s.status === 'fechada';
      });

      months.push({
        month: monthName,
        vendas: monthSales.length,
        receita: monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / 1000
      });
    }

    return months;
  }, [sales]);

  // Volume de atividades (últimos 6 meses)
  const activityVolume = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthVisits = visits.filter(v => {
        const visitDate = new Date(v.scheduled_date);
        return visitDate.getMonth() === date.getMonth() && 
               visitDate.getFullYear() === date.getFullYear();
      }).length;

      const monthTasks = tasks.filter(t => {
        const taskDate = new Date(t.created_date);
        return taskDate.getMonth() === date.getMonth() && 
               taskDate.getFullYear() === date.getFullYear();
      }).length;

      months.push({
        month: monthName,
        visitas: monthVisits,
        tarefas: monthTasks
      });
    }

    return months;
  }, [visits, tasks]);

  // Distribuição geográfica
  const geoDistribution = useMemo(() => {
    const cityGroups = clients.reduce((acc, client) => {
      const city = client.city || 'Sem localização';
      if (!acc[city]) {
        acc[city] = { count: 0, revenue: 0 };
      }
      acc[city].count++;
      acc[city].revenue += client.projected_revenue || 0;
      return acc;
    }, {});

    return Object.entries(cityGroups)
      .map(([city, data]) => ({
        city,
        clientes: data.count,
        receita: data.revenue / 1000
      }))
      .sort((a, b) => b.clientes - a.clientes)
      .slice(0, 10);
  }, [clients]);

  // Pipeline progression
  const pipelineProgression = useMemo(() => {
    const stages = [
      { name: 'Diagnosticar', key: 'diagnosticar_necessidades' },
      { name: 'Apresentar', key: 'apresentar_equipamento' },
      { name: 'Demonstração', key: 'demonstracao_tecnica' },
      { name: 'Negociar', key: 'negociar_proposta' },
      { name: 'Fechar', key: 'fechar_venda' }
    ];

    return stages.map(stage => ({
      name: stage.name,
      clientes: clients.filter(c => c.visit_objective === stage.key).length
    }));
  }, [clients]);

  const isLoading = loadingClients || loadingSales || loadingVisits || loadingTasks;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard de Vendas</h1>
            <p className="text-indigo-100 text-sm">Análise completa de performance</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-white/80" />
              <p className="text-xs text-white/80">Pipeline Total</p>
            </div>
            <p className="text-xl font-bold text-white">
              R$ {(kpis.totalRevenue / 1000).toFixed(0)}k
            </p>
          </Card>

          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-white/80" />
              <p className="text-xs text-white/80">Vendas Fechadas</p>
            </div>
            <p className="text-xl font-bold text-white">
              R$ {(kpis.closedRevenue / 1000).toFixed(0)}k
            </p>
          </Card>

          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white/80" />
              <p className="text-xs text-white/80">Taxa Conversão</p>
            </div>
            <p className="text-xl font-bold text-white">{kpis.conversionRate}%</p>
          </Card>

          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-white/80" />
              <p className="text-xs text-white/80">Ticket Médio</p>
            </div>
            <p className="text-xl font-bold text-white">
              R$ {(kpis.avgDealSize / 1000).toFixed(0)}k
            </p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Funil de Vendas */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Funil de Vendas
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={funnelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Pipeline Progression */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Progressão do Pipeline
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pipelineProgression}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="clientes" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Receita por Status */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Receita Projetada por Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {revenueByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tendência de Vendas */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Tendência de Vendas (Últimos 6 Meses)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${value}k`} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="vendas" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} name="Vendas" />
              <Area yAxisId="right" type="monotone" dataKey="receita" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} name="Receita (R$ mil)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Volume de Atividades */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Volume de Atividades
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visitas" stroke={COLORS.primary} strokeWidth={2} name="Visitas" />
              <Line type="monotone" dataKey="tarefas" stroke={COLORS.warning} strokeWidth={2} name="Tarefas" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição Geográfica */}
        <Card className="p-4 bg-white shadow-md">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Top 10 Cidades
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geoDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="clientes" fill={COLORS.primary} name="Clientes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{kpis.activeVisits}</p>
                <p className="text-xs text-slate-600">Visitas Agendadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{kpis.pendingTasks}</p>
                <p className="text-xs text-slate-600">Tarefas Pendentes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}