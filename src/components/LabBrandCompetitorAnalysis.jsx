import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Microscope, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export default function LabBrandCompetitorAnalysis() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeLabBrands = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Você é um especialista em equipamentos de diagnóstico veterinário laboratorial.

TAREFA: Analise os PRINCIPAIS CONCORRENTES de marcas de equipamentos laboratoriais veterinários no mercado brasileiro.

MARCAS PRINCIPAIS:
- Bioetes (marca forte)
- Zoetes (marca conhecida)
- Mindray (líder de mercado)
- Horiba (alta qualidade)
- Sysmex (referência internacional)
- Boule (marca europeia)

CATEGORIAS DE EQUIPAMENTOS:
1. Analisadores Hematológicos (Hemograma)
2. Analisadores Bioquímicos
3. Hemogasômetros (Hemogasometria)

Para cada marca e categoria, retorne:
{
  "brands": [
    {
      "brand": "Nome da Marca",
      "market_position": "líder/forte/média/fraca",
      "equipment_categories": [
        {
          "category": "hemograma/bioquimico/hemogasio",
          "models": [
            {
              "model": "Nome do Modelo",
              "price_range": "R$ 40.000 - R$ 80.000",
              "exam_cost": 8.50,
              "throughput": "60 amostras/hora",
              "parameters": ["Leucócitos", "Hemácias", "Plaquetas", "Hemoglobina"],
              "strengths": ["Ponto forte 1", "Ponto forte 2"],
              "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
              "maintenance_cost_monthly": 1200,
              "reagent_cost_per_test": 5.30,
              "training_required_hours": 8
            }
          ]
        }
      ],
      "overall_strengths": ["Força geral 1", "Força geral 2"],
      "overall_weaknesses": ["Fraqueza geral 1", "Fraqueza geral 2"],
      "market_share": 25
    }
  ],
  "market_insights": {
    "most_common_brand": "Mindray",
    "price_leader": "Bioetes",
    "quality_leader": "Sysmex",
    "best_value": "Mindray",
    "fastest_growing": "Zoetes"
  },
  "our_advantages": [
    "Vantagem competitiva 1",
    "Vantagem competitiva 2",
    "Vantagem competitiva 3"
  ]
}

IMPORTANTE: Use dados reais do mercado veterinário brasileiro.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            brands: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  brand: { type: "string" },
                  market_position: { type: "string" },
                  equipment_categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        models: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              model: { type: "string" },
                              price_range: { type: "string" },
                              exam_cost: { type: "number" },
                              throughput: { type: "string" },
                              parameters: { type: "array", items: { type: "string" } },
                              strengths: { type: "array", items: { type: "string" } },
                              weaknesses: { type: "array", items: { type: "string" } },
                              maintenance_cost_monthly: { type: "number" },
                              reagent_cost_per_test: { type: "number" },
                              training_required_hours: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  },
                  overall_strengths: { type: "array", items: { type: "string" } },
                  overall_weaknesses: { type: "array", items: { type: "string" } },
                  market_share: { type: "number" }
                }
              }
            },
            market_insights: {
              type: "object",
              properties: {
                most_common_brand: { type: "string" },
                price_leader: { type: "string" },
                quality_leader: { type: "string" },
                best_value: { type: "string" },
                fastest_growing: { type: "string" }
              }
            },
            our_advantages: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao analisar marcas');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'líder': return 'bg-green-100 text-green-700';
      case 'forte': return 'bg-blue-100 text-blue-700';
      case 'média': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hemograma': return '🔬';
      case 'bioquimico': return '⚗️';
      case 'hemogasio': return '💨';
      default: return '🧪';
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Microscope className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">🏆 Análise de Marcas</h3>
          <p className="text-xs text-slate-600">Concorrentes diretos de equipamentos</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={analyzeLabBrands}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando Marcas e Equipamentos...
            </>
          ) : (
            <>
              <Microscope className="w-4 h-4 mr-2" />
              Analisar Marcas Concorrentes
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Market Insights */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-3">📊 Panorama do Mercado</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Mais Comum</p>
                <p className="font-semibold text-slate-800">{analysis.market_insights.most_common_brand}</p>
              </div>
              <div>
                <p className="text-slate-500">Líder Preço</p>
                <p className="font-semibold text-slate-800">{analysis.market_insights.price_leader}</p>
              </div>
              <div>
                <p className="text-slate-500">Líder Qualidade</p>
                <p className="font-semibold text-slate-800">{analysis.market_insights.quality_leader}</p>
              </div>
              <div>
                <p className="text-slate-500">Melhor Custo-Benefício</p>
                <p className="font-semibold text-slate-800">{analysis.market_insights.best_value}</p>
              </div>
            </div>
          </div>

          {/* Nossas Vantagens */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700">Nossas Vantagens Competitivas</p>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              {analysis.our_advantages?.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Marcas */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">🏢 Análise por Marca</p>
            <div className="space-y-2">
              {analysis.brands?.map((brand, i) => (
                <Card key={i} className="p-3 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{brand.brand}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPositionColor(brand.market_position)}>
                          {brand.market_position}
                        </Badge>
                        <Badge variant="outline">{brand.market_share}% mercado</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Equipamentos por Categoria */}
                  {brand.equipment_categories?.map((cat, idx) => (
                    <div key={idx} className="mt-3 bg-slate-50 rounded p-2">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        {getCategoryIcon(cat.category)} {cat.category?.toUpperCase()}
                      </p>
                      {cat.models?.map((model, midx) => (
                        <div key={midx} className="bg-white rounded p-2 mb-2 border">
                          <p className="font-semibold text-sm text-slate-800">{model.model}</p>
                          <p className="text-xs text-slate-500 mb-2">{model.price_range}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <p className="text-slate-500">Custo/exame</p>
                              <p className="font-semibold text-slate-800">R$ {model.exam_cost}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Throughput</p>
                              <p className="font-semibold text-slate-800">{model.throughput}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Manutenção/mês</p>
                              <p className="font-semibold text-slate-800">R$ {model.maintenance_cost_monthly}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Treinamento</p>
                              <p className="font-semibold text-slate-800">{model.training_required_hours}h</p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl(`EquipmentComparison?competitor=${brand.brand}&model=${model.model}`))}
                            className="w-full text-xs"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Comparar com Nosso Equipamento
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-green-50 rounded p-2 border border-green-200">
                      <p className="font-medium text-green-700 mb-1">✓ Forças</p>
                      <ul className="text-green-600 space-y-0.5">
                        {brand.overall_strengths?.slice(0, 2).map((s, idx) => (
                          <li key={idx}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded p-2 border border-red-200">
                      <p className="font-medium text-red-700 mb-1">⚠ Fraquezas</p>
                      <ul className="text-red-600 space-y-0.5">
                        {brand.overall_weaknesses?.slice(0, 2).map((w, idx) => (
                          <li key={idx}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={analyzeLabBrands}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={analyzing}
          >
            Atualizar Análise
          </Button>
        </div>
      )}
    </Card>
  );
}