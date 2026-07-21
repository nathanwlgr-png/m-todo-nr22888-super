import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, FileText, Loader2, TrendingUp, Sparkles, Target, Users, Calendar, BarChart3, Brain } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import MarketBenchmarkAnalysis from '@/components/MarketBenchmarkAnalysis';
import GoogleSheetsHistoryExport from '@/components/reports/GoogleSheetsHistoryExport';

const statusLabels = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
  all: 'Todos'
};

const clientTypeLabels = {
  clinica_pequena: 'Clínica Pequena',
  clinica_media: 'Clínica Média',
  hospital_veterinario: 'Hospital Veterinário',
  laboratorio_terceirizado: 'Lab. Terceirizado',
  clinica_especializada: 'Clínica Especializada',
  sem_equipamento: 'Sem Equipamento',
  all: 'Todos'
};

export default function Reports() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    clientType: 'all',
    createdBy: 'all'
  });

  const [aiInsights, setAiInsights] = useState(null);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100)
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const vendors = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.created_by).filter(Boolean))];
    return unique;
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (filters.startDate && client.created_date < filters.startDate) return false;
      if (filters.endDate && client.created_date > filters.endDate) return false;
      if (filters.status !== 'all' && client.status !== filters.status) return false;
      if (filters.clientType !== 'all' && client.client_type !== filters.clientType) return false;
      if (filters.createdBy !== 'all' && client.created_by !== filters.createdBy) return false;
      return true;
    });
  }, [clients, filters]);

  const salesMetrics = useMemo(() => {
    const closedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const totalValue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgValue = closedSales.length > 0 ? totalValue / closedSales.length : 0;
    
    const now = new Date();
    const thisMonth = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });

    const conversionRate = visits.length > 0
      ? Math.round((closedSales.length / visits.filter(v => v.status === 'realizada').length) * 100)
      : 0;

    return {
      total: closedSales.length,
      thisMonth: thisMonth.length,
      totalValue,
      avgValue,
      conversionRate
    };
  }, [sales, visits]);

  const clientMetrics = useMemo(() => {
    const totalRevenue = filteredClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const avgScore = filteredClients.length > 0
      ? Math.round(filteredClients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / filteredClients.length)
      : 0;
    const hot = filteredClients.filter(c => c.status === 'quente').length;
    const warm = filteredClients.filter(c => c.status === 'morno').length;
    const cold = filteredClients.filter(c => c.status === 'frio').length;

    return {
      total: filteredClients.length,
      totalRevenue,
      avgScore,
      hot,
      warm,
      cold
    };
  }, [filteredClients]);

  const advancedMetrics = useMemo(() => {
    const clientsByMonth = {};
    clients.forEach(c => {
      const month = c.created_date ? c.created_date.substring(0, 7) : 'unknown';
      clientsByMonth[month] = (clientsByMonth[month] || 0) + 1;
    });

    const avgSalesCycle = visits.filter(v => v.status === 'realizada').length > 0
      ? Math.round(visits.filter(v => v.status === 'realizada').length / (sales.filter(s => s.status === 'fechada').length || 1))
      : 0;

    const revenueByStatus = {
      quente: clients.filter(c => c.status === 'quente').reduce((sum, c) => sum + (c.projected_revenue || 0), 0),
      morno: clients.filter(c => c.status === 'morno').reduce((sum, c) => sum + (c.projected_revenue || 0), 0),
      frio: clients.filter(c => c.status === 'frio').reduce((sum, c) => sum + (c.projected_revenue || 0), 0)
    };

    const revenuePerClient = clients.length > 0
      ? Math.round(sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0) / clients.length)
      : 0;

    return {
      clientsByMonth,
      avgSalesCycle,
      revenueByStatus,
      revenuePerClient
    };
  }, [clients, visits, sales]);

  const generateAIInsights = async () => {
    setAnalyzingInsights(true);

    const prompt = `
Analise os dados de vendas e clientes abaixo e forneça insights estratégicos:

VENDAS:
- Total fechadas: ${salesMetrics.total}
- Valor total: R$ ${salesMetrics.totalValue}
- Ticket médio: R$ ${salesMetrics.avgValue}
- Taxa de conversão: ${salesMetrics.conversionRate}%
- Ciclo médio de vendas: ${advancedMetrics.avgSalesCycle} visitas

CLIENTES:
- Total: ${clientMetrics.total}
- Pipeline: R$ ${clientMetrics.totalRevenue}
- Score médio: ${clientMetrics.avgScore}%
- Quentes: ${clientMetrics.hot}, Mornos: ${clientMetrics.warm}, Frios: ${clientMetrics.cold}
- Receita por status: Quentes R$${advancedMetrics.revenueByStatus.quente}, Mornos R$${advancedMetrics.revenueByStatus.morno}, Frios R$${advancedMetrics.revenueByStatus.frio}

HISTÓRICO:
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Crescimento de clientes nos últimos meses: ${JSON.stringify(advancedMetrics.clientsByMonth)}

Com base nisso, forneça em português brasileiro:
1. market_trends: Array com 3 tendências de mercado identificadas (seja específico sobre equipamentos veterinários)
2. client_behavior_insights: Array com 3 insights sobre comportamento dos clientes
3. performance_bottlenecks: Array com 2-3 gargalos que estão impedindo mais vendas
4. proactive_actions: Array com 4-5 ações proativas e específicas para otimizar vendas (cada uma deve ser acionável e incluir quem fazer, como fazer, e resultado esperado)
5. revenue_opportunities: Número estimado de receita adicional possível nos próximos 3 meses em R$
6. priority_focus: String com o foco prioritário único para o próximo mês

Seja específico, prático e focado em AÇÃO. Pense como um consultor de vendas veterinárias.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          market_trends: { type: "array", items: { type: "string" } },
          client_behavior_insights: { type: "array", items: { type: "string" } },
          performance_bottlenecks: { type: "array", items: { type: "string" } },
          proactive_actions: { type: "array", items: { type: "string" } },
          revenue_opportunities: { type: "number" },
          priority_focus: { type: "string" }
        }
      }
    });

    setAiInsights(response);
    setAnalyzingInsights(false);
  };

  const exportClientsCSV = () => {
    const headers = ['Nome', 'Tipo', 'Status', 'Score', 'Receita Projetada', 'Cidade', 'Data Cadastro', 'Vendedor'];
    const rows = filteredClients.map(c => [
      c.first_name || '',
      clientTypeLabels[c.client_type] || '',
      statusLabels[c.status] || '',
      c.purchase_score || 0,
      c.projected_revenue || 0,
      c.city || '',
      c.created_date || '',
      c.created_by || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportSalesCSV = () => {
    const headers = ['Data', 'Cliente', 'Equipamento', 'Valor', 'Status', 'Vendedor'];
    const rows = sales.map(s => [
      s.sale_date || '',
      s.client_name || '',
      s.equipment_name || '',
      s.sale_value || 0,
      s.status || '',
      s.salesperson || s.created_by || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatorio - Metodo NR', 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 28);

    doc.setFontSize(12);
    doc.text('Vendas', 20, 40);
    doc.setFontSize(10);
    doc.text(`Total Fechadas: ${salesMetrics.total}`, 20, 48);
    doc.text(`Valor Total: R$ ${salesMetrics.totalValue.toLocaleString('pt-BR')}`, 20, 55);
    doc.text(`Ticket Medio: R$ ${salesMetrics.avgValue.toLocaleString('pt-BR')}`, 20, 62);
    doc.text(`Conversao: ${salesMetrics.conversionRate}%`, 20, 69);

    doc.setFontSize(12);
    doc.text('Clientes', 20, 82);
    doc.setFontSize(10);
    doc.text(`Total: ${clientMetrics.total}`, 20, 90);
    doc.text(`Pipeline: R$ ${clientMetrics.totalRevenue.toLocaleString('pt-BR')}`, 20, 97);

    doc.save(`relatorio_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loadingClients || loadingSales || loadingVisits) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Relatórios</h1>
            <p className="text-xs text-slate-500">Análise de vendas</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <GoogleSheetsHistoryExport />

        {/* Market Benchmark */}
        <MarketBenchmarkAnalysis />

        {/* Sales Metrics */}
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Métricas de Vendas</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-slate-600">Vendas Fechadas</p>
              <p className="text-2xl font-bold text-emerald-600">{salesMetrics.total}</p>
              <p className="text-xs text-slate-500">{salesMetrics.thisMonth} este mês</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Valor Total</p>
              <p className="text-xl font-bold text-emerald-600">
                R$ {(salesMetrics.totalValue / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Ticket Médio</p>
              <p className="text-xl font-bold text-indigo-600">
                R$ {(salesMetrics.avgValue / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Taxa Conversão</p>
              <p className="text-xl font-bold text-amber-600">{salesMetrics.conversionRate}%</p>
            </div>
          </div>
        </Card>

        {/* Advanced Metrics Dashboard */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Dashboard Avançado</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600">Ciclo de Vendas</p>
              <p className="text-xl font-bold text-blue-600">{advancedMetrics.avgSalesCycle}</p>
              <p className="text-xs text-slate-500">visitas até fechar</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Receita/Cliente</p>
              <p className="text-xl font-bold text-blue-600">
                R$ {(advancedMetrics.revenuePerClient / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-600 mb-2">Pipeline por Status</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">🔥 Quentes</span>
                  <span className="font-semibold">R$ {(advancedMetrics.revenueByStatus.quente / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600">🌡️ Mornos</span>
                  <span className="font-semibold">R$ {(advancedMetrics.revenueByStatus.morno / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">❄️ Frios</span>
                  <span className="font-semibold">R$ {(advancedMetrics.revenueByStatus.frio / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Insights Button */}
        {!aiInsights && (
          <Button
            onClick={generateAIInsights}
            disabled={analyzingInsights || clients.length === 0}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {analyzingInsights ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analisando Dados...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Gerar Análise com IA
              </>
            )}
          </Button>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <>
            {/* Market Trends */}
            <Card className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-slate-800">Tendências de Mercado</h3>
              </div>
              <ul className="space-y-2">
                {aiInsights.market_trends?.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-violet-500 mt-0.5">📊</span>
                    {trend}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Client Behavior */}
            <Card className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-cyan-600" />
                <h3 className="font-semibold text-slate-800">Comportamento dos Clientes</h3>
              </div>
              <ul className="space-y-2">
                {aiInsights.client_behavior_insights?.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-cyan-500 mt-0.5">👥</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Performance Bottlenecks */}
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-slate-800">Gargalos de Performance</h3>
              </div>
              <ul className="space-y-2">
                {aiInsights.performance_bottlenecks?.map((bottleneck, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    {bottleneck}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Proactive Actions */}
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">Ações Proativas Recomendadas</h3>
              </div>
              <ul className="space-y-2">
                {aiInsights.proactive_actions?.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded-lg">
                    <span className="text-emerald-600 font-bold mt-0.5">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Revenue Opportunity */}
            {aiInsights.revenue_opportunities && (
              <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Oportunidade de Receita (3 meses)</span>
                  <span className="text-2xl font-bold text-amber-600">
                    R$ {(aiInsights.revenue_opportunities / 1000).toFixed(0)}k
                  </span>
                </div>
              </Card>
            )}

            {/* Priority Focus */}
            {aiInsights.priority_focus && (
              <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-300">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-slate-800">Foco Prioritário do Mês</h3>
                </div>
                <p className="text-slate-700 font-medium">{aiInsights.priority_focus}</p>
              </Card>
            )}

            <Button
              onClick={() => setAiInsights(null)}
              variant="outline"
              className="w-full"
            >
              Gerar Nova Análise
            </Button>
          </>
        )}

        {/* Filters */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4">Filtros de Clientes</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="quente">Quente</SelectItem>
                <SelectItem value="morno">Morno</SelectItem>
                <SelectItem value="frio">Frio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.clientType} onValueChange={(value) => setFilters({ ...filters, clientType: value })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(clientTypeLabels).filter(([k]) => k !== 'all').map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Client Metrics */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Clientes ({clientMetrics.total})</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-600">Pipeline</p>
              <p className="text-xl font-bold text-blue-600">
                R$ {(clientMetrics.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-slate-600">Score Médio</p>
              <p className="text-xl font-bold text-indigo-600">{clientMetrics.avgScore}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-600 mb-2">Distribuição</p>
              <div className="flex gap-2">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔥 {clientMetrics.hot}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🌡️ {clientMetrics.warm}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">❄️ {clientMetrics.cold}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Export */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={exportClientsCSV}
            variant="outline"
            size="sm"
            disabled={filteredClients.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Clientes
          </Button>
          <Button
            onClick={exportSalesCSV}
            variant="outline"
            size="sm"
            disabled={sales.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Vendas
          </Button>
          <Button
            onClick={exportPDF}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
}