import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tags, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AutoInteractionTagger({ clientId, interactions = [] }) {
    const [isTagging, setIsTagging] = useState(false);
    const [taggedInteractions, setTaggedInteractions] = useState([]);
    const queryClient = useQueryClient();

    const updateInteractionMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Interaction.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['interactions', clientId]);
        }
    });

    const autoTagInteractions = async () => {
        if (interactions.length === 0) {
            toast.error('Sem interações para categorizar');
            return;
        }

        setIsTagging(true);
        try {
            const untaggedInteractions = interactions.slice(0, 20); // Limitar para performance

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise estas interações de vendas e forneça categorização automática:

Interações:
${JSON.stringify(untaggedInteractions.map(i => ({
    id: i.id,
    type: i.type,
    subject: i.subject,
    notes: i.notes,
    outcome: i.outcome
})), null, 2)}

Para cada interação, forneça:
1. Categoria principal (prospeccao/qualificacao/demonstracao/negociacao/fechamento/pos-venda/suporte)
2. Tags relevantes (preço, concorrência, urgente, follow-up, objeção, interesse-alto, etc)
3. Sentimento (positivo/neutro/negativo)
4. Prioridade de follow-up (alta/média/baixa)
5. Resumo em uma linha`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tagged_interactions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    interaction_id: { type: "string" },
                                    category: { type: "string" },
                                    tags: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    sentiment: { type: "string" },
                                    follow_up_priority: { type: "string" },
                                    summary: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setTaggedInteractions(result.tagged_interactions || []);

            // Atualizar interações com tags
            for (const tagged of result.tagged_interactions || []) {
                const interaction = interactions.find(i => i.id === tagged.interaction_id);
                if (interaction) {
                    await updateInteractionMutation.mutateAsync({
                        id: interaction.id,
                        data: {
                            ...interaction,
                            ai_category: tagged.category,
                            ai_tags: tagged.tags,
                            ai_sentiment: tagged.sentiment,
                            ai_priority: tagged.follow_up_priority,
                            ai_summary: tagged.summary
                        }
                    });
                }
            }

            toast.success(`${result.tagged_interactions?.length || 0} interações categorizadas!`);
        } catch (error) {
            console.error('Auto-tagging error:', error);
            toast.error('Erro ao categorizar interações');
        } finally {
            setIsTagging(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            prospeccao: 'bg-blue-100 text-blue-800',
            qualificacao: 'bg-purple-100 text-purple-800',
            demonstracao: 'bg-indigo-100 text-indigo-800',
            negociacao: 'bg-yellow-100 text-yellow-800',
            fechamento: 'bg-green-100 text-green-800',
            'pos-venda': 'bg-teal-100 text-teal-800',
            suporte: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positivo': return '😊';
            case 'negativo': return '😟';
            default: return '😐';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-blue-600" />
                        Auto-Categorização IA
                    </div>
                    <Button
                        onClick={autoTagInteractions}
                        disabled={isTagging || interactions.length === 0}
                        size="sm"
                    >
                        {isTagging ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Categorizando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Categorizar Todas
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {taggedInteractions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <Tags className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Categorize automaticamente todas as interações</p>
                        <p className="text-xs mt-1">{interactions.length} interações disponíveis</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {taggedInteractions.map((tagged, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={getCategoryColor(tagged.category)}>
                                                {tagged.category}
                                            </Badge>
                                            <span className="text-lg">
                                                {getSentimentIcon(tagged.sentiment)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{tagged.summary}</p>
                                    </div>
                                    <Badge variant="outline" className={
                                        tagged.follow_up_priority === 'alta' ? 'border-red-300 text-red-700' :
                                        tagged.follow_up_priority === 'média' ? 'border-yellow-300 text-yellow-700' :
                                        'border-green-300 text-green-700'
                                    }>
                                        {tagged.follow_up_priority}
                                    </Badge>
                                </div>
                                {tagged.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {tagged.tags.map((tag, tagIdx) => (
                                            <Badge key={tagIdx} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}