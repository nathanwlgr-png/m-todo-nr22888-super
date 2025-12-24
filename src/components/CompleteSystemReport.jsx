import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function CompleteSystemReport() {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list();
      return data.filter(c => c && c.id && !c.is_deleted);
    }
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Estatísticas gerais
      const stats = {
        totalClients: clients.length,
        hotClients: clients.filter(c => c.status === 'quente').length,
        warmClients: clients.filter(c => c.status === 'morno').length,
        coldClients: clients.filter(c => c.status === 'frio').length,
        avgScore: Math.round(clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length) || 0,
        totalSales: sales.filter(s => s.status === 'fechada').length,
        totalRevenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        monthVisits: visits.filter(v => {
          const date = new Date(v.scheduled_date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        pendingTasks: tasks.filter(t => t.status === 'pendente').length,
        cities: [...new Set(clients.map(c => c.city).filter(Boolean))].length,
        topEquipment: equipment.slice(0, 5)
      };

      // Análise IA do sistema
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de negócios. Analise este CRM de vendas veterinárias:

DADOS DO SISTEMA:
═══════════════════════════════════════
📊 CLIENTES
- Total: ${stats.totalClients}
- Quentes: ${stats.hotClients}
- Mornos: ${stats.warmClients}
- Frios: ${stats.coldClients}
- Score Médio: ${stats.avgScore}%
- Cidades atendidas: ${stats.cities}

💰 VENDAS
- Total fechadas: ${stats.totalSales}
- Receita total: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}
- Taxa conversão: ${((stats.totalSales / stats.totalClients) * 100).toFixed(1)}%

📅 ATIVIDADES
- Visitas este mês: ${stats.monthVisits}
- Tarefas pendentes: ${stats.pendingTasks}

🎯 EQUIPAMENTOS
${stats.topEquipment.map(e => `- ${e.name}: R$ ${e.price?.toLocaleString('pt-BR')}`).join('\n')}

FUNCIONALIDADES ATIVAS:
✓ Numerologia Pitagórica
✓ SPIN Selling
✓ Primori (IA Integrativa)
✓ Automação de tarefas
✓ Análise preditiva
✓ Gamificação
✓ Pipeline visual
✓ Análise de mercado
✓ WhatsApp integrado

═══════════════════════════════════════
GERE UM RELATÓRIO EXECUTIVO:
═══════════════════════════════════════

**1. RESUMO EXECUTIVO** (3-4 parágrafos)
Panorama geral do negócio, saúde do pipeline, performance.

**2. ANÁLISE DE PERFORMANCE**
- Pontos fortes (3-5)
- Áreas de melhoria (3-5)
- Oportunidades não exploradas (2-3)

**3. INSIGHTS ESTRATÉGICOS**
- Clientes com maior potencial
- Melhor momento para ações comerciais
- Previsão próximos 30 dias

**4. RECOMENDAÇÕES PRIORITÁRIAS**
TOP 5 ações para aumentar receita imediatamente.

**5. ANÁLISE DE RISCO**
Riscos identificados e como mitigar.

**6. PRÓXIMOS PASSOS**
Roadmap sugerido para próximas 2 semanas.

Seja EXECUTIVO, DIRETO, DATA-DRIVEN.`
      });

      // Gerar PDF
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241);
      doc.text('RELATÓRIO COMPLETO DO SISTEMA', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`CRM Seamaty - Método NR22 + Primori IA`, 20, y);
      y += 5;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, y);
      y += 5;
      doc.text(`Usuário: ${user?.full_name || 'N/A'}`, 20, y);
      y += 15;

      // Estatísticas
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('📊 ESTATÍSTICAS GERAIS', 20, y);
      y += 8;

      doc.setFontSize(10);
      const statsText = [
        `Total de Clientes: ${stats.totalClients}`,
        `Clientes Quentes: ${stats.hotClients} | Mornos: ${stats.warmClients} | Frios: ${stats.coldClients}`,
        `Score Médio: ${stats.avgScore}%`,
        `Vendas Fechadas: ${stats.totalSales}`,
        `Receita Total: R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`,
        `Taxa de Conversão: ${((stats.totalSales / stats.totalClients) * 100).toFixed(1)}%`,
        `Visitas este mês: ${stats.monthVisits}`,
        `Tarefas Pendentes: ${stats.pendingTasks}`,
        `Cidades Atendidas: ${stats.cities}`
      ];

      statsText.forEach(line => {
        doc.text(line, 25, y);
        y += 6;
      });

      y += 10;

      // Análise IA
      doc.setFontSize(14);
      doc.text('🤖 ANÁLISE PRIMORI (IA)', 20, y);
      y += 8;

      doc.setFontSize(9);
      const lines = doc.splitTextToSize(aiAnalysis, 170);
      lines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });

      // Top Clientes
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      y += 10;
      doc.setFontSize(14);
      doc.text('🔥 TOP 10 CLIENTES QUENTES', 20, y);
      y += 8;

      doc.setFontSize(9);
      const topClients = clients
        .filter(c => c.status === 'quente')
        .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
        .slice(0, 10);

      topClients.forEach((client, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${idx + 1}. ${client.first_name} - Score: ${client.purchase_score}% - ${client.city || 'N/A'}`,
          25, y
        );
        y += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${pageCount} | CRM Seamaty © ${new Date().getFullYear()}`,
          105, 290,
          { align: 'center' }
        );
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setReport({
        pdfUrl,
        pdfBlob,
        stats,
        aiAnalysis,
        timestamp: new Date().toISOString()
      });

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    const a = document.createElement('a');
    a.href = report.pdfUrl;
    a.download = `relatorio-sistema-${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
  };

  const prepareWhatsApp = () => {
    if (!report || !user?.phone) return;

    const summary = `📊 *RELATÓRIO DO SISTEMA CRM*
_${new Date().toLocaleString('pt-BR')}_

═══════════════════════
📈 RESUMO EXECUTIVO
═══════════════════════
✓ Total Clientes: ${report.stats.totalClients}
🔥 Quentes: ${report.stats.hotClients}
🌡️ Mornos: ${report.stats.warmClients}
❄️ Frios: ${report.stats.coldClients}

💰 Vendas Fechadas: ${report.stats.totalSales}
💵 Receita: R$ ${(report.stats.totalRevenue / 1000).toFixed(0)}k
📊 Conversão: ${((report.stats.totalSales / report.stats.totalClients) * 100).toFixed(1)}%

📅 Visitas no mês: ${report.stats.monthVisits}
✅ Tarefas pendentes: ${report.stats.pendingTasks}
🏙️ Cidades: ${report.stats.cities}

═══════════════════════
🤖 PRIMORI IA - INSIGHTS
═══════════════════════
${report.aiAnalysis.substring(0, 500)}...

_PDF completo foi baixado no seu dispositivo._

⚠️ *Este é um resumo. Veja o PDF para relatório completo.*`;

    navigator.clipboard.writeText(summary);
    toast.success('Resumo copiado!', {
      description: 'Cole no WhatsApp para enviar',
      duration: 5000
    });
  };

  const requestWhatsAppSend = async () => {
    if (!user?.phone) {
      toast.error('Configure seu WhatsApp em Configurações primeiro');
      return;
    }

    const confirmed = confirm(`⚠️ CONFIRMAR ENVIO DO RELATÓRIO?

Isso vai:
1. Copiar o resumo do relatório
2. Abrir WhatsApp Web com a mensagem pronta
3. VOCÊ decide se envia ou não

Continuar?`);

    if (confirmed) {
      prepareWhatsApp();
      setTimeout(() => {
        if (user?.phone) {
          window.open(`https://wa.me/${user.phone}`, '_blank');
        }
      }, 1000);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Relatório Completo do Sistema</h3>
          <p className="text-xs text-slate-600">
            Análise detalhada + insights Primori IA
          </p>
        </div>
      </div>

      <Button
        onClick={generateReport}
        disabled={generating}
        className="w-full bg-indigo-600 hover:bg-indigo-700 mb-3"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Gerando relatório completo...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </>
        )}
      </Button>

      {report && (
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-lg border-2 border-green-300">
            <p className="text-sm font-semibold text-green-700 mb-2">✓ Relatório Gerado</p>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="text-center">
                <p className="font-bold text-lg text-indigo-700">{report.stats.totalClients}</p>
                <p className="text-slate-600">Clientes</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-green-700">{report.stats.totalSales}</p>
                <p className="text-slate-600">Vendas</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-purple-700">{report.stats.avgScore}%</p>
                <p className="text-slate-600">Score</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="h-12 border-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            <Button
              onClick={requestWhatsAppSend}
              className="h-12 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar WhatsApp
            </Button>
          </div>

          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ O envio ao WhatsApp requer sua confirmação final
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}