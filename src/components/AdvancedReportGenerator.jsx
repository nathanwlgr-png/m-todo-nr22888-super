import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2, TrendingUp, BarChart3, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function AdvancedReportGenerator() {
  const [generating, setGenerating] = useState(false);
  const [template, setTemplate] = useState('sales_period');
  const [params, setParams] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status_filter: 'all',
    client_type: 'all',
    equipment_category: 'all',
    min_revenue: 0
  });
  const [lastReport, setLastReport] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 1000),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 1000),
  });

  const templates = {
    sales_period: { 
      name: 'Vendas por Período', 
      icon: TrendingUp,
      description: 'Análise completa de vendas com tendências e previsões'
    },
    campaign_performance: { 
      name: 'Performance de Campanhas', 
      icon: BarChart3,
      description: 'ROI, conversão e efetividade de campanhas'
    },
    funnel_by_seller: { 
      name: 'Funil por Vendedor', 
      icon: FileText,
      description: 'Análise individual de performance e conversão'
    },
    client_portfolio: { 
      name: 'Portfólio de Clientes', 
      icon: FileSpreadsheet,
      description: 'Segmentação, health score e oportunidades'
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const startDate = new Date(params.start_date);
      const endDate = new Date(params.end_date);

      // Filtrar dados
      const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const filteredClients = clients.filter(c => {
        if (params.status_filter !== 'all' && c.status !== params.status_filter) return false;
        if (params.client_type !== 'all' && c.client_type !== params.client_type) return false;
        if ((c.projected_revenue || 0) < params.min_revenue) return false;
        return true;
      });

      // Gerar análise IA baseada no template
      const aiAnalysis = await generateAIAnalysis(template, {
        filteredSales,
        filteredClients,
        campaigns,
        tasks,
        startDate,
        endDate
      });

      const report = {
        template,
        template_name: templates[template].name,
        generated_at: new Date().toISOString(),
        params,
        data: {
          sales: filteredSales,
          clients: filteredClients,
          campaigns,
          summary: {
            total_sales: filteredSales.length,
            total_revenue: filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
            total_clients: filteredClients.length,
            avg_ticket: filteredSales.length > 0 ? 
              filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / filteredSales.length : 0
          }
        },
        ai_analysis: aiAnalysis,
        charts: generateChartData(template, filteredSales, filteredClients)
      };

      setLastReport(report);
      toast.success('Relatório gerado com sucesso!', {
        description: `${report.data.summary.total_sales} vendas analisadas`
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const generateAIAnalysis = async (template, data) => {
    const { filteredSales, filteredClients, startDate, endDate } = data;

    const prompts = {
      sales_period: `Analise as vendas do período ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}.

DADOS:
• Total vendas: ${filteredSales.length}
• Receita: R$ ${filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString()}
• Ticket médio: R$ ${filteredSales.length > 0 ? (filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / filteredSales.length).toFixed(0) : 0}

VENDAS DETALHADAS (últimas 10):
${filteredSales.slice(0, 10).map(s => `• ${s.client_name}: R$ ${s.sale_value} - ${s.equipment_name}`).join('\n')}

Retorne JSON:
{
  "trend_analysis": "Análise de tendência (crescimento, estável, queda)",
  "top_products": [{"name": "produto", "quantity": 0, "revenue": 0}],
  "insights": ["insight 1", "insight 2", "insight 3"],
  "predictions": {
    "next_30_days": {"expected_sales": 0, "expected_revenue": 0, "confidence": "alta|media|baixa"},
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "executive_summary": "Resumo executivo (3-4 linhas)"
}`,

      campaign_performance: `Analise a performance das campanhas.

CAMPANHAS (${data.campaigns.length}):
${data.campaigns.map(c => `• ${c.name}: status=${c.status}, budget=${c.budget || 0}, leads=${c.metrics?.current_leads || 0}`).join('\n')}

Retorne JSON com análise de ROI, conversão e efetividade por campanha.`,

      funnel_by_seller: `Analise o funil de vendas por vendedor.

CLIENTES: ${filteredClients.length}
VENDAS: ${filteredSales.length}

Retorne JSON com análise de conversão, tempo médio no funil, gargalos por vendedor.`,

      client_portfolio: `Analise o portfólio de clientes.

CLIENTES: ${filteredClients.length}
Quentes: ${filteredClients.filter(c => c.status === 'quente').length}
Mornos: ${filteredClients.filter(c => c.status === 'morno').length}
Frios: ${filteredClients.filter(c => c.status === 'frio').length}

Retorne JSON com segmentação, health score médio, oportunidades de upsell/cross-sell.`
    };

    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[template],
        response_json_schema: {
          type: "object",
          properties: {
            trend_analysis: { type: "string" },
            top_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  revenue: { type: "number" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } },
            predictions: {
              type: "object",
              properties: {
                next_30_days: {
                  type: "object",
                  properties: {
                    expected_sales: { type: "number" },
                    expected_revenue: { type: "number" },
                    confidence: { type: "string" }
                  }
                },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            executive_summary: { type: "string" }
          }
        }
      });
      return analysis;
    } catch (error) {
      return {
        executive_summary: "Análise indisponível no momento",
        insights: [],
        predictions: { next_30_days: {}, recommendations: [] }
      };
    }
  };

  const generateChartData = (template, sales, clients) => {
    if (template === 'sales_period') {
      // Agrupar vendas por mês
      const salesByMonth = {};
      sales.forEach(s => {
        const month = new Date(s.sale_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        salesByMonth[month] = (salesByMonth[month] || 0) + (s.sale_value || 0);
      });

      return {
        sales_timeline: Object.entries(salesByMonth).map(([month, revenue]) => ({
          month,
          revenue
        })),
        status_distribution: {
          quente: clients.filter(c => c.status === 'quente').length,
          morno: clients.filter(c => c.status === 'morno').length,
          frio: clients.filter(c => c.status === 'frio').length
        }
      };
    }

    return {};
  };

  const exportToPDF = () => {
    if (!lastReport) return;

    const doc = new jsPDF();
    const { template_name, data, ai_analysis, generated_at } = lastReport;

    // Título
    doc.setFontSize(18);
    doc.text(template_name, 20, 20);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date(generated_at).toLocaleString('pt-BR')}`, 20, 30);

    // Resumo
    doc.setFontSize(14);
    doc.text('RESUMO', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total de vendas: ${data.summary.total_sales}`, 20, 55);
    doc.text(`Receita total: R$ ${data.summary.total_revenue.toLocaleString('pt-BR')}`, 20, 62);
    doc.text(`Ticket médio: R$ ${data.summary.avg_ticket.toFixed(0)}`, 20, 69);
    doc.text(`Clientes analisados: ${data.summary.total_clients}`, 20, 76);

    // Análise IA
    if (ai_analysis?.executive_summary) {
      doc.setFontSize(14);
      doc.text('ANÁLISE IA', 20, 95);
      doc.setFontSize(10);
      const summary = doc.splitTextToSize(ai_analysis.executive_summary, 170);
      doc.text(summary, 20, 105);

      // Insights
      if (ai_analysis.insights?.length > 0) {
        doc.setFontSize(12);
        doc.text('INSIGHTS', 20, 130);
        doc.setFontSize(10);
        ai_analysis.insights.forEach((insight, i) => {
          const text = doc.splitTextToSize(`${i + 1}. ${insight}`, 170);
          doc.text(text, 20, 140 + (i * 15));
        });
      }
    }

    doc.save(`relatorio-${template}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado!');
  };

  const exportToCSV = () => {
    if (!lastReport) return;

    const { data } = lastReport;
    let csv = 'VENDAS\n';
    csv += 'Cliente,Equipamento,Valor,Data,Status\n';
    
    data.sales.forEach(s => {
      csv += `${s.client_name},${s.equipment_name},${s.sale_value},${s.sale_date},${s.status}\n`;
    });

    csv += '\n\nCLIENTES\n';
    csv += 'Nome,Cidade,Status,Score,Pipeline\n';
    data.clients.forEach(c => {
      csv += `${c.first_name},${c.city || 'N/A'},${c.status},${c.purchase_score || 0},${c.projected_revenue || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${template}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV exportado!');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Gerador de Relatórios IA</h2>
          <p className="text-sm text-slate-600">Análises avançadas com insights preditivos</p>
        </div>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Template</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(templates).map(([key, t]) => {
            const Icon = t.icon;
            return (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  template === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800">{t.name}</span>
                </div>
                <p className="text-xs text-slate-600">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Data Início</label>
            <Input
              type="date"
              value={params.start_date}
              onChange={(e) => setParams({ ...params, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Data Fim</label>
            <Input
              type="date"
              value={params.end_date}
              onChange={(e) => setParams({ ...params, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Status</label>
            <Select value={params.status_filter} onValueChange={(v) => setParams({ ...params, status_filter: v })}>
              <SelectTrigger>
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
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Tipo Cliente</label>
            <Select value={params.client_type} onValueChange={(v) => setParams({ ...params, client_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="clinica_pequena">Clínica Pequena</SelectItem>
                <SelectItem value="clinica_media">Clínica Média</SelectItem>
                <SelectItem value="hospital_veterinario">Hospital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Receita Mínima (R$)
          </label>
          <Input
            type="number"
            value={params.min_revenue}
            onChange={(e) => setParams({ ...params, min_revenue: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateReport}
        disabled={generating}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 mb-4"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando Relatório IA...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Gerar Relatório
          </>
        )}
      </Button>

      {/* Export Options */}
      {lastReport && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
            <p className="text-sm font-semibold text-slate-800 mb-2">Último Relatório</p>
            <p className="text-xs text-slate-600 mb-1">
              {lastReport.template_name} - {new Date(lastReport.generated_at).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-600">
              {lastReport.data.summary.total_sales} vendas • R$ {lastReport.data.summary.total_revenue.toLocaleString()}
            </p>
            {lastReport.ai_analysis?.executive_summary && (
              <p className="text-xs text-blue-700 mt-2 italic">
                {lastReport.ai_analysis.executive_summary}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={exportToPDF} variant="outline" className="border-blue-300">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="border-green-300">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}