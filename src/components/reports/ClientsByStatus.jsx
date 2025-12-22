import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThermometerSun, Flame, Snowflake } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function ClientsByStatus({ clients = [] }) {
  const stats = useMemo(() => {
    const hot = clients.filter(c => c.status === 'quente');
    const warm = clients.filter(c => c.status === 'morno');
    const cold = clients.filter(c => c.status === 'frio');

    const hotRevenue = hot.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const warmRevenue = warm.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const coldRevenue = cold.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);

    return {
      hot: { count: hot.length, revenue: hotRevenue, clients: hot },
      warm: { count: warm.length, revenue: warmRevenue, clients: warm },
      cold: { count: cold.length, revenue: coldRevenue, clients: cold },
      total: clients.length
    };
  }, [clients]);

  const chartData = [
    { name: 'Quente', value: stats.hot.count, color: '#ef4444' },
    { name: 'Morno', value: stats.warm.count, color: '#f59e0b' },
    { name: 'Frio', value: stats.cold.count, color: '#3b82f6' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-900">Quente</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">{stats.hot.count}</p>
          <p className="text-xs text-red-700">
            R$ {(stats.hot.revenue / 1000).toFixed(0)}k pipeline
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <ThermometerSun className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Morno</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">{stats.warm.count}</p>
          <p className="text-xs text-yellow-700">
            R$ {(stats.warm.revenue / 1000).toFixed(0)}k pipeline
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Snowflake className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-blue-900">Frio</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.cold.count}</p>
          <p className="text-xs text-blue-700">
            R$ {(stats.cold.revenue / 1000).toFixed(0)}k pipeline
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Distribuição de Clientes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 bg-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Score médio (Quente)</span>
            <span className="font-bold text-slate-800">
              {stats.hot.count > 0 
                ? (stats.hot.clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / stats.hot.count).toFixed(0)
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Score médio (Morno)</span>
            <span className="font-bold text-slate-800">
              {stats.warm.count > 0
                ? (stats.warm.clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / stats.warm.count).toFixed(0)
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Score médio (Frio)</span>
            <span className="font-bold text-slate-800">
              {stats.cold.count > 0
                ? (stats.cold.clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / stats.cold.count).toFixed(0)
                : 0}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}