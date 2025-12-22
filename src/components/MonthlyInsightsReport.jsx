import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Loader2, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function MonthlyInsightsReport() {
  const [generating, setGenerating] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  const { data: analyses = [] } = useQuery({
    queryKey: ['visit-analyses'],
    queryFn: () => base44.entities.VisitAnalysis.list('-visit_date', 500)
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthAnalyses = analyses.filter(a => {
        const date = new Date(a.visit_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      if (monthAnalyses.length === 0) {
        toast.error('Nenhuma visita registrada este mês');
        setGenerating(false);
        return;
      }

      // Estatísticas
      const totalVisits = monthAnalyses.length;
      const salesClosed = monthAnalyses.filter(a => a.sale_closed).length;
      const conversionRate = ((salesClosed / totalVisits) * 100).toFixed(1);
      const avgSuccessScore = (monthAnalyses.reduce((sum, a) => sum + (a.success_score || 0), 0) / totalVisits).toFixed(1);

      // Melhores técnicas
      const techniquesCount = {};
      const techniquesSuccess = {};
      monthAnalyses.forEach(a => {
        a.techniques_used?.forEach(tech => {
          techniquesCount[tech] = (techniquesCount[tech] || 0) + 1;
          if (a.sale_closed) {
            techniquesSuccess[tech] = (techniquesSuccess[tech] || 0) + 1;
          }
        });
      });

      const bestTechniques = Object.keys(techniquesCount)
        .map(tech => ({
          name: tech,
          count: techniquesCount[tech],
          successRate: techniquesSuccess[tech] ? ((techniquesSuccess[tech] / techniquesCount[tech]) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      // Perfis mais fechados
      const profilesCount = {};
      const profilesSuccess = {};
      monthAnalyses.forEach(a => {
        const profile = a.client_profile;
        profilesCount[profile] = (profilesCount[profile] || 0) + 1;
        if (a.sale_closed) {
          profilesSuccess[profile] = (profilesSuccess[profile] || 0) + 1;
        }
      });

      const bestProfiles = Object.keys(profilesCount)
        .map(profile => ({
          name: profile,
          count: profilesCount[profile],
          successRate: profilesSuccess[profile] ? ((profilesSuccess[profile] / profilesCount[profile]) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      // O que mais funcionou
      const allWorked = monthAnalyses.flatMap(a => a.what_worked || []);
      const workedCount = {};
      allWorked.forEach(item => {
        workedCount[item] = (workedCount[item] || 0) + 1;
      });
      const topWorked = Object.entries(workedCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // O que mais falhou
      const allFailed = monthAnalyses.flatMap(a => a.what_failed || []);
      const failedCount = {};
      allFailed.forEach(item => {
        failedCount[item] = (failedCount[item] || 0) + 1;
      });
      const topFailed = Object.entries(failedCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Análise IA estratégica
      const strategicPrompt = `Você é um consultor estratégico de vendas. Analise os dados abaixo e forneça insights executivos.

ESTATÍSTICAS DO MÊS:
- Total de Visitas: ${totalVisits}
- Vendas Fechadas: ${salesClosed}
- Taxa de Conversão: ${conversionRate}%
- Score Médio: ${avgSuccessScore}

MELHORES TÉCNICAS:
${bestTechniques.map(t => `- ${t.name}: ${t.successRate}% sucesso (${t.count} usos)`).join('\n')}

PERFIS COM MELHOR CONVERSÃO:
${bestProfiles.map(p => `- ${p.name}: ${p.successRate}% conversão (${p.count} visitas)`).join('\n')}

O QUE FUNCIONOU:
${topWorked.map(w => `- ${w[0]} (${w[1]}x)`).join('\n')}

O QUE FALHOU:
${topFailed.map(f => `- ${f[0]} (${f[1]}x)`).join('\n')}

Retorne JSON:
{
  "executive_summary": "Resumo executivo em 2-3 parágrafos",
  "key_findings": ["achado1", "achado2", "achado3"],
  "action_plan": ["ação1", "ação2", "ação3"],
  "forecast_next_month": "Previsão para próximo mês baseado em dados"
}`;

      const strategicAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: strategicPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_findings: { type: "array", items: { type: "string" } },
            action_plan: { type: "array", items: { type: "string" } },
            forecast_next_month: { type: "string" }
          }
        }
      });

      // Recomendações por perfil
      const profileRecommendations = {};
      const uniqueProfiles = [...new Set(monthAnalyses.map(a => a.client_profile))];
      
      for (const profile of uniqueProfiles) {
        const profileAnalyses = monthAnalyses.filter(a => a.client_profile === profile);
        const successfulTechniques = [];
        
        profileAnalyses.filter(a => a.sale_closed).forEach(a => {
          a.techniques_used?.forEach(tech => {
            if (!successfulTechniques.includes(tech)) {
              successfulTechniques.push(tech);
            }
          });
        });

        if (successfulTechniques.length > 0) {
          profileRecommendations[profile] = successfulTechniques.slice(0, 3);
        }
      }

      const report = {
        month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        totalVisits,
        salesClosed,
        conversionRate,
        avgSuccessScore,
        bestTechniques,
        bestProfiles,
        topWorked,
        topFailed,
        strategicAnalysis,
        profileRecommendations
      };

      setReportData(report);
      setReportOpen(true);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.text('Relatório Mensal de Insights', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(reportData.month, 20, yPos);
    yPos += 15;

    // Estatísticas
    doc.setFontSize(14);
    doc.text('Estatísticas Gerais', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Total de Visitas: ${reportData.totalVisits}`, 25, yPos);
    yPos += 6;
    doc.text(`Vendas Fechadas: ${reportData.salesClosed}`, 25, yPos);
    yPos += 6;
    doc.text(`Taxa de Conversão: ${reportData.conversionRate}%`, 25, yPos);
    yPos += 6;
    doc.text(`Score Médio: ${reportData.avgSuccessScore}`, 25, yPos);
    yPos += 12;

    // Melhores Técnicas
    doc.setFontSize(14);
    doc.text('Melhores Técnicas', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    reportData.bestTechniques.forEach(tech => {
      doc.text(`${tech.name}: ${tech.successRate}% (${tech.count} usos)`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;

    // Recomendações por Perfil
    if (Object.keys(reportData.profileRecommendations).length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text('Técnicas Recomendadas por Perfil', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      Object.entries(reportData.profileRecommendations).forEach(([profile, techniques]) => {
        doc.text(`${profile}:`, 25, yPos);
        yPos += 6;
        techniques.forEach(tech => {
          doc.text(`  - ${tech}`, 30, yPos);
          yPos += 5;
        });
        yPos += 3;
      });
      yPos += 8;
    }

    // Perfis com melhor conversão
    doc.setFontSize(14);
    doc.text('Perfis com Melhor Conversão', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    reportData.bestProfiles.forEach(profile => {
      doc.text(`${profile.name}: ${profile.successRate}%`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;

    // O que funcionou
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.text('O Que Funcionou', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    reportData.topWorked.forEach(item => {
      doc.text(`- ${item[0]} (${item[1]}x)`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;

    // Análise Estratégica
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.text('Análise Estratégica IA', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    
    const splitSummary = doc.splitTextToSize(reportData.strategicAnalysis.executive_summary, 170);
    splitSummary.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    doc.save(`relatorio-insights-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF baixado!');
  };

  return (
    <>
      <Button
        onClick={generateReport}
        disabled={generating}
        className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Relatório Mensal de Insights
          </>
        )}
      </Button>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Relatório de Insights - {reportData?.month}
            </DialogTitle>
          </DialogHeader>

          {reportData && (
            <div className="space-y-6 py-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                  <p className="text-xs text-green-600 mb-1">Total Visitas</p>
                  <p className="text-2xl font-bold text-green-700">{reportData.totalVisits}</p>
                </Card>
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <p className="text-xs text-blue-600 mb-1">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.conversionRate}%</p>
                </Card>
              </div>

              {/* Executive Summary */}
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  Análise Estratégica IA
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {reportData.strategicAnalysis.executive_summary}
                </p>
              </Card>

              {/* Key Findings */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Principais Descobertas</h3>
                <ul className="space-y-2">
                  {reportData.strategicAnalysis.key_findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span className="text-sm text-slate-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best Techniques */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Melhores Técnicas</h3>
                <div className="space-y-2">
                  {reportData.bestTechniques.map((tech, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium text-slate-800">{tech.name}</span>
                      <span className="text-sm font-bold text-green-700">{tech.successRate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plan */}
              <Card className="p-4 bg-orange-50">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  Plano de Ação
                </h3>
                <ul className="space-y-2">
                  {reportData.strategicAnalysis.action_plan.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600">{idx + 1}.</span>
                      <span className="text-sm text-slate-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recomendações por Perfil */}
              {Object.keys(reportData.profileRecommendations).length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">🎯 Técnicas Recomendadas por Perfil</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.profileRecommendations).map(([profile, techniques]) => (
                      <Card key={profile} className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <p className="text-sm font-semibold text-indigo-700 mb-2">{profile}</p>
                        <div className="flex flex-wrap gap-2">
                          {techniques.map((tech, idx) => (
                            <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={downloadPDF} className="w-full" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}