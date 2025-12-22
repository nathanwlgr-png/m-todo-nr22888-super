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
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
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

  const { data: equipment = [], isLoading: loadingEquipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 200)
  });

  // Get unique vendors
  const vendors = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.created_by).filter(Boolean))];
    return unique;
  }, [clients]);

  // Filtered clients
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

  // Report metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const avgScore = filteredClients.length > 0
      ? Math.round(filteredClients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / filteredClients.length)
      : 0;
    const hot = filteredClients.filter(c => c.status === 'quente').length;
    const warm = filteredClients.filter(c => c.status === 'morno').length;
    const cold = filteredClients.filter(c => c.status === 'frio').length;

    return {
      totalClients: filteredClients.length,
      totalRevenue,
      avgScore,
      hot,
      warm,
      cold
    };
  }, [filteredClients]);

  const exportCSV = () => {
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
    link.download = `relatorio_seamaty_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Relatório Seamaty', 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 28);

    // Metrics
    doc.setFontSize(12);
    doc.text('Resumo', 20, 40);
    doc.setFontSize(10);
    doc.text(`Total de Clientes: ${metrics.totalClients}`, 20, 48);
    doc.text(`Receita Projetada: R$ ${metrics.totalRevenue.toLocaleString('pt-BR')}`, 20, 55);
    doc.text(`Score Médio: ${metrics.avgScore}%`, 20, 62);
    doc.text(`Quentes: ${metrics.hot} | Mornos: ${metrics.warm} | Frios: ${metrics.cold}`, 20, 69);

    // Clients table
    doc.setFontSize(12);
    doc.text('Clientes', 20, 82);
    
    let y = 90;
    doc.setFontSize(8);
    filteredClients.slice(0, 30).forEach((client, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const line = `${client.first_name} | ${clientTypeLabels[client.client_type]} | ${statusLabels[client.status]} | Score: ${client.purchase_score || 0}%`;
      doc.text(line, 20, y);
      y += 6;
    });

    if (filteredClients.length > 30) {
      doc.text(`... e mais ${filteredClients.length - 30} clientes`, 20, y);
    }

    doc.save(`relatorio_seamaty_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loadingClients || loadingEquipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Relatórios Avançados</h1>
            <p className="text-xs text-slate-500">Análise de clientes e vendas</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Filtros
          </h3>
          
          <div className="space-y-4">
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

            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="quente">Quente</SelectItem>
                  <SelectItem value="morno">Morno</SelectItem>
                  <SelectItem value="frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tipo de Cliente</Label>
              <Select value={filters.clientType} onValueChange={(value) => setFilters({ ...filters, clientType: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(clientTypeLabels).filter(([k]) => k !== 'all').map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Vendedor</Label>
              <Select value={filters.createdBy} onValueChange={(value) => setFilters({ ...filters, createdBy: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Metrics Summary */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <h3 className="font-semibold text-slate-800 mb-3">Resumo</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.totalClients}</p>
            </div>
            <div>
              <p className="text-slate-600">Pipeline Total</p>
              <p className="text-xl font-bold text-emerald-600">
                R$ {(metrics.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-slate-600">Score Médio</p>
              <p className="text-xl font-bold text-indigo-600">{metrics.avgScore}%</p>
            </div>
            <div>
              <p className="text-slate-600">Distribuição</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔥 {metrics.hot}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🌡️ {metrics.warm}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">❄️ {metrics.cold}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Equipments Summary */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Equipamentos Cadastrados</h3>
          <div className="space-y-2">
            {equipment.slice(0, 5).map(eq => (
              <div key={eq.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-700">{eq.name}</span>
                <span className="font-semibold text-emerald-600">
                  R$ {eq.price.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
            {equipment.length > 5 && (
              <p className="text-xs text-slate-500 pt-2">+ {equipment.length - 5} equipamentos</p>
            )}
          </div>
        </Card>

        {/* Client List Preview */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Clientes Filtrados ({filteredClients.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredClients.slice(0, 10).map(client => (
              <div key={client.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-slate-800">{client.first_name}</p>
                  <p className="text-xs text-slate-500">{clientTypeLabels[client.client_type]}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    client.status === 'quente' ? 'bg-red-100 text-red-700' :
                    client.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {statusLabels[client.status]}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{client.purchase_score || 0}%</p>
                </div>
              </div>
            ))}
            {filteredClients.length > 10 && (
              <p className="text-xs text-slate-500 text-center pt-2">+ {filteredClients.length - 10} clientes</p>
            )}
          </div>
        </Card>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={exportCSV}
            variant="outline"
            className="h-12 border-2"
            disabled={filteredClients.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={exportPDF}
            className="h-12 bg-indigo-600 hover:bg-indigo-700"
            disabled={filteredClients.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}