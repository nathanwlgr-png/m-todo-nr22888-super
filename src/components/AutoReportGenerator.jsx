import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

/**
 * Gerador Automático de Relatórios com IA
 * Gera relatórios diários, semanais e mensais automaticamente
 */
export default function AutoReportGenerator() {
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const generateReport = async (period = 'daily') => {
    setGenerating(true);
    try {
      const now = new Date();
      const startDate = new Date();
      
      if (period === 'daily') startDate.setDate(now.getDate() - 1);
      if (period === 'weekly') startDate.setDate(now.getDate() - 7);
      if (period === 'monthly') startDate.setMonth(now.getMonth() - 1);

      // Filtrar dados do período
      const periodSales = sales.filter(s => new Date(s.sale_date) >= startDate);
      const hotClients = clients.filter(c => c.status === 'quente');
      const urgentTasks = tasks.filter(t => t.status === 'pendente' && t.priority === 'alta');
      const highEngagement = clients.filter(c => (c.engagement_score || 0) > 70);

      // Calcular métricas
      const totalRevenue = periodSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const avgEngagement = clients.length > 0 
        ? clients.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / clients.length 
        : 0;

      // Gerar análise IA
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de vendas expert. Analise os dados e gere um relatório executivo.

PERÍODO: ${period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}
DATA: ${startDate.toLocaleDateString('pt-BR')} até ${now.toLocaleDateString('pt-BR')}

MÉTRICAS:
- Total de vendas fechadas: ${periodSales.length}
- Receita total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Clientes quentes: ${hotClients.length}
- Tarefas urgentes: ${urgentTasks.length}
- Clientes alta engajamento: ${highEngagement.length}
- Engajamento médio: ${avgEngagement.toFixed(1)}%

Gere um relatório em JSON com:
{
  "executive_summary": "Resumo executivo (3-4 linhas)",
  "highlights": ["Destaque 1", "Destaque 2", "Destaque 3"],
  "concerns": ["Preocupação 1", "Preocupação 2"],
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "forecast": "Previsão para próximo período",
  "priority_actions": ["Ação prioritária 1", "Ação prioritária 2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            forecast: { type: "string" },
            priority_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      const report = {
        period,
        date: now.toISOString(),
        metrics: {
          sales: periodSales.length,
          revenue: totalRevenue,
          hotClients: hotClients.length,
          urgentTasks: urgentTasks.length,
          avgEngagement: avgEngagement.toFixed(1)
        },
        analysis: aiAnalysis
      };

      setLastReport(report);
      
      // Enviar via WhatsApp se configurado
      if (user?.whatsapp_number && user?.enable_whatsapp_notifications) {
        const message = formatReportMessage(report);
        await navigator.clipboard.writeText(message);
        toast.success('📊 Relatório gerado e copiado!', {
          description: 'Clique para enviar via WhatsApp',
          action: {
            label: 'Enviar',
            onClick: () => window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank')
          }
        });
      } else {
        toast.success('Relatório gerado com sucesso!');
      }

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const formatReportMessage = (report) => {
    const periodLabel = report.period === 'daily' ? 'DIÁRIO' : report.period === 'weekly' ? 'SEMANAL' : 'MENSAL';
    return `📊 *RELATÓRIO ${periodLabel}*\n${new Date(report.date).toLocaleDateString('pt-BR')}\n\n` +
      `📈 *MÉTRICAS*\n` +
      `• Vendas: ${report.metrics.sales}\n` +
      `• Receita: R$ ${report.metrics.revenue.toLocaleString('pt-BR')}\n` +
      `• Clientes Quentes: ${report.metrics.hotClients}\n` +
      `• Tarefas Urgentes: ${report.metrics.urgentTasks}\n` +
      `• Engajamento Médio: ${report.metrics.avgEngagement}%\n\n` +
      `💡 *RESUMO EXECUTIVO*\n${report.analysis.executive_summary}\n\n` +
      `✅ *DESTAQUES*\n${report.analysis.highlights.map(h => `• ${h}`).join('\n')}\n\n` +
      `⚠️ *ATENÇÃO*\n${report.analysis.concerns.map(c => `• ${c}`).join('\n')}\n\n` +
      `🎯 *AÇÕES PRIORITÁRIAS*\n${report.analysis.priority_actions.map(a => `• ${a}`).join('\n')}`;
  };

  const exportToPDF = () => {
    if (!lastReport) return;
    
    const doc = new jsPDF();
    const periodLabel = lastReport.period === 'daily' ? 'DIÁRIO' : lastReport.period === 'weekly' ? 'SEMANAL' : 'MENSAL';
    
    doc.setFontSize(20);
    doc.text(`RELATÓRIO ${periodLabel}`, 20, 20);
    
    doc.setFontSize(10);
    doc.text(new Date(lastReport.date).toLocaleDateString('pt-BR'), 20, 30);
    
    doc.setFontSize(14);
    doc.text('MÉTRICAS', 20, 45);
    doc.setFontSize(10);
    doc.text(`Vendas: ${lastReport.metrics.sales}`, 20, 55);
    doc.text(`Receita: R$ ${lastReport.metrics.revenue.toLocaleString('pt-BR')}`, 20, 62);
    doc.text(`Clientes Quentes: ${lastReport.metrics.hotClients}`, 20, 69);
    doc.text(`Tarefas Urgentes: ${lastReport.metrics.urgentTasks}`, 20, 76);
    doc.text(`Engajamento Médio: ${lastReport.metrics.avgEngagement}%`, 20, 83);
    
    doc.setFontSize(14);
    doc.text('RESUMO EXECUTIVO', 20, 100);
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(lastReport.analysis.executive_summary, 170);
    doc.text(summary, 20, 110);
    
    doc.save(`relatorio-${lastReport.period}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado!');
  };

  // DESABILITADO: Relatórios automáticos para evitar rate limit
  // Usuário pode gerar manualmente quando necessário
  useEffect(() => {
    // Auto-reports desabilitados por padrão
  }, []);

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Relatórios Automáticos IA</h3>
          <p className="text-xs text-slate-600">Análise inteligente de performance</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateReport('daily')}
          disabled={generating}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Diário
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateReport('weekly')}
          disabled={generating}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Semanal
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateReport('monthly')}
          disabled={generating}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Mensal
        </Button>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-4 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Gerando relatório com IA...
        </div>
      )}

      {lastReport && (
        <div className="space-y-2">
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Último relatório gerado</p>
            <p className="text-sm font-semibold text-slate-800">
              {lastReport.period === 'daily' ? 'Diário' : lastReport.period === 'weekly' ? 'Semanal' : 'Mensal'} - {new Date(lastReport.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button
            size="sm"
            onClick={exportToPDF}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      )}
    </Card>
  );
}