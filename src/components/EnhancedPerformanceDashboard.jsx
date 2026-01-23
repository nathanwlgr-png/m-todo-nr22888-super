import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Award, Zap, Calendar } from 'lucide-react';
import GamificationSystem from '@/components/GamificationSystem';
import GoalsManager from '@/components/GoalsManager';

export default function EnhancedPerformanceDashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  // Calculate metrics
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const salesThisMonth = sales.filter(s => new Date(s.created_date) >= thisMonth);
  const salesLastMonth = sales.filter(s => 
    new Date(s.created_date) >= lastMonth && new Date(s.created_date) < thisMonth
  );
  
  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const revenueLastMonth = salesLastMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

  const visitsThisWeek = visits.filter(v => new Date(v.created_date) >= thisWeek).length;
  const tasksCompleted = tasks.filter(t => t.status === 'concluida').length;
  const taskCompletionRate = tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;

  const hotClients = clients.filter(c => c.status === 'quente').length;
  const avgDealSize = salesThisMonth.length > 0 ? revenueThisMonth / salesThisMonth.length : 0;
  const conversionRate = clients.length > 0 ? (sales.filter(s => s.status === 'fechada').length / clients.length) * 100 : 0;

  const pipelineValue = clients
    .filter(c => c.status === 'quente' || c.status === 'morno')
    .reduce((sum, c) => sum + (c.available_budget || 50000), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Dashboard de Desempenho</h3>
            <p className="text-xs text-white/80">Performance em tempo real</p>
          </div>
          <Award className="w-8 h-8 text-white/80" />
        </div>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue */}
        <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-700">Receita Mês</p>
          </div>
          <p className="text-xl font-black text-green-900">
            R$ {(revenueThisMonth / 1000).toFixed(0)}k
          </p>
          <div className="flex items-center gap-1 mt-1">
            {revenueGrowth >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={`text-xs font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior
            </span>
          </div>
        </Card>

        {/* Deals */}
        <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Vendas Mês</p>
          </div>
          <p className="text-xl font-black text-blue-900">{salesThisMonth.length}</p>
          <p className="text-xs text-blue-600 mt-1">
            Ticket médio: R$ {(avgDealSize / 1000).toFixed(0)}k
          </p>
        </Card>

        {/* Hot Clients */}
        <Card className="p-3 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-red-600" />
            <p className="text-xs font-semibold text-red-700">Clientes Quentes</p>
          </div>
          <p className="text-xl font-black text-red-900">{hotClients}</p>
          <p className="text-xs text-red-600 mt-1">
            Pipeline: R$ {(pipelineValue / 1000).toFixed(0)}k
          </p>
        </Card>

        {/* Conversion */}
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-purple-700">Taxa Conversão</p>
          </div>
          <p className="text-xl font-black text-purple-900">{conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-purple-600 mt-1">
            {sales.filter(s => s.status === 'fechada').length} de {clients.length} clientes
          </p>
        </Card>
      </div>

      {/* Activity Metrics */}
      <Card className="p-4">
        <h4 className="font-bold text-slate-900 mb-3">📊 Atividade Recente</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-700">Visitas esta semana</span>
            </div>
            <Badge className="bg-blue-600 text-white">{visitsThisWeek}</Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm text-slate-700">Taxa conclusão tarefas</span>
            </div>
            <Badge className="bg-green-600 text-white">{taskCompletionRate.toFixed(0)}%</Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-slate-700">Total clientes</span>
            </div>
            <Badge className="bg-purple-600 text-white">{clients.length}</Badge>
          </div>
        </div>
      </Card>

      {/* Gamification */}
      <GamificationSystem />

      {/* Goals Manager */}
      <GoalsManager />
    </div>
  );
}