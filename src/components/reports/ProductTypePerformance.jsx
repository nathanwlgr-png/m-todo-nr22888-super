import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Cpu, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProductTypePerformance({ sales = [], dateFilter }) {
  const stats = useMemo(() => {
    const filteredSales = sales.filter(s => {
      if (!dateFilter.start || !dateFilter.end) return true;
      const saleDate = new Date(s.sale_date);
      return saleDate >= new Date(dateFilter.start) && saleDate <= new Date(dateFilter.end);
    }).filter(s => s.status === 'fechada' || s.status === 'entregue');

    const isMachine = (equipmentName) => {
      const name = equipmentName?.toLowerCase() || '';
      return name.includes('analisador') || 
             name.includes('vbc') || 
             name.includes('smt') ||
             name.includes('vg1') ||
             name.includes('vg2') ||
             name.includes('vi1') ||
             name.includes('qt3');
    };

    const machines = filteredSales.filter(s => isMachine(s.equipment_name));
    const supplies = filteredSales.filter(s => !isMachine(s.equipment_name));

    const machineValue = machines.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const supplyValue = supplies.reduce((sum, s) => sum + (s.sale_value || 0), 0);

    return {
      machines: {
        count: machines.length,
        value: machineValue,
        avgTicket: machines.length > 0 ? machineValue / machines.length : 0
      },
      supplies: {
        count: supplies.length,
        value: supplyValue,
        avgTicket: supplies.length > 0 ? supplyValue / supplies.length : 0
      },
      total: machineValue + supplyValue
    };
  }, [sales, dateFilter]);

  const chartData = [
    {
      name: 'Máquinas',
      vendas: stats.machines.count,
      valor: stats.machines.value / 1000,
    },
    {
      name: 'Insumos',
      vendas: stats.supplies.count,
      valor: stats.supplies.value / 1000,
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-blue-900">Máquinas</h3>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-blue-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-blue-900">
                R$ {(stats.machines.value / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
              <div>
                <p className="text-xs text-blue-600">Vendas</p>
                <p className="text-lg font-bold text-blue-800">{stats.machines.count}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Ticket Médio</p>
                <p className="text-lg font-bold text-blue-800">
                  R$ {(stats.machines.avgTicket / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-amber-900">Insumos</h3>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-amber-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-amber-900">
                R$ {(stats.supplies.value / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200">
              <div>
                <p className="text-xs text-amber-600">Vendas</p>
                <p className="text-lg font-bold text-amber-800">{stats.supplies.count}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Ticket Médio</p>
                <p className="text-lg font-bold text-amber-800">
                  R$ {(stats.supplies.avgTicket / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Comparação de Performance
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'valor') return [`R$ ${value.toFixed(0)}k`, 'Valor'];
                return [value, 'Vendas'];
              }}
            />
            <Legend />
            <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
            <Bar dataKey="valor" fill="#10b981" name="Valor (R$k)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Receita Total</p>
            <p className="text-xs text-slate-600">Período selecionado</p>
          </div>
          <div className="text-2xl font-bold text-green-600">
            R$ {(stats.total / 1000).toFixed(0)}k
          </div>
        </div>
      </Card>
    </div>
  );
}