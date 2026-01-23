import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertCircle, Heart, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSentimentAnalyzer({ clientId, interactions = [] }) {
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeSentiment = async () => {
        if (interactions.length === 0) {
            toast.error('Sem interações para analisar');
            return;
        }

        setIsAnalyzing(true);
        try {
            const interactionsSummary = interactions.map(i => ({
                type: i.type,
                date: i.created_date,
                subject: i.subject,
                notes: i.notes,
                outcome: i.outcome
            }));

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise o histórico de interações deste cliente e forneça insights detalhados:

Interações (últimas ${interactions.length}):
${JSON.stringify(interactionsSummary, null, 2)}

Forneça uma análise completa incluindo:
1. Sentimento geral do cliente (positivo/neutro/negativo)
2. Nível de engajamento (alto/médio/baixo)
3. Principais preocupações ou objeções identificadas
4. Oportunidades de upsell ou cross-sell
5. Recomendações de ação imediata
6. Melhor abordagem para próximo contato
7. Risco de churn (0-100)
8. Palavras-chave e temas recorrentes`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        overall_sentiment: {
                            type: "string",
                            enum: ["positivo", "neutro", "negativo"]
                        },
                        sentiment_score: {
                            type: "number",
                            description: "0-100"
                        },
                        engagement_level: {
                            type: "string",
                            enum: ["alto", "médio", "baixo"]
                        },
                        main_concerns: {
                            type: "array",
                            items: { type: "string" }
                        },
                        upsell_opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    product: { type: "string" },
                                    reason: { type: "string" },
                                    confidence: { type: "number" }
                                }
                            }
                        },
                        immediate_actions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        recommended_approach: {
                            type: "string"
                        },
                        churn_risk: {
                            type: "number"
                        },
                        key_themes: {
                            type: "array",
                            items: { type: "string" }
                        },
                        next_contact_timing: {
                            type: "string"
                        },
                        client_personality_insights: {
                            type: "string"
                        }
                    }
                }
            });

            setAnalysis(result);
            toast.success('Análise de sentimento concluída!');
        } catch (error) {
            console.error('Sentiment analysis error:', error);
            toast.error('Erro ao analisar sentimento');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positivo': return 'bg-green-100 text-green-800';
            case 'negativo': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        Análise de Sentimento IA
                    </div>
                    <Button
                        onClick={analyzeSentiment}
                        disabled={isAnalyzing || interactions.length === 0}
                        size="sm"
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 mr-2" />
                                Analisar
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!analysis && (
                    <div className="text-center py-8 text-gray-500">
                        <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Clique em "Analisar" para obter insights de IA</p>
                        <p className="text-xs mt-1">{interactions.length} interações disponíveis</p>
                    </div>
                )}

                {analysis && (
                    <div className="space-y-4">
                        {/* Sentimento Geral */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Sentimento Geral</div>
                                <Badge className={getSentimentColor(analysis.overall_sentiment)}>
                                    {analysis.overall_sentiment}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-purple-700">
                                    {analysis.sentiment_score}%
                                </div>
                                <div className="text-xs text-gray-600">Score</div>
                            </div>
                        </div>

                        {/* Engajamento e Risco */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs text-gray-600">Engajamento</span>
                                </div>
                                <div className="font-bold text-blue-700 capitalize">
                                    {analysis.engagement_level}
                                </div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-gray-600">Risco Churn</span>
                                </div>
                                <div className="font-bold text-red-700">
                                    {analysis.churn_risk}%
                                </div>
                            </div>
                        </div>

                        {/* Oportunidades de Upsell */}
                        {analysis.upsell_opportunities?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <h4 className="font-semibold text-sm">Oportunidades de Upsell</h4>
                                </div>
                                <div className="space-y-2">
                                    {analysis.upsell_opportunities.map((opp, idx) => (
                                        <div key={idx} className="p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="font-semibold text-green-900 text-sm">
                                                        {opp.product}
                                                    </div>
                                                    <div className="text-xs text-green-700 mt-1">
                                                        {opp.reason}
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-200 text-green-800 text-xs">
                                                    {opp.confidence}% confiança
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ações Imediatas */}
                        {analysis.immediate_actions?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm mb-2">🎯 Ações Imediatas</h4>
                                <ul className="space-y-1">
                                    {analysis.immediate_actions.map((action, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Abordagem Recomendada */}
                        {analysis.recommended_approach && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-sm mb-2">💡 Abordagem Recomendada</h4>
                                <p className="text-sm text-gray-700">{analysis.recommended_approach}</p>
                            </div>
                        )}

                        {/* Temas-Chave */}
                        {analysis.key_themes?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm mb-2">🔑 Temas Recorrentes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.key_themes.map((theme, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            {theme}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preocupações */}
                        {analysis.main_concerns?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm mb-2">⚠️ Principais Preocupações</h4>
                                <ul className="space-y-1">
                                    {analysis.main_concerns.map((concern, idx) => (
                                        <li key={idx} className="text-sm text-gray-600">
                                            {concern}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Timing e Personalidade */}
                        <div className="grid grid-cols-2 gap-3">
                            {analysis.next_contact_timing && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-xs text-gray-600 mb-1">Próximo Contato</div>
                                    <div className="text-sm font-semibold text-purple-800">
                                        {analysis.next_contact_timing}
                                    </div>
                                </div>
                            )}
                            {analysis.client_personality_insights && (
                                <div className="p-3 bg-pink-50 rounded-lg">
                                    <div className="text-xs text-gray-600 mb-1">Insights Personalidade</div>
                                    <div className="text-xs text-pink-800">
                                        {analysis.client_personality_insights}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}