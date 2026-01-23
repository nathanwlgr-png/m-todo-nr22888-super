import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

const ENGAGEMENT_COLORS = {
  very_high: 'bg-green-500',
  high: 'bg-emerald-500',
  medium: 'bg-yellow-500',
  low: 'bg-orange-500',
  very_low: 'bg-red-500'
};

const ENGAGEMENT_LABELS = {
  very_high: 'Muito Alto',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
  very_low: 'Muito Baixo'
};

export default function ClientScoreCard({ clientId, compact = false }) {
  const queryClient = useQueryClient();
  const [calculating, setCalculating] = useState(false);

  const { data: score, isLoading } = useQuery({
    queryKey: ['client-score', clientId],
    queryFn: async () => {
      try {
        const result = await base44.entities.ClientScore.filter({ client_id: clientId });
        return result?.[0] || null;
      } catch (error) {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const response = await base44.functions.invoke('calculateClientScore', { client_id: clientId });
      if (response?.data?.success) {
        queryClient.invalidateQueries(['client-score', clientId]);
      }
    } catch (error) {
      console.error('Erro ao calcular score:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-slate-50">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="p-4 bg-slate-50 border-dashed">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-3">Score não calculado</p>
          <Button
            size="sm"
            onClick={calculateScore}
            disabled={calculating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {calculating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <TrendingUp className="w-3 h-3 mr-1" />}
            Calcular Score
          </Button>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{score.overall_score}</p>
          <p className="text-xs text-slate-600">Score</p>
        </div>
        <Badge className={`${ENGAGEMENT_COLORS[score.engagement_level]} text-white`}>
          {ENGAGEMENT_LABELS[score.engagement_level]}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Principal */}
      <Card className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-indigo-600 font-semibold mb-1">Pontuação do Cliente</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-indigo-900">{score.overall_score}</p>
              <p className="text-sm text-indigo-700">/100</p>
            </div>
          </div>
          <Badge className={`${ENGAGEMENT_COLORS[score.engagement_level]} text-white`}>
            {ENGAGEMENT_LABELS[score.engagement_level]}
          </Badge>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-indigo-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${score.overall_score}%` }}
          />
        </div>
      </Card>

      {/* Scores Componentes */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-white shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-1">Compras</p>
          <p className="text-2xl font-bold text-slate-900">{score.purchase_history_score}</p>
          <p className="text-xs text-slate-600 mt-1">40% do total</p>
        </Card>
        <Card className="p-3 bg-white shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-1">Interação</p>
          <p className="text-2xl font-bold text-slate-900">{score.interaction_score}</p>
          <p className="text-xs text-slate-600 mt-1">35% do total</p>
        </Card>
        <Card className="p-3 bg-white shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-1">Numerologia</p>
          <p className="text-2xl font-bold text-slate-900">{score.numerology_score}</p>
          <p className="text-xs text-slate-600 mt-1">25% do total</p>
        </Card>
      </div>

      {/* Probabilidades */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <p className="text-xs text-green-600 font-semibold mb-1">Probabilidade de Conversão</p>
          <p className="text-3xl font-bold text-green-700">{score.conversion_probability}%</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-red-600 font-semibold mb-1">Risco de Perda</p>
              <p className="text-3xl font-bold text-red-700">{score.churn_risk.toFixed(0)}%</p>
            </div>
            {score.churn_risk > 60 && (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Recomendações */}
      {score.recommendations && score.recommendations.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <p className="text-sm font-semibold text-purple-900 mb-2">📋 Recomendações</p>
          <ul className="space-y-1">
            {score.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex gap-2">
                <span className="text-purple-600">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Atualizar Score */}
      <Button
        onClick={calculateScore}
        disabled={calculating}
        variant="outline"
        className="w-full"
      >
        {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
        Recalcular Score
      </Button>

      {score.last_calculated && (
        <p className="text-xs text-slate-500 text-center">
          Atualizado: {new Date(score.last_calculated).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}