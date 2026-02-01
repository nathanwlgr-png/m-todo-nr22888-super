import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Plus, Trash2, Download, Shield, TrendingUp, Star } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useAILimit } from '@/components/AILimitProtection';

export default function CompetitorAnalysisModule({ client }) {
  const { quotaExceeded, checkQuotaBeforeCall, trackAICall, limitReached, handleLimitError } = useAILimit();
  const [competitors, setCompetitors] = useState([]);
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    main_products: '',
    pricing: '',
    market_presence: '',
    strengths: '',
    weaknesses: '',
    threat_level: 'media'
  });

  const analyzeCompetitors = async () => {
    if (!client?.city && !client?.clinic_name) {
      toast.error('Cliente precisa ter cidade ou nome da clínica');
      return;
    }

    if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
      toast.error(quotaExceeded ? 'Quota diária atingida' : 'Limite IA atingido');
      return;
    }
    
    setLoading(true);
    try {
      trackAICall();
      
      const prompt = `Você é um analista de inteligência competitiva avançada para equipamentos veterinários.

PRODUTOS SEAMATY (NOSSOS):
🔬 Analisadores Bioquímicos: SMT-120VP, QT3
🩸 Analisadores de Gases: VG1, VG2
🧬 Imunofluorescência: VI1
🔴 Hematológico: VBC-50A
🧫 PCR: VQ1

DIFERENCIAIS SEAMATY:
✅ 25 meses garantia (vs 12 mercado)
✅ Manutenção vitalícia inclusa
✅ Bonificação em insumos
✅ ISO 13485:2016
✅ Presença em 120+ países

CONTEXTO DO CLIENTE:
- Clínica: ${client.clinic_name || client.first_name}
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Equipamento Atual: ${client.current_equipment || 'Não informado'}
- Interesse: ${client.equipment_interest || 'Analisadores'}

TAREFA COMPLETA:
1. Identifique os 5 PRINCIPAIS COMPETIDORES na região
2. Busque REVIEWS, MENÇÕES e RECLAMAÇÕES online (Google, Reclame Aqui, redes sociais)
3. Compare produtos concorrentes vs produtos Seamaty
4. Identifique vantagens e vulnerabilidades

Para CADA competidor, retorne:

{
  "competitors": [
    {
      "name": "Nome da Empresa",
      "headquarters": "Localização",
      "main_products": "Produtos principais (lista separada por vírgula)",
      "market_presence": "Presença: Nacional/Regional/Local",
      "estimated_market_share": "% estimado",
      "pricing_strategy": "Premium/Mid-range/Budget",
      "strengths": [
        "Força 1",
        "Força 2",
        "Força 3"
      ],
      "weaknesses": [
        "Fraqueza 1",
        "Fraqueza 2"
      ],
      "key_clients": "Tipos de cliente que servem",
      "threat_level": "Alta/Média/Baixa",
      "differentiation": "Como se diferencia",
      "vulnerability": "Como vencer este competidor",
      "recent_moves": "Movimentos recentes (se houver)",
      "online_reputation": {
        "average_rating": 4.2,
        "review_count": 150,
        "positive_mentions": ["Ponto positivo 1", "Ponto positivo 2"],
        "negative_mentions": ["Reclamação 1", "Reclamação 2"],
        "sources": "Google Reviews, Reclame Aqui, etc"
      },
      "product_comparison": {
        "seamaty_advantage": ["Vantagem 1 Seamaty", "Vantagem 2"],
        "competitor_advantage": ["Vantagem 1 deles", "Vantagem 2"],
        "price_comparison": "Premium/Similar/Budget vs Seamaty"
      }
    }
  ],
  "competitive_advantage_report": {
    "seamaty_strengths": ["Força única 1", "Força única 2", "Força única 3"],
    "market_gaps": ["Gap 1 que Seamaty preenche", "Gap 2"],
    "win_probability": 85,
    "differentiation_score": 92
  },
  "positioning_strategies": [
    {
      "strategy": "Nome da estratégia",
      "description": "Como executar",
      "target_weakness": "Fraqueza do concorrente que explora",
      "expected_impact": "Alto/Médio/Baixo"
    }
  ]
}

Use INTERNET REAL: Google Reviews, Reclame Aqui, redes sociais, websites, comparadores.

IMPORTANTE: Busque dados REAIS online de reputação e reviews.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  headquarters: { type: "string" },
                  main_products: { type: "string" },
                  market_presence: { type: "string" },
                  estimated_market_share: { type: "string" },
                  pricing_strategy: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  key_clients: { type: "string" },
                  threat_level: { type: "string" },
                  differentiation: { type: "string" },
                  vulnerability: { type: "string" },
                  recent_moves: { type: "string" },
                  online_reputation: {
                    type: "object",
                    properties: {
                      average_rating: { type: "number" },
                      review_count: { type: "number" },
                      positive_mentions: { type: "array", items: { type: "string" } },
                      negative_mentions: { type: "array", items: { type: "string" } },
                      sources: { type: "string" }
                    }
                  },
                  product_comparison: {
                    type: "object",
                    properties: {
                      seamaty_advantage: { type: "array", items: { type: "string" } },
                      competitor_advantage: { type: "array", items: { type: "string" } },
                      price_comparison: { type: "string" }
                    }
                  }
                }
              }
            },
            competitive_advantage_report: {
              type: "object",
              properties: {
                seamaty_strengths: { type: "array", items: { type: "string" } },
                market_gaps: { type: "array", items: { type: "string" } },
                win_probability: { type: "number" },
                differentiation_score: { type: "number" }
              }
            },
            positioning_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy: { type: "string" },
                  description: { type: "string" },
                  target_weakness: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.competitors && Array.isArray(result.competitors)) {
        setCompetitors(result.competitors);
        setCompetitiveAdvantage(result.competitive_advantage_report);
        toast.success(`${result.competitors.length} competidores + vantagens identificadas!`);
      } else {
        toast.error('Nenhum competidor encontrado');
      }
    } catch (error) {
      console.error('Erro:', error);
      const isLimit = handleLimitError(error);
      toast.error(isLimit ? 'Limite IA atingido' : error.message || 'Erro ao analisar');
    } finally {
      setLoading(false);
    }
  };

  const addManualCompetitor = () => {
    if (!formData.name.trim()) {
      toast.error('Digite o nome do competidor');
      return;
    }

    setCompetitors([...competitors, { ...formData, id: Date.now() }]);
    setFormData({
      name: '',
      main_products: '',
      pricing: '',
      market_presence: '',
      strengths: '',
      weaknesses: '',
      threat_level: 'media'
    });
    setShowForm(false);
    toast.success('Competidor adicionado!');
  };

  const deleteCompetitor = (id) => {
    setCompetitors(competitors.filter(c => c.id !== id));
    toast.success('Competidor removido!');
  };

  const downloadAnalysisPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Header
      doc.setFontSize(16);
      doc.text('ANALISE COMPETITIVA + VANTAGEM SEAMATY', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Cliente: ${client.clinic_name || client.first_name}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Vantagem Competitiva
      if (competitiveAdvantage) {
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('VANTAGEM COMPETITIVA SEAMATY', 10, yPosition);
        yPosition += 8;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Probabilidade de Vitoria: ${competitiveAdvantage.win_probability}%`, 10, yPosition);
        yPosition += 5;
        doc.text(`Score Diferenciacao: ${competitiveAdvantage.differentiation_score}%`, 10, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.text('Forcas Exclusivas:', 10, yPosition);
        yPosition += 5;
        competitiveAdvantage.seamaty_strengths?.forEach(s => {
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(`- ${s}`, 180);
          lines.forEach(line => {
            if (yPosition > 270) { doc.addPage(); yPosition = 15; }
            doc.text(line, 15, yPosition);
            yPosition += 4;
          });
        });
        yPosition += 5;

        doc.setFontSize(10);
        doc.text('Gaps de Mercado:', 10, yPosition);
        yPosition += 5;
        competitiveAdvantage.market_gaps?.forEach(g => {
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(`- ${g}`, 180);
          lines.forEach(line => {
            if (yPosition > 270) { doc.addPage(); yPosition = 15; }
            doc.text(line, 15, yPosition);
            yPosition += 4;
          });
        });
        yPosition += 10;
      }

      // Competidores
      if (yPosition > 240) { doc.addPage(); yPosition = 15; }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Competidores Identificados', 10, yPosition);
      yPosition += 8;

      competitors.forEach((comp, idx) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(11);
        doc.text(`${idx + 1}. ${comp.name}`, 10, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        const details = [
          `Sede: ${comp.headquarters || comp.market_presence || 'N/A'}`,
          `Produtos: ${comp.main_products || 'N/A'}`,
          `Presença: ${comp.market_presence || 'N/A'}`,
          `Estratégia de Preço: ${comp.pricing_strategy || comp.pricing || 'N/A'}`,
          `Ameaça: ${comp.threat_level || 'Média'}`
        ];

        details.forEach(detail => {
          doc.text(`• ${detail}`, 15, yPosition);
          yPosition += 4;
        });

        // Strengths
        if ((comp.strengths || '').split(',').filter(s => s.trim()).length > 0) {
          yPosition += 2;
          doc.setTextColor(0, 153, 0);
          doc.setFontSize(8);
          doc.text('✓ Forças:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const strengthsList = comp.strengths?.split(',') || [];
          strengthsList.forEach(s => {
            if (s.trim()) {
              doc.text(`- ${s.trim()}`, 18, yPosition);
              yPosition += 3;
            }
          });
        }

        // Weaknesses
        if ((comp.weaknesses || '').split(',').filter(s => s.trim()).length > 0) {
          yPosition += 2;
          doc.setTextColor(204, 0, 0);
          doc.setFontSize(8);
          doc.text('✗ Fraquezas:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const weaknessList = comp.weaknesses?.split(',') || [];
          weaknessList.forEach(w => {
            if (w.trim()) {
              doc.text(`- ${w.trim()}`, 18, yPosition);
              yPosition += 3;
            }
          });
        }

        // Vulnerability
        if (comp.vulnerability) {
          yPosition += 2;
          doc.setTextColor(0, 102, 204);
          doc.setFontSize(8);
          doc.text('Como Vencer:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const splitVuln = doc.splitTextToSize(comp.vulnerability, 170);
          doc.text(splitVuln, 18, yPosition);
          yPosition += (splitVuln.length * 3) + 4;
        }

        // Reviews Online
        if (comp.online_reputation) {
          if (yPosition > 250) { doc.addPage(); yPosition = 15; }
          yPosition += 2;
          doc.setTextColor(245, 158, 11);
          doc.setFontSize(8);
          doc.text(`Reputacao Online: ${comp.online_reputation.average_rating}/5 (${comp.online_reputation.review_count} reviews)`, 15, yPosition);
          yPosition += 4;
          doc.setTextColor(0, 0, 0);
          
          if (comp.online_reputation.negative_mentions?.length > 0) {
            doc.setFontSize(7);
            doc.text('Principais Reclamacoes:', 18, yPosition);
            yPosition += 3;
            comp.online_reputation.negative_mentions.slice(0, 2).forEach(m => {
              const lines = doc.splitTextToSize(`- ${m}`, 165);
              lines.forEach(line => {
                doc.text(line, 20, yPosition);
                yPosition += 3;
              });
            });
          }
          yPosition += 3;
        }

        // Comparação Produtos
        if (comp.product_comparison?.seamaty_advantage?.length > 0) {
          if (yPosition > 250) { doc.addPage(); yPosition = 15; }
          yPosition += 2;
          doc.setTextColor(16, 185, 129);
          doc.setFontSize(8);
          doc.text('Seamaty vence em:', 15, yPosition);
          yPosition += 4;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(7);
          comp.product_comparison.seamaty_advantage.slice(0, 3).forEach(a => {
            const lines = doc.splitTextToSize(`+ ${a}`, 165);
            lines.forEach(line => {
              doc.text(line, 18, yPosition);
              yPosition += 3;
            });
          });
          yPosition += 3;
        }

        yPosition += 5;
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`analise-competidores-${client.clinic_name || client.first_name}-${timestamp}.pdf`);
      toast.success('PDF baixado!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-purple-900">🎯 Análise de Concorrentes</p>
            <p className="text-xs text-purple-600">{competitors.length} competidor(es) identificado(s)</p>
          </div>
        </div>
        {competitors.length > 0 && (
          <Button size="sm" onClick={downloadAnalysisPDF} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-3 h-3 mr-1" />
            PDF
          </Button>
        )}
      </div>

      {competitors.length === 0 ? (
        <div className="space-y-3">
          <Button
            onClick={analyzeCompetitors}
            disabled={loading || quotaExceeded || limitReached}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analisando mercado + reviews online...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analisar Concorrentes + Reviews (IA)
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Manual
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Relatório Vantagem Competitiva */}
          {competitiveAdvantage && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-300">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-900">Vantagem Competitiva Seamaty</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-lg p-2 border border-emerald-200">
                  <p className="text-xs text-slate-500">Probabilidade Vitória</p>
                  <p className="text-2xl font-bold text-emerald-600">{competitiveAdvantage.win_probability}%</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-200">
                  <p className="text-xs text-slate-500">Score Diferenciação</p>
                  <p className="text-2xl font-bold text-emerald-600">{competitiveAdvantage.differentiation_score}%</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-emerald-200 mb-2">
                <p className="text-xs font-semibold text-emerald-700 mb-1">✨ Forças Exclusivas Seamaty</p>
                <ul className="text-xs text-slate-700 space-y-0.5">
                  {competitiveAdvantage.seamaty_strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-600">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 mb-1">🎯 Gaps de Mercado</p>
                <ul className="text-xs text-slate-700 space-y-0.5">
                  {competitiveAdvantage.market_gaps?.map((g, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-600">→</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {competitors.map((comp, idx) => (
            <div key={comp.id || idx} className="p-3 bg-white rounded-lg border-2 border-purple-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-800">{comp.name}</h4>
                <div className="flex gap-2">
                  <Badge className={
                    comp.threat_level === 'Alta' ? 'bg-red-600' :
                    comp.threat_level === 'Média' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }>
                    {comp.threat_level || 'Média'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCompetitor(comp.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                {comp.headquarters && (
                  <div>
                    <p className="text-slate-600">Sede</p>
                    <p className="font-semibold text-slate-800">{comp.headquarters}</p>
                  </div>
                )}
                {comp.main_products && (
                  <div>
                    <p className="text-slate-600">Produtos</p>
                    <p className="font-semibold text-slate-800">{comp.main_products}</p>
                  </div>
                )}
              </div>

              {comp.strengths && (
                <div className="p-2 bg-green-50 rounded mb-2 text-xs">
                  <p className="text-green-700 font-semibold mb-1">✓ Forças:</p>
                  <p className="text-green-600">{comp.strengths}</p>
                </div>
              )}

              {comp.weaknesses && (
                <div className="p-2 bg-red-50 rounded mb-2 text-xs">
                  <p className="text-red-700 font-semibold mb-1">✗ Fraquezas:</p>
                  <p className="text-red-600">{comp.weaknesses}</p>
                </div>
              )}

              {comp.vulnerability && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <p className="text-blue-700 font-semibold mb-1">💡 Como Vencer:</p>
                  <p className="text-blue-600">{comp.vulnerability}</p>
                </div>
              )}

              {/* Reviews Online */}
              {comp.online_reputation && (
                <div className="p-2 bg-amber-50 rounded text-xs border border-amber-200 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-amber-700 font-semibold">⭐ Reputação Online</p>
                    <Badge className="bg-amber-600">
                      {comp.online_reputation.average_rating}/5 ({comp.online_reputation.review_count} reviews)
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div>
                      <p className="text-green-700 font-semibold text-[10px] mb-0.5">+ Elogios:</p>
                      {comp.online_reputation.positive_mentions?.slice(0, 2).map((m, i) => (
                        <p key={i} className="text-green-600 text-[10px]">• {m}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-red-700 font-semibold text-[10px] mb-0.5">- Reclamações:</p>
                      {comp.online_reputation.negative_mentions?.slice(0, 2).map((m, i) => (
                        <p key={i} className="text-red-600 text-[10px]">• {m}</p>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-amber-600 mt-1">Fonte: {comp.online_reputation.sources}</p>
                </div>
              )}

              {/* Comparação Produtos */}
              {comp.product_comparison && (
                <div className="mt-2 p-2 bg-indigo-50 rounded text-xs border border-indigo-200">
                  <p className="text-indigo-700 font-semibold mb-1">⚖️ Comparação Produtos</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-emerald-700 font-semibold text-[10px] mb-0.5">Seamaty vence em:</p>
                      {comp.product_comparison.seamaty_advantage?.slice(0, 3).map((a, i) => (
                        <p key={i} className="text-emerald-600 text-[10px]">✓ {a}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-orange-700 font-semibold text-[10px] mb-0.5">Eles vencem em:</p>
                      {comp.product_comparison.competitor_advantage?.slice(0, 3).map((a, i) => (
                        <p key={i} className="text-orange-600 text-[10px]">→ {a}</p>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-1">Preço: {comp.product_comparison.price_comparison}</p>
                </div>
              )}
            </div>
          ))}

          {/* Estratégias de Posicionamento */}
          {result?.positioning_strategies && result.positioning_strategies.length > 0 && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border-2 border-violet-300">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h4 className="font-bold text-violet-900">Estratégias de Posicionamento</h4>
              </div>
              <div className="space-y-2">
                {result.positioning_strategies.map((strat, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-violet-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-800 text-sm">{strat.strategy}</p>
                      <Badge className={
                        strat.expected_impact === 'Alto' ? 'bg-green-600' :
                        strat.expected_impact === 'Médio' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }>
                        {strat.expected_impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{strat.description}</p>
                    <p className="text-[10px] text-violet-600">🎯 Explora: {strat.target_weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-purple-200 space-y-2">
          <Input
            placeholder="Nome do competidor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            placeholder="Produtos principais"
            value={formData.main_products}
            onChange={(e) => setFormData({ ...formData, main_products: e.target.value })}
          />
          <Textarea
            placeholder="Forças"
            value={formData.strengths}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
            rows={2}
          />
          <Textarea
            placeholder="Fraquezas"
            value={formData.weaknesses}
            onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
            rows={2}
          />
          <Textarea
            placeholder="Como vencer este competidor"
            value={formData.vulnerability}
            onChange={(e) => setFormData({ ...formData, vulnerability: e.target.value })}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={addManualCompetitor}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Adicionar
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}