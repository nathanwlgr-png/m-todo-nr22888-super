import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Newspaper, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export default function MarketIntelligenceAnalyzer({ client }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeMarketTrends = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um analista de mercado veterinário especializado em equipamentos diagnósticos.

CLIENTE:
- Nome: ${client.clinic_name || client.first_name}
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Equipamento Atual: ${client.current_equipment || 'Não informado'}

TAREFA: Pesquise e analise:

1. NOTÍCIAS DO SETOR (últimas 30 dias)
   - Lançamentos de equipamentos
   - Fusões/aquisições em empresas veterinárias
   - Regulamentações novas
   - Tendências em diagnóstico veterinário

2. TENDÊNCIAS DE MERCADO
   - Demanda por tipos de exame
   - Preferência por equipamentos
   - Padrões de investimento
   - Regiões em crescimento

3. IMPACTO PARA ESTE CLIENTE
   - Oportunidades específicas
   - Ameaças competitivas
   - Timing ideal para venda
   - Argumentos de venda baseados em tendências

Retorne JSON estruturado:

{
  "market_news": [
    {
      "title": "Notícia",
      "source": "Fonte",
      "date": "Data",
      "relevance": "Alta/Média/Baixa",
      "summary": "Resumo",
      "impact_for_client": "Como afeta este cliente"
    }
  ],
  "market_trends": [
    {
      "trend": "Tendência",
      "direction": "Crescendo/Estável/Declinando",
      "timeline": "Timeline",
      "client_opportunity": "Oportunidade",
      "market_share_impact": "Impacto estimado"
    }
  ],
  "competitive_threats": [
    {
      "threat": "Ameaça",
      "severity": "Alta/Média/Baixa",
      "affected_equipment": "Qual equipamento",
      "mitigation": "Como neutralizar"
    }
  ],
  "strategic_recommendations": [
    "Recomendação acionável 1",
    "Recomendação acionável 2"
  ],
  "market_window": {
    "optimal_timing": "Melhor momento para abordagem",
    "urgency_level": "Urgência: Alta/Média/Baixa",
    "estimated_market_size": "Tamanho estimado do mercado"
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            market_news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  source: { type: "string" },
                  date: { type: "string" },
                  relevance: { type: "string" },
                  summary: { type: "string" },
                  impact_for_client: { type: "string" }
                }
              }
            },
            market_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend: { type: "string" },
                  direction: { type: "string" },
                  timeline: { type: "string" },
                  client_opportunity: { type: "string" },
                  market_share_impact: { type: "string" }
                }
              }
            },
            competitive_threats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  threat: { type: "string" },
                  severity: { type: "string" },
                  affected_equipment: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            strategic_recommendations: { type: "array", items: { type: "string" } },
            market_window: {
              type: "object",
              properties: {
                optimal_timing: { type: "string" },
                urgency_level: { type: "string" },
                estimated_market_size: { type: "string" }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise de mercado gerada!');
    } catch (error) {
      toast.error('Erro ao analisar mercado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Header
      doc.setFontSize(16);
      doc.text('📊 ANÁLISE DE MERCADO', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Cliente: ${client.clinic_name || client.first_name}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 6;
      doc.setFontSize(8);
      doc.text(`${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Market Window
      if (analysis.market_window) {
        doc.setFontSize(12);
        doc.text('🎯 Janela de Mercado', 10, yPosition);
        yPosition += 6;
        
        doc.setFontSize(9);
        doc.text(`Timing Ideal: ${analysis.market_window.optimal_timing}`, 15, yPosition);
        yPosition += 4;
        doc.text(`Urgência: ${analysis.market_window.urgency_level}`, 15, yPosition);
        yPosition += 4;
        doc.text(`Tamanho Mercado: ${analysis.market_window.estimated_market_size}`, 15, yPosition);
        yPosition += 10;
      }

      // Notícias
      if (analysis.market_news?.length > 0) {
        doc.setFontSize(12);
        doc.text('📰 Notícias Recentes do Setor', 10, yPosition);
        yPosition += 6;

        analysis.market_news.slice(0, 3).forEach((news) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 15;
          }

          doc.setFontSize(9);
          doc.text(`• ${news.title}`, 15, yPosition);
          yPosition += 4;
          
          doc.setFontSize(8);
          doc.text(`Fonte: ${news.source} | Relevância: ${news.relevance}`, 20, yPosition);
          yPosition += 3;
          
          const splitSummary = doc.splitTextToSize(news.summary, 170);
          doc.text(splitSummary, 20, yPosition);
          yPosition += (splitSummary.length * 3) + 2;

          const splitImpact = doc.splitTextToSize(`Impacto: ${news.impact_for_client}`, 170);
          doc.setTextColor(0, 102, 204);
          doc.text(splitImpact, 20, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += (splitImpact.length * 3) + 4;
        });
        yPosition += 4;
      }

      // Tendências
      if (analysis.market_trends?.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.text('📈 Tendências de Mercado', 10, yPosition);
        yPosition += 6;

        analysis.market_trends.slice(0, 3).forEach((trend) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 15;
          }

          doc.setFontSize(9);
          doc.text(`• ${trend.trend} (${trend.direction})`, 15, yPosition);
          yPosition += 3;
          
          doc.setFontSize(8);
          doc.text(`Timeline: ${trend.timeline}`, 20, yPosition);
          yPosition += 3;
          
          const splitOpp = doc.splitTextToSize(`Oportunidade: ${trend.client_opportunity}`, 170);
          doc.text(splitOpp, 20, yPosition);
          yPosition += (splitOpp.length * 3) + 2;

          doc.text(`Impacto Market Share: ${trend.market_share_impact}`, 20, yPosition);
          yPosition += 5;
        });
        yPosition += 4;
      }

      // Ameaças Competitivas
      if (analysis.competitive_threats?.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.text('⚠️ Ameaças Competitivas', 10, yPosition);
        yPosition += 6;

        analysis.competitive_threats.forEach((threat) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 15;
          }

          doc.setFontSize(9);
          doc.text(`• ${threat.threat} (Severidade: ${threat.severity})`, 15, yPosition);
          yPosition += 3;
          
          doc.setFontSize(8);
          doc.text(`Equipamento: ${threat.affected_equipment}`, 20, yPosition);
          yPosition += 3;
          
          const splitMit = doc.splitTextToSize(`Mitigação: ${threat.mitigation}`, 170);
          doc.setTextColor(0, 153, 0);
          doc.text(splitMit, 20, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += (splitMit.length * 3) + 4;
        });
        yPosition += 4;
      }

      // Recomendações
      if (analysis.strategic_recommendations?.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.text('💡 Recomendações Estratégicas', 10, yPosition);
        yPosition += 6;

        analysis.strategic_recommendations.forEach((rec, idx) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 15;
          }

          doc.setFontSize(9);
          const splitRec = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
          doc.text(splitRec, 15, yPosition);
          yPosition += (splitRec.length * 3) + 3;
        });
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`analise-mercado-${client.clinic_name || client.first_name}-${timestamp}.pdf`);
      toast.success('PDF baixado!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  if (!analysis) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900">📊 Análise de Mercado & Tendências</p>
            <p className="text-xs text-blue-600">IA pesquisa notícias, tendências e oportunidades</p>
          </div>
        </div>
        <Button
          onClick={analyzeMarketTrends}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Newspaper className="w-4 h-4 mr-2" />
              Gerar Análise de Mercado
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análise de Mercado
          </h3>
          <Button size="sm" onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-3 h-3 mr-1" />
            PDF
          </Button>
        </div>

        {/* Market Window */}
        {analysis.market_window && (
          <div className="p-3 bg-white rounded-lg mb-3 border-2 border-blue-200">
            <p className="text-xs font-bold text-blue-700 mb-2">🎯 Janela de Mercado</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-blue-600 font-semibold">Timing Ideal</p>
                <p className="text-slate-700">{analysis.market_window.optimal_timing}</p>
              </div>
              <div>
                <p className="text-blue-600 font-semibold">Urgência</p>
                <Badge className={
                  analysis.market_window.urgency_level === 'Alta' ? 'bg-red-600' :
                  analysis.market_window.urgency_level === 'Média' ? 'bg-yellow-600' :
                  'bg-green-600'
                }>
                  {analysis.market_window.urgency_level}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-blue-600 font-semibold">Tamanho de Mercado</p>
                <p className="text-slate-700">{analysis.market_window.estimated_market_size}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notícias */}
        {analysis.market_news?.length > 0 && (
          <div className="p-3 bg-white rounded-lg mb-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">📰 Notícias do Setor</p>
            <div className="space-y-2">
              {analysis.market_news.slice(0, 2).map((news, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-xs text-slate-800 flex-1">{news.title}</p>
                    <Badge className="text-xs ml-2">{news.relevance}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{news.summary}</p>
                  <p className="text-xs text-blue-600">💡 {news.impact_for_client}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendências */}
        {analysis.market_trends?.length > 0 && (
          <div className="p-3 bg-white rounded-lg mb-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">📈 Tendências</p>
            <div className="space-y-2">
              {analysis.market_trends.slice(0, 2).map((trend, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded">
                  <p className="font-semibold text-xs text-slate-800">{trend.trend}</p>
                  <p className="text-xs text-slate-600">
                    <strong>Direção:</strong> {trend.direction} | <strong>Timeline:</strong> {trend.timeline}
                  </p>
                  <p className="text-xs text-green-600 mt-1">✓ {trend.client_opportunity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ameaças */}
        {analysis.competitive_threats?.length > 0 && (
          <div className="p-3 bg-white rounded-lg mb-3 border border-red-200">
            <p className="text-xs font-bold text-red-700 mb-2">⚠️ Ameaças Competitivas</p>
            <div className="space-y-2">
              {analysis.competitive_threats.map((threat, idx) => (
                <div key={idx} className="p-2 bg-red-50 rounded text-xs">
                  <p className="font-semibold text-red-800">{threat.threat}</p>
                  <p className="text-slate-600">
                    Severidade: <Badge className={threat.severity === 'Alta' ? 'bg-red-600' : threat.severity === 'Média' ? 'bg-yellow-600' : 'bg-green-600'}>{threat.severity}</Badge>
                  </p>
                  <p className="text-slate-600 mt-1">Mitigação: {threat.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {analysis.strategic_recommendations?.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs font-bold text-amber-800 mb-2">💡 Recomendações Estratégicas</p>
            <ul className="space-y-1">
              {analysis.strategic_recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-700">
                  {idx + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}