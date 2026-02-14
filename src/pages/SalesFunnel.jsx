import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Zap,
  Loader2,
  Filter,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Funnel,
  FunnelChart
} from 'recharts';
import ChartDetailsOverlay from '@/components/ChartDetailsOverlay';

const STATUS_COLORS = {
  quente: '#ef4444',
  morno: '#f59e0b',
  frio: '#3b82f6'
};

export default function SalesFunnel() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('30'); // days
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayClients, setOverlayClients] = useState([]);
  const [overlayTitle, setOverlayTitle] = useState('');

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: sequences = [], isLoading: sequencesLoading } = useQuery({
    queryKey: ['followup-sequences'],
    queryFn: () => base44.entities.FollowUpSequence.list('-created_date', 100)
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500)
  });

  // Get unique salespersons
  const salespersons = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.created_by).filter(Boolean))];
    return unique;
  }, [clients]);

  // Filter data
  const filteredData = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeFilter) * 24 * 60 * 60 * 1000);

    let filteredClients = clients.filter(c => {
      const createdDate = new Date(c.created_date);
      const timeMatch = createdDate >= daysAgo;
      const salesPersonMatch = salespersonFilter === 'all' || c.created_by === salespersonFilter;
      return timeMatch && salesPersonMatch;
    });

    let filteredSales = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      const timeMatch = saleDate >= daysAgo;
      const salesPersonMatch = salespersonFilter === 'all' || s.salesperson === salespersonFilter;
      return timeMatch && salesPersonMatch;
    });

    return { clients: filteredClients, sales: filteredSales };
  }, [clients, sales, timeFilter, salespersonFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const { clients: filteredClients, sales: filteredSales } = filteredData;

    const totalLeads = filteredClients.length;
    const hotLeads = filteredClients.filter(c => c.status === 'quente').length;
    const warmLeads = filteredClients.filter(c => c.status === 'morno').length;
    const coldLeads = filteredClients.filter(c => c.status === 'frio').length;

    const closedSales = filteredSales.filter(s => s.status === 'fechada').length;
    const conversionRate = totalLeads > 0 ? ((closedSales / totalLeads) * 100).toFixed(1) : 0;

    const totalRevenue = filteredSales
      .filter(s => s.status === 'fechada')
      .reduce((sum, s) => sum + (s.sale_value || 0), 0);

    const projectedRevenue = filteredClients
      .reduce((sum, c) => sum + (c.projected_revenue || 0), 0);

    const avgScore = totalLeads > 0
      ? Math.round(filteredClients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / totalLeads)
      : 0;

    const activeSequences = sequences.filter(s => s.active).length;

    const clientsWithVisits = filteredClients.filter(c => 
      visits.some(v => v.client_id === c.id && v.status === 'realizada')
    ).length;

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      closedSales,
      conversionRate,
      totalRevenue,
      projectedRevenue,
      avgScore,
      activeSequences,
      clientsWithVisits
    };
  }, [filteredData, sequences, visits]);

  // Functions to open overlay
  const showClientsInOverlay = (filterFn, title) => {
    const clientsToShow = filteredData.clients.filter(filterFn);
    setOverlayClients(clientsToShow);
    setOverlayTitle(title);
    setOverlayOpen(true);
  };

  // Funnel data
  const funnelData = [
    { name: 'Leads Totais', value: metrics.totalLeads, fill: '#6366f1' },
    { name: 'Com Visita', value: metrics.clientsWithVisits, fill: '#8b5cf6' },
    { name: 'Quentes', value: metrics.hotLeads, fill: '#ef4444' },
    { name: 'Vendas Fechadas', value: metrics.closedSales, fill: '#10b981' }
  ];

  // Status distribution
  const statusData = [
    { name: 'Quente', value: metrics.hotLeads, color: STATUS_COLORS.quente },
    { name: 'Morno', value: metrics.warmLeads, color: STATUS_COLORS.morno },
    { name: 'Frio', value: metrics.coldLeads, color: STATUS_COLORS.frio }
  ];

  // Revenue by status
  const revenueByStatus = useMemo(() => {
    const { clients: filteredClients } = filteredData;
    return [
      { 
        status: 'Quente', 
        revenue: filteredClients.filter(c => c.status === 'quente').reduce((sum, c) => sum + (c.projected_revenue || 0), 0) / 1000,
        color: STATUS_COLORS.quente
      },
      { 
        status: 'Morno', 
        revenue: filteredClients.filter(c => c.status === 'morno').reduce((sum, c) => sum + (c.projected_revenue || 0), 0) / 1000,
        color: STATUS_COLORS.morno
      },
      { 
        status: 'Frio', 
        revenue: filteredClients.filter(c => c.status === 'frio').reduce((sum, c) => sum + (c.projected_revenue || 0), 0) / 1000,
        color: STATUS_COLORS.frio
      }
    ];
  }, [filteredData]);

  if (clientsLoading || salesLoading || sequencesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Funil de Vendas</h1>
            <p className="text-sm text-indigo-200">Dashboard estratégico</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-white text-xs mb-2 block">Período</Label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white text-xs mb-2 block">Vendedor</Label>
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {salespersons.map(sp => (
                  <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.totalLeads}</p>
                <p className="text-xs text-slate-500">Leads</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.conversionRate}%</p>
                <p className="text-xs text-slate-500">Conversão</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">R$ {(metrics.totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-500">Realizado</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">R$ {(metrics.projectedRevenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-500">Projetado</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Funil de Conversão
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
                onClick={(data) => {
                  if (data.name === 'Leads Totais') {
                    showClientsInOverlay(() => true, 'Todos os Leads');
                  } else if (data.name === 'Com Visita') {
                    showClientsInOverlay(
                      (c) => visits.some(v => v.client_id === c.id && v.status === 'realizada'),
                      'Clientes com Visita Realizada'
                    );
                  } else if (data.name === 'Quentes') {
                    showClientsInOverlay((c) => c.status === 'quente', 'Clientes Quentes');
                  } else if (data.name === 'Vendas Fechadas') {
                    const closedSaleClientIds = sales.filter(s => s.status === 'fechada').map(s => s.client_id);
                    showClientsInOverlay((c) => closedSaleClientIds.includes(c.id), 'Vendas Fechadas');
                  }
                }}
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {funnelData.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  if (item.name === 'Leads Totais') {
                    showClientsInOverlay(() => true, 'Todos os Leads');
                  } else if (item.name === 'Com Visita') {
                    showClientsInOverlay(
                      (c) => visits.some(v => v.client_id === c.id && v.status === 'realizada'),
                      'Clientes com Visita Realizada'
                    );
                  } else if (item.name === 'Quentes') {
                    showClientsInOverlay((c) => c.status === 'quente', 'Clientes Quentes');
                  } else if (item.name === 'Vendas Fechadas') {
                    const closedSaleClientIds = sales.filter(s => s.status === 'fechada').map(s => s.client_id);
                    showClientsInOverlay((c) => closedSaleClientIds.includes(c.id), 'Vendas Fechadas');
                  }
                }}
                className="flex items-center gap-2 text-xs hover:bg-slate-50 p-1 rounded transition-colors cursor-pointer"
              >
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-600">{item.name}: {item.value}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  const statusMap = { 'Quente': 'quente', 'Morno': 'morno', 'Frio': 'frio' };
                  showClientsInOverlay(
                    (c) => c.status === statusMap[data.name],
                    `Clientes ${data.name}`
                  );
                }}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Status */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Receita Projetada por Status (mil R$)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="revenue" 
                radius={[8, 8, 0, 0]}
                onClick={(data) => {
                  const statusMap = { 'Quente': 'quente', 'Morno': 'morno', 'Frio': 'frio' };
                  showClientsInOverlay(
                    (c) => c.status === statusMap[data.status],
                    `Clientes ${data.status}`
                  );
                }}
              >
                {revenueByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{metrics.hotLeads}</p>
              <p className="text-sm text-slate-600 mt-1">Clientes Quentes</p>
              <Badge className="mt-2 bg-red-100 text-red-700">Alta prioridade</Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{metrics.activeSequences}</p>
              <p className="text-sm text-slate-600 mt-1">Sequências Ativas</p>
              <Badge className="mt-2 bg-purple-100 text-purple-700">
                <Zap className="w-3 h-3 mr-1" />
                Automação
              </Badge>
            </div>
          </Card>
        </div>

        {/* Score Average */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Score Médio de Compra</p>
              <p className="text-3xl font-bold text-indigo-700 mt-1">{metrics.avgScore}%</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      <ChartDetailsOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        clients={overlayClients}
        title={overlayTitle}
      />
    </div>
  );
}