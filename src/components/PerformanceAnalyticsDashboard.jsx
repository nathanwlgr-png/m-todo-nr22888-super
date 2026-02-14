import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Award,
  Zap,
  Calendar,
  Loader2
} from 'lucide-react';

export default function PerformanceAnalyticsDashboard() {
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500)
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500)
  });

  // Métricas de Performance
  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentClients = clients.filter(c => new Date(c.created_date) >= thirtyDaysAgo);
    const recentSales = sales.filter(s => new Date(s.sale_date) >= thirtyDaysAgo && s.status === 'fechada');
    const recentInteractions = interactions.filter(i => new Date(i.created_date) >= thirtyDaysAgo);
    const recentVisits = visits.filter(v => new Date(v.scheduled_date) >= thirtyDaysAgo && v.status === 'realizada');

    const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgDealSize = recentSales.length > 0 ? totalRevenue / recentSales.length : 0;
    const conversionRate = recentClients.length > 0 ? (recentSales.length / recentClients.length) * 100 : 0;
    
    const avgScore = clients.length > 0 
      ? clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length 
      : 0;

    const completedTasks = tasks.filter(t => t.status === 'concluida' && new Date(t.updated_date) >= sevenDaysAgo);
    const taskCompletionRate = tasks.filter(t => new Date(t.created_date) >= sevenDaysAgo).length > 0
      ? (completedTasks.length / tasks.filter(t => new Date(t.created_date) >= sevenDaysAgo).length) * 100
      : 0;

    return {
      newClients30d: recentClients.length,
      salesClosed30d: recentSales.length,
      totalRevenue30d: totalRevenue,
      avgDealSize,
      conversionRate,
      interactions30d: recentInteractions.length,
      visits30d: recentVisits.length,
      avgScore,
      taskCompletionRate,
      hotLeads: clients.filter(c => c.status === 'quente').length
    };
  }, [clients, sales, interactions, visits, tasks]);

  // Vendas por Semana (últimos 30 dias)
  const weeklySalesData = useMemo(() => {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const now = new Date();
    
    return weeks.map((week, index) => {
      const weekStart = new Date(now.getTime() - (4 - index) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekSales = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate >= weekStart && saleDate < weekEnd && s.status === 'fechada';
      });

      return {
        week,
        vendas: weekSales.length,
        receita: weekSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / 1000
      };
    });
  }, [sales]);

  // Performance por Status
  const statusPerformance = useMemo(() => {
    return [
      { 
        status: 'Quente', 
        count: clients.filter(c => c.status === 'quente').length,
        color: '#ef4444'
      },
      { 
        status: 'Morno', 
        count: clients.filter(c => c.status === 'morno').length,
        color: '#f59e0b'
      },
      { 
        status: 'Frio', 
        count: clients.filter(c => c.status === 'frio').length,
        color: '#3b82f6'
      }
    ];
  }, [clients]);

  // Atividades por Tipo
  const activityData = useMemo(() => {
    return [
      { tipo: 'Interações', valor: interactions.filter(i => new Date(i.created_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
      { tipo: 'Visitas', valor: visits.filter(v => new Date(v.scheduled_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
      { tipo: 'Tarefas', valor: tasks.filter(t => new Date(t.created_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
      { tipo: 'Vendas', valor: sales.filter(s => new Date(s.sale_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length }
    ];
  }, [interactions, visits, tasks, sales]);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Performance Analytics</h2>
            <p className="text-indigo-100">Análise completa dos últimos 30 dias</p>
          </div>
        </div>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-600 font-medium">Receita 30d</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            R$ {(metrics.totalRevenue30d / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Ticket médio: R$ {(metrics.avgDealSize / 1000).toFixed(1)}k
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-slate-600 font-medium">Conversão</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">
            {metrics.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {metrics.salesClosed30d} vendas fechadas
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-red-600" />
            <span className="text-xs text-slate-600 font-medium">Leads Quentes</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{metrics.hotLeads}</p>
          <p className="text-xs text-slate-600 mt-1">
            Score médio: {metrics.avgScore.toFixed(0)}
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-600 font-medium">Atividade</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {metrics.interactions30d + metrics.visits30d}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {metrics.taskCompletionRate.toFixed(0)}% tarefas concluídas
          </p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Vendas Semanais */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Vendas por Semana
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendas" fill="#6366f1" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status dos Clientes */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusPerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Atividades */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Atividades 30 Dias
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="tipo" />
              <Tooltip />
              <Bar dataKey="valor" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tendência de Receita */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Tendência de Receita (mil R$)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Resumo Final */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Resumo de Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-600">Novos Clientes</p>
            <p className="text-xl font-bold text-slate-800">{metrics.newClients30d}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Interações</p>
            <p className="text-xl font-bold text-slate-800">{metrics.interactions30d}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Visitas Realizadas</p>
            <p className="text-xl font-bold text-slate-800">{metrics.visits30d}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Taxa de Conclusão</p>
            <p className="text-xl font-bold text-slate-800">{metrics.taskCompletionRate.toFixed(0)}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}