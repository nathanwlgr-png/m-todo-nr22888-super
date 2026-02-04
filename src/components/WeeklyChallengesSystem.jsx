import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Trophy, Sparkles, CheckCircle2, 
  Lock, Flame, TrendingUp, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function WeeklyChallengesSystem() {
  const queryClient = useQueryClient();
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coaching-sessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 10)
  });

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['weekly-challenges'],
    queryFn: async () => {
      try {
        return await base44.entities.WeeklyChallenge.list('-created_date', 50);
      } catch (error) {
        console.error('Erro ao carregar desafios:', error);
        return [];
      }
    }
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const completedThisWeek = challenges.filter(c => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return c.completed && new Date(c.created_date) > weekAgo;
  }).length;

  const totalPoints = challenges.filter(c => c.completed).reduce((sum, c) => sum + (c.points || 0), 0);
  const streak = calculateStreak(challenges);
  
  function calculateStreak(challenges) {
    const sortedCompleted = challenges
      .filter(c => c.completed && c.completed_date)
      .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
    
    if (sortedCompleted.length === 0) return 0;
    
    let currentStreak = 1;
    for (let i = 0; i < sortedCompleted.length - 1; i++) {
      const current = new Date(sortedCompleted[i].completed_date);
      const next = new Date(sortedCompleted[i + 1].completed_date);
      const daysDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) currentStreak++;
      else break;
    }
    return currentStreak;
  }

  const generateWeeklyChallenges = async () => {
    setGeneratingChallenges(true);
    try {
      // Analisa últimas sessões para identificar áreas de melhoria
      const recentSessions = coachingSessions.slice(0, 5);
      
      const weaknesses = recentSessions.flatMap(s => s.weaknesses || []);
      const avgScores = {
        spin: recentSessions.reduce((acc, s) => acc + (s.technique_scores?.spin_selling || 0), 0) / recentSessions.length,
        objection: recentSessions.reduce((acc, s) => acc + (s.technique_scores?.objection_handling || 0), 0) / recentSessions.length,
        emotional: recentSessions.reduce((acc, s) => acc + (s.technique_scores?.emotional_intelligence || 0), 0) / recentSessions.length
      };

      const prompt = `Baseado nas últimas análises de coaching de vendas, crie 3 DESAFIOS SEMANAIS práticos:

ÁREAS DE MELHORIA IDENTIFICADAS:
${weaknesses.slice(0, 5).map((w, i) => `${i + 1}. ${w}`).join('\n')}

SCORES MÉDIOS:
- SPIN Selling: ${avgScores.spin.toFixed(1)}/10
- Controle de Objeções: ${avgScores.objection.toFixed(1)}/10
- Inteligência Emocional: ${avgScores.emotional.toFixed(1)}/10

Crie 3 desafios ESPECÍFICOS, MENSURÁVEIS e ALCANÇÁVEIS para esta semana:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            challenges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficulty: { type: "string", enum: ["Fácil", "Médio", "Difícil"] },
                  target_metric: { type: "string" },
                  success_criteria: { type: "string" },
                  points: { type: "number" },
                  tips: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Salvar desafios
      for (const challenge of result.challenges) {
        await base44.entities.WeeklyChallenge.create({
          ...challenge,
          week_number: getWeekNumber(),
          completed: false
        });
      }

      queryClient.invalidateQueries(['weekly-challenges']);
      toast.success('Desafios da semana gerados!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar desafios');
    } finally {
      setGeneratingChallenges(false);
    }
  };

  const markChallengeComplete = async (challengeId, points) => {
    try {
      await base44.entities.WeeklyChallenge.update(challengeId, {
        completed: true,
        completed_date: new Date().toISOString()
      });

      queryClient.invalidateQueries(['weekly-challenges']);
      toast.success(`+${points} pontos! 🎉`);
    } catch (error) {
      toast.error('Erro ao completar desafio');
    }
  };

  const getWeekNumber = () => {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const currentWeekChallenges = challenges.filter(c => 
    c.week_number === getWeekNumber() || !c.week_number
  );

  const totalPointsThisWeek = currentWeekChallenges
    .filter(c => c.completed)
    .reduce((acc, c) => acc + (c.points || 0), 0);

  if (isLoading) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Target className="w-5 h-5" />
            Desafios Semanais
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-600 text-white">
              <Trophy className="w-3 h-3 mr-1" />
              {totalPointsThisWeek} pts
            </Badge>
          </div>
        </div>
        <p className="text-sm text-orange-700">
          Treine áreas específicas identificadas pela IA
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Gamificação Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white rounded-lg border-2 border-orange-200 text-center">
            <Trophy className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-orange-900">{totalPoints}</p>
            <p className="text-xs text-gray-600">Total Pontos</p>
          </div>
          <div className="p-3 bg-white rounded-lg border-2 border-red-200 text-center">
            <Flame className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-900">{streak}</p>
            <p className="text-xs text-gray-600">Sequência</p>
          </div>
          <div className="p-3 bg-white rounded-lg border-2 border-green-200 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-900">{completedThisWeek}</p>
            <p className="text-xs text-gray-600">Esta Semana</p>
          </div>
        </div>

        {/* Progresso Semanal */}
        <div className="p-3 bg-white rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">PROGRESSO DA SEMANA</span>
            <span className="text-sm font-bold text-orange-600">
              {completedThisWeek}/{currentWeekChallenges.length}
            </span>
          </div>
          <Progress 
            value={(completedThisWeek / Math.max(currentWeekChallenges.length, 1)) * 100} 
            className="h-2"
          />
          {completedThisWeek === currentWeekChallenges.length && currentWeekChallenges.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
              <Flame className="w-4 h-4" />
              <span>Todos completados! +50 pontos bônus! 🔥</span>
            </div>
          )}
        </div>

        {/* Lista de Desafios */}
        {currentWeekChallenges.length === 0 ? (
          <div className="p-6 bg-white rounded-lg border-2 border-orange-200 text-center">
            <Target className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">
              Nenhum desafio ativo. Gere desafios personalizados baseados nas suas análises!
            </p>
            <Button
              onClick={generateWeeklyChallenges}
              disabled={generatingChallenges || coachingSessions.length < 2}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {generatingChallenges ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Desafios IA
                </>
              )}
            </Button>
            {coachingSessions.length < 2 && (
              <p className="text-xs text-gray-500 mt-2">
                Faça pelo menos 2 análises para gerar desafios personalizados
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentWeekChallenges.map((challenge) => {
                const difficultyColors = {
                  'Fácil': 'bg-green-100 text-green-700 border-green-300',
                  'Médio': 'bg-yellow-100 text-yellow-700 border-yellow-300',
                  'Difícil': 'bg-red-100 text-red-700 border-red-300'
                };

                return (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      challenge.completed
                        ? 'bg-green-50 border-green-300 opacity-75'
                        : 'bg-white border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {challenge.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Target className="w-5 h-5 text-orange-600" />
                          )}
                          <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{challenge.description}</p>
                      </div>
                      <Badge className={difficultyColors[challenge.difficulty]}>
                        {challenge.difficulty}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs mb-3">
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-blue-800">
                          <strong>Meta:</strong> {challenge.target_metric}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-purple-800">
                          <strong>Sucesso:</strong> {challenge.success_criteria}
                        </p>
                      </div>
                    </div>

                    {challenge.tips?.length > 0 && !challenge.completed && (
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-600">💡 Dicas:</p>
                        {challenge.tips.map((tip, idx) => (
                          <p key={idx} className="text-xs text-gray-600">• {tip}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-bold text-orange-600">
                          {challenge.points} pontos
                        </span>
                      </div>
                      {!challenge.completed && (
                        <Button
                          onClick={() => markChallengeComplete(challenge.id, challenge.points)}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Completar
                        </Button>
                      )}
                      {challenge.completed && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completo
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={generateWeeklyChallenges}
              disabled={generatingChallenges}
              variant="outline"
              className="w-full border-2 border-orange-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Novos Desafios
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}