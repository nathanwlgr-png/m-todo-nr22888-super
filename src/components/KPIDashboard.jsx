import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, Target, Calendar, Package } from 'lucide-react';

export default function KPIDashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list();
      return data.filter(c => c && c.id && !c.is_deleted);
    }
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

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Vendas
    const closedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const monthSales = closedSales.filter(s => new Date(s.sale_date) >= thisMonth);
    const lastMonthSales = closedSales.filter(s => {
      const date = new Date(s.sale_date);
      return date >= lastMonth && date < thisMonth;
    });
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
    
    // Clientes
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const avgScore = clients.length > 0 ? clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length : 0;
    const highScoreClients = clients.filter(c => c.purchase_score >= 70).length;
    
    // Visitas
    const monthVisits = visits.filter(v => new Date(v.scheduled_date) >= thisMonth && v.status === 'realizada').length;
    const scheduledVisits = visits.filter(v => v.status === 'agendada').length;
    const visitConversionRate = monthVisits > 0 ? (monthSales.length / monthVisits * 100).toFixed(1) : 0;
    
    // Tarefas
    const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
    const overdueTasks = tasks.filter(t => t.status === 'pendente' && new Date(t.due_date) < now).length;
    const completedThisMonth = tasks.filter(t => t.status === 'concluida' && new Date(t.updated_date) >= thisMonth).length;
    
    // Taxa de conversão
    const conversionRate = clients.length > 0 ? (closedSales.length / clients.length) * 100 : 0;
    
    // Engajamento
    const monthInteractions = interactions.filter(i => new Date(i.created_date) >= thisMonth).length;
    const avgInteractionsPerClient = clients.length > 0 ? (monthInteractions / clients.length).toFixed(1) : 0;
    
    // Previsão
    const pipelineValue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const expectedClosings = clients.filter(c => c.purchase_score >= 75).length;
    
    return {
      totalClients: clients.length,
      hotClients,
      highScoreClients,
      avgScore: Math.round(avgScore),
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      revenueGrowth,
      monthSales: monthSales.length,
      totalSales: closedSales.length,
      conversionRate: conversionRate.toFixed(1),
      monthVisits,
      scheduledVisits,
      visitConversionRate,
      pendingTasks,
      overdueTasks,
      completedThisMonth,
      monthInteractions,
      avgInteractionsPerClient,
      pipelineValue,
      expectedClosings
    };
  }, [clients, sales, visits, tasks, interactions]);

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <h3 className="font-bold text-slate-800 mb-4">📊 KPIs - Visão Geral</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Receita com Crescimento */}
        <div className="p-3 bg-white rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-semibold">Receita Mês</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            R$ {(kpis.monthRevenue / 1000).toFixed(0)}k
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-semibold ${parseFloat(kpis.revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(kpis.revenueGrowth) >= 0 ? '↑' : '↓'} {Math.abs(kpis.revenueGrowth)}%
            </span>
            <span className="text-xs text-slate-600">vs mês anterior</span>
          </div>
        </div>

        {/* Clientes Quentes + Alta Pontuação */}
        <div className="p-3 bg-white rounded-xl border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-semibold">Alta Prioridade</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{kpis.hotClients}</p>
          <p className="text-xs text-slate-600">
            {kpis.highScoreClients} com score 70+
          </p>
        </div>

        {/* Score + Taxa de Conversão */}
        <div className="p-3 bg-white rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-semibold">Performance</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{kpis.avgScore}%</p>
          <p className="text-xs text-slate-600">
            Taxa conversão: {kpis.conversionRate}%
          </p>
        </div>

        {/* Visitas + Taxa de Conversão */}
        <div className="p-3 bg-white rounded-xl border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-semibold">Visitas</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{kpis.monthVisits}</p>
          <p className="text-xs text-slate-600">
            {kpis.visitConversionRate}% conversão
          </p>
        </div>

        {/* Tarefas + Concluídas */}
        <div className="p-3 bg-white rounded-xl border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-700 font-semibold">Tarefas</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{kpis.pendingTasks}</p>
          <p className="text-xs text-slate-600">
            {kpis.completedThisMonth} concluídas no mês
          </p>
        </div>

        {/* Pipeline Futuro */}
        <div className="p-3 bg-white rounded-xl border-2 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-indigo-700 font-semibold">Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">
            R$ {(kpis.pipelineValue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-slate-600">
            {kpis.expectedClosings} fechamentos esperados
          </p>
        </div>

        {/* Engajamento */}
        <div className="p-3 bg-white rounded-xl border-2 border-cyan-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs text-cyan-700 font-semibold">Engajamento</span>
          </div>
          <p className="text-2xl font-bold text-cyan-700">{kpis.monthInteractions}</p>
          <p className="text-xs text-slate-600">
            {kpis.avgInteractionsPerClient} por cliente
          </p>
        </div>

        {/* Previsão IA */}
        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-purple-700 font-semibold">IA Previsão</span>
          </div>
          <p className="text-xl font-bold text-purple-700">
            R$ {((kpis.pipelineValue * parseFloat(kpis.conversionRate) / 100) / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-purple-600">
            Receita estimada mês
          </p>
        </div>
      </div>
    </Card>
  );
}