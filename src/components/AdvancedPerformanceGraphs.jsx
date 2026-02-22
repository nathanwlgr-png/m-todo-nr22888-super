import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';

export default function AdvancedPerformanceGraphs({ salesData, clientScores, periodComparison, trends }) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Gráfico 1: Receita por Produto (Comparativo)
  const revenueByProduct = useMemo(() => {
    if (!periodComparison?.byProduct) return [];
    return Object.entries(periodComparison.byProduct).map(([product, { current, previous }]) => ({
      product: product.substring(0, 15),
      atual: current || 0,
      anterior: previous || 0,
      variacao: previous ? Math.round(((current - previous) / previous) * 100) : 0
    }));
  }, [periodComparison]);

  // Gráfico 2: Distribuição de Score (Pie)
  const scoreDistribution = useMemo(() => {
    if (!clientScores) return [];
    const quentes = clientScores.filter(c => c.score >= 70).length;
    const mornos = clientScores.filter(c => c.score >= 40 && c.score < 70).length;
    const frios = clientScores.filter(c => c.score < 40).length;
    return [
      { name: 'Quentes (70+)', value: quentes, fill: '#10b981' },
      { name: 'Mornos (40-69)', value: mornos, fill: '#f59e0b' },
      { name: 'Frios (<40)', value: frios, fill: '#ef4444' }
    ];
  }, [clientScores]);

  // Gráfico 3: Tendência semanal de receita
  const weeklyTrend = useMemo(() => {
    if (!trends?.weekly) return [];
    return trends.weekly.map(day => ({
      dia: day.date.substring(5, 10),
      receita: day.revenue || 0,
      vendas: day.sales || 0
    }));
  }, [trends]);

  // Gráfico 4: Scatter de Score vs Receita (Outliers)
  const scoreVsRevenue = useMemo(() => {
    if (!clientScores) return [];
    return clientScores
      .filter(c => c.revenue !== undefined)
      .map(c => ({
        x: c.score || 0,
        y: c.revenue || 0,
        name: c.clientName,
        fill: c.isOutlier ? '#ef4444' : '#3b82f6'
      }));
  }, [clientScores]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Gráfico 1: Receita por Produto */}
      {revenueByProduct.length > 0 && (
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              💰 Receita por Produto (Período vs Anterior)
              <Badge className="bg-blue-100 text-blue-700 text-[10px]">Comparativo</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => `R$${(value / 1000).toFixed(1)}k`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend fontSize={12} />
                <Bar dataKey="atual" fill="#3b82f6" name="Atual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="anterior" fill="#d1d5db" name="Anterior" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {revenueByProduct.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span>{p.product}</span>
                  <span className={p.variacao >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {p.variacao >= 0 ? '+' : ''}{p.variacao}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 2: Distribuição de Score */}
      {scoreDistribution.length > 0 && (
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">📊 Distribuição de Score de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} clientes`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 3: Tendência Semanal */}
      {weeklyTrend.length > 0 && (
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              📈 Tendência Semanal de Receita
              {trends?.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {trends?.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => `R$${(value / 1000).toFixed(1)}k`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend fontSize={12} />
                <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} name="Receita" />
                <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} name="Vendas (#)" />
              </LineChart>
            </ResponsiveContainer>
            {trends?.comment && (
              <p className="text-[11px] text-slate-600 mt-2 italic">💡 {trends.comment}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráfico 4: Score vs Receita (Outliers) */}
      {scoreVsRevenue.length > 0 && (
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              🎯 Análise Score vs Receita (Outliers Destacados)
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Score" fontSize={12} label={{ value: 'Score', position: 'insideBottomRight', offset: -5 }} />
                <YAxis type="number" dataKey="y" name="Receita" fontSize={12} label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '12px' }} />
                <Scatter name="Clientes" data={scoreVsRevenue} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 bg-orange-50 p-2 rounded text-[11px] border border-orange-200">
              <p className="font-semibold text-orange-800">⚠️ Outliers Detectados:</p>
              {scoreVsRevenue.filter(p => p.fill === '#ef4444').map((p, i) => (
                <p key={i} className="text-orange-700 mt-1">• {p.name}: Score {p.x}, Receita R${(p.y / 1000).toFixed(1)}k</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}