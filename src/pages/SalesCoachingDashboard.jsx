import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, Zap, PlayCircle, Award } from 'lucide-react';

export default function SalesCoachingDashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showCoaching, setShowCoaching] = useState(false);

  const currentUser = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await base44.auth.me()
  });

  const coachingMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('salesCoachingAI', {
        user_email: currentUser.data?.email,
        transcript
      });
    }
  });

  if (coachingMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Analisando sua performance...</p>
        </div>
      </div>
    );
  }

  const coachingData = coachingMutation.data?.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">🎓 Sales Coaching AI</h1>
          <p className="text-slate-600 mt-2">Análise inteligente de performance e técnicas de vendas</p>
        </div>

        {!showCoaching ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle>Carregar Transcrição</CardTitle>
                <CardDescription>Cole ou carregue uma transcrição de chamada de vendas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  placeholder="Cole aqui a transcrição da chamada ou descrição das interações..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full h-40 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => coachingMutation.mutate()}
                  disabled={!transcript.trim() || coachingMutation.isPending}
                  className="w-full"
                >
                  {coachingMutation.isPending ? 'Analisando...' : 'Analisar Performance'}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Análise Completa
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 space-y-2">
                  <p>✅ Pontos fortes identificados</p>
                  <p>✅ Áreas de melhoria detalhadas</p>
                  <p>✅ Técnicas de vendas recomendadas</p>
                  <p>✅ Feedback personalizado (5 ações)</p>
                  <p>✅ Estimativa de taxa de fechamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                    Role-Play Prático
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 space-y-2">
                  <p>🎭 3 cenários realistas</p>
                  <p>💬 Diálogos estruturados</p>
                  <p>⚡ Objeções comuns</p>
                  <p>🔑 Frases-chave a usar</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="feedback" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="roleplay">Role-Play</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
            </TabsList>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">✅ Pontos Fortes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {coachingData?.coaching_analysis?.strengths?.map((strength, idx) => (
                      <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-slate-900">{strength}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚠️ Áreas de Melhoria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {coachingData?.coaching_analysis?.improvement_areas?.map((area, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-slate-900">{area}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 Feedback Personalizado (5 Ações)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coachingData?.coaching_analysis?.personalized_feedback?.map((action, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-slate-900">Ação {idx + 1}: {action.action}</h4>
                        <Badge className={action.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {action.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{action.description}</p>
                      <div className="bg-slate-50 p-3 rounded text-sm italic text-slate-600">
                        💡 Exemplo: {action.example}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role-Play Tab */}
            <TabsContent value="roleplay" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {coachingData?.role_play_scenarios?.map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScenario(idx)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedScenario === idx
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{scenario.title}</div>
                    <Badge className="mt-2 text-xs">{scenario.difficulty_level}</Badge>
                  </button>
                ))}
              </div>

              {coachingData?.role_play_scenarios?.[selectedScenario] && (
                <Card>
                  <CardHeader>
                    <CardTitle>{coachingData.role_play_scenarios[selectedScenario].title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">👤 Perfil do Cliente</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                        {coachingData.role_play_scenarios[selectedScenario].client_profile}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">⚠️ Objeção Principal</h4>
                      <p className="text-sm text-slate-700 bg-red-50 p-3 rounded border border-red-200">
                        {coachingData.role_play_scenarios[selectedScenario].main_objection}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🗣️ Passos da Conversa</h4>
                      <ol className="space-y-2">
                        {coachingData.role_play_scenarios[selectedScenario].conversation_steps?.map((step, i) => (
                          <li key={i} className="text-sm text-slate-700 flex gap-3">
                            <span className="font-bold text-indigo-600">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🔑 Frases-Chave</h4>
                      <div className="space-y-2">
                        {coachingData.role_play_scenarios[selectedScenario].key_phrases?.map((phrase, i) => (
                          <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm italic text-slate-700">
                            "{phrase}"
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">💬 Resposta à Objeção</h4>
                      <p className="text-sm text-slate-700 bg-green-50 p-3 rounded border border-green-200">
                        {coachingData.role_play_scenarios[selectedScenario].objection_response}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">📌 Técnica SPIN</h4>
                      <p className="text-sm text-slate-700">{coachingData.role_play_scenarios[selectedScenario].spin_technique}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Métricas de Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Taxa de Fechamento Atual</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {coachingData?.coaching_analysis?.current_closing_rate_estimate}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Potencial de Melhoria</div>
                      <div className="text-3xl font-bold text-green-600">
                        {coachingData?.coaching_analysis?.potential_improvement}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">📚 Técnicas Recomendadas</h4>
                    <div className="space-y-2">
                      {coachingData?.coaching_analysis?.recommended_techniques?.map((tech, idx) => (
                        <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded text-sm text-slate-900">
                          ✨ {tech}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {coachingData && (
          <Button
            onClick={() => {
              setShowCoaching(!showCoaching);
              if (showCoaching) {
                setTranscript('');
                coachingMutation.reset();
              }
            }}
            variant="outline"
            className="w-full"
          >
            {showCoaching ? 'Analisar Novo Transcript' : 'Ver Análise Completa'}
          </Button>
        )}
      </div>
    </div>
  );
}