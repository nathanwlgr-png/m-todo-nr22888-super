import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Zap,
  Brain,
  Loader2,
  ChevronRight,
  Calendar,
  Package,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveAnalyticsDashboard({ client }) {
  const [analytics, setAnalytics] = useState(client?.ai_sales_intelligence || null);
  const [loading, setLoading] = useState(false);

  const generateAnalytics = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculatePredictiveAnalytics', {
        client_id: client.id
      });

      if (response.data.success) {
        setAnalytics(response.data.analytics);
        
        // Atualizar cliente com novos dados
        await base44.entities.Client.update(client.id, {
          ai_sales_intelligence: response.data.analytics
        });

        toast.success('Análise preditiva gerada com sucesso!');
      } else {
        toast.error(response.data.error || 'Erro ao gerar análise');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar análise preditiva');
    } finally {
      setLoading(false);
    }
  };

  const getChurnColor = (risk) => {
    if (risk < 20) return 'text-green-600 bg-green-50';
    if (risk < 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConversionColor = (prob) => {
    if (prob > 70) return 'text-green-600 bg-green-50';
    if (prob > 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (!analytics) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>Análise Preditiva</CardTitle>
              <p className="text-sm text-muted-foreground">LTV, Churn e Oportunidades</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateAnalytics} 
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Gerar Análise Preditiva Completa
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Análise Preditiva</h3>
            <p className="text-sm text-muted-foreground">
              Última análise: {analytics.last_ai_analysis ? new Date(analytics.last_ai_analysis).toLocaleDateString() : 'Agora'}
            </p>
          </div>
        </div>
        <Button 
          onClick={generateAnalytics} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LTV Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <CardTitle className="text-sm">Lifetime Value</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    R$ {(analytics.ltv_12_months || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Próximos 12 meses</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">24 meses</p>
                  <p className="font-semibold">R$ {(analytics.ltv_24_months || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">36 meses</p>
                  <p className="font-semibold">R$ {(analytics.ltv_36_months || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Churn Risk Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${analytics.churn_risk > 50 ? 'text-red-600' : 'text-yellow-600'}`} />
              <CardTitle className="text-sm">Risco de Churn</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getChurnColor(analytics.churn_risk).split(' ')[0]}`}>
                    {analytics.churn_risk || 0}%
                  </span>
                </div>
                <Progress value={analytics.churn_risk || 0} className="h-2 mt-2" />
              </div>
              <div className="pt-2 border-t">
                <Badge className={getChurnColor(analytics.churn_risk)}>
                  {analytics.churn_risk < 20 ? '✅ Baixo Risco' : 
                   analytics.churn_risk < 50 ? '⚠️ Risco Moderado' : 
                   '🚨 Alto Risco'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversão Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm">Probabilidade de Conversão</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getConversionColor(analytics.conversion_probability).split(' ')[0]}`}>
                    {analytics.conversion_probability || 0}%
                  </span>
                </div>
                <Progress value={analytics.conversion_probability || 0} className="h-2 mt-2" />
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {analytics.best_approach || 'Analisando...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oportunidades de Cross-sell */}
      {analytics.cross_sell_opportunities && analytics.cross_sell_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <CardTitle>Oportunidades de Cross-sell</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.cross_sell_opportunities.map((opp, idx) => (
                <div key={idx} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-indigo-900">{opp.product}</h4>
                      <p className="text-sm text-indigo-700 mt-1">{opp.reason}</p>
                    </div>
                    <Badge className="bg-indigo-600 text-white">
                      {opp.probability}% prob.
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-200">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold">R$ {opp.expected_value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>{opp.timing}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oportunidades de Upsell */}
      {analytics.upsell_opportunities && analytics.upsell_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle>Oportunidades de Upsell</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.upsell_opportunities.map((opp, idx) => (
                <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">{opp.product}</h4>
                      <p className="text-sm text-green-700 mt-1">{opp.reason}</p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {opp.probability}% prob.
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">R$ {opp.expected_value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>{opp.timing}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsão de Próxima Compra */}
      {analytics.next_purchase_prediction && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <CardTitle>Previsão de Próxima Compra</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-semibold text-purple-900">
                  {analytics.next_purchase_prediction.product_category}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Estimada</p>
                <p className="font-semibold text-purple-900">
                  {new Date(analytics.next_purchase_prediction.estimated_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Probabilidade</p>
                <p className="font-semibold text-purple-900">
                  {analytics.next_purchase_prediction.probability}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="font-semibold text-purple-900">
                  R$ {analytics.next_purchase_prediction.estimated_value?.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gatilhos e Conteúdos Recomendados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.key_triggers && analytics.key_triggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gatilhos Mentais Efetivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.key_triggers.map((trigger, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50">
                    <Zap className="w-3 h-3 mr-1" />
                    {trigger}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.recommended_content && analytics.recommended_content.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conteúdos Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recommended_content.map((content, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-green-600" />
                    <span>{content}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}