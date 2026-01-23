import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, DollarSign, RefreshCw, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesForecastAI() {
    const [forecast, setForecast] = useState(null);
    const [isForecasting, setIsForecasting] = useState(false);

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const { data: sales = [] } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    const { data: interactions = [] } = useQuery({
        queryKey: ['all-interactions'],
        queryFn: () => base44.entities.Interaction.list(),
    });

    const generateForecast = async () => {
        setIsForecasting(true);
        try {
            // Preparar dados históricos
            const historicalData = {
                total_clients: clients.length,
                hot_clients: clients.filter(c => c.status === 'quente').length,
                warm_clients: clients.filter(c => c.status === 'morno').length,
                cold_clients: clients.filter(c => c.status === 'frio').length,
                total_sales: sales.length,
                closed_sales: sales.filter(s => s.status === 'fechada').length,
                total_revenue: sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0),
                avg_sale_value: sales.filter(s => s.status === 'fechada').length > 0 
                    ? sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0) / sales.filter(s => s.status === 'fechada').length 
                    : 0,
                total_interactions: interactions.length,
                clients_with_visits: clients.filter(c => c.total_visits_count > 0).length,
                avg_purchase_score: clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length
            };

            const hotClientsDetails = clients
                .filter(c => c.status === 'quente')
                .map(c => ({
                    name: c.first_name,
                    score: c.purchase_score,
                    equipment_interest: c.equipment_interest,
                    budget: c.available_budget,
                    last_visit: c.last_visit_date
                }));

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um especialista em previsão de vendas para equipamentos veterinários.

DADOS HISTÓRICOS:
${JSON.stringify(historicalData, null, 2)}

CLIENTES QUENTES (top prioridade):
${JSON.stringify(hotClientsDetails.slice(0, 20), null, 2)}

TAREFA:
Faça uma previsão de vendas detalhada para os próximos 30, 60 e 90 dias:

1. Previsão de receita (conservadora, realista, otimista)
2. Quantidade de vendas esperadas
3. Principais oportunidades (top 5)
4. Riscos e desafios
5. Ações recomendadas para atingir metas
6. Sazonalidade e tendências
7. Taxa de conversão esperada
8. Equipamentos com maior probabilidade de venda`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        next_30_days: {
                            type: "object",
                            properties: {
                                revenue_forecast: {
                                    type: "object",
                                    properties: {
                                        conservative: { type: "number" },
                                        realistic: { type: "number" },
                                        optimistic: { type: "number" }
                                    }
                                },
                                expected_sales_count: { type: "number" },
                                conversion_rate: { type: "number" }
                            }
                        },
                        next_60_days: {
                            type: "object",
                            properties: {
                                revenue_forecast: {
                                    type: "object",
                                    properties: {
                                        conservative: { type: "number" },
                                        realistic: { type: "number" },
                                        optimistic: { type: "number" }
                                    }
                                },
                                expected_sales_count: { type: "number" }
                            }
                        },
                        next_90_days: {
                            type: "object",
                            properties: {
                                revenue_forecast: {
                                    type: "object",
                                    properties: {
                                        conservative: { type: "number" },
                                        realistic: { type: "number" },
                                        optimistic: { type: "number" }
                                    }
                                },
                                expected_sales_count: { type: "number" }
                            }
                        },
                        top_opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    client_name: { type: "string" },
                                    equipment: { type: "string" },
                                    estimated_value: { type: "number" },
                                    probability: { type: "number" },
                                    timeline: { type: "string" }
                                }
                            }
                        },
                        risks: {
                            type: "array",
                            items: { type: "string" }
                        },
                        recommended_actions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        hot_equipment: {
                            type: "array",
                            items: { type: "string" }
                        },
                        trends: { type: "string" }
                    }
                }
            });

            setForecast(result);
            toast.success('Previsão gerada com sucesso!');
        } catch (error) {
            console.error('Forecast error:', error);
            toast.error('Erro ao gerar previsão');
        } finally {
            setIsForecasting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Previsão de Vendas IA
                    </div>
                    <Button
                        onClick={generateForecast}
                        disabled={isForecasting}
                        size="sm"
                    >
                        {isForecasting ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Calculando...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Gerar Previsão
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!forecast ? (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Gere previsões inteligentes de vendas</p>
                        <p className="text-xs mt-1">Baseado em dados históricos e IA</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Previsão 30 dias */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-900">Próximos 30 Dias</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-xs text-gray-600">Conservador</div>
                                    <div className="text-lg font-bold text-green-700">
                                        R$ {forecast.next_30_days.revenue_forecast.conservative.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-green-100 rounded border-2 border-green-400">
                                    <div className="text-xs text-gray-600">Realista</div>
                                    <div className="text-lg font-bold text-green-800">
                                        R$ {forecast.next_30_days.revenue_forecast.realistic.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                    <div className="text-xs text-gray-600">Otimista</div>
                                    <div className="text-lg font-bold text-green-700">
                                        R$ {forecast.next_30_days.revenue_forecast.optimistic.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-green-700 flex items-center justify-between">
                                <span>Vendas esperadas: {forecast.next_30_days.expected_sales_count}</span>
                                <span>Conv: {forecast.next_30_days.conversion_rate}%</span>
                            </div>
                        </div>

                        {/* Previsão 60 dias */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-900">60 Dias</span>
                                <span className="text-lg font-bold text-blue-700">
                                    R$ {forecast.next_60_days.revenue_forecast.realistic.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="text-xs text-blue-600">
                                {forecast.next_60_days.expected_sales_count} vendas esperadas
                            </div>
                        </div>

                        {/* Previsão 90 dias */}
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-900">90 Dias</span>
                                <span className="text-lg font-bold text-purple-700">
                                    R$ {forecast.next_90_days.revenue_forecast.realistic.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="text-xs text-purple-600">
                                {forecast.next_90_days.expected_sales_count} vendas esperadas
                            </div>
                        </div>

                        {/* Top Oportunidades */}
                        {forecast.top_opportunities?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-semibold">Top Oportunidades</span>
                                </div>
                                <div className="space-y-2">
                                    {forecast.top_opportunities.slice(0, 5).map((opp, idx) => (
                                        <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-sm text-orange-900">
                                                        {opp.client_name}
                                                    </div>
                                                    <div className="text-xs text-orange-700">
                                                        {opp.equipment} • {opp.timeline}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-orange-700">
                                                        R$ {opp.estimated_value.toLocaleString('pt-BR')}
                                                    </div>
                                                    <Badge className="bg-orange-200 text-orange-800 text-xs">
                                                        {opp.probability}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Riscos */}
                        {forecast.risks?.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-semibold text-red-900">Riscos</span>
                                </div>
                                <ul className="text-xs text-red-700 space-y-1">
                                    {forecast.risks.map((risk, idx) => (
                                        <li key={idx}>• {risk}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Ações Recomendadas */}
                        {forecast.recommended_actions?.length > 0 && (
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-indigo-900 mb-2">🎯 Ações Recomendadas</h4>
                                <ul className="text-xs text-indigo-700 space-y-1">
                                    {forecast.recommended_actions.map((action, idx) => (
                                        <li key={idx}>✓ {action}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Equipamentos em Alta */}
                        {forecast.hot_equipment?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">🔥 Equipamentos em Alta</h4>
                                <div className="flex flex-wrap gap-2">
                                    {forecast.hot_equipment.map((eq, idx) => (
                                        <Badge key={idx} className="bg-red-100 text-red-800">
                                            {eq}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tendências */}
                        {forecast.trends && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-semibold mb-1">📊 Tendências</h4>
                                <p className="text-xs text-gray-700">{forecast.trends}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}