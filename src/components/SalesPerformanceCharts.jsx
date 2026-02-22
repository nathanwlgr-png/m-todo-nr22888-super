import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function SalesPerformanceCharts() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-charts'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  useEffect(() => {
    if (sales.length > 0) {
      generateCharts();
    }
  }, [sales.length]);

  const generateCharts = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateSalesCharts', {
        sales: sales.slice(0, 100)
      });
      if (res.data) {
        setChartData(res.data);
      }
    } catch (error) {
      console.error('Erro ao gerar gráficos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Gerando gráficos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Performance por Vendedor */}
      {chartData.by_salesperson && chartData.by_salesperson.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">👨‍💼 Performance por Vendedor</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.by_salesperson}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance por Produto */}
      {chartData.by_product && chartData.by_product.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📦 Performance por Produto</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.by_product}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${(entry.value / 1000).toFixed(0)}k`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.by_product.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tendência de Vendas */}
      {chartData.trend && chartData.trend.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📈 Tendência de Vendas (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} name="Vendas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}