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

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Vendas
    const closedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const monthSales = closedSales.filter(s => new Date(s.sale_date) >= thisMonth);
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    
    // Clientes
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const avgScore = clients.length > 0 ? clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length : 0;
    
    // Visitas
    const monthVisits = visits.filter(v => new Date(v.scheduled_date) >= thisMonth && v.status === 'realizada').length;
    const scheduledVisits = visits.filter(v => v.status === 'agendada').length;
    
    // Tarefas
    const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
    const overdueTasks = tasks.filter(t => t.status === 'pendente' && new Date(t.due_date) < now).length;
    
    // Taxa de conversão
    const conversionRate = clients.length > 0 ? (closedSales.length / clients.length) * 100 : 0;
    
    return {
      totalClients: clients.length,
      hotClients,
      avgScore: Math.round(avgScore),
      totalRevenue,
      monthRevenue,
      monthSales: monthSales.length,
      totalSales: closedSales.length,
      conversionRate: conversionRate.toFixed(1),
      monthVisits,
      scheduledVisits,
      pendingTasks,
      overdueTasks
    };
  }, [clients, sales, visits, tasks]);

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <h3 className="font-bold text-slate-800 mb-4">📊 KPIs - Visão Geral</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Receita */}
        <div className="p-3 bg-white rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-semibold">Receita Mês</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            R$ {(kpis.monthRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-slate-600">
            {kpis.monthSales} vendas este mês
          </p>
        </div>

        {/* Clientes Quentes */}
        <div className="p-3 bg-white rounded-xl border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-semibold">Quentes</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{kpis.hotClients}</p>
          <p className="text-xs text-slate-600">
            de {kpis.totalClients} clientes
          </p>
        </div>

        {/* Score Médio */}
        <div className="p-3 bg-white rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-semibold">Score Médio</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{kpis.avgScore}%</p>
          <p className="text-xs text-slate-600">
            Conversão: {kpis.conversionRate}%
          </p>
        </div>

        {/* Visitas */}
        <div className="p-3 bg-white rounded-xl border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-semibold">Visitas Mês</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{kpis.monthVisits}</p>
          <p className="text-xs text-slate-600">
            {kpis.scheduledVisits} agendadas
          </p>
        </div>

        {/* Tarefas */}
        <div className="p-3 bg-white rounded-xl border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-700 font-semibold">Tarefas</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{kpis.pendingTasks}</p>
          <p className="text-xs text-slate-600">
            {kpis.overdueTasks} atrasadas
          </p>
        </div>

        {/* Total Pipeline */}
        <div className="p-3 bg-white rounded-xl border-2 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-indigo-700 font-semibold">Pipeline Total</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">
            R$ {(kpis.totalRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-slate-600">
            {kpis.totalSales} vendas fechadas
          </p>
        </div>
      </div>
    </Card>
  );
}