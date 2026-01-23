import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Sparkles, 
    TrendingUp, 
    AlertTriangle, 
    Target, 
    MessageSquare, 
    Award,
    Lightbulb,
    ArrowRight,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AISalesCoach({ clientContext, interactionType = 'call' }) {
    const [transcript, setTranscript] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (!transcript.trim()) {
            toast.error('Por favor, insira a transcrição ou notas da interação');
            return;
        }

        setIsAnalyzing(true);
        try {
            const { data } = await base44.functions.invoke('analyzeSalesInteraction', {
                transcript: transcript,
                client_context: clientContext,
                interaction_type: interactionType
            });

            if (data.success) {
                setAnalysis(data.analysis);
                toast.success('Análise concluída! Confira o feedback abaixo.');
            } else {
                toast.error('Erro ao analisar a interação');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erro ao processar análise');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            alta: 'bg-red-100 text-red-800',
            média: 'bg-yellow-100 text-yellow-800',
            baixa: 'bg-blue-100 text-blue-800'
        };
        return colors[priority] || colors.média;
    };

    const getEffectivenessBadge = (effectiveness) => {
        const config = {
            alta: { icon: CheckCircle2, color: 'text-green-600' },
            média: { icon: AlertCircle, color: 'text-yellow-600' },
            baixa: { icon: XCircle, color: 'text-red-600' }
        };
        const eff = config[effectiveness] || config.média;
        const Icon = eff.icon;
        return <Icon className={`h-4 w-4 ${eff.color}`} />;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Sales Coach
                    </CardTitle>
                    <CardDescription>
                        Cole a transcrição ou notas da sua interação de vendas para receber feedback personalizado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Tipo de Interação
                        </label>
                        <Select defaultValue={interactionType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="call">Ligação Telefônica</SelectItem>
                                <SelectItem value="meeting">Reunião Presencial</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="demo">Demonstração</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Transcrição ou Notas da Interação
                        </label>
                        <Textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Cole aqui a transcrição da chamada, ou escreva as notas principais da sua interação com o cliente..."
                            rows={10}
                            className="font-mono text-sm"
                        />
                    </div>

                    <Button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing || !transcript.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        {isAnalyzing ? (
                            <>
                                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                Analisando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analisar Interação
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {analysis && (
                <Card className="border-2 border-purple-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">Análise e Feedback</CardTitle>
                            <div className={`px-4 py-2 rounded-lg ${getScoreColor(analysis.overall_score)}`}>
                                <div className="text-2xl font-bold">{analysis.overall_score}</div>
                                <div className="text-xs">Pontuação</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                <TabsTrigger value="objections">Objeções</TabsTrigger>
                                <TabsTrigger value="techniques">Técnicas</TabsTrigger>
                                <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
                                <TabsTrigger value="scripts">Scripts</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                                Pontos Fortes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {analysis.strengths?.map((strength, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm">{strength}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                                Áreas para Melhorar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {analysis.areas_for_improvement?.map((area, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm">{area}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                                {analysis.missed_opportunities?.length > 0 && (
                                    <Card className="bg-orange-50 border-orange-200">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Target className="h-5 w-5 text-orange-600" />
                                                Oportunidades Perdidas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {analysis.missed_opportunities.map((opp, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <ArrowRight className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm">{opp}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Insights-Chave</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-relaxed">{analysis.key_insights}</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="objections" className="space-y-4">
                                {analysis.objections_identified?.map((obj, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-red-600" />
                                                Objeção {idx + 1}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Objeção:</div>
                                                <p className="text-sm mt-1 bg-red-50 p-2 rounded">{obj.objection}</p>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Como foi tratada:</div>
                                                <p className="text-sm mt-1 bg-yellow-50 p-2 rounded">{obj.how_handled}</p>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Abordagem Sugerida:</div>
                                                <p className="text-sm mt-1 bg-green-50 p-2 rounded">{obj.suggested_approach}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            <TabsContent value="techniques" className="space-y-4">
                                {analysis.sales_techniques_used?.map((tech, idx) => (
                                    <Card key={idx}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Award className="h-5 w-5 text-blue-600" />
                                                        <span className="font-semibold">{tech.technique}</span>
                                                        {getEffectivenessBadge(tech.effectiveness)}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{tech.comment}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            <TabsContent value="recommendations" className="space-y-4">
                                {['alta', 'média', 'baixa'].map(priority => {
                                    const recs = analysis.specific_recommendations?.filter(r => r.priority === priority);
                                    if (!recs?.length) return null;
                                    
                                    return (
                                        <div key={priority}>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <Badge className={getPriorityBadge(priority)}>
                                                    Prioridade {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                </Badge>
                                            </h3>
                                            <div className="space-y-3">
                                                {recs.map((rec, idx) => (
                                                    <Card key={idx}>
                                                        <CardContent className="pt-6">
                                                            <div className="flex items-start gap-3">
                                                                <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <div className="font-medium text-sm mb-1">
                                                                        {rec.category}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600">
                                                                        {rec.recommendation}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                <Card className="bg-blue-50 border-blue-200 mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Estratégia de Fechamento</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-relaxed">{analysis.closing_strategy}</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-green-50 border-green-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Próximos Passos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.suggested_next_steps?.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="scripts" className="space-y-4">
                                {analysis.script_suggestions?.map((script, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <CardTitle className="text-base text-purple-700">
                                                {script.moment}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                <p className="text-sm italic leading-relaxed">
                                                    "{script.suggested_phrase}"
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {analysis.numerology_alignment && (
                                    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Alinhamento Numerológico</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-relaxed">{analysis.numerology_alignment}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}