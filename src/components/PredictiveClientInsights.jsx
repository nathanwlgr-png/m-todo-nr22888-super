import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  AlertTriangle, TrendingUp, TrendingDown, DollarSign, 
  Calendar, Target, Zap, Sparkles, Loader2, CheckCircle2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function PredictiveClientInsights({ clientId, clientName }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('predictiveClientAnalysis', { client_id: clientId }),
    onSuccess: (response) => {
      setAnalysis(response.data);
      toast.success('Análise preditiva concluída!');
    },
    onError: () => {
      toast.error('Erro ao analisar cliente');
    }
  });

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return '🔴 Alto Risco';
    if (score >= 40) return '🟡 Risco Médio';
    return '🟢 Baixo Risco';
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Análise Preditiva IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Executar Análise Completa
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Risco de Churn */}
          {analysis.churn_analysis && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Análise de Churn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Risco de Perda</span>
                    <Badge className={getRiskColor(analysis.churn_analysis.churn_risk_score)}>
                      {getRiskLabel(analysis.churn_analysis.churn_risk_score)}
                    </Badge>
                  </div>
                  <Progress 
                    value={analysis.churn_analysis.churn_risk_score} 
                    className="h-3"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Score: {analysis.churn_analysis.churn_risk_score}/100
                  </p>
                </div>

                {analysis.churn_analysis.risk_factors?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Fatores de Risco:</p>
                    <ul className="text-xs text-red-800 space-y-1">
                      {analysis.churn_analysis.risk_factors.map((factor, i) => (
                        <li key={i}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.churn_analysis.retention_actions?.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 mb-2">💡 Ações de Retenção:</p>
                    <ul className="text-xs text-green-800 space-y-1">
                      {analysis.churn_analysis.retention_actions.map((action, i) => (
                        <li key={i}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.churn_analysis.action_deadline_days && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold">Prazo:</span>
                    <span className="text-orange-600">
                      Agir em até {analysis.churn_analysis.action_deadline_days} dias
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Oportunidades de Upsell */}
          {analysis.upsell_opportunities?.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Oportunidades de Upsell
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.upsell_opportunities.map((opp, i) => (
                  <div key={i} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-blue-900">{opp.product}</p>
                        <p className="text-xs text-blue-700 mt-1">{opp.reason}</p>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {opp.probability}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span>R$ {opp.expected_value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>{opp.timing}</span>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded mt-2">
                      <p className="text-xs font-semibold text-blue-900 mb-1">💬 Pitch:</p>
                      <p className="text-xs text-blue-800">{opp.pitch}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Oportunidades de Cross-Sell */}
          {analysis.cross_sell_opportunities?.length > 0 && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Oportunidades de Cross-Sell
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.cross_sell_opportunities.map((opp, i) => (
                  <div key={i} className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-purple-900">{opp.product}</p>
                        <p className="text-xs text-purple-700 mt-1">{opp.reason}</p>
                      </div>
                      <Badge className="bg-purple-600 text-white">
                        {opp.probability}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span>R$ {opp.expected_value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span>{opp.timing}</span>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded mt-2">
                      <p className="text-xs font-semibold text-purple-900 mb-1">💬 Pitch:</p>
                      <p className="text-xs text-purple-800">{opp.pitch}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Previsão de Próxima Compra */}
          {analysis.next_purchase_prediction && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Próxima Compra Prevista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Categoria:</span>
                    <Badge variant="outline">{analysis.next_purchase_prediction.product_category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Data estimada:</span>
                    <span className="text-sm text-slate-600">
                      {new Date(analysis.next_purchase_prediction.estimated_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Probabilidade:</span>
                    <Badge className="bg-green-600 text-white">
                      {analysis.next_purchase_prediction.probability}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Valor estimado:</span>
                    <span className="text-sm font-bold text-green-600">
                      R$ {analysis.next_purchase_prediction.estimated_value?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lifetime Value */}
          {analysis.lifetime_value && (
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Lifetime Value Previsto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-indigo-600 mb-1">12 meses</p>
                    <p className="text-lg font-bold text-indigo-900">
                      R$ {analysis.lifetime_value.ltv_12_months?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-indigo-600 mb-1">24 meses</p>
                    <p className="text-lg font-bold text-indigo-900">
                      R$ {analysis.lifetime_value.ltv_24_months?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-indigo-600 mb-1">36 meses</p>
                    <p className="text-lg font-bold text-indigo-900">
                      R$ {analysis.lifetime_value.ltv_36_months?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}