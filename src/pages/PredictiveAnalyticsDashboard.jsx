import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, 
  Target, Sparkles, Loader2, DollarSign, Calendar,
  Users, Zap, CheckCircle2, Clock, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export default function PredictiveAnalyticsDashboard() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  const generatePredictions = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.functions.invoke('generatePredictiveAnalytics', {});
      setPredictions(result.predictions);
      toast.success('Análise preditiva completa!');
    } catch (error) {
      toast.error('Erro ao gerar previsões: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const COLORS = {
    high: '#ef4444',
    medium: '#f97316',
    low: '#eab308',
    success: '#22c55e',
    primary: '#7c3aed'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Predictive Analytics</h1>
            <p className="text-slate-600">Previsões de vendas, churn e probabilidades de fechamento</p>
          </div>
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>

        {/* Action Button */}
        {!predictions && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-purple-900 mb-2">Análise Preditiva com IA</h3>
              <p className="text-slate-700 mb-4">
                Gere previsões inteligentes baseadas em todo o histórico do CRM
              </p>
              <Button
                onClick={generatePredictions}
                disabled={analyzing}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando dados...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Previsões
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {predictions && (
          <>
            {/* Previsão de Vendas */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <TrendingUp className="w-5 h-5" />
                  Previsão de Vendas - Próximos 3 Meses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {['next_month', 'second_month', 'third_month'].map((period, idx) => {
                    const data = predictions.sales_forecast[period];
                    const monthName = ['Mês 1', 'Mês 2', 'Mês 3'][idx];
                    
                    return (
                      <Card key={period} className="bg-white/80">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-600 mb-1">{monthName}</p>
                          <p className="text-2xl font-bold text-green-900">
                            {data.predicted_sales_count}
                          </p>
                          <p className="text-xs text-slate-700">vendas previstas</p>
                          <p className="text-lg font-bold text-green-700 mt-2">
                            R$ {data.predicted_revenue.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={data.confidence} className="flex-1 h-1" />
                            <span className="text-xs text-slate-600">{data.confidence}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {predictions.sales_forecast.next_month.key_factors && (
                  <div className="p-3 bg-white/80 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 mb-2">Fatores Chave:</p>
                    <ul className="space-y-1">
                      {predictions.sales_forecast.next_month.key_factors.map((factor, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-white/80 rounded-lg">
                  <p className="text-xs font-semibold text-green-800 mb-1">Tendência:</p>
                  <p className="text-sm text-slate-700">{predictions.sales_forecast.reasoning}</p>
                </div>
              </CardContent>
            </Card>

            {/* Clientes em Risco de Churn */}
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Churn - {predictions.churn_risks.length} Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.churn_risks.slice(0, 10).map((risk, idx) => {
                  const riskColor = risk.risk_level === 'high' ? 'red' :
                                    risk.risk_level === 'medium' ? 'orange' : 'yellow';
                  
                  return (
                    <Card key={idx} className={`bg-${riskColor}-50 border-2 border-${riskColor}-300`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-slate-900">{risk.client_name}</p>
                            <p className="text-xs text-slate-600">Risco: {risk.risk_level}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`bg-${riskColor}-600`}>
                              {risk.risk_score}%
                            </Badge>
                            <p className="text-xs text-slate-600 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {risk.days_to_act} dias
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Por quê:</p>
                            <ul className="space-y-0.5">
                              {risk.reasons.map((reason, i) => (
                                <li key={i} className="text-xs text-slate-600">• {reason}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Ações:</p>
                            <ul className="space-y-0.5">
                              {risk.recommended_actions.map((action, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                  <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => navigate(createPageUrl(`ClientProfile?id=${risk.client_id}`))}
                        >
                          Ver Cliente
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Deals Quentes */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Target className="w-5 h-5" />
                  Deals Quentes - Alta Probabilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.hot_deals.slice(0, 10).map((deal, idx) => (
                  <Card key={idx} className="bg-white/80 border-2 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-purple-900">{deal.client_name}</p>
                          <p className="text-sm text-purple-700">
                            R$ {deal.estimated_value.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-purple-600">
                            {deal.close_probability}%
                          </Badge>
                          <p className="text-xs text-slate-600 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(deal.estimated_close_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Progress value={deal.close_probability} className="h-2 mb-3" />

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-purple-700 mb-1">Fatores Positivos:</p>
                          <ul className="space-y-0.5">
                            {deal.key_factors.map((factor, i) => (
                              <li key={i} className="text-xs text-slate-600">✓ {factor}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-purple-700 mb-1">Próximos Passos:</p>
                          <ul className="space-y-0.5">
                            {deal.next_steps.map((step, i) => (
                              <li key={i} className="text-xs text-slate-600">→ {step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-3 bg-purple-600"
                        onClick={() => navigate(createPageUrl(`ClientProfile?id=${deal.client_id}`))}
                      >
                        Trabalhar Este Deal
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Insights Acionáveis */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Zap className="w-5 h-5" />
                  Insights Acionáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {predictions.insights.map((insight, idx) => (
                  <Card key={idx} className="bg-white/80">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <Badge className="bg-blue-600">{insight.category}</Badge>
                        <Badge variant="outline" className={
                          insight.priority === 'high' ? 'border-red-500 text-red-700' :
                          insight.priority === 'medium' ? 'border-orange-500 text-orange-700' :
                          'border-yellow-500 text-yellow-700'
                        }>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">{insight.insight}</p>
                      <p className="text-xs text-slate-600 mb-2">💡 {insight.action}</p>
                      <p className="text-xs text-blue-700">Impacto: {insight.impact}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Saúde do Mercado */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Visão Geral do Mercado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-slate-600">Saúde Geral</p>
                    <p className="text-lg font-bold text-slate-900">
                      {predictions.market_trends.overall_health}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-slate-600">Velocidade</p>
                    <p className="text-lg font-bold text-slate-900">
                      {predictions.market_trends.velocity}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-slate-600">Conversão</p>
                    <p className="text-lg font-bold text-slate-900">
                      {predictions.market_trends.conversion_rate_trend}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Recomendações:</p>
                  <ul className="space-y-1">
                    {predictions.market_trends.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Botão para nova análise */}
            <Button
              onClick={generatePredictions}
              disabled={analyzing}
              className="w-full"
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Atualizar Previsões
            </Button>
          </>
        )}
      </div>
    </div>
  );
}