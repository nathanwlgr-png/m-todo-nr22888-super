import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';

// Probabilidades de fechamento por etapa do pipeline
const STAGE_PROBABILITIES = {
  diagnosticar_necessidades: 0.15,
  apresentar_equipamento: 0.30,
  demonstracao_tecnica: 0.50,
  negociar_proposta: 0.70,
  fechar_venda: 0.90
};

// Multiplicadores por status
const STATUS_MULTIPLIERS = {
  quente: 1.3,
  morno: 1.0,
  frio: 0.6
};

export default function RevenueForecast({ clients = [] }) {
  const forecast = useMemo(() => {
    let totalWeighted = 0;
    let totalOptimistic = 0;
    let totalPessimistic = 0;
    let totalPipeline = 0;

    const byStage = {};
    const highProbability = [];
    const mediumProbability = [];
    const lowProbability = [];

    clients.forEach(client => {
      const revenue = client.projected_revenue || 0;
      if (revenue === 0) return;

      totalPipeline += revenue;

      // Probabilidade base pela etapa
      const stageProbability = STAGE_PROBABILITIES[client.visit_objective] || 0.15;
      
      // Multiplicador pelo status
      const statusMultiplier = STATUS_MULTIPLIERS[client.status] || 1.0;
      
      // Ajuste pelo score
      const scoreAdjustment = (client.purchase_score || 50) / 100;
      
      // Probabilidade final
      const probability = Math.min(stageProbability * statusMultiplier * scoreAdjustment, 0.95);
      
      // Receita ponderada
      const weightedRevenue = revenue * probability;
      totalWeighted += weightedRevenue;
      
      // Cenários
      totalOptimistic += revenue * Math.min(probability * 1.5, 0.95);
      totalPessimistic += revenue * (probability * 0.6);

      // Agrupar por etapa
      const stage = client.visit_objective || 'diagnosticar_necessidades';
      if (!byStage[stage]) {
        byStage[stage] = { count: 0, revenue: 0, weightedRevenue: 0, probability: stageProbability };
      }
      byStage[stage].count++;
      byStage[stage].revenue += revenue;
      byStage[stage].weightedRevenue += weightedRevenue;

      // Classificar por probabilidade
      const clientData = { ...client, probability, weightedRevenue };
      if (probability >= 0.6) {
        highProbability.push(clientData);
      } else if (probability >= 0.3) {
        mediumProbability.push(clientData);
      } else {
        lowProbability.push(clientData);
      }
    });

    // Ordenar por receita ponderada
    highProbability.sort((a, b) => b.weightedRevenue - a.weightedRevenue);
    mediumProbability.sort((a, b) => b.weightedRevenue - a.weightedRevenue);

    return {
      totalPipeline,
      totalWeighted,
      totalOptimistic,
      totalPessimistic,
      byStage,
      highProbability: highProbability.slice(0, 5),
      mediumProbability: mediumProbability.slice(0, 3),
      lowProbability,
      conversionRate: totalPipeline > 0 ? (totalWeighted / totalPipeline) * 100 : 0
    };
  }, [clients]);

  const stageLabels = {
    diagnosticar_necessidades: 'Diagnóstico',
    apresentar_equipamento: 'Apresentação',
    demonstracao_tecnica: 'Demo',
    negociar_proposta: 'Negociação',
    fechar_venda: 'Fechamento'
  };

  return (
    <div className="space-y-4">
      {/* Main Forecast Card */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-emerald-900">Previsão de Receita Inteligente</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
            <p className="text-xs text-slate-500 mb-1">Projeção Realista</p>
            <p className="text-2xl font-bold text-emerald-600">
              R$ {(forecast.totalWeighted / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {forecast.conversionRate.toFixed(0)}% do pipeline
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border-2 border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Pipeline Total</p>
            <p className="text-2xl font-bold text-slate-700">
              R$ {(forecast.totalPipeline / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-400 mt-1">{clients.length} clientes</p>
          </div>
        </div>

        {/* Cenários */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">🎯 Cenário Otimista</span>
            <span className="font-bold text-green-600">
              R$ {(forecast.totalOptimistic / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">⚠️ Cenário Pessimista</span>
            <span className="font-bold text-amber-600">
              R$ {(forecast.totalPessimistic / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </Card>

      {/* By Stage */}
      <Card className="p-4">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Receita por Etapa
        </h4>
        <div className="space-y-3">
          {Object.entries(forecast.byStage).map(([stage, data]) => (
            <div key={stage}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {stageLabels[stage]}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {data.count} clientes
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">
                    R$ {(data.weightedRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-slate-500">
                    {((data.probability || 0) * 100).toFixed(0)}% prob.
                  </p>
                </div>
              </div>
              <Progress 
                value={(data.weightedRevenue / forecast.totalWeighted) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* High Probability Deals */}
      {forecast.highProbability.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Negócios de Alta Probabilidade ({forecast.highProbability.length})
          </h4>
          <div className="space-y-2">
            {forecast.highProbability.map(client => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{client.first_name}</p>
                  <p className="text-xs text-slate-500">{stageLabels[client.visit_objective]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">
                    R$ {(client.projected_revenue / 1000).toFixed(0)}k
                  </p>
                  <Badge className="bg-green-600 text-xs">
                    {(client.probability * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Medium Probability Deals */}
      {forecast.mediumProbability.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Necessitam Atenção ({forecast.mediumProbability.length})
          </h4>
          <div className="space-y-2">
            {forecast.mediumProbability.map(client => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{client.first_name}</p>
                  <p className="text-xs text-slate-500">{stageLabels[client.visit_objective]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600 text-sm">
                    R$ {(client.projected_revenue / 1000).toFixed(0)}k
                  </p>
                  <Badge className="bg-amber-500 text-xs">
                    {(client.probability * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}