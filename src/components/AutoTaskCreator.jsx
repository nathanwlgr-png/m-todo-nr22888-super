import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, Calendar, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoTaskCreator({ clientId }) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState(null);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const createTasksMutation = useMutation({
    mutationFn: (tasksData) => Promise.all(
      tasksData.map(task => base44.entities.Task.create(task))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-tasks']);
      toast.success('Tarefas criadas com sucesso!');
      setGeneratedTasks(null);
    }
  });

  const handleGenerateTasks = async () => {
    if (!client) return;

    setGenerating(true);

    try {
      const prompt = `Analise o cliente e crie 3-5 tarefas CONCRETAS e ESTRATÉGICAS.

═══════════════════════════════════════
📊 DADOS DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Clínica: ${client.clinic_name || 'N/A'}
Status: ${client.status} | Score: ${client.purchase_score}%
Tipo: ${client.client_type}
Decisor: ${client.decision_role}

═══════════════════════════════════════
🧠 PERFIL COMPORTAMENTAL
═══════════════════════════════════════
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Estilo Decisão: ${client.decision_style}
Tom: ${client.client_tone || 'Não observado'}

═══════════════════════════════════════
📈 HISTÓRICO
═══════════════════════════════════════
Visitas: ${visits.length} realizadas
Última visita: ${client.last_visit_date || 'Nenhuma'}
Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}
Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
Equipamento atual: ${client.current_equipment || 'Nenhum'}
Interesse: ${client.equipment_interest || 'Não definido'}

═══════════════════════════════════════
🎯 CRIE TAREFAS NO FORMATO JSON
═══════════════════════════════════════

{
  "tasks": [
    {
      "title": "Título curto e acionável",
      "description": "Descrição detalhada incluindo EXATAMENTE o que fazer, quando fazer e como fazer",
      "type": "follow_up" | "ligacao" | "email" | "visita",
      "priority": "baixa" | "media" | "alta",
      "due_days": 1-30,
      "reasoning": "Por que esta tarefa é importante agora"
    }
  ]
}

REGRAS:
1. Tarefas devem ser ESPECÍFICAS para este cliente
2. Adaptar ao perfil numerológico ${client.numerology_number}
3. Timing estratégico baseado no status ${client.status}
4. Próximo passo lógico na jornada de vendas
5. Incluir detalhes acionáveis (o que enviar, quando ligar, etc)
6. Priorizar baseado em score ${client.purchase_score}%

Retorne apenas JSON válido.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  priority: { type: "string" },
                  due_days: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedTasks(result.tasks || []);
    } catch (error) {
      toast.error('Erro ao gerar tarefas: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTasks = async () => {
    const tasksToCreate = generatedTasks.map(task => ({
      client_id: clientId,
      client_name: client.first_name,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      due_date: new Date(Date.now() + task.due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendente',
      auto_created: true
    }));

    await createTasksMutation.mutateAsync(tasksToCreate);
  };

  const priorityColors = {
    alta: 'bg-red-100 text-red-700 border-red-300',
    media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    baixa: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const typeIcons = {
    follow_up: '🔄',
    ligacao: '📞',
    email: '📧',
    visita: '🚗',
    outro: '📋'
  };

  if (!client) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-purple-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Automação de Tarefas IA
          </h3>
          <p className="text-xs text-purple-600">Tarefas personalizadas para {client.first_name}</p>
        </div>
        <Button
          onClick={handleGenerateTasks}
          disabled={generating || generatedTasks}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              Gerar Tarefas
            </>
          )}
        </Button>
      </div>

      {generatedTasks && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-900 mb-3">
              {generatedTasks.length} tarefas geradas automaticamente
            </p>
            
            <div className="space-y-2">
              {generatedTasks.map((task, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{typeIcons[task.type]}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Em {task.due_days} dias
                    </span>
                  </div>
                  
                  {task.reasoning && (
                    <p className="text-xs text-purple-700 mt-2 italic">
                      💡 {task.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateTasks}
              disabled={createTasksMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {createTasksMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Criar Todas as Tarefas
                </>
              )}
            </Button>
            <Button
              onClick={() => setGeneratedTasks(null)}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}