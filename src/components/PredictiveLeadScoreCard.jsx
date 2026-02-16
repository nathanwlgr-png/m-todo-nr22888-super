import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Target, Zap, Calendar, MessageCircle, 
  AlertTriangle, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PredictiveLeadScoreCard({ lead }) {
  const queryClient = useQueryClient();

  const calculateScoreMutation = useMutation({
    mutationFn: () => base44.functions.invoke('predictiveLeadScoring', { lead_id: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Score atualizado!');
    },
    onError: () => toast.error('Erro ao calcular score')
  });

  const score = lead.predictive_score || 0;
  const breakdown = lead.score_breakdown || {};
  const priority = lead.priority_level || 'low';

  const priorityConfig = {
    critical: { color: 'bg-red-600', label: '🔥 CRÍTICO', text: 'text-red-600' },
    high: { color: 'bg-orange-600', label: '⚡ ALTA', text: 'text-orange-600' },
    medium: { color: 'bg-yellow-600', label: '📍 MÉDIA', text: 'text-yellow-600' },
    low: { color: 'bg-slate-400', label: '📉 BAIXA', text: 'text-slate-600' }
  };

  const config = priorityConfig[priority];

  return (
    <Card className={`border-l-4 ${config.color}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Score Preditivo
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => calculateScoreMutation.mutate()}
            disabled={calculateScoreMutation.isPending}
          >
            {calculateScoreMutation.isPending ? (
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Recalcular
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${config.text}`}>
            {score}
          </div>
          <p className="text-sm text-slate-600">de 100 pontos</p>
          <Badge className={`${config.color} text-white mt-2`}>
            {config.label}
          </Badge>
        </div>

        {/* Barra de Conversão */}
        {lead.conversion_probability && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Probabilidade de Conversão</span>
              <span className="font-bold">{lead.conversion_probability}%</span>
            </div>
            <Progress value={lead.conversion_probability} className="h-2" />
          </div>
        )}

        {/* Breakdown de Scores */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Breakdown Detalhado:</h4>
          {breakdown.engagement_score !== undefined && (
            <ScoreItem 
              icon={<MessageCircle className="w-4 h-4" />}
              label="Engajamento"
              value={breakdown.engagement_score}
            />
          )}
          {breakdown.fit_score !== undefined && (
            <ScoreItem 
              icon={<Target className="w-4 h-4" />}
              label="Fit com ICP"
              value={breakdown.fit_score}
            />
          )}
          {breakdown.intent_score !== undefined && (
            <ScoreItem 
              icon={<Zap className="w-4 h-4" />}
              label="Intenção de Compra"
              value={breakdown.intent_score}
            />
          )}
          {breakdown.timing_score !== undefined && (
            <ScoreItem 
              icon={<Calendar className="w-4 h-4" />}
              label="Timing"
              value={breakdown.timing_score}
            />
          )}
        </div>

        {/* Sinais de Compra */}
        {lead.buying_signals && lead.buying_signals.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Sinais de Compra Detectados
            </h4>
            <div className="space-y-1">
              {lead.buying_signals.map((signal, idx) => (
                <div key={idx} className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                  • {signal}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próxima Ação */}
        {lead.next_best_action && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Próxima Ação Recomendada
                  </h4>
                  <p className="text-sm text-blue-800">{lead.next_best_action}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights IA */}
        {lead.ai_insights && lead.ai_insights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Insights da IA
            </h4>
            <div className="space-y-2">
              {lead.ai_insights.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="text-xs bg-purple-50 text-purple-900 p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    <span className="text-xs text-purple-600">
                      {insight.confidence}% confiança
                    </span>
                  </div>
                  <p>{insight.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Última Atualização */}
        {lead.last_score_update && (
          <p className="text-xs text-slate-500 text-center">
            Última atualização: {new Date(lead.last_score_update).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreItem({ icon, label, value }) {
  const getColor = (val) => {
    if (val >= 70) return 'text-green-600';
    if (val >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-slate-700">{label}</span>
      </div>
      <span className={`font-bold ${getColor(value)}`}>{value}/100</span>
    </div>
  );
}