import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Package, RefreshCw, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoProductRecommender({ client }) {
    const [recommendations, setRecommendations] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const generateRecommendations = async () => {
        setIsAnalyzing(true);
        try {
            const prompt = `Você é um especialista em vendas de equipamentos veterinários Seamaty.

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Tipo: ${client.client_type || 'N/A'}
- Decisor: ${client.decision_role || 'N/A'}
- Volume: ${client.current_volume || 'N/A'}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Interesse: ${client.equipment_interest || 'N/A'}
- Orçamento: R$ ${client.available_budget || 'Não informado'}
- Necessidades Lab: ${client.lab_needs?.join(', ') || 'Não definidas'}
- Score: ${client.purchase_score || 50}%
- Status: ${client.status}
- Dores: ${client.main_pains?.join(', ') || 'N/A'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'N/A'}

CATÁLOGO SEAMATY:
1. VG2 - Hemogasometria + Imunofluorescência (Top linha, completo)
2. VG1 - Hemogasometria Básica (entrada, custo-benefício)
3. VQ1 - PCR Veterinário Nucleic Acid (molecular)
4. QT3 - Bioquímico + Coagulação + Gases (all-in-one)
5. 3DX - Lab 3DX Bioquímico + Imuno + Gases (5 amostras simultâneas)
6. SMT-120VP - Bioquímico Veterinário (24 testes)
7. VI1 - Imunofluorescência
8. Hematologia Veterinária
9. Insumos e Reagentes (recorrência)

TAREFA:
Recomende os 3 melhores produtos para este cliente com justificativa detalhada.
Considere: perfil, orçamento, necessidades, momento da venda e estratégia de upsell/cross-sell.`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        primary_recommendation: {
                            type: "object",
                            properties: {
                                product: { type: "string" },
                                reason: { type: "string" },
                                estimated_value: { type: "number" },
                                closing_probability: { type: "number" },
                                key_benefits: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                objections_to_address: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                pitch_strategy: { type: "string" }
                            }
                        },
                        alternative_1: {
                            type: "object",
                            properties: {
                                product: { type: "string" },
                                reason: { type: "string" },
                                estimated_value: { type: "number" },
                                when_to_offer: { type: "string" }
                            }
                        },
                        alternative_2: {
                            type: "object",
                            properties: {
                                product: { type: "string" },
                                reason: { type: "string" },
                                estimated_value: { type: "number" },
                                when_to_offer: { type: "string" }
                            }
                        },
                        upsell_opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    product: { type: "string" },
                                    timing: { type: "string" },
                                    expected_value: { type: "number" }
                                }
                            }
                        },
                        consumables_forecast: {
                            type: "object",
                            properties: {
                                monthly_estimate: { type: "number" },
                                main_items: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        },
                        total_ltv_estimate: { type: "number" },
                        next_steps: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setRecommendations(result);
            toast.success('Recomendações geradas!');
        } catch (error) {
            console.error('Recommendation error:', error);
            toast.error('Erro ao gerar recomendações');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        Recomendação Automática IA
                    </div>
                    <Button
                        onClick={generateRecommendations}
                        disabled={isAnalyzing}
                        size="sm"
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Recomendar
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!recommendations ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Gere recomendações personalizadas</p>
                        <p className="text-xs mt-1">Baseado no perfil completo do cliente</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Recomendação Principal */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="h-5 w-5 text-purple-600" />
                                <span className="font-bold text-purple-900">Recomendação Principal</span>
                                <Badge className="ml-auto bg-purple-200 text-purple-800">
                                    {recommendations.primary_recommendation.closing_probability}% probabilidade
                                </Badge>
                            </div>
                            
                            <div className="text-xl font-bold text-purple-900 mb-2">
                                {recommendations.primary_recommendation.product}
                            </div>
                            
                            <div className="text-2xl font-bold text-green-600 mb-3">
                                R$ {recommendations.primary_recommendation.estimated_value.toLocaleString('pt-BR')}
                            </div>

                            <p className="text-sm text-purple-800 mb-3">
                                {recommendations.primary_recommendation.reason}
                            </p>

                            <div className="mb-3">
                                <span className="text-xs font-semibold text-purple-700">Benefícios Chave:</span>
                                <ul className="text-xs text-purple-700 mt-1 space-y-1">
                                    {recommendations.primary_recommendation.key_benefits?.map((b, i) => (
                                        <li key={i}>✓ {b}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-2 bg-purple-100 rounded mb-3">
                                <span className="text-xs font-semibold text-purple-800">Estratégia de Pitch:</span>
                                <p className="text-xs text-purple-700 mt-1">
                                    {recommendations.primary_recommendation.pitch_strategy}
                                </p>
                            </div>

                            {recommendations.primary_recommendation.objections_to_address?.length > 0 && (
                                <div className="p-2 bg-red-50 rounded">
                                    <span className="text-xs font-semibold text-red-700">Objeções a Endereçar:</span>
                                    <ul className="text-xs text-red-600 mt-1">
                                        {recommendations.primary_recommendation.objections_to_address.map((o, i) => (
                                            <li key={i}>• {o}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Alternativas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="font-semibold text-sm text-blue-900 mb-1">
                                    Alternativa 1
                                </div>
                                <div className="text-xs font-bold text-blue-800 mb-1">
                                    {recommendations.alternative_1.product}
                                </div>
                                <div className="text-lg font-bold text-green-600 mb-2">
                                    R$ {recommendations.alternative_1.estimated_value.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-xs text-blue-700 mb-2">
                                    {recommendations.alternative_1.reason}
                                </p>
                                <div className="text-xs text-blue-600">
                                    Quando: {recommendations.alternative_1.when_to_offer}
                                </div>
                            </div>

                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                <div className="font-semibold text-sm text-indigo-900 mb-1">
                                    Alternativa 2
                                </div>
                                <div className="text-xs font-bold text-indigo-800 mb-1">
                                    {recommendations.alternative_2.product}
                                </div>
                                <div className="text-lg font-bold text-green-600 mb-2">
                                    R$ {recommendations.alternative_2.estimated_value.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-xs text-indigo-700 mb-2">
                                    {recommendations.alternative_2.reason}
                                </p>
                                <div className="text-xs text-indigo-600">
                                    Quando: {recommendations.alternative_2.when_to_offer}
                                </div>
                            </div>
                        </div>

                        {/* Upsell */}
                        {recommendations.upsell_opportunities?.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-900">Oportunidades Upsell</span>
                                </div>
                                {recommendations.upsell_opportunities.map((opp, idx) => (
                                    <div key={idx} className="text-xs text-green-700 mb-1">
                                        • {opp.product} - R$ {opp.expected_value.toLocaleString('pt-BR')} ({opp.timing})
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Previsão Insumos */}
                        {recommendations.consumables_forecast && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-semibold text-yellow-900">💰 Receita Recorrente</span>
                                <div className="text-2xl font-bold text-yellow-700 mt-1">
                                    R$ {recommendations.consumables_forecast.monthly_estimate.toLocaleString('pt-BR')}/mês
                                </div>
                                <div className="text-xs text-yellow-700 mt-2">
                                    Insumos: {recommendations.consumables_forecast.main_items?.join(', ')}
                                </div>
                            </div>
                        )}

                        {/* LTV */}
                        <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                            <span className="text-sm font-semibold text-green-900">Lifetime Value Estimado</span>
                            <div className="text-3xl font-bold text-green-700 mt-1">
                                R$ {recommendations.total_ltv_estimate.toLocaleString('pt-BR')}
                            </div>
                        </div>

                        {/* Próximos Passos */}
                        {recommendations.next_steps?.length > 0 && (
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <span className="text-sm font-semibold text-indigo-900">📋 Próximos Passos</span>
                                <ul className="text-xs text-indigo-700 mt-2 space-y-1">
                                    {recommendations.next_steps.map((step, idx) => (
                                        <li key={idx}>{idx + 1}. {step}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}