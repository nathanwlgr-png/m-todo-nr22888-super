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
import { ArrowLeft, Download, FileText, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

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