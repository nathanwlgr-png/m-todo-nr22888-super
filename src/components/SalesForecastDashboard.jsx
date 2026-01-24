import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, 
  DollarSign, Target, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Info, Calendar, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SalesForecastDashboard({ compact = false }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState(false);

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ['salesForecasts'],
    queryFn: () => base44.entities.SalesForecast.list('-created_date', 5),
    staleTime: 5 * 60 * 1000
  });

  const latestForecast = forecasts[0];

  const generateNewForecast = async () => {
    setGeneratingForecast(true);
    try {
      const result = await base44.functions.invoke('generateSalesForecast', { period_type: 'monthly' });
      queryClient.invalidateQueries(['salesForecasts']);
      toast.success('Previsão atualizada!');
    } catch (error) {
      toast.error('Erro ao gerar previsão: ' + error.message);
    } finally {
      setGeneratingForecast(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </CardContent>
      </Card>
    );
  }

  if (!latestForecast) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
        <CardContent className="pt-6 text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-orange-400" />
          <p className="text-sm text-gray-600 mb-4">Nenhuma previsão gerada ainda</p>
          <Button
            onClick={generateNewForecast}
            disabled={generatingForecast}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {generatingForecast ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Previsão IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  const trendIcon = latestForecast.market_conditions?.trend === 'growing' ? TrendingUp :
                     latestForecast.market_conditions?.trend === 'declining' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const confidenceColor = latestForecast.confidence_level >= 70 ? 'text-green-600' :
                          latestForecast.confidence_level >= 50 ? 'text-yellow-600' : 'text-red-600';

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(createPageUrl('SalesForecastPage'))}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-orange-900">Previsão IA</h3>
            </div>
            <Badge className={`${confidenceColor} bg-white`}>
              {latestForecast.confidence_level}% confiança
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Vendas Previstas</p>
              <p className="text-2xl font-bold text-orange-600">{latestForecast.predicted_sales_count}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Receita Prevista</p>
              <p className="text-lg font-bold text-green-600">
                R$ {(latestForecast.predicted_revenue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <TrendIcon className="w-4 h-4" />
            <span>
              {latestForecast.market_conditions?.trend === 'growing' ? 'Mercado em crescimento' :
               latestForecast.market_conditions?.trend === 'declining' ? 'Mercado em queda' : 'Mercado estável'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-400 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-600" />
              Previsão de Vendas IA
            </CardTitle>
            <Button
              onClick={generateNewForecast}
              disabled={generatingForecast}
              size="sm"
              variant="outline"
              className="border-orange-300"
            >
              {generatingForecast ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Período: {new Date(latestForecast.period_start).toLocaleDateString('pt-BR')} - {new Date(latestForecast.period_end).toLocaleDateString('pt-BR')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-orange-500">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-gray-500">Vendas</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{latestForecast.predicted_sales_count}</p>
              <p className="text-xs text-gray-500 mt-1">próximos 30 dias</p>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-500">Receita</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                R$ {(latestForecast.predicted_revenue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500 mt-1">previsto</p>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500">Conversão</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{latestForecast.conversion_rate?.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">taxa prevista</p>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-500">Confiança</p>
              </div>
              <p className={`text-3xl font-bold ${confidenceColor}`}>
                {latestForecast.confidence_level}%
              </p>
              <Progress value={latestForecast.confidence_level} className="mt-2 h-1" />
            </div>
          </div>

          {/* Condições de Mercado */}
          {latestForecast.market_conditions && (
            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendIcon className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-800">Condições de Mercado</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className={
                    latestForecast.market_conditions.trend === 'growing' ? 'bg-green-600' :
                    latestForecast.market_conditions.trend === 'declining' ? 'bg-red-600' : 'bg-gray-600'
                  }>
                    {latestForecast.market_conditions.trend === 'growing' ? '📈 Crescimento' :
                     latestForecast.market_conditions.trend === 'declining' ? '📉 Queda' : '➡️ Estável'}
                  </Badge>
                </div>
                {latestForecast.market_conditions.seasonality_impact && (
                  <p className="text-gray-600">
                    <span className="font-medium">Sazonalidade:</span> {latestForecast.market_conditions.seasonality_impact}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fatores Chave */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Fatores que Influenciam
            </h4>
            {latestForecast.key_factors?.slice(0, 5).map((factor, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border-l-4" style={{
                borderLeftColor: factor.impact === 'positive' ? '#10b981' : 
                                factor.impact === 'negative' ? '#ef4444' : '#6b7280'
              }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{factor.factor}</span>
                      <Badge variant="outline" className="text-xs">
                        Peso: {factor.weight}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                  {factor.impact === 'positive' && <TrendingUp className="w-5 h-5 text-green-600" />}
                  {factor.impact === 'negative' && <TrendingDown className="w-5 h-5 text-red-600" />}
                  {factor.impact === 'neutral' && <Minus className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>

          {/* Clientes de Alta Probabilidade */}
          {latestForecast.high_probability_clients?.length > 0 && (
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Fechamentos Prováveis ({latestForecast.high_probability_clients.length})
              </h4>
              <div className="space-y-2">
                {latestForecast.high_probability_clients.map((hpc, idx) => (
                  <div key={idx} 
                    className="p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => hpc.client_id && navigate(createPageUrl(`ClientProfile?id=${hpc.client_id}`))}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{hpc.client_name}</p>
                        <p className="text-xs text-gray-500">
                          Previsão: {new Date(hpc.expected_close_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600 text-white mb-1">
                          {hpc.probability}%
                        </Badge>
                        <p className="text-sm font-bold text-green-700">
                          R$ {(hpc.expected_value / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{hpc.reasoning}</p>
                    <Progress value={hpc.probability} className="mt-2 h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raciocínio da IA */}
          <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-300">
            <button
              onClick={() => setExpandedReasoning(!expandedReasoning)}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Como a IA Chegou Nesta Previsão
              </h4>
              {expandedReasoning ? (
                <ChevronUp className="w-5 h-5 text-purple-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-600" />
              )}
            </button>
            
            {expandedReasoning && (
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                {latestForecast.ai_reasoning}
              </div>
            )}
          </div>

          {/* Recomendações */}
          {latestForecast.recommendations?.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Recomendações
              </h4>
              <ul className="space-y-2">
                {latestForecast.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Riscos */}
          {latestForecast.risk_factors?.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Fatores de Risco
              </h4>
              <ul className="space-y-2">
                {latestForecast.risk_factors.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-600">⚠️</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
            <span>Gerado em: {new Date(latestForecast.created_date).toLocaleString('pt-BR')}</span>
            <Button
              onClick={generateNewForecast}
              disabled={generatingForecast}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              {generatingForecast ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}