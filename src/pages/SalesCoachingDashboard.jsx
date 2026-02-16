import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, TrendingDown, Award, Target, Brain, 
  Lightbulb, BookOpen, CheckCircle, AlertTriangle, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesCoachingDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coaching-sessions', user?.email],
    queryFn: () => base44.entities.SalesCoaching.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const latestSession = coachingSessions[0];

  const analyzePerformance = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiSalesCoaching', {
        user_email: user.email,
        period_days: 30
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching-sessions']);
      toast.success('Análise concluída!');
      setAnalyzing(false);
    },
    onError: () => {
      toast.error('Erro na análise');
      setAnalyzing(false);
    }
  });

  const handleAnalyze = () => {
    setAnalyzing(true);
    analyzePerformance.mutate();
  };

  if (!latestSession) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Coaching de Vendas com IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Receba feedback personalizado e melhore suas técnicas de vendas com análise de IA.
            </p>
            <Button onClick={handleAnalyze} disabled={analyzing} className="bg-indigo-600">
              {analyzing ? 'Analisando...' : 'Iniciar Análise de Performance'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-1">Performance Score</CardTitle>
              <p className="text-indigo-100">Última análise: {new Date(latestSession.analysis_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing} className="bg-white/10 border-white/20 text-white">
              <Zap className="w-4 h-4 mr-2" />
              {analyzing ? 'Analisando...' : 'Nova Análise'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-6xl font-bold">{latestSession.performance_score}</div>
            <div className="flex-1">
              <Progress value={latestSession.performance_score} className="h-3 bg-white/20" />
              <p className="text-sm text-indigo-100 mt-2">
                {latestSession.interactions_analyzed} interações analisadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Taxa Conversão</p>
              <p className="text-2xl font-bold text-indigo-600">{latestSession.conversion_rate?.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Leads Contatados</p>
              <p className="text-2xl font-bold text-blue-600">{latestSession.key_metrics?.leads_contacted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Propostas Enviadas</p>
              <p className="text-2xl font-bold text-purple-600">{latestSession.key_metrics?.proposals_sent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Vendas Fechadas</p>
              <p className="text-2xl font-bold text-green-600">{latestSession.key_metrics?.deals_closed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths */}
      {latestSession.strengths?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Award className="w-5 h-5" />
              Seus Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestSession.strengths.map((strength, index) => (
              <Card key={index} className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{strength.area}</h4>
                  <p className="text-sm text-slate-600 mb-2">{strength.description}</p>
                  {strength.examples?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-green-700">Exemplos:</p>
                      {strength.examples.map((ex, i) => (
                        <p key={i} className="text-xs text-slate-600">• {ex}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {latestSession.areas_for_improvement?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Target className="w-5 h-5" />
              Áreas para Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestSession.areas_for_improvement.map((area, index) => (
              <Card key={index} className={
                area.priority === 'alta' ? 'bg-red-50 border-red-200' :
                area.priority === 'media' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{area.area}</h4>
                    <Badge className={
                      area.priority === 'alta' ? 'bg-red-500' :
                      area.priority === 'media' ? 'bg-yellow-500' : 'bg-blue-500'
                    }>
                      {area.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{area.description}</p>
                  {area.actionable_tips?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Dicas Práticas:
                      </p>
                      {area.actionable_tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <p className="text-sm text-slate-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Successful Patterns */}
      {latestSession.successful_patterns?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
              Padrões de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestSession.successful_patterns.map((pattern, index) => (
              <Card key={index} className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{pattern.pattern}</h4>
                    <Badge className="bg-indigo-600">{pattern.success_rate}% sucesso</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{pattern.recommendation}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Training Suggestions */}
      {latestSession.training_suggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <BookOpen className="w-5 h-5" />
              Treinamentos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestSession.training_suggestions.map((training, index) => (
              <Card key={index} className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{training.topic}</h4>
                  <p className="text-sm text-slate-600 mb-3">{training.reason}</p>
                  {training.resources?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-purple-700">Recursos:</p>
                      {training.resources.map((resource, i) => (
                        <p key={i} className="text-xs text-slate-600">• {resource}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}