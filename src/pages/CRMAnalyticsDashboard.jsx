import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CRMAnalyticsDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30');
  const [regionFilter, setRegionFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  // Filtrar dados por data
  const getFilteredDate = () => {
    const now = new Date();
    switch(dateRange) {
      case '7': return subDays(now, 7);
      case '30': return subDays(now, 30);
      case '90': return subDays(now, 90);
      case '180': return subMonths(now, 6);
      case '365': return subMonths(now, 12);
      default: return subDays(now, 30);
    }
  };

  const filteredData = useMemo(() => {
    const cutoffDate = getFilteredDate();

    let filteredClients = clients.filter(c => new Date(c.created_date) >= cutoffDate);
    let filteredSales = sales.filter(s => new Date(s.sale_date) >= cutoffDate);
    let filteredInteractions = interactions.filter(i => new Date(i.created_date) >= cutoffDate);

    if (regionFilter !== 'all') {
      filteredClients = filteredClients.filter(c => c.city === regionFilter);
      filteredSales = filteredSales.filter(s => {
        const client = clients.find(c => c.id === s.client_id);
        return client?.city === regionFilter;
      });
    }

    if (productFilter !== 'all') {
      filteredSales = filteredSales.filter(s => s.equipment_name?.includes(productFilter));
    }

    return {
      clients: filteredClients,
      sales: filteredSales,
      interactions: filteredInteractions
    };
  }, [clients, sales, interactions, dateRange, regionFilter, productFilter]);

  // Métricas gerais
  const metrics = useMemo(() => {
    const totalRevenue = filteredData.sales
      .filter(s => s.status === 'fechada')
      .reduce((sum, s) => sum + (s.sale_value || 0), 0);

    const avgDealSize = filteredData.sales.length > 0 
      ? totalRevenue / filteredData.sales.filter(s => s.status === 'fechada').length 
      : 0;

    const conversionRate = filteredData.clients.length > 0
      ? (filteredData.sales.filter(s => s.status === 'fechada').length / filteredData.clients.length) * 100
      : 0;

    const avgScore = filteredData.clients.reduce((sum, c) => sum + (c.purchase_score || 50), 0) / 
                     (filteredData.clients.length || 1);

    const churnRisk = filteredData.clients.filter(c => c.ai_sales_intelligence?.churn_risk > 50).length;

    return {
      totalRevenue,
      avgDealSize,
      conversionRate,
      avgScore,
      churnRisk,
      totalClients: filteredData.clients.length,
      totalSales: filteredData.sales.filter(s => s.status === 'fechada').length,
      totalInteractions: filteredData.interactions.length
    };
  }, [filteredData]);

  // Vendas por região
  const salesByRegion = useMemo(() => {
    const regionMap = {};
    filteredData.sales.forEach(sale => {
      const client = clients.find(c => c.id === sale.client_id);
      const city = client?.city || 'Não definido';
      if (!regionMap[city]) {
        regionMap[city] = { city, value: 0, count: 0 };
      }
      regionMap[city].value += sale.sale_value || 0;
      regionMap[city].count += 1;
    });
    return Object.values(regionMap).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData.sales, clients]);

  // Vendas por produto
  const salesByProduct = useMemo(() => {
    const productMap = {};
    filteredData.sales.forEach(sale => {
      const product = sale.equipment_name || 'Não definido';
      if (!productMap[product]) {
        productMap[product] = { name: product, value: 0, count: 0 };
      }
      productMap[product].value += sale.sale_value || 0;
      productMap[product].count += 1;
    });
    return Object.values(productMap).sort((a, b) => b.value - a.value);
  }, [filteredData.sales]);

  // Distribuição de segmentos
  const segmentDistribution = useMemo(() => {
    const segments = {};
    filteredData.clients.forEach(client => {
      const segment = client.ai_segment || 'Sem Segmento';
      segments[segment] = (segments[segment] || 0) + 1;
    });
    return Object.entries(segments).map(([name, value]) => ({ name, value }));
  }, [filteredData.clients]);

  // Pipeline distribution
  const pipelineDistribution = useMemo(() => {
    const pipeline = {};
    filteredData.clients.forEach(client => {
      const stage = client.pipeline_stage || 'lead';
      pipeline[stage] = (pipeline[stage] || 0) + 1;
    });
    return Object.entries(pipeline).map(([name, value]) => ({ name, value }));
  }, [filteredData.clients]);

  // Regiões únicas para filtro
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(clients.map(c => c.city).filter(Boolean))];
    return uniqueRegions.sort();
  }, [clients]);

  // Produtos únicos para filtro
  const products = useMemo(() => {
    const uniqueProducts = [...new Set(sales.map(s => s.equipment_name).filter(Boolean))];
    return uniqueProducts.sort();
  }, [sales]);

  // Tendência de vendas ao longo do tempo
  const salesTrend = useMemo(() => {
    const trendMap = {};
    filteredData.sales.forEach(sale => {
      const date = format(new Date(sale.sale_date), 'yyyy-MM');
      if (!trendMap[date]) {
        trendMap[date] = { date, revenue: 0, count: 0 };
      }
      trendMap[date].revenue += sale.sale_value || 0;
      trendMap[date].count += 1;
    });
    return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData.sales]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">CRM Analytics</h1>
            <p className="text-xs text-white/70">Dashboard Completo de Análises</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-2">
          <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
            <div className="grid grid-cols-3 gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-white/90 border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-white/90 border-none">
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Regiões</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="bg-white/90 border-none">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Produtos</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-16 space-y-4">
        {/* KPIs Principais */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Receita Total</p>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              R$ {(metrics.totalRevenue / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metrics.totalSales} vendas
            </p>
          </Card>

          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Ticket Médio</p>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              R$ {(metrics.avgDealSize / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-slate-500">por venda</p>
          </Card>

          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Taxa Conversão</p>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {metrics.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">{metrics.totalClients} clientes</p>
          </Card>

          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Score Médio</p>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {metrics.avgScore.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">de 100</p>
          </Card>
        </div>

        {/* Alertas */}
        {metrics.churnRisk > 0 && (
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {metrics.churnRisk} clientes em risco
                </p>
                <p className="text-xs text-red-600">Alto risco de churn detectado</p>
              </div>
            </div>
          </Card>
        )}

        {/* Vendas por Região */}
        <Card className="p-4 bg-white shadow-lg">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Vendas por Região</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByRegion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Vendas por Produto */}
        <Card className="p-4 bg-white shadow-lg">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Vendas por Produto</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={salesByProduct}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name.substring(0, 15)}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {salesByProduct.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Tendência de Vendas */}
        <Card className="p-4 bg-white shadow-lg">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Tendência de Vendas</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição de Segmentos */}
        <Card className="p-4 bg-white shadow-lg">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Segmentos de Clientes</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {segmentDistribution.map((segment, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{segment.name}</span>
                <Badge>{segment.value}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="p-4 bg-white shadow-lg">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Pipeline de Vendas</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {pipelineDistribution.map((stage, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 capitalize">{stage.name}</span>
                <Badge variant="outline">{stage.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}