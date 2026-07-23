import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConsolidatedSalesPerformance from '@/components/performance/ConsolidatedSalesPerformance';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PerformanceDashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500)
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-created_date', 500)
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500)
  });

  const { data: salesPoints = [], isLoading: loadingPoints } = useQuery({
    queryKey: ['sales-points'],
    queryFn: () => base44.entities.SalesPoints.list()
  });

  const { data: salesGoals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['sales-goals-performance'],
    queryFn: () => base44.entities.SalesGoal.list('-end_date', 200)
  });

  const isLoading = loadingClients || loadingSales || loadingVisits || loadingTasks || loadingPoints || loadingGoals;

  // KPIs de Vendas
  const salesKPIs = useMemo(() => {
    const closedSales = sales.filter(s => s.status === 'fechada');
    const totalLeads = clients.length;
    const conversionRate = totalLeads > 0 ? (closedSales.length / totalLeads * 100).toFixed(1) : 0;
    
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgSaleValue = closedSales.length > 0 ? totalRevenue / closedSales.length : 0;

    // Ciclo de vendas médio
    const clientsWithSales = closedSales.map(s => {
      const client = clients.find(c => c.id === s.client_id);
      if (!client || !client.created_date || !s.sale_date) return null;
      
      const created = new Date(client.created_date);
      const sold = new Date(s.sale_date);
      const days = Math.floor((sold - created) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : null;
    }).filter(d => d !== null);

    const avgSalesCycle = clientsWithSales.length > 0
      ? Math.round(clientsWithSales.reduce((a, b) => a + b, 0) / clientsWithSales.length)
      : 0;

    return {
      conversionRate,
      avgSaleValue,
      avgSalesCycle,
      totalRevenue,
      totalSales: closedSales.length
    };
  }, [sales, clients]);

  // Performance por Vendedor
  const sellerPerformance = useMemo(() => {
    const sellers = {};

    sales.forEach(sale => {
      const seller = sale.salesperson || sale.created_by_id || 'Não identificado';
      if (!sellers[seller]) {
        sellers[seller] = {
          name: seller,
          sales: 0,
          revenue: 0,
          visits: 0,
          tasks: 0,
          completedTasks: 0
        };
      }
      if (sale.status === 'fechada') {
        sellers[seller].sales++;
        sellers[seller].revenue += sale.sale_value || 0;
      }
    });

    visits.forEach(visit => {
      const seller = visit.created_by_id || 'Não identificado';
      if (sellers[seller]) {
        sellers[seller].visits++;
      }
    });

    tasks.forEach(task => {
      const seller = task.assigned_to || task.created_by_id || 'Não identificado';
      if (sellers[seller]) {
        sellers[seller].tasks++;
        if (task.status === 'concluida') {
          sellers[seller].completedTasks++;
        }
      }
    });

    return Object.values(sellers).sort((a, b) => b.revenue - a.revenue);
  }, [sales, visits, tasks]);

  // Eficácia de IA
  const aiEffectiveness = useMemo(() => {
    const totalTasks = tasks.length;
    const autoTasks = tasks.filter(t => t.auto_created).length;
    const completedAutoTasks = tasks.filter(t => t.auto_created && t.status === 'concluida').length;
    
    const aiTaskRate = totalTasks > 0 ? (autoTasks / totalTasks * 100).toFixed(1) : 0;
    const aiSuccessRate = autoTasks > 0 ? (completedAutoTasks / autoTasks * 100).toFixed(1) : 0;

    // Clientes com dicas de numerologia
    const clientsWithTips = clients.filter(c => c.numerology_tip).length;
    const numerologyAdoption = clients.length > 0 ? (clientsWithTips / clients.length * 100).toFixed(1) : 0;

    return {
      aiTaskRate,
      aiSuccessRate,
      numerologyAdoption,
      autoTasks,
      completedAutoTasks
    };
  }, [tasks, clients]);

  // Insights Numerológicos
  const numerologyInsights = useMemo(() => {
    const byNumber = {};
    const byStatus = { quente: [], morno: [], frio: [] };

    clients.forEach(client => {
      const num = client.numerology_number;
      if (num) {
        if (!byNumber[num]) {
          byNumber[num] = { count: 0, avgScore: 0, totalScore: 0, conversions: 0 };
        }
        byNumber[num].count++;
        byNumber[num].totalScore += client.purchase_score || 0;
      }

      if (client.status) {
        byStatus[client.status].push(client);
      }
    });

    // Calcular médias
    Object.keys(byNumber).forEach(num => {
      byNumber[num].avgScore = Math.round(byNumber[num].totalScore / byNumber[num].count);
      
      // Conversões
      const numClients = clients.filter(c => c.numerology_number == num);
      byNumber[num].conversions = sales.filter(s => {
        const client = numClients.find(c => c.id === s.client_id);
        return client && s.status === 'fechada';
      }).length;
    });

    const numerologyData = Object.keys(byNumber).map(num => ({
      number: `#${num}`,
      count: byNumber[num].count,
      avgScore: byNumber[num].avgScore,
      conversions: byNumber[num].conversions
    })).sort((a, b) => b.count - a.count);

    const statusData = [
      { name: 'Quente', value: byStatus.quente.length, color: '#ef4444' },
      { name: 'Morno', value: byStatus.morno.length, color: '#f59e0b' },
      { name: 'Frio', value: byStatus.frio.length, color: '#3b82f6' }
    ];

    return { numerologyData, statusData };
  }, [clients, sales]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Dashboard de Performance</h1>
            <p className="text-sm text-indigo-200">Métricas e Insights</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* KPIs de Vendas */}
        <Card className="p-4 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            KPIs de Vendas
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-600 font-medium mb-1">Taxa de Conversão</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-800">{salesKPIs.conversionRate}%</p>
                <TrendingUp className="w-4 h-4 text-emerald-600 mb-1" />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs text-indigo-600 font-medium mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-slate-800">
                R$ {(salesKPIs.avgSaleValue / 1000).toFixed(0)}k
              </p>
            </div>

            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-medium mb-1">Ciclo de Vendas</p>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-slate-800">{salesKPIs.avgSalesCycle}</p>
                <p className="text-sm text-slate-600 mb-1">dias</p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600 font-medium mb-1">Receita Total</p>
              <p className="text-xl font-bold text-slate-800">
                R$ {(salesKPIs.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total de Vendas Fechadas</span>
              <span className="font-bold text-slate-800">{salesKPIs.totalSales}</span>
            </div>
          </div>
        </Card>

        <ConsolidatedSalesPerformance sales={sales} goals={salesGoals} />

        {/* Performance por Vendedor */}
        <Card className="p-4 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Performance Individual
          </h3>

          <div className="space-y-3">
            {sellerPerformance.slice(0, 5).map((seller, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800 text-sm">
                    {seller.name.split('@')[0]}
                  </p>
                  <span className="text-xs font-bold text-emerald-600">
                    R$ {(seller.revenue / 1000).toFixed(0)}k
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-bold text-slate-800">{seller.sales}</p>
                    <p className="text-slate-500">Vendas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800">{seller.visits}</p>
                    <p className="text-slate-500">Visitas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800">{seller.completedTasks}</p>
                    <p className="text-slate-500">Tarefas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800">
                      {seller.tasks > 0 ? Math.round(seller.completedTasks / seller.tasks * 100) : 0}%
                    </p>
                    <p className="text-slate-500">Taxa</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Eficácia de IA */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Eficácia das Estratégias de IA
          </h3>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Tarefas Criadas por IA</span>
                <span className="text-lg font-bold text-purple-700">{aiEffectiveness.aiTaskRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${aiEffectiveness.aiTaskRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Taxa de Sucesso IA</span>
                <span className="text-lg font-bold text-emerald-700">{aiEffectiveness.aiSuccessRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${aiEffectiveness.aiSuccessRate}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {aiEffectiveness.completedAutoTasks} de {aiEffectiveness.autoTasks} tarefas IA concluídas
              </p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Adoção de Numerologia</span>
                <span className="text-lg font-bold text-indigo-700">{aiEffectiveness.numerologyAdoption}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${aiEffectiveness.numerologyAdoption}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Insights Numerológicos */}
        <Card className="p-4 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            Insights de Numerologia
          </h3>

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-3">Distribuição por Número</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={numerologyInsights.numerologyData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="number" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Clientes" />
                <Bar dataKey="avgScore" fill="#f59e0b" name="Score Médio" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-3">Distribuição por Status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={numerologyInsights.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {numerologyInsights.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Performers Numerology */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <h3 className="font-bold text-slate-800 mb-3">🎯 Perfis com Melhor Conversão</h3>
          <div className="space-y-2">
            {numerologyInsights.numerologyData
              .filter(n => n.conversions > 0)
              .sort((a, b) => b.conversions - a.conversions)
              .slice(0, 3)
              .map((n, i) => (
                <div key={i} className="bg-white rounded p-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-700 text-lg">{n.number}</span>
                    <span className="text-xs text-slate-600 ml-2">
                      {n.count} clientes
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">{n.conversions} vendas</p>
                    <p className="text-xs text-slate-500">Score: {n.avgScore}%</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Gamification Summary */}
        {salesPoints.length > 0 && (
          <Card className="p-4 bg-white">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
              Ranking de Pontos
            </h3>
            <div className="space-y-2">
              {salesPoints.slice(0, 5).map((sp, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded p-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-slate-700">#{i + 1}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {sp.user_name || sp.user_email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-slate-500">Nível {sp.level}</p>
                    </div>
                  </div>
                  <span className="font-bold text-yellow-600">{sp.total_points} pts</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}