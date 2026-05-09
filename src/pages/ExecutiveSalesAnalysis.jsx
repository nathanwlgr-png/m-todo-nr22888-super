import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, Download, RefreshCw } from 'lucide-react';

export default function ExecutiveSalesAnalysis() {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(false);

  const { data: salesData, refetch: refetchSales } = useQuery({
    queryKey: ['executive-sales-report', timeRange],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateSalesReport', { days: parseInt(timeRange) });
      return res.data;
    },
    staleTime: 300000,
  });

  const { data: kpisData } = useQuery({
    queryKey: ['sales-kpis'],
    queryFn: async () => {
      const res = await base44.functions.invoke('calculateSalesKPIs', {});
      return res.data;
    },
    staleTime: 300000,
  });

  const { data: forecastData } = useQuery({
    queryKey: ['sales-forecast'],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateSalesForecast', { days: 30 });
      return res.data;
    },
    staleTime: 300000,
  });

  const handleRefresh = async () => {
    setLoading(true);
    await refetchSales();
    setLoading(false);
  };

  // Preparar dados para gráficos
  const dailyPerformance = salesData?.daily_breakdown || [];
  const stageDistribution = salesData?.by_stage || [];
  const conversionRates = salesData?.conversion_rates || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">📊 Análise Executiva de Vendas</h1>
            <p className="text-slate-400">Dashboard de desempenho e previsões em tempo real</p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Controles */}
        <div className="flex gap-2 mb-6">
          {['7', '30', '90'].map(days => (
            <Button
              key={days}
              variant={timeRange === days ? 'default' : 'outline'}
              onClick={() => setTimeRange(days)}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Últimos {days} dias
            </Button>
          ))}
        </div>

        {/* KPIs Cards */}
        {kpisData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Receita Total', value: kpisData.total_revenue, icon: '💰', trend: kpisData.revenue_trend },
              { label: 'Vendas Fechadas', value: kpisData.closed_deals, icon: '🎯', trend: kpisData.deals_trend },
              { label: 'Taxa Conversão', value: `${kpisData.conversion_rate}%`, icon: '📈', trend: kpisData.conversion_trend },
              { label: 'Ticket Médio', value: `R$ ${kpisData.avg_deal_value}`, icon: '💵', trend: kpisData.ticket_trend },
            ].map((kpi, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-3xl">{kpi.icon}</span>
                    <Badge variant={kpi.trend > 0 ? 'default' : 'destructive'} className="gap-1">
                      {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(kpi.trend)}%
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Desempenho Diário */}
          {dailyPerformance.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Desempenho Diário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyPerformance}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Distribuição por Estágio */}
          {stageDistribution.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Valor por Estágio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="stage" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Previsão e Taxas de Conversão */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Previsão de Fechamento */}
          {forecastData?.predictions && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">🔮 Previsão 30 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastData.predictions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} name="Previsão" />
                    <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Confiança" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Taxas de Conversão */}
          {conversionRates.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">📊 Taxa de Conversão por Estágio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversionRates.map((stage, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-300">{stage.stage}</span>
                        <span className="text-sm font-bold text-white">{stage.rate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500" 
                          style={{ width: `${stage.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo Executivo */}
        {salesData?.summary && (
          <Card className="bg-slate-800 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white">📋 Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(salesData.summary).map(([key, value]) => (
                  <div key={key} className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-slate-400 text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}