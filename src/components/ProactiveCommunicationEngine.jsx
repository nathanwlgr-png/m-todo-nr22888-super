import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, DollarSign, Target, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveCommunicationEngine({ clientId }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }),
    select: (data) => data[0],
    enabled: !!clientId
  });

  const generateIntelligence = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculateAdvancedAIIntelligence', {
        client_id: clientId
      });
      
      queryClient.invalidateQueries(['client', clientId]);
      toast.success('Inteligência de vendas atualizada!');
    } catch (error) {
      toast.error('Erro ao gerar inteligência: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return <div className="text-center py-4">Carregando...</div>;

  const intelligence = client.ai_sales_intelligence || {};
  const hasCrossSell = intelligence.cross_sell_opportunities?.length > 0;
  const hasUpsell = intelligence.upsell_opportunities?.length > 0;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Inteligência de Vendas Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!intelligence.product_adoption_rate ? (
            <div className="text-center py-8">
              <Button 
                onClick={generateIntelligence} 
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {loading ? 'Analisando...' : 'Gerar Análise IA'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-2 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Adoção</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {intelligence.product_adoption_rate}%
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">LTV 24 meses</p>
                        <p className="text-3xl font-bold text-green-600">
                          R$ {(intelligence.ltv_24_months || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Oportunidades</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {(intelligence.cross_sell_opportunities?.length || 0) + 
                           (intelligence.upsell_opportunities?.length || 0)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* LTV Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Projeção de Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">12 meses</p>
                      <p className="text-lg font-bold text-gray-800">
                        R$ {(intelligence.ltv_12_months || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">24 meses</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {(intelligence.ltv_24_months || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">36 meses</p>
                      <p className="text-lg font-bold text-blue-600">
                        R$ {(intelligence.ltv_36_months || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cross-Sell Opportunities */}
              {hasCrossSell && (
                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Oportunidades de Cross-Sell
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {intelligence.cross_sell_opportunities.map((opp, idx) => (
                        <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">{opp.product}</p>
                              <p className="text-xs text-gray-600 mt-1">{opp.reason}</p>
                            </div>
                            <Badge className="bg-green-600 text-white">
                              {opp.probability}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              R$ {opp.expected_value.toLocaleString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {opp.timing}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upsell Opportunities */}
              {hasUpsell && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Oportunidades de Upsell
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {intelligence.upsell_opportunities.map((opp, idx) => (
                        <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">{opp.product}</p>
                              <p className="text-xs text-gray-600 mt-1">{opp.reason}</p>
                            </div>
                            <Badge className="bg-blue-600 text-white">
                              {opp.probability}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              R$ {opp.expected_value.toLocaleString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {opp.timing}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Purchase Prediction */}
              {intelligence.next_purchase_prediction && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-700">Previsão de Próxima Compra:</span>
                        <p className="text-sm text-gray-800 mt-1">
                          {intelligence.next_purchase_prediction.product_category}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span>Data: {intelligence.next_purchase_prediction.estimated_date}</span>
                          <span>Probabilidade: {intelligence.next_purchase_prediction.probability}%</span>
                          <span>Valor: R$ {intelligence.next_purchase_prediction.estimated_value?.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                variant="outline" 
                onClick={generateIntelligence}
                disabled={loading}
                className="w-full"
              >
                Atualizar Análise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}