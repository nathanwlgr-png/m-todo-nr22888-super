import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Sparkles, Loader2, CheckCircle2, 
  Calendar, TrendingUp, Zap, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function ActionPlanGenerator() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [actionPlan, setActionPlan] = useState(null);

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['my-coaching-sessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 20)
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-action-plan-tasks'],
    queryFn: async () => {
      const tasks = await base44.entities.Task.list('-created_date', 50);
      return tasks.filter(t => t.auto_created && t.type === 'coaching_action');
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-action-plan-tasks']);
    }
  });

  const generateActionPlan = async () => {
    if (coachingSessions.length < 2) {
      toast.error('Faça pelo menos 2 análises de coaching primeiro');
      return;
    }

    setGenerating(true);
    try {
      // Compilar dados das últimas sessões
      const recentSessions = coachingSessions.slice(0, 10);
      
      const allWeaknesses = recentSessions.flatMap(s => s.weaknesses || []);
      const avgScores = {
        spin: recentSessions.reduce((sum, s) => sum + (s.technique_scores?.spin_selling || 0), 0) / recentSessions.length,
        numerology: recentSessions.reduce((sum, s) => sum + (s.technique_scores?.numerology_adaptation || 0), 0) / recentSessions.length,
        cialdini: recentSessions.reduce((sum, s) => sum + (s.technique_scores?.cialdini_triggers || 0), 0) / recentSessions.length,
        emotional: recentSessions.reduce((sum, s) => sum + (s.technique_scores?.emotional_intelligence || 0), 0) / recentSessions.length,
        objections: recentSessions.reduce((sum, s) => sum + (s.technique_scores?.objection_handling || 0), 0) / recentSessions.length
      };

      const overallAvg = recentSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / recentSessions.length;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um coach de vendas consultivas. Analise o desempenho deste vendedor e crie um PLANO DE AÇÃO personalizado.

═══════════════════════════════════════
📊 ANÁLISE DE PERFORMANCE
═══════════════════════════════════════

**ÚLTIMAS ${recentSessions.length} SESSÕES**
Score Médio Geral: ${overallAvg.toFixed(1)}/100

**SCORES POR TÉCNICA:**
- SPIN Selling: ${avgScores.spin.toFixed(1)}/10
- Adaptação Numerológica: ${avgScores.numerology.toFixed(1)}/10
- Gatilhos Cialdini: ${avgScores.cialdini.toFixed(1)}/10
- Inteligência Emocional: ${avgScores.emotional.toFixed(1)}/10
- Controle de Objeções: ${avgScores.objections.toFixed(1)}/10

**ÁREAS DE MELHORIA RECORRENTES:**
${allWeaknesses.slice(0, 10).map((w, i) => `${i + 1}. ${w}`).join('\n')}

═══════════════════════════════════════
🎯 GERE UM PLANO DE AÇÃO COMPLETO
═══════════════════════════════════════

Crie um plano de desenvolvimento de 30 dias com:
1. Prioridades claras baseadas nas maiores fraquezas
2. Ações específicas e mensuráveis
3. Cronograma realista
4. Recursos e ferramentas necessários

Retorne JSON estruturado:`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                main_strength: { type: "string" },
                critical_weakness: { type: "string" },
                priority_focus: { type: "string" },
                estimated_improvement: { type: "string" }
              }
            },
            priority_areas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  current_score: { type: "number" },
                  target_score: { type: "number" },
                  priority: { type: "string" },
                  why_important: { type: "string" }
                }
              }
            },
            action_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  duration_days: { type: "number" },
                  specific_actions: { type: "array", items: { type: "string" } },
                  success_metrics: { type: "string" },
                  resources: { type: "array", items: { type: "string" } }
                }
              }
            },
            weekly_milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  goal: { type: "string" },
                  activities: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommended_practices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  practice: { type: "string" },
                  frequency: { type: "string" },
                  benefit: { type: "string" }
                }
              }
            }
          }
        }
      });

      setActionPlan(result);
      toast.success('Plano de ação gerado!');

      // Criar tarefas no CRM automaticamente
      for (const action of result.action_items.slice(0, 5)) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + action.duration_days);
        
        await createTaskMutation.mutateAsync({
          title: `[COACHING] ${action.title}`,
          description: `${action.description}\n\nAções específicas:\n${action.specific_actions.map(a => `• ${a}`).join('\n')}\n\nMétrica de sucesso: ${action.success_metrics}`,
          due_date: dueDate.toISOString().split('T')[0],
          priority: action.priority === 'high' ? 'alta' : action.priority === 'medium' ? 'media' : 'baixa',
          type: 'coaching_action',
          auto_created: true,
          status: 'pendente'
        });
      }

      toast.success(`${result.action_items.length} tarefas criadas no seu CRM!`, { duration: 4000 });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar plano: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const completedTasks = myTasks.filter(t => t.status === 'concluida').length;
  const totalTasks = myTasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Target className="w-5 h-5" />
          Plano de Ação Personalizado
        </CardTitle>
        <p className="text-sm text-purple-700">
          Desenvolvimento baseado nas suas análises de coaching
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progresso das Tarefas */}
        {totalTasks > 0 && (
          <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-800">PROGRESSO DO PLANO</span>
              <span className="text-sm font-bold text-purple-600">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!actionPlan ? (
          <div className="p-6 bg-white rounded-lg border-2 border-purple-200 text-center">
            <Target className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-gray-700 mb-3">
              Gere um plano de ação personalizado com tarefas rastreáveis baseado nas suas fraquezas
            </p>
            <Button
              onClick={generateActionPlan}
              disabled={generating || coachingSessions.length < 2}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Plano de Ação
                </>
              )}
            </Button>
            {coachingSessions.length < 2 && (
              <p className="text-xs text-gray-500 mt-2">
                Faça pelo menos 2 análises de coaching primeiro
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
              <p className="text-xs font-semibold text-purple-800 mb-3">📋 RESUMO</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-600 mb-1">Ponto Forte:</p>
                  <p className="font-semibold text-green-700">{actionPlan.summary.main_strength}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Foco Crítico:</p>
                  <p className="font-semibold text-red-700">{actionPlan.summary.critical_weakness}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Prioridade:</p>
                  <p className="font-semibold text-purple-700">{actionPlan.summary.priority_focus}</p>
                </div>
              </div>
            </div>

            {/* Áreas Prioritárias */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-purple-800">🎯 ÁREAS PRIORITÁRIAS</p>
              {actionPlan.priority_areas.map((area, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">{area.area}</span>
                    <Badge className={
                      area.priority === 'high' ? 'bg-red-600' :
                      area.priority === 'medium' ? 'bg-orange-600' : 'bg-yellow-600'
                    }>
                      {area.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={(area.current_score / 10) * 100} className="flex-1 h-1" />
                    <span className="text-xs text-gray-600">{area.current_score} → {area.target_score}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{area.why_important}</p>
                </div>
              ))}
            </div>

            {/* Marcos Semanais */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-purple-800">📅 MARCOS SEMANAIS (30 dias)</p>
              {actionPlan.weekly_milestones.map((milestone, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-gray-900">Semana {milestone.week}</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">{milestone.goal}</p>
                  <ul className="space-y-1">
                    {milestone.activities.map((activity, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-600" />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Práticas Recomendadas */}
            <div className="p-3 bg-purple-100 rounded-lg border border-purple-300">
              <p className="text-xs font-semibold text-purple-900 mb-2">⚡ PRÁTICAS DIÁRIAS</p>
              <div className="space-y-2">
                {actionPlan.recommended_practices.map((practice, idx) => (
                  <div key={idx} className="text-xs text-purple-800">
                    <span className="font-semibold">{practice.practice}</span> ({practice.frequency})
                    <p className="text-purple-700 ml-4">→ {practice.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={generateActionPlan}
              disabled={generating}
              variant="outline"
              className="w-full border-2 border-purple-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Atualizar Plano
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}