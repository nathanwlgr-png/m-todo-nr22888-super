import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function HemogasReportGenerator() {
  const [generating, setGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Buscar informações científicas sobre hemogasômetro
      const aiReport = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em diagnóstico veterinário. Crie um material técnico COMPLETO sobre HEMOGASÔMETRO com 17 PARÂMETROS.

ESTRUTURA DO MATERIAL:

1. INTRODUÇÃO
- O que é hemogasometria
- Importância na medicina veterinária

2. OS 17 PARÂMETROS (com explicação detalhada):
- pH (equilíbrio ácido-base)
- pO2 (pressão parcial de oxigênio)
- pCO2 (pressão parcial de dióxido de carbono)
- HCO3- (bicarbonato)
- TCO2 (dióxido de carbono total)
- BE/BB (excesso/déficit de base)
- SO2 (saturação de oxigênio)
- Hb (hemoglobina)
- Hct (hematócrito)
- Na+ (sódio)
- K+ (potássio)
- Ca++ (cálcio iônico)
- Cl- (cloreto)
- Glicose
- Lactato
- Creatinina
- BUN (ureia)

3. INTERPRETAÇÃO CLÍNICA
- Acidose metabólica
- Acidose respiratória
- Alcalose metabólica
- Alcalose respiratória

4. APLICAÇÕES PRÁTICAS
- Emergências veterinárias
- Monitoramento anestésico
- Cuidados intensivos
- Cirurgias críticas

5. REFERÊNCIAS CIENTÍFICAS
- Estudos recentes
- Guidelines veterinárias

Retorne JSON formatado para PDF:`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            introduction: { type: "string" },
            parameters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  abbreviation: { type: "string" },
                  normal_range: { type: "string" },
                  clinical_significance: { type: "string" },
                  interpretation: { type: "string" }
                }
              }
            },
            clinical_interpretation: {
              type: "object",
              properties: {
                metabolic_acidosis: { type: "string" },
                respiratory_acidosis: { type: "string" },
                metabolic_alkalosis: { type: "string" },
                respiratory_alkalosis: { type: "string" }
              }
            },
            practical_applications: { type: "array", items: { type: "string" } },
            references: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Gerar PDF
      const pdf = new jsPDF();
      let yPos = 20;

      // Título
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(aiReport.title || 'Hemogasômetro - Guia Completo', 20, yPos);
      yPos += 15;

      // Introdução
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const introLines = pdf.splitTextToSize(aiReport.introduction, 170);
      pdf.text(introLines, 20, yPos);
      yPos += introLines.length * 5 + 10;

      // Parâmetros
      pdf.addPage();
      yPos = 20;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('17 PARÂMETROS AVALIADOS', 20, yPos);
      yPos += 10;

      aiReport.parameters?.forEach((param, idx) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${idx + 1}. ${param.name} (${param.abbreviation})`, 20, yPos);
        yPos += 6;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Valores normais: ${param.normal_range}`, 25, yPos);
        yPos += 5;

        const sigLines = pdf.splitTextToSize(param.clinical_significance, 165);
        pdf.text(sigLines, 25, yPos);
        yPos += sigLines.length * 4 + 5;
      });

      // Interpretação Clínica
      pdf.addPage();
      yPos = 20;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('INTERPRETAÇÃO CLÍNICA', 20, yPos);
      yPos += 10;

      const interpretations = [
        { title: 'Acidose Metabólica', text: aiReport.clinical_interpretation?.metabolic_acidosis },
        { title: 'Acidose Respiratória', text: aiReport.clinical_interpretation?.respiratory_acidosis },
        { title: 'Alcalose Metabólica', text: aiReport.clinical_interpretation?.metabolic_alkalosis },
        { title: 'Alcalose Respiratória', text: aiReport.clinical_interpretation?.respiratory_alkalosis }
      ];

      interpretations.forEach(interp => {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(interp.title, 20, yPos);
        yPos += 6;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(interp.text || '', 170);
        pdf.text(lines, 25, yPos);
        yPos += lines.length * 4 + 8;
      });

      // Aplicações Práticas
      pdf.addPage();
      yPos = 20;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('APLICAÇÕES PRÁTICAS', 20, yPos);
      yPos += 10;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      aiReport.practical_applications?.forEach(app => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        const lines = pdf.splitTextToSize(`• ${app}`, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 4 + 3;
      });

      // Referências
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('REFERÊNCIAS CIENTÍFICAS', 20, yPos);
      yPos += 8;

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      aiReport.references?.forEach(ref => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        const lines = pdf.splitTextToSize(ref, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 3 + 4;
      });

      // Salvar PDF
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Preparar mensagem WhatsApp
      const message = `📚 *MATERIAL TÉCNICO: HEMOGASÔMETRO*\n\n` +
        `✅ 17 Parâmetros Completos\n` +
        `📊 Interpretação Clínica\n` +
        `🔬 Referências Científicas\n` +
        `💉 Aplicações Práticas\n\n` +
        `Material gerado em ${new Date().toLocaleString('pt-BR')}\n\n` +
        `_Download do PDF disponível_`;

      // Abrir link para download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'Hemogasometro_17_Parametros.pdf';
      link.click();

      // Copiar mensagem e abrir WhatsApp
      if (user?.whatsapp_number) {
        await navigator.clipboard.writeText(message);
        setTimeout(() => {
          window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
        }, 500);
      }

      toast.success('Material gerado e baixado!', {
        description: 'PDF pronto e mensagem copiada para WhatsApp'
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar material');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-sm">Material Hemogasômetro</h3>
          <p className="text-xs text-slate-600">17 parâmetros + estudos</p>
        </div>
      </div>

      <Button
        onClick={generateReport}
        disabled={generating}
        className="w-full bg-teal-600 hover:bg-teal-700 h-10"
        size="sm"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Gerar PDF + WhatsApp
          </>
        )}
      </Button>
    </Card>
  );
}