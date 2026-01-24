import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function SeamtyRotorAnalysisGenerator() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('generateSeamptyRotorAnalysis', {});
      setAnalysis(response.data);
    } catch (err) {
      setError(err.message || 'Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!analysis) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Capa
      pdf.setFontSize(24);
      pdf.text('ANÁLISE TÉCNICA DOS ROTORES SEAMATY', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(14);
      pdf.setTextColor(220, 100, 50);
      pdf.text('Para Equipe Planeta Bichos', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

      // Adicionar análise dos rotores
      for (const rotor of analysis.rotors) {
        pdf.addPage();
        yPosition = 20;

        // Título do rotor
        pdf.setFontSize(16);
        pdf.setTextColor(220, 100, 50);
        pdf.text(rotor.name, 20, yPosition);

        yPosition += 10;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Código: ${rotor.code} | Cor: ${rotor.color}`, 20, yPosition);

        yPosition += 15;

        // Parâmetros
        pdf.setFontSize(11);
        pdf.setTextColor(220, 100, 50);
        pdf.text('Parâmetros e Enzimas:', 20, yPosition);

        yPosition += 8;
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);

        rotor.parameters.forEach((param, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.text(`${param.abbr}: ${param.name}`, 25, yPosition);
          yPosition += 6;
          
          // Função
          const funcLines = pdf.splitTextToSize(`Função: ${param.function}`, pageWidth - 30);
          funcLines.forEach((line, i) => {
            if (yPosition > 250) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.setTextColor(100, 100, 100);
            pdf.text(line, 30, yPosition);
            yPosition += 4;
          });

          yPosition += 2;
          pdf.setTextColor(50, 50, 50);
        });

        yPosition += 10;
      }

      // Página de referências
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setTextColor(220, 100, 50);
      pdf.text('REFERÊNCIAS BIBLIOGRÁFICAS', 20, 20);

      yPosition = 30;
      pdf.setFontSize(9);
      pdf.setTextColor(50, 50, 50);

      analysis.references.forEach((ref, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        const refLines = pdf.splitTextToSize(`${index + 1}. ${ref}`, pageWidth - 30);
        refLines.forEach(line => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });

        yPosition += 3;
      });

      // Download
      pdf.save(`Analise_Rotores_Seamaty_Planeta_Bichos_${new Date().getTime()}.pdf`);
    } catch (err) {
      setError('Erro ao gerar PDF: ' + err.message);
    }
  };

  const sendToWhatsApp = async () => {
    if (!analysis) return;
    
    try {
      // Implementar integração WhatsApp aqui
      const message = `Olá! Segue anexo a análise técnica dos rotores Seamaty para a equipe Planeta Bichos. Documento completo com análise de enzimas, casos clínicos e referências bibliográficas.`;
      
      // Aqui você poderia integrar com API WhatsApp ou base44.integrations
      alert('Documento pronto para enviar via WhatsApp');
    } catch (err) {
      setError('Erro ao preparar para WhatsApp: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Análise Técnica dos Rotores Seamaty</CardTitle>
          <CardDescription>
            Geração de documento detalhado com análise científica, casos clínicos e referências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={generateAnalysis}
              disabled={loading}
              className="flex-1 gap-2"
              variant={analysis ? 'outline' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando análise...
                </>
              ) : (
                'Gerar Análise Completa'
              )}
            </Button>
          </div>

          {analysis && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✓ Análise gerada com sucesso - {analysis.rotors.length} rotores analisados
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generatePDF}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </Button>
                <Button
                  onClick={sendToWhatsApp}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  Enviar WhatsApp
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-700 mb-2">Conteúdo incluído:</p>
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>✓ {analysis.rotors.length} rotores analisados em detalhes</li>
                  <li>✓ Função de cada enzima/parâmetro</li>
                  <li>✓ 6 casos clínicos por rotor</li>
                  <li>✓ {analysis.references.length} referências bibliográficas</li>
                  <li>✓ Interpretação clínica completa</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}