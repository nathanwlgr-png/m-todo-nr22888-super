import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export default function MarketReportGenerator({ client, marketData, competitorData }) {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateComprehensiveReport = async () => {
    setGenerating(true);
    try {
      const prompt = `Você é um consultor estratégico especializado em vendas de equipamentos veterinários.

CLIENTE:
- Nome: ${client.clinic_name || client.first_name}
- Tipo: ${client.client_type}
- Cidade: ${client.city}
- Status Atual: ${client.status}
- Score: ${client.purchase_score}/100

DADOS DE MERCADO:
${marketData ? JSON.stringify(marketData, null, 2) : 'Não disponível'}

ANÁLISE COMPETITIVA:
${competitorData && competitorData.length > 0 ? JSON.stringify(competitorData.slice(0, 3), null, 2) : 'Não disponível'}

TAREFA: Gere um relatório EXECUTIVO em 5 seções:

{
  "executive_summary": "Resumo de 3-4 parágrafos da situação completa",
  "market_opportunity": {
    "market_size": "Tamanho do mercado",
    "growth_potential": "Potencial de crescimento",
    "timeline": "Timeline estimado",
    "investment_required": "Investimento necessário"
  },
  "competitive_positioning": {
    "our_advantages": ["Vantagem 1", "Vantagem 2"],
    "competitive_threats": ["Ameaça 1", "Ameaça 2"],
    "market_gaps": "Oportunidades no mercado"
  },
  "sales_strategy": {
    "approach": "Abordagem recomendada",
    "key_messages": ["Mensagem 1", "Mensagem 2", "Mensagem 3"],
    "timeline_to_close": "Timeline até fechamento",
    "critical_success_factors": ["Fator 1", "Fator 2"]
  },
  "next_steps": [
    "Ação imediata 1",
    "Ação imediata 2",
    "Ação imediata 3"
  ],
  "risk_mitigation": [
    "Mitigação de risco 1",
    "Mitigação de risco 2"
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            market_opportunity: {
              type: "object",
              properties: {
                market_size: { type: "string" },
                growth_potential: { type: "string" },
                timeline: { type: "string" },
                investment_required: { type: "string" }
              }
            },
            competitive_positioning: {
              type: "object",
              properties: {
                our_advantages: { type: "array", items: { type: "string" } },
                competitive_threats: { type: "array", items: { type: "string" } },
                market_gaps: { type: "string" }
              }
            },
            sales_strategy: {
              type: "object",
              properties: {
                approach: { type: "string" },
                key_messages: { type: "array", items: { type: "string" } },
                timeline_to_close: { type: "string" },
                critical_success_factors: { type: "array", items: { type: "string" } }
              }
            },
            next_steps: { type: "array", items: { type: "string" } },
            risk_mitigation: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReport(result);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margins = { top: 15, left: 10, right: 10 };
      let yPosition = margins.top;

      // Header
      doc.setFillColor(79, 39, 245); // Purple
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO DE ANÁLISE DE MERCADO', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`${client.clinic_name || client.first_name} • ${client.city}`, pageWidth / 2, 25, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPosition = 45;

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(79, 39, 245);
      doc.text('📋 RESUMO EXECUTIVO', margins.left, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const summaryText = doc.splitTextToSize(report.executive_summary, pageWidth - 20);
      doc.text(summaryText, margins.left + 5, yPosition);
      yPosition += (summaryText.length * 4) + 8;

      // Market Opportunity
      if (yPosition > 240) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(14);
      doc.setTextColor(79, 39, 245);
      doc.text('🎯 OPORTUNIDADE DE MERCADO', margins.left, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const opportunities = [
        `Tamanho do Mercado: ${report.market_opportunity?.market_size}`,
        `Potencial de Crescimento: ${report.market_opportunity?.growth_potential}`,
        `Timeline: ${report.market_opportunity?.timeline}`,
        `Investimento Necessário: ${report.market_opportunity?.investment_required}`
      ];
      
      opportunities.forEach(opp => {
        doc.text(`• ${opp}`, margins.left + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      // Competitive Positioning
      if (yPosition > 230) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(14);
      doc.setTextColor(79, 39, 245);
      doc.text('⚔️ POSICIONAMENTO COMPETITIVO', margins.left, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(0, 153, 0);
      doc.text('Vantagens:', margins.left + 5, yPosition);
      yPosition += 4;
      
      doc.setTextColor(0, 0, 0);
      report.competitive_positioning?.our_advantages?.forEach(adv => {
        doc.text(`✓ ${adv}`, margins.left + 10, yPosition);
        yPosition += 4;
      });

      yPosition += 3;
      doc.setTextColor(204, 0, 0);
      doc.text('Ameaças:', margins.left + 5, yPosition);
      yPosition += 4;

      doc.setTextColor(0, 0, 0);
      report.competitive_positioning?.competitive_threats?.forEach(threat => {
        doc.text(`✗ ${threat}`, margins.left + 10, yPosition);
        yPosition += 4;
      });

      yPosition += 5;

      // Sales Strategy
      if (yPosition > 230) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(14);
      doc.setTextColor(79, 39, 245);
      doc.text('💼 ESTRATÉGIA DE VENDAS', margins.left, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const strategyText = doc.splitTextToSize(`Abordagem: ${report.sales_strategy?.approach}`, pageWidth - 20);
      doc.text(strategyText, margins.left + 5, yPosition);
      yPosition += (strategyText.length * 3) + 3;

      doc.setTextColor(0, 102, 204);
      doc.text('Mensagens-chave:', margins.left + 5, yPosition);
      yPosition += 4;
      
      doc.setTextColor(0, 0, 0);
      report.sales_strategy?.key_messages?.forEach(msg => {
        doc.text(`• ${msg}`, margins.left + 10, yPosition);
        yPosition += 4;
      });

      doc.text(`Timeline para Fechamento: ${report.sales_strategy?.timeline_to_close}`, margins.left + 5, yPosition + 3);

      yPosition += 10;

      // Next Steps
      if (yPosition > 230) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(14);
      doc.setTextColor(79, 39, 245);
      doc.text('✅ PRÓXIMOS PASSOS', margins.left, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      report.next_steps?.forEach((step, idx) => {
        doc.text(`${idx + 1}. ${step}`, margins.left + 5, yPosition);
        yPosition += 5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
               pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`relatorio-mercado-${client.clinic_name || client.first_name}-${timestamp}.pdf`);
      toast.success('PDF baixado!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  if (!report) {
    return (
      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900">📊 Relatório de Análise de Mercado</p>
            <p className="text-xs text-emerald-600">Relatório executivo personalizado em PDF</p>
          </div>
        </div>
        <Button
          onClick={generateComprehensiveReport}
          disabled={generating}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório Completo
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-emerald-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Relatório Gerado
        </h3>
        <Button onClick={downloadReportPDF} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-1" />
          Baixar PDF
        </Button>
      </div>

      {/* Resumo Executivo */}
      <div className="p-3 bg-white rounded-lg border-l-4 border-emerald-600">
        <p className="text-xs font-bold text-emerald-700 mb-2">Resumo Executivo</p>
        <p className="text-xs text-slate-700 leading-relaxed">{report.executive_summary}</p>
      </div>

      {/* Oportunidade */}
      {report.market_opportunity && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(report.market_opportunity).map(([key, value]) => (
            <div key={key} className="p-2 bg-white rounded text-xs">
              <p className="text-emerald-600 font-semibold">{key.replace(/_/g, ' ')}</p>
              <p className="text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Estratégia */}
      {report.sales_strategy && (
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
          <p className="text-xs font-bold text-blue-700 mb-2">Estratégia de Vendas</p>
          <p className="text-xs text-slate-700 mb-2">{report.sales_strategy.approach}</p>
          <p className="text-xs font-semibold text-blue-700 mb-1">Mensagens-chave:</p>
          <ul className="text-xs text-slate-700 space-y-1">
            {report.sales_strategy.key_messages?.map((msg, idx) => (
              <li key={idx}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Próximos Passos */}
      {report.next_steps && (
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
          <p className="text-xs font-bold text-green-700 mb-2">Próximos Passos</p>
          <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
            {report.next_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}