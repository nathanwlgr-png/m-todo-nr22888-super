import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AIClientSegmentation() {
    const [isSegmenting, setIsSegmenting] = useState(false);
    const [segmentResults, setSegmentResults] = useState(null);
    const queryClient = useQueryClient();

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

    const updateClientMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
        }
    });

    const segmentClients = async () => {
        setIsSegmenting(true);
        try {
            const clientsData = clients.map(client => {
                const clientSales = sales.filter(s => s.client_id === client.id);
                const clientInteractions = interactions.filter(i => i.client_id === client.id);
                
                return {
                    id: client.id,
                    name: client.first_name,
                    status: client.status,
                    purchase_score: client.purchase_score || 0,
                    total_sales: clientSales.length,
                    total_revenue: clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
                    last_interaction: clientInteractions[0]?.created_date,
                    interaction_count: clientInteractions.length,
                    engagement_score: client.engagement_score || 0,
                    ai_sentiment: clientInteractions.filter(i => i.ai_sentiment === 'positivo').length / (clientInteractions.length || 1),
                    equipment_interest: client.equipment_interest,
                    available_budget: client.available_budget
                };
            });

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um especialista em segmentação de clientes B2B.

Analise estes ${clientsData.length} clientes e segmente-os em grupos estratégicos:

DADOS DOS CLIENTES:
${JSON.stringify(clientsData.slice(0, 50), null, 2)}

CRITÉRIOS DE SEGMENTAÇÃO:
1. Histórico de compras (quantidade, valor, frequência)
2. Sentimento das interações (positivo/neutro/negativo)
3. Nível de engajamento (interações, respostas, visitas)
4. Lifetime Value previsto (potencial de receita futura)
5. Estágio no funil de vendas
6. Orçamento disponível

SEGMENTOS POSSÍVEIS:
- VIP (high value, high engagement, multiple purchases)
- Champions (high engagement, advocates, multiple successful sales)
- Potential (high score, good engagement, no sales yet)
- Nurture (medium score, medium engagement, needs development)
- At Risk (previous customer, low engagement, churn risk)
- Cold (low score, low engagement, hard to convert)
- Dormant (no recent interaction, needs reactivation)

Para cada cliente, retorne:
1. Segmento principal
2. LTV estimado (lifetime value em R$)
3. Prioridade de atenção (1-10)
4. Próxima melhor ação`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        segmented_clients: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    client_id: { type: "string" },
                                    segment: { type: "string" },
                                    ltv_estimate: { type: "number" },
                                    attention_priority: { type: "number" },
                                    next_best_action: { type: "string" },
                                    segment_confidence: { type: "number" }
                                }
                            }
                        },
                        segment_summary: {
                            type: "object",
                            properties: {
                                vip_count: { type: "number" },
                                champions_count: { type: "number" },
                                potential_count: { type: "number" },
                                nurture_count: { type: "number" },
                                at_risk_count: { type: "number" },
                                cold_count: { type: "number" },
                                dormant_count: { type: "number" }
                            }
                        },
                        insights: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setSegmentResults(result);

            // Atualizar clientes com segmentação
            for (const segmented of result.segmented_clients) {
                const client = clients.find(c => c.id === segmented.client_id);
                if (client) {
                    await updateClientMutation.mutateAsync({
                        id: client.id,
                        data: {
                            ai_segment: segmented.segment,
                            ltv_estimate: segmented.ltv_estimate,
                            attention_priority: segmented.attention_priority,
                            ai_next_best_action: segmented.next_best_action
                        }
                    });
                }
            }

            toast.success('Segmentação concluída!');
        } catch (error) {
            console.error('Segmentation error:', error);
            toast.error('Erro ao segmentar clientes');
        } finally {
            setIsSegmenting(false);
        }
    };

    const getSegmentColor = (segment) => {
        const colors = {
            'VIP': 'bg-purple-100 text-purple-800 border-purple-300',
            'Champions': 'bg-green-100 text-green-800 border-green-300',
            'Potential': 'bg-blue-100 text-blue-800 border-blue-300',
            'Nurture': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'At Risk': 'bg-red-100 text-red-800 border-red-300',
            'Cold': 'bg-gray-100 text-gray-800 border-gray-300',
            'Dormant': 'bg-orange-100 text-orange-800 border-orange-300'
        };
        return colors[segment] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Segmentação Automática IA
                    </div>
                    <Button
                        onClick={segmentClients}
                        disabled={isSegmenting}
                        size="sm"
                    >
                        {isSegmenting ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Segmentando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Segmentar Todos
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!segmentResults ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Segmente automaticamente seus clientes</p>
                        <p className="text-xs mt-1">{clients.length} clientes serão analisados</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-2">
                            {segmentResults.segment_summary.vip_count > 0 && (
                                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                                    <div className="text-xs text-purple-600">VIP</div>
                                    <div className="text-lg font-bold text-purple-800">
                                        {segmentResults.segment_summary.vip_count}
                                    </div>
                                </div>
                            )}
                            {segmentResults.segment_summary.champions_count > 0 && (
                                <div className="p-2 bg-green-50 rounded border border-green-200">
                                    <div className="text-xs text-green-600">Champions</div>
                                    <div className="text-lg font-bold text-green-800">
                                        {segmentResults.segment_summary.champions_count}
                                    </div>
                                </div>
                            )}
                            {segmentResults.segment_summary.potential_count > 0 && (
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                    <div className="text-xs text-blue-600">Potenciais</div>
                                    <div className="text-lg font-bold text-blue-800">
                                        {segmentResults.segment_summary.potential_count}
                                    </div>
                                </div>
                            )}
                            {segmentResults.segment_summary.at_risk_count > 0 && (
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                    <div className="text-xs text-red-600">Em Risco</div>
                                    <div className="text-lg font-bold text-red-800">
                                        {segmentResults.segment_summary.at_risk_count}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Insights */}
                        {segmentResults.insights?.length > 0 && (
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-indigo-900 mb-2">💡 Insights</h4>
                                <ul className="text-xs text-indigo-700 space-y-1">
                                    {segmentResults.insights.map((insight, idx) => (
                                        <li key={idx}>• {insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Top Priority Clients */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2">🎯 Prioridade Máxima</h4>
                            <div className="space-y-2">
                                {segmentResults.segmented_clients
                                    .filter(c => c.attention_priority >= 8)
                                    .slice(0, 5)
                                    .map((client, idx) => {
                                        const fullClient = clients.find(c => c.id === client.client_id);
                                        return (
                                            <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-sm">
                                                            {fullClient?.first_name}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {client.next_best_action}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className={getSegmentColor(client.segment)}>
                                                            {client.segment}
                                                        </Badge>
                                                        <div className="text-xs text-orange-600 mt-1">
                                                            LTV: R$ {client.ltv_estimate.toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}