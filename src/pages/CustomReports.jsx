import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, BarChart3, TrendingUp, Users, Calendar, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function CustomReports() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Fetch all data
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 5000).catch(() => [])
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 5000).catch(() => [])
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 5000).catch(() => [])
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 5000).catch(() => [])
  });

  // Filter by date range
  const filterByDateRange = (items, dateField) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.created_date);
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
  };

  // Report data processing
  const salesReport = useMemo(() => {
    const filtered = filterByDateRange(sales, 'sale_date');
    const byStatus = {};
    const byEquipment = {};
    
    filtered.forEach(sale => {
      byStatus[sale.status] = (byStatus[sale.status] || 0) + (sale.sale_value || 0);
      byEquipment[sale.equipment_name] = (byEquipment[sale.equipment_name] || 0) + 1;
    });

    return {
      total: filtered.reduce((sum, s) => sum + (s.sale_value || 0), 0),
      count: filtered.length,
      avg: filtered.length > 0 ? (filtered.reduce((sum, s) => sum + (s.sale_value || 0), 0) / filtered.length).toFixed(2) : 0,
      byStatus,
      byEquipment,
      items: filtered
    };
  }, [sales, startDate, endDate]);

  const clientsReport = useMemo(() => {
    let filtered = clients;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (cityFilter !== 'all') {
      filtered = filtered.filter(c => c.city === cityFilter);
    }

    const byStatus = { quente: 0, morno: 0, frio: 0 };
    const byScore = { high: 0, medium: 0, low: 0 };
    
    filtered.forEach(client => {
      if (client.status) byStatus[client.status]++;
      const score = client.purchase_score || 0;
      if (score >= 70) byScore.high++;
      else if (score >= 40) byScore.medium++;
      else byScore.low++;
    });

    return {
      total: filtered.length,
      byStatus,
      byScore,
      avgScore: filtered.length > 0 ? (filtered.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / filtered.length).toFixed(1) : 0,
      items: filtered
    };
  }, [clients, statusFilter, cityFilter]);

  const visitsReport = useMemo(() => {
    const filtered = filterByDateRange(visits, 'scheduled_date');
    const byStatus = {};
    const byType = {};

    filtered.forEach(visit => {
      byStatus[visit.status] = (byStatus[visit.status] || 0) + 1;
      byType[visit.visit_type] = (byType[visit.visit_type] || 0) + 1;
    });

    return {
      total: filtered.length,
      byStatus,
      byType,
      items: filtered
    };
  }, [visits, startDate, endDate]);

  const cities = useMemo(() => {
    const unique = [...new Set(clients.map(c => c?.city).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [clients]);

  // Export functions
  const exportPDF = async (data, title) => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text(title, 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Período: ${startDate} a ${endDate}`, 14, 25);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
      
      // Content
      doc.setFontSize(12);
      let yPos = 45;
      
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          doc.text(`${key}: `, 14, yPos);
          yPos += 6;
          Object.entries(value).forEach(([k, v]) => {
            doc.setFontSize(10);
            doc.text(`  ${k}: ${v}`, 20, yPos);
            yPos += 5;
            if (yPos > 270) {
              doc.addPage();
              yPos = 15;
            }
          });
        } else if (typeof value !== 'object') {
          doc.setFontSize(11);
          doc.text(`${key}: ${value}`, 14, yPos);
          yPos += 7;
        }
      });

      doc.save(`relatorio-${title.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = (data, title) => {
    try {
      let csv = `${title}\nPeíodo: ${startDate} a ${endDate}\nGerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      
      if (Array.isArray(data)) {
        const headers = Object.keys(data[0] || {});
        csv += headers.join(',') + '\n';
        data.forEach(item => {
          csv += headers.map(h => `"${item[h] || ''}"`).join(',') + '\n';
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          csv += `${key},${value}\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-${title.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar CSV');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Relatórios Customizados
          </h1>
          <p className="text-slate-600">Gere relatórios detalhados sobre vendas, clientes e visitas</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Status Cliente</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="quente">🔥 Quente</SelectItem>
                    <SelectItem value="morno">🌡️ Morno</SelectItem>
                    <SelectItem value="frio">❄️ Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Cidade</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                    setStatusFilter('all');
                    setCityFilter('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Resetar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="w-full bg-white rounded-xl p-1 shadow-lg mb-6">
            <TabsTrigger value="sales" className="flex-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex-1 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Visitas
            </TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          {reportType === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Receita Total</p>
                    <p className="text-3xl font-bold">R$ {salesReport.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Número de Vendas</p>
                    <p className="text-3xl font-bold">{salesReport.count}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Ticket Médio</p>
                    <p className="text-3xl font-bold">R$ {parseFloat(salesReport.avg).toLocaleString('pt-BR')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Taxa de Conversão</p>
                    <p className="text-3xl font-bold">{clients.length > 0 ? ((salesReport.count / clients.length) * 100).toFixed(1) : 0}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Detalhes por Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(salesReport.byStatus).map(([status, value]) => (
                    <div key={status} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-700 capitalize">{status}</span>
                      <span className="text-slate-900 font-bold">R$ {value.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => exportPDF({
                    ...salesReport,
                    byStatus: Object.fromEntries(Object.entries(salesReport.byStatus).map(([k, v]) => [k, `R$ ${v.toLocaleString('pt-BR')}`]))
                  }, 'Relatório de Vendas')}
                  disabled={exporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => exportCSV(salesReport.items, 'Vendas')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          )}

          {/* Clients Report */}
          {reportType === 'clients' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Total de Clientes</p>
                    <p className="text-3xl font-bold">{clientsReport.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Clientes Quentes</p>
                    <p className="text-3xl font-bold">{clientsReport.byStatus.quente || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Clientes Mornos</p>
                    <p className="text-3xl font-bold">{clientsReport.byStatus.morno || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Score Médio</p>
                    <p className="text-3xl font-bold">{clientsReport.avgScore}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Distribuição por Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-semibold">Alto (70-100%)</span>
                    <span className="font-bold">{clientsReport.byScore.high}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-semibold">Médio (40-69%)</span>
                    <span className="font-bold">{clientsReport.byScore.medium}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-semibold">Baixo (0-39%)</span>
                    <span className="font-bold">{clientsReport.byScore.low}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => exportPDF(clientsReport, 'Relatório de Clientes')}
                  disabled={exporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => exportCSV(clientsReport.items, 'Clientes')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          )}

          {/* Visits Report */}
          {reportType === 'visits' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Total de Visitas</p>
                    <p className="text-3xl font-bold">{visitsReport.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Visitas Realizadas</p>
                    <p className="text-3xl font-bold">{visitsReport.byStatus.realizada || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 border-0 text-white">
                  <CardContent className="p-6">
                    <p className="text-sm opacity-90 mb-1">Visitas Agendadas</p>
                    <p className="text-3xl font-bold">{visitsReport.byStatus.agendada || 0}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Visitas por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(visitsReport.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-700 capitalize">{type}</span>
                      <span className="text-slate-900 font-bold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => exportPDF(visitsReport, 'Relatório de Visitas')}
                  disabled={exporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => exportCSV(visitsReport.items, 'Visitas')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}