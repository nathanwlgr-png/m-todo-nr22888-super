import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Bell, Zap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveInterventionAI() {
    const [interventions, setInterventions] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['all-tasks'],
        queryFn: () => base44.entities.Task.list(),
    });

    const { data: interactions = [] } = useQuery({
        queryKey: ['all-interactions'],
        queryFn: () => base44.entities.Interaction.list(),
    });

    const createTaskMutation = useMutation({
        mutationFn: (taskData) => base44.entities.Task.create(taskData),
        onSuccess: () => {
            queryClient.invalidateQueries(['all-tasks']);
            toast.success('Tarefa criada automaticamente!');
        }
    });

    const analyzeAndIntervene = async () => {
        setIsAnalyzing(true);
        try {
            const clientsWithRisk = clients.map(client => {
                const clientInteractions = interactions.filter(i => i.client_id === client.id);
                const lastInteraction = clientInteractions[0];
                const daysSinceLastContact = lastInteraction 
                    ? Math.floor((Date.now() - new Date(lastInteraction.created_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 999;

                return {
                    id: client.id,
                    name: client.first_name,
                    status: client.status,
                    score: client.purchase_score || 0,
                    days_since_contact: daysSinceLastContact,
                    engagement_score: client.engagement_score || 0,
                    churn_risk: client.ai_sales_intelligence?.churn_risk || 0,
                    segment: client.ai_segment,
                    total_revenue: client.projected_revenue || 0
                };
            });

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise estes clientes e identifique situações que requerem intervenção proativa:

CLIENTES:
${JSON.stringify(clientsWithRisk.slice(0, 30), null, 2)}

SITUAÇÕES QUE REQUEREM INTERVENÇÃO:
1. Cliente quente sem contato há mais de 7 dias
2. Score de compra caindo (comparar histórico)
3. Cliente VIP/Champion com baixo engajamento recente
4. Cliente em risco de churn (>60%)
5. Oportunidade de upsell detectada
6. Cliente dormant com alto potencial
7. Prazo de decisão se aproximando

Para cada intervenção necessária, retorne:
- Tipo de alerta
- Urgência (crítica/alta/média)
- Cliente afetado
- Ação recomendada específica
- Template de mensagem sugerido`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        interventions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    client_id: { type: "string" },
                                    alert_type: { type: "string" },
                                    urgency: { 
                                        type: "string",
                                        enum: ["crítica", "alta", "média"]
                                    },
                                    reason: { type: "string" },
                                    recommended_action: { type: "string" },
                                    suggested_message: { type: "string" },
                                    auto_create_task: { type: "boolean" },
                                    task_title: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setInterventions(result.interventions || []);

            // Auto-criar tarefas para intervenções críticas
            for (const intervention of result.interventions || []) {
                if (intervention.auto_create_task && intervention.urgency === 'crítica') {
                    const client = clients.find(c => c.id === intervention.client_id);
                    if (client) {
                        await createTaskMutation.mutateAsync({
                            client_id: client.id,
                            client_name: client.first_name,
                            title: intervention.task_title || intervention.recommended_action,
                            description: intervention.reason,
                            priority: 'alta',
                            type: 'follow_up',
                            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            auto_created: true
                        });
                    }
                }
            }

            toast.success(`${result.interventions?.length || 0} intervenções identificadas!`);
        } catch (error) {
            console.error('Intervention error:', error);
            toast.error('Erro ao analisar intervenções');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'crítica': return 'bg-red-100 text-red-800 border-red-300';
            case 'alta': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-600" />
                        Intervenção Proativa IA
                    </div>
                    <Button
                        onClick={analyzeAndIntervene}
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
                                <Zap className="h-4 w-4 mr-2" />
                                Analisar
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {interventions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Sistema de alerta inteligente</p>
                        <p className="text-xs mt-1">Identifica situações que requerem ação imediata</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interventions.map((intervention, idx) => {
                            const client = clients.find(c => c.id === intervention.client_id);
                            return (
                                <div key={idx} className={`p-3 rounded-lg border-2 ${getUrgencyColor(intervention.urgency)}`}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <div className="font-semibold text-sm">
                                                {client?.first_name || 'Cliente'}
                                            </div>
                                            <Badge className="mt-1 text-xs" variant="outline">
                                                {intervention.alert_type}
                                            </Badge>
                                        </div>
                                        <Badge className={getUrgencyColor(intervention.urgency)}>
                                            {intervention.urgency}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-xs text-gray-700 mb-2">
                                        {intervention.reason}
                                    </p>

                                    <div className="p-2 bg-white rounded text-xs mb-2">
                                        <span className="font-semibold">Ação:</span> {intervention.recommended_action}
                                    </div>

                                    {intervention.suggested_message && (
                                        <div className="p-2 bg-white rounded text-xs mb-2">
                                            <span className="font-semibold">Mensagem:</span>
                                            <p className="mt-1 text-gray-600">{intervention.suggested_message}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                                            className="flex-1"
                                        >
                                            Ver Cliente
                                        </Button>
                                        {client?.phone && intervention.suggested_message && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    window.open(
                                                        `https://wa.me/${client.phone}?text=${encodeURIComponent(intervention.suggested_message)}`,
                                                        '_blank'
                                                    );
                                                }}
                                            >
                                                <MessageSquare className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}