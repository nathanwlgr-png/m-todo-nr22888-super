import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, DollarSign, Package, Cpu } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export default function PersonalGoalsWidget() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['my-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const metrics = useMemo(() => {
    if (!currentUser || !sales.length) return null;

    const mySales = sales.filter(s => 
      s.salesperson === currentUser.email && 
      (s.status === 'fechada' || s.status === 'entregue')
    );

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const monthStart = startOfMonth(now);

    const todayEnd = endOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const monthEnd = endOfMonth(now);

    // Vendas por período
    const todaySales = mySales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate >= todayStart && saleDate <= todayEnd;
    });

    const weekSales = mySales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate >= weekStart && saleDate <= weekEnd;
    });

    const monthSales = mySales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate >= monthStart && saleDate <= monthEnd;
    });

    // Separar por tipo (máquinas vs insumos)
    const isMachine = (equipmentName) => {
      const machineName = equipmentName?.toLowerCase() || '';
      return machineName.includes('analisador') || 
             machineName.includes('vbc') || 
             machineName.includes('smt') ||
             machineName.includes('vg1') ||
             machineName.includes('vg2') ||
             machineName.includes('vi1') ||
             machineName.includes('qt3');
    };

    const calculateByType = (salesArray) => {
      const machines = salesArray.filter(s => isMachine(s.equipment_name));
      const supplies = salesArray.filter(s => !isMachine(s.equipment_name));
      
      return {
        machines: {
          count: machines.length,
          value: machines.reduce((sum, s) => sum + (s.sale_value || 0), 0)
        },
        supplies: {
          count: supplies.length,
          value: supplies.reduce((sum, s) => sum + (s.sale_value || 0), 0)
        },
        total: salesArray.reduce((sum, s) => sum + (s.sale_value || 0), 0)
      };
    };

    // Top clientes
    const clientSales = {};
    mySales.forEach(sale => {
      if (!clientSales[sale.client_id]) {
        clientSales[sale.client_id] = {
          name: sale.client_name,
          total: 0,
          count: 0
        };
      }
      clientSales[sale.client_id].total += sale.sale_value || 0;
      clientSales[sale.client_id].count += 1;
    });

    const topClients = Object.values(clientSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return {
      today: calculateByType(todaySales),
      week: calculateByType(weekSales),
      month: calculateByType(monthSales),
      topClients,
      // Metas (podem ser configuradas)
      goals: {
        daily: 5000,
        weekly: 25000,
        monthly: 100000
      }
    };
  }, [sales, currentUser]);

  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Minhas Metas
        </h2>
        <Badge variant="outline" className="text-purple-600">
          {currentUser?.full_name?.split(' ')[0]}
        </Badge>
      </div>

      {/* Meta Mensal */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Meta do Mês</span>
          <span className="text-xs text-slate-500">
            R$ {metrics.month.total.toLocaleString('pt-BR')} / R$ {metrics.goals.monthly.toLocaleString('pt-BR')}
          </span>
        </div>
        <Progress 
          value={(metrics.month.total / metrics.goals.monthly) * 100} 
          className="h-3 mb-2"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            {((metrics.month.total / metrics.goals.monthly) * 100).toFixed(0)}% atingido
          </span>
          <span className="text-slate-600">
            Faltam R$ {Math.max(0, metrics.goals.monthly - metrics.month.total).toLocaleString('pt-BR')}
          </span>
        </div>
      </Card>

      {/* Período: Hoje, Semana, Mês */}
      <div className="grid grid-cols-3 gap-3">
        {/* Hoje */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-slate-700">Hoje</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            R$ {(metrics.today.total / 1000).toFixed(0)}k
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Máq
              </span>
              <span className="font-medium">{metrics.today.machines.count}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Ins
              </span>
              <span className="font-medium">{metrics.today.supplies.count}</span>
            </div>
          </div>
        </Card>

        {/* Semana */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium text-slate-700">Semana</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            R$ {(metrics.week.total / 1000).toFixed(0)}k
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Máq
              </span>
              <span className="font-medium">{metrics.week.machines.count}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Ins
              </span>
              <span className="font-medium">{metrics.week.supplies.count}</span>
            </div>
          </div>
        </Card>

        {/* Mês */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3 h-3 text-purple-500" />
            <span className="text-xs font-medium text-slate-700">Mês</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            R$ {(metrics.month.total / 1000).toFixed(0)}k
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Máq
              </span>
              <span className="font-medium">{metrics.month.machines.count}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Ins
              </span>
              <span className="font-medium">{metrics.month.supplies.count}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalhamento Máquinas vs Insumos */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-800">Máquinas</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mb-1">
            R$ {(metrics.month.machines.value / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-blue-700">{metrics.month.machines.count} vendas no mês</p>
        </Card>

        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Insumos</span>
          </div>
          <p className="text-xl font-bold text-amber-900 mb-1">
            R$ {(metrics.month.supplies.value / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-amber-700">{metrics.month.supplies.count} vendas no mês</p>
        </Card>
      </div>

      {/* Top Clientes */}
      {metrics.topClients.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            🏆 Top Clientes
          </h3>
          <div className="space-y-2">
            {metrics.topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                  <span className="text-sm text-slate-700">{client.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    R$ {(client.total / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-slate-500">{client.count} vendas</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}