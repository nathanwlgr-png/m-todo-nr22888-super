import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function ProbabilityAnalysisAI({ client }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['all-clients-stats'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ['all-sales-stats'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: allVisits = [] } = useQuery({
    queryKey: ['all-visits-stats'],
    queryFn: () => base44.entities.Visit.list()
  });

  const analyzeProbability = async () => {
    if (!client?.purchase_score && !client?.status) {
      toast.error('Cliente precisa ter dados básicos (status ou score)');
      return;
    }
    
    setAnalyzing(true);
    try {
      // Dados estatísticos
      const clientsWithSameProfile = allClients.filter(c => 
        c && c.numerology_number === client.numerology_number
      );
      
      const clientsWithSameType = allClients.filter(c => 
        c && c.client_type === client.client_type
      );

      const salesBySimilarClients = allSales.filter(s => {
        if (!s?.client_id) return false;
        const saleClient = allClients.find(c => c && c.id === s.client_id);
        return saleClient && (
          saleClient.numerology_number === client.numerology_number ||
          saleClient.client_type === client.client_type
        );
      });

      const visitsBySimilarClients = allVisits.filter(v => {
        if (!v?.client_id) return false;
        const visitClient = allClients.find(c => c && c.id === v.client_id);
        return visitClient && visitClient.numerology_number === client.numerology_number;
      });

      const prompt = `Você é um cientista de dados especializado em previsão de vendas B2B.

DADOS DO CLIENTE ATUAL:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Tipo: ${client.client_type}
- Status: ${client.status}
- Score Atual: ${client.purchase_score}%
- Orçamento: R$ ${client.available_budget || 0}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.length || 0}
- Objeções: ${client.real_objections?.length || 0}
- Visitas realizadas: ${client.total_visits_count || 0}

DADOS ESTATÍSTICOS HISTÓRICOS:
- Total de clientes no sistema: ${allClients.length}
- Clientes com mesmo perfil numerológico (${client.numerology_number}): ${clientsWithSameProfile.length}
- Clientes do mesmo tipo (${client.client_type}): ${clientsWithSameType.length}
- Vendas fechadas por perfis similares: ${salesBySimilarClients.filter(s => s.status === 'fechada').length}
- Média de visitas até fechamento (perfil similar): ${visitsBySimilarClients.length > 0 ? (visitsBySimilarClients.length / Math.max(salesBySimilarClients.length, 1)).toFixed(1) : 'N/A'}
- Taxa de conversão geral: ${allSales.length > 0 ? ((allSales.filter(s => s.status === 'fechada').length / allClients.length) * 100).toFixed(1) : 0}%

TAREFA:
Faça uma ANÁLISE PROBABILÍSTICA PROFUNDA usando:
1. Regressão logística conceitual
2. Análise de cohort (clientes similares)
3. Padrões temporais
4. Fatores de risco e sucesso

Retorne JSON:
{
  "closing_probability": 78,
  "confidence_interval": [70, 86],
  "expected_closing_date": "2025-02-15",
  "expected_visits_needed": 3,
  "probability_factors": {
    "score_weight": 25,
    "numerology_weight": 20,
    "budget_weight": 15,
    "history_weight": 20,
    "behavior_weight": 20
  },
  "statistical_analysis": {
    "cohort_conversion_rate": 65,
    "similar_clients_avg_days": 45,
    "success_pattern_match": 80
  },
  "risk_factors": [
    "Fator de risco 1",
    "Fator de risco 2"
  ],
  "success_factors": [
    "Fator de sucesso 1",
    "Fator de sucesso 2"
  ],
  "recommended_actions": [
    "Ação prioritária 1",
    "Ação prioritária 2"
  ],
  "optimal_approach": "Descrição da melhor estratégia baseada em dados"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            closing_probability: { type: "number" },
            confidence_interval: {
              type: "array",
              items: { type: "number" }
            },
            expected_closing_date: { type: "string" },
            expected_visits_needed: { type: "number" },
            probability_factors: {
              type: "object",
              properties: {
                score_weight: { type: "number" },
                numerology_weight: { type: "number" },
                budget_weight: { type: "number" },
                history_weight: { type: "number" },
                behavior_weight: { type: "number" }
              }
            },
            statistical_analysis: {
              type: "object",
              properties: {
                cohort_conversion_rate: { type: "number" },
                similar_clients_avg_days: { type: "number" },
                success_pattern_match: { type: "number" }
              }
            },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            },
            success_factors: {
              type: "array",
              items: { type: "string" }
            },
            recommended_actions: {
              type: "array",
              items: { type: "string" }
            },
            optimal_approach: { type: "string" }
          }
        }
      });

      if (result?.closing_probability) {
        setAnalysis(result);
        toast.success('Análise probabilística concluída!');
      } else {
        toast.error('Erro ao processar análise');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao analisar probabilidade');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">📊 Análise Probabilística</h3>
          <p className="text-xs text-slate-600">IA com dados estatísticos e regressão</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={analyzeProbability}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Calculando Probabilidades...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analisar com Dados Estatísticos
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Probabilidade Principal */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">PROBABILIDADE DE FECHAMENTO</p>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{analysis.closing_probability}%</p>
              <p className="text-sm opacity-80">
                ({analysis.confidence_interval[0]}-{analysis.confidence_interval[1]}%)
              </p>
            </div>
          </div>

          {/* Previsões */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-slate-500">Data Esperada</p>
              </div>
              <p className="font-bold text-slate-800">
                {new Date(analysis.expected_closing_date).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-slate-500">Visitas Previstas</p>
              </div>
              <p className="font-bold text-slate-800">
                {analysis.expected_visits_needed} visitas
              </p>
            </div>
          </div>

          {/* Pesos dos Fatores */}
          <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-3">Pesos dos Fatores</p>
            <div className="space-y-2">
              {Object.entries(analysis.probability_factors).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-800">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise Estatística */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">📈 Cohort Analysis</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Taxa Conversão Similar</p>
                <p className="font-bold text-slate-800">{analysis.statistical_analysis.cohort_conversion_rate}%</p>
              </div>
              <div>
                <p className="text-slate-500">Dias Médios</p>
                <p className="font-bold text-slate-800">{analysis.statistical_analysis.similar_clients_avg_days}d</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Match de Padrão</p>
                <p className="font-bold text-slate-800">{analysis.statistical_analysis.success_pattern_match}%</p>
              </div>
            </div>
          </div>

          {/* Fatores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-1">✓ Sucesso</p>
              <ul className="text-xs text-green-600 space-y-0.5">
                {analysis.success_factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-1">⚠ Riscos</p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {analysis.risk_factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Abordagem Ótima */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-1">🎯 Estratégia Ótima</p>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.optimal_approach}</p>
          </div>

          {/* Ações Recomendadas */}
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-700 mb-2">⚡ Ações Prioritárias</p>
            <ul className="text-xs text-slate-700 space-y-1">
              {analysis.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={analyzeProbability}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={analyzing}
          >
            Recalcular
          </Button>
        </div>
      )}
    </Card>
  );
}