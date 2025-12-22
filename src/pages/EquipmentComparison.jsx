import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Calendar, Zap, CheckCircle } from 'lucide-react';

export default function EquipmentComparison() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const competitorBrand = urlParams.get('competitor');
  const competitorModel = urlParams.get('model');

  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [inputs, setInputs] = useState({
    monthly_exams: 100,
    competitor_exam_cost: 8.50,
    competitor_maintenance: 1200,
    our_equipment_price: 85000,
    our_exam_cost: 6.20,
    our_maintenance: 800
  });

  const generateComparison = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista em análise financeira de equipamentos laboratoriais veterinários.

TAREFA: Compare nosso equipamento com o concorrente e calcule o ROI detalhado.

DADOS DO CONCORRENTE:
- Marca: ${competitorBrand}
- Modelo: ${competitorModel}
- Custo por exame: R$ ${inputs.competitor_exam_cost}
- Manutenção mensal: R$ ${inputs.competitor_maintenance}

NOSSO EQUIPAMENTO:
- Preço: R$ ${inputs.our_equipment_price}
- Custo por exame: R$ ${inputs.our_exam_cost}
- Manutenção mensal: R$ ${inputs.our_maintenance}

VOLUME:
- ${inputs.monthly_exams} exames/mês

Calcule e retorne JSON:
{
  "competitor_analysis": {
    "monthly_cost": 12000,
    "yearly_cost": 144000,
    "cost_per_exam_breakdown": {
      "reagent": 5.30,
      "maintenance": 2.20,
      "total": 8.50
    }
  },
  "our_analysis": {
    "initial_investment": 85000,
    "monthly_cost": 8500,
    "yearly_cost": 102000,
    "cost_per_exam_breakdown": {
      "reagent": 4.20,
      "maintenance": 2.00,
      "total": 6.20
    }
  },
  "savings": {
    "monthly_savings": 3500,
    "yearly_savings": 42000,
    "savings_percentage": 29.2,
    "roi_months": 24.3,
    "break_even_date": "2026-12-15",
    "five_year_savings": 210000
  },
  "advantages": [
    "Economia de R$ 2,30 por exame",
    "Custo de manutenção 33% menor",
    "ROI em 24 meses",
    "Economia de R$ 210 mil em 5 anos"
  ],
  "visual_comparison": {
    "cost_efficiency": {
      "ours": 85,
      "competitor": 65
    },
    "maintenance": {
      "ours": 90,
      "competitor": 60
    },
    "long_term_value": {
      "ours": 95,
      "competitor": 55
    }
  },
  "recommendation": "Com base no volume de ${inputs.monthly_exams} exames/mês, nosso equipamento oferece ROI superior e economia significativa a longo prazo."
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            competitor_analysis: {
              type: "object",
              properties: {
                monthly_cost: { type: "number" },
                yearly_cost: { type: "number" },
                cost_per_exam_breakdown: {
                  type: "object",
                  properties: {
                    reagent: { type: "number" },
                    maintenance: { type: "number" },
                    total: { type: "number" }
                  }
                }
              }
            },
            our_analysis: {
              type: "object",
              properties: {
                initial_investment: { type: "number" },
                monthly_cost: { type: "number" },
                yearly_cost: { type: "number" },
                cost_per_exam_breakdown: {
                  type: "object",
                  properties: {
                    reagent: { type: "number" },
                    maintenance: { type: "number" },
                    total: { type: "number" }
                  }
                }
              }
            },
            savings: {
              type: "object",
              properties: {
                monthly_savings: { type: "number" },
                yearly_savings: { type: "number" },
                savings_percentage: { type: "number" },
                roi_months: { type: "number" },
                break_even_date: { type: "string" },
                five_year_savings: { type: "number" }
              }
            },
            advantages: { type: "array", items: { type: "string" } },
            visual_comparison: {
              type: "object",
              properties: {
                cost_efficiency: {
                  type: "object",
                  properties: {
                    ours: { type: "number" },
                    competitor: { type: "number" }
                  }
                },
                maintenance: {
                  type: "object",
                  properties: {
                    ours: { type: "number" },
                    competitor: { type: "number" }
                  }
                },
                long_term_value: {
                  type: "object",
                  properties: {
                    ours: { type: "number" },
                    competitor: { type: "number" }
                  }
                }
              }
            },
            recommendation: { type: "string" }
          }
        }
      });

      setComparison(result);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar comparação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Comparação de Equipamentos</h1>
            <p className="text-sm text-purple-100">ROI e Análise Financeira</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Info */}
        <Card className="p-4 bg-white shadow-lg">
          <p className="font-semibold text-slate-800 mb-1">Concorrente: {competitorBrand}</p>
          <p className="text-sm text-slate-600">Modelo: {competitorModel}</p>
        </Card>

        {/* Inputs */}
        <Card className="p-4 bg-white shadow-lg">
          <p className="font-semibold text-slate-800 mb-3">Dados para Comparação</p>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Exames por mês</Label>
              <Input
                type="number"
                value={inputs.monthly_exams}
                onChange={(e) => setInputs({...inputs, monthly_exams: parseInt(e.target.value)})}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Custo/exame concorrente</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={inputs.competitor_exam_cost}
                  onChange={(e) => setInputs({...inputs, competitor_exam_cost: parseFloat(e.target.value)})}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Manutenção concorrente</Label>
                <Input
                  type="number"
                  value={inputs.competitor_maintenance}
                  onChange={(e) => setInputs({...inputs, competitor_maintenance: parseInt(e.target.value)})}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Custo/exame nosso</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={inputs.our_exam_cost}
                  onChange={(e) => setInputs({...inputs, our_exam_cost: parseFloat(e.target.value)})}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Manutenção nossa</Label>
                <Input
                  type="number"
                  value={inputs.our_maintenance}
                  onChange={(e) => setInputs({...inputs, our_maintenance: parseInt(e.target.value)})}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Preço nosso equipamento</Label>
              <Input
                type="number"
                value={inputs.our_equipment_price}
                onChange={(e) => setInputs({...inputs, our_equipment_price: parseInt(e.target.value)})}
                className="h-12"
              />
            </div>
          </div>

          <Button
            onClick={generateComparison}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Calculando ROI...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Gerar Comparação
              </>
            )}
          </Button>
        </Card>

        {/* Comparison Results */}
        {comparison && (
          <>
            {/* ROI Card */}
            <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">ECONOMIA TOTAL</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {comparison.savings.yearly_savings.toLocaleString('pt-BR')}
                    <span className="text-sm font-normal">/ano</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-slate-500 mb-1">ROI</p>
                  <p className="text-lg font-bold text-slate-800">{comparison.savings.roi_months} meses</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-slate-500 mb-1">Break-even</p>
                  <p className="text-sm font-bold text-slate-800">
                    {new Date(comparison.savings.break_even_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Economia 5 anos</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {comparison.savings.five_year_savings.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-green-100 rounded-lg p-3">
                <p className="text-xs text-green-700">{comparison.recommendation}</p>
              </div>
            </Card>

            {/* Vantagens */}
            <Card className="p-4 bg-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-slate-800">Vantagens do Nosso Equipamento</p>
              </div>
              <ul className="space-y-2">
                {comparison.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 font-bold">{i + 1}.</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Visual Comparison */}
            <Card className="p-4 bg-white shadow-lg">
              <p className="font-semibold text-slate-800 mb-3">Comparação Visual</p>
              
              {Object.entries(comparison.visual_comparison).map(([key, values]) => (
                <div key={key} className="mb-4">
                  <p className="text-xs text-slate-600 mb-2 capitalize">
                    {key.replace('_', ' ')}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-indigo-600 font-medium">Nosso</span>
                        <span className="font-bold">{values.ours}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${values.ours}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Concorrente</span>
                        <span className="font-bold">{values.competitor}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400"
                          style={{ width: `${values.competitor}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-2">Concorrente</p>
                <p className="text-sm text-slate-600 mb-1">Custo/exame: R$ {comparison.competitor_analysis.cost_per_exam_breakdown.total}</p>
                <p className="text-sm text-slate-600 mb-1">Mensal: R$ {comparison.competitor_analysis.monthly_cost.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-slate-600">Anual: R$ {comparison.competitor_analysis.yearly_cost.toLocaleString('pt-BR')}</p>
              </Card>

              <Card className="p-3 bg-indigo-50">
                <p className="text-xs font-semibold text-indigo-700 mb-2">Nosso</p>
                <p className="text-sm text-indigo-600 mb-1">Custo/exame: R$ {comparison.our_analysis.cost_per_exam_breakdown.total}</p>
                <p className="text-sm text-indigo-600 mb-1">Mensal: R$ {comparison.our_analysis.monthly_cost.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-indigo-600">Anual: R$ {comparison.our_analysis.yearly_cost.toLocaleString('pt-BR')}</p>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}