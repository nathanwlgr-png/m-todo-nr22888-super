import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, DollarSign, RefreshCw } from 'lucide-react';

export default function AdvancedSalesAnalytics() {
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async () => {
      const res = await base44.functions.invoke('salesAnalyticsDashboard', {});
      return res.data;
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p>Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData || {};

  const COLORS = ['#4f46e5', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">📊 Sales Analytics</h1>
            <p className="text-slate-600 mt-2">Dashboard de KPIs e performance do time</p>
          </div>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Receita (90d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                R$ {(data.summary?.total_revenue_90_days / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-slate-500 mt-1">Últimos 3 meses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Forecast (12m)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                R$ {(data.summary?.forecast_12_months / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-slate-500 mt-1">Próximos 12 meses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Taxa Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {data.summary?.overall_conversion_rate}%
              </div>
              <p className="text-xs text-slate-500 mt-1">{data.summary?.closed_deals} deals fechados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {data.summary?.total_clients}
              </div>
              <p className="text-xs text-slate-500 mt-1">Clientes ativos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="reps">Reps</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* Trends */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>📈 Receita Mensal (12 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthly_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4f46e5" name="Receita" strokeWidth={2} />
                    <Line type="monotone" dataKey="sales_count" stroke="#06b6d4" name="# Vendas" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(data.pipeline_distribution || {}).map(([stage, count]) => ({
                          name: stage,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(data.pipeline_distribution || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Conversão por Estágio</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(data.conversion_by_stage || {}).map(([stage, rate]) => ({
                      stage,
                      conversão: parseFloat(rate)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="conversão" fill="#8b5cf6" name="Taxa %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rep Performance */}
          <TabsContent value="reps">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Representante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.rep_performance?.map((rep, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{rep.name}</h4>
                          <p className="text-xs text-slate-500">{rep.total_clients} clientes</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            R$ {(rep.revenue / 1000).toFixed(1)}k
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 mt-1">
                            {rep.conversion_rate}% conversão
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded">
                          <p className="text-slate-600">Deals Fechados</p>
                          <p className="font-bold text-slate-900">{rep.closed_deals}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <p className="text-slate-600">Visitas</p>
                          <p className="font-bold text-slate-900">{rep.visits || 0}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <p className="text-slate-600">Tarefas Pendentes</p>
                          <p className="font-bold text-slate-900">{rep.tasks_pending}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast */}
          <TabsContent value="forecast">
            <Card>
              <CardHeader>
                <CardTitle>📊 Previsão de Receita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Média Mensal</p>
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {(data.summary?.avg_monthly_revenue / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Forecast 6 Meses</p>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {(data.summary?.forecast_6_months / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Forecast 12 Meses</p>
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {(data.summary?.forecast_12_months / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Últimas Vendas</h4>
                  <div className="space-y-2">
                    {data.recent_sales?.map((sale, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-sm font-semibold text-slate-900">{sale.client}</p>
                          <p className="text-xs text-slate-500">{sale.equipment}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R$ {(sale.value / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-slate-500">{sale.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}