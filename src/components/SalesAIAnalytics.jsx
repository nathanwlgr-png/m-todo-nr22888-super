import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesAIAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    try {
      const completedTasks = tasks.filter(t => t.status === 'concluida');
      const completedVisits = visits.filter(v => v.status === 'realizada');
      const closedSales = sales.filter(s => s.status === 'fechada');
      
      const hotClients = clients.filter(c => c.status === 'quente');
      const highScoreClients = clients.filter(c => (c.purchase_score || 0) >= 70);

      const prompt = `
ANÁLISE AVANÇADA DE PERFORMANCE DE VENDAS:

DADOS GERAIS:
- Total Clientes: ${clients.length}
- Clientes Quentes: ${hotClients.length}
- Score Alto (70+): ${highScoreClients.length}
- Vendas Fechadas: ${closedSales.length}
- Visitas Realizadas: ${completedVisits.length}
- Tarefas Concluídas: ${completedTasks.length}

VENDAS:
${closedSales.slice(0, 10).map(s => `- ${s.equipment_name}: R$ ${s.sale_value} - ${s.salesperson || 'N/A'}`).join('\n')}

CLIENTES TOP SCORE:
${highScoreClients.slice(0, 5).map(c => `- ${c.first_name} (${c.purchase_score}): ${c.status} - ${c.equipment_interest || 'N/A'}`).join('\n')}

TAREFA: Analise profundamente a performance e forneça insights acionáveis.

Retorne JSON:
{
  "overall_performance": {
    "score": 85,
    "trend": "crescente|estavel|decrescente",
    "summary": "Resumo da performance"
  },
  "top_strategies": [
    {
      "strategy": "Nome da estratégia",
      "effectiveness": 90,
      "description": "Por que funciona",
      "how_to_replicate": "Como replicar"
    }
  ],
  "conversion_predictions": [
    {
      "segment": "Clientes quentes",
      "predicted_rate": 65,
      "confidence": 85,
      "factors": ["Fator 1", "Fator 2"]
    }
  ],
  "bottlenecks": [
    {
      "issue": "Problema identificado",
      "impact": "alto|medio|baixo",
      "solution": "Solução recomendada"
    }
  ],
  "quick_wins": [
    {
      "action": "Ação rápida",
      "expected_impact": "Impacto esperado",
      "effort": "baixo|medio|alto"
    }
  ],
  "team_recommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ],
  "forecast_next_30_days": {
    "expected_sales": 8,
    "expected_revenue": "R$ 400.000",
    "confidence": 75
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_performance: {
              type: "object",
              properties: {
                score: { type: "number" },
                trend: { type: "string" },
                summary: { type: "string" }
              }
            },
            top_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy: { type: "string" },
                  effectiveness: { type: "number" },
                  description: { type: "string" },
                  how_to_replicate: { type: "string" }
                }
              }
            },
            conversion_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segment: { type: "string" },
                  predicted_rate: { type: "number" },
                  confidence: { type: "number" },
                  factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  impact: { type: "string" },
                  solution: { type: "string" }
                }
              }
            },
            quick_wins: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                  effort: { type: "string" }
                }
              }
            },
            team_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            forecast_next_30_days: {
              type: "object",
              properties: {
                expected_sales: { type: "number" },
                expected_revenue: { type: "string" },
                confidence: { type: "number" }
              }
            }
          }
        }
      });

      setAnalytics(result);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trendColors = {
    crescente: 'from-green-500 to-emerald-500',
    estavel: 'from-blue-500 to-cyan-500',
    decrescente: 'from-red-500 to-orange-500'
  };

  const impactColors = {
    alto: 'bg-red-100 text-red-800 border-red-300',
    medio: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    baixo: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  if (!analytics) {
    return (
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Analytics de Vendas com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 mb-4">
              Analise sua performance, identifique estratégias vencedoras e receba insights acionáveis
            </p>
            <Button
              onClick={analyzePerformance}
              disabled={isAnalyzing}
              className="bg-purple-600"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar Performance'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Geral */}
      <Card className={`bg-gradient-to-r ${trendColors[analytics.overall_performance.trend]} text-white`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">PERFORMANCE GERAL</span>
            <span className="text-4xl font-bold">{analytics.overall_performance.score}</span>
          </div>
          <p className="text-sm mb-2">{analytics.overall_performance.summary}</p>
          <Badge className="bg-white/20 text-white">
            Tendência: {analytics.overall_performance.trend}
          </Badge>
        </CardContent>
      </Card>

      {/* Previsão 30 Dias */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Previsão - Próximos 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700">Vendas Esperadas</p>
              <p className="text-2xl font-bold text-green-900">{analytics.forecast_next_30_days.expected_sales}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700">Receita Esperada</p>
              <p className="text-xl font-bold text-green-900">{analytics.forecast_next_30_days.expected_revenue}</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Badge variant="outline">
              Confiança: {analytics.forecast_next_30_days.confidence}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Estratégias Top */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Estratégias Vencedoras
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {analytics.top_strategies.map((strategy, i) => (
            <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800">{strategy.strategy}</p>
                <Badge className="bg-blue-600 text-white">
                  {strategy.effectiveness}%
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">{strategy.description}</p>
              <div className="bg-white p-2 rounded border">
                <p className="text-xs font-semibold text-blue-700 mb-1">Como Replicar:</p>
                <p className="text-xs text-slate-700">{strategy.how_to_replicate}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Previsões de Conversão */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Previsão de Conversão por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {analytics.conversion_predictions.map((pred, i) => (
            <div key={i} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800">{pred.segment}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-purple-600">{pred.predicted_rate}%</span>
                  <Badge variant="outline" className="text-xs">
                    {pred.confidence}% confiança
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {pred.factors.map((f, j) => (
                  <Badge key={j} variant="outline" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Gargalos */}
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Gargalos Identificados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {analytics.bottlenecks.map((bottleneck, i) => (
            <div key={i} className={`p-3 rounded-lg border-2 ${impactColors[bottleneck.impact]}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{bottleneck.issue}</p>
                <Badge className="bg-white/50">
                  Impacto {bottleneck.impact}
                </Badge>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <p className="text-xs font-semibold mb-1">💡 Solução:</p>
                <p className="text-xs">{bottleneck.solution}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card>
        <CardHeader className="bg-orange-50">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Vitórias Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {analytics.quick_wins.map((win, i) => (
            <div key={i} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-800">{win.action}</p>
                <Badge variant="outline">
                  Esforço {win.effort}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{win.expected_impact}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recomendações para o Time */}
      <Card>
        <CardHeader className="bg-indigo-50">
          <CardTitle className="text-base">📋 Recomendações para o Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {analytics.team_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-indigo-600 font-bold">•</span>
                <span className="text-slate-700">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button
        onClick={analyzePerformance}
        variant="outline"
        className="w-full"
      >
        Atualizar Análise
      </Button>
    </div>
  );
}