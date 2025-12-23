import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, Filter, DollarSign, Target, Users } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AdvancedSalesReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Filtrar vendas
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Filtro de data
      if (dateRange.from && dateRange.to && sale.sale_date) {
        const saleDate = parseISO(sale.sale_date);
        const inRange = isWithinInterval(saleDate, { start: dateRange.from, end: dateRange.to });
        if (!inRange) return false;
      }

      // Filtro de vendedor
      if (selectedSalesperson !== 'all' && sale.salesperson !== selectedSalesperson) {
        return false;
      }

      return true;
    });
  }, [sales, dateRange, selectedSalesperson]);

  // Métricas por campanha
  const campaignMetrics = useMemo(() => {
    return campaigns.map(campaign => {
      const campaignSales = filteredSales.filter(s => {
        if (!campaign.target_clients) return false;
        return campaign.target_clients.includes(s.client_id);
      });

      const revenue = campaignSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const roi = campaign.budget > 0 ? ((revenue - campaign.budget) / campaign.budget) * 100 : 0;

      return {
        name: campaign.name,
        revenue,
        budget: campaign.budget || 0,
        roi: roi.toFixed(1),
        sales: campaignSales.length,
        leads: campaign.metrics?.current_leads || 0,
        conversion: campaign.metrics?.current_leads > 0 
          ? ((campaignSales.length / campaign.metrics.current_leads) * 100).toFixed(1)
          : 0
      };
    });
  }, [campaigns, filteredSales]);

  // Performance por vendedor
  const salesByPerson = useMemo(() => {
    const grouped = {};
    filteredSales.forEach(sale => {
      const seller = sale.salesperson || 'Não atribuído';
      if (!grouped[seller]) {
        grouped[seller] = {
          name: seller,
          sales: 0,
          revenue: 0
        };
      }
      grouped[seller].sales += 1;
      grouped[seller].revenue += sale.sale_value || 0;
    });
    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Funil de vendas
  const funnelData = useMemo(() => {
    const stages = [
      { stage: 'Leads', count: clients.filter(c => c.pipeline_stage === 'lead').length },
      { stage: 'Qualificados', count: clients.filter(c => c.pipeline_stage === 'qualificado').length },
      { stage: 'Proposta', count: clients.filter(c => c.pipeline_stage === 'proposta').length },
      { stage: 'Negociação', count: clients.filter(c => c.pipeline_stage === 'negociacao').length },
      { stage: 'Fechados', count: filteredSales.length }
    ];

    return stages.map((s, i) => ({
      ...s,
      conversion: i > 0 ? ((s.count / stages[0].count) * 100).toFixed(1) : 100
    }));
  }, [clients, filteredSales]);

  // Receita ao longo do tempo
  const revenueOverTime = useMemo(() => {
    const monthly = {};
    filteredSales.forEach(sale => {
      if (!sale.sale_date) return;
      const month = format(parseISO(sale.sale_date), 'MMM/yy', { locale: ptBR });
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += sale.sale_value || 0;
    });

    return Object.entries(monthly).map(([month, revenue]) => ({
      month,
      revenue
    }));
  }, [filteredSales]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 px-4 pt-4 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Relatórios Avançados</h1>
            <p className="text-sm text-indigo-200">Análise detalhada de vendas</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{filteredSales.length}</p>
            <p className="text-xs text-indigo-200">Vendas</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">R$ {(totalRevenue / 1000).toFixed(0)}k</p>
            <p className="text-xs text-indigo-200">Receita</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">R$ {(avgTicket / 1000).toFixed(0)}k</p>
            <p className="text-xs text-indigo-200">Ticket Médio</p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Filtros */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {dateRange.from ? format(dateRange.from, 'dd/MM/yy') : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs text-slate-600 mb-1 block">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {dateRange.to ? format(dateRange.to, 'dd/MM/yy') : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1 block">Vendedor</label>
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Vendedores</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* ROI por Campanha */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            ROI por Campanha
          </h3>
          <div className="space-y-3">
            {campaignMetrics.map((cm, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800">{cm.name}</span>
                  <span className={`text-sm font-bold ${cm.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ROI: {cm.roi}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded">
                    <p className="text-slate-500">Investido</p>
                    <p className="font-semibold">R$ {cm.budget.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-green-700">Receita</p>
                    <p className="font-semibold text-green-900">R$ {cm.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-700">Vendas</p>
                    <p className="font-semibold text-blue-900">{cm.sales}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="text-purple-700">Conversão</p>
                    <p className="font-semibold text-purple-900">{cm.conversion}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance por Vendedor */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Performance por Vendedor
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByPerson}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6366f1" name="Receita (R$)" />
              <Bar dataKey="sales" fill="#f59e0b" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {salesByPerson.map((sp, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{sp.name}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-indigo-600">{sp.sales} vendas</span>
                  <span className="font-semibold">R$ {sp.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Funil de Vendas */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Funil de Vendas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Quantidade">
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {funnelData.map((stage, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <div className="flex gap-3">
                  <span className="text-slate-600">{stage.count}</span>
                  <span className="text-green-600 font-semibold">{stage.conversion}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Receita ao Longo do Tempo */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Receita Mensal
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Receita" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Análise de Equipamentos */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Vendas por Equipamento</h3>
          <div className="space-y-2">
            {Object.entries(
              filteredSales.reduce((acc, s) => {
                const eq = s.equipment_name || 'Não especificado';
                if (!acc[eq]) acc[eq] = { count: 0, revenue: 0 };
                acc[eq].count += 1;
                acc[eq].revenue += s.sale_value || 0;
                return acc;
              }, {})
            ).map(([equipment, data]) => (
              <div key={equipment} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">{equipment}</span>
                  <span className="text-sm text-slate-600">{data.count} vendas</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-2 bg-slate-200 rounded-full flex-1 mr-3 overflow-hidden">
                    <div 
                      className="h-full bg-purple-600"
                      style={{ width: `${(data.revenue / totalRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm">R$ {data.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}