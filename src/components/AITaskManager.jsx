import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckSquare, Sparkles, Loader2, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Gestor de Tarefas com IA
 * Priorização inteligente, sugestões automáticas e organização por contexto
 */
export default function AITaskManager() {
  const [analyzing, setAnalyzing] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tasks']);
      toast.success('Tarefa criada!');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tasks']);
    }
  });

  const analyzeAndOrganize = async () => {
    setAnalyzing(true);
    try {
      const pendingTasks = tasks.filter(t => t.status === 'pendente');

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de produtividade expert. Analise as tarefas pendentes e reorganize por prioridade inteligente.

TAREFAS PENDENTES (${pendingTasks.length}):
${pendingTasks.map(t => `- ${t.title} | Cliente: ${t.client_name || 'N/A'} | Prioridade atual: ${t.priority} | Vencimento: ${t.due_date || 'N/A'}`).join('\n')}

CLIENTES CONTEXTO:
${clients.slice(0, 20).map(c => `- ${c.first_name}: status=${c.status}, score=${c.purchase_score}%, engagement=${c.engagement_score || 0}%`).join('\n')}

Retorne JSON com:
{
  "reorganized_tasks": [
    {
      "task_title": "título da tarefa",
      "new_priority": "alta|media|baixa",
      "reasoning": "motivo da priorização",
      "suggested_date": "YYYY-MM-DD",
      "context": "contexto estratégico"
    }
  ],
  "new_task_suggestions": [
    {
      "title": "Título da nova tarefa",
      "description": "Descrição",
      "client_name": "Nome do cliente",
      "priority": "alta|media|baixa",
      "due_date": "YYYY-MM-DD",
      "reasoning": "Por que criar esta tarefa"
    }
  ],
  "summary": "Resumo da análise (2-3 linhas)"
}

Priorize tarefas de clientes quentes, com alto engagement ou prazos próximos.`,
        response_json_schema: {
          type: "object",
          properties: {
            reorganized_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_title: { type: "string" },
                  new_priority: { type: "string" },
                  reasoning: { type: "string" },
                  suggested_date: { type: "string" },
                  context: { type: "string" }
                }
              }
            },
            new_task_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  client_name: { type: "string" },
                  priority: { type: "string" },
                  due_date: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      // Atualizar prioridades das tarefas existentes
      for (const reorg of analysis.reorganized_tasks) {
        const task = pendingTasks.find(t => t.title === reorg.task_title);
        if (task && task.priority !== reorg.new_priority) {
          await updateTaskMutation.mutateAsync({
            id: task.id,
            data: { priority: reorg.new_priority, due_date: reorg.suggested_date }
          });
        }
      }

      toast.success('✨ Tarefas reorganizadas com IA!', {
        description: analysis.summary
      });

      // Mostrar sugestões de novas tarefas
      if (analysis.new_task_suggestions.length > 0) {
        const suggestions = analysis.new_task_suggestions.map(s => 
          `• ${s.title} (${s.client_name}) - ${s.reasoning}`
        ).join('\n');
        
        toast.info(`💡 ${analysis.new_task_suggestions.length} novas tarefas sugeridas`, {
          description: 'Verifique o relatório',
          duration: 8000
        });
      }

    } catch (error) {
      console.error('Erro ao analisar tarefas:', error);
      toast.error('Erro ao analisar tarefas');
    } finally {
      setAnalyzing(false);
    }
  };

  const createSmartTask = async () => {
    if (!taskInput.trim()) return;

    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta descrição de tarefa e enriqueça com contexto inteligente: "${taskInput}"

CLIENTES DISPONÍVEIS:
${clients.slice(0, 30).map(c => `- ${c.first_name} (${c.status}, score: ${c.purchase_score}%)`).join('\n')}

Retorne JSON:
{
  "title": "Título claro e acionável",
  "description": "Descrição detalhada",
  "client_name": "Nome do cliente relacionado (se aplicável)",
  "priority": "alta|media|baixa",
  "due_date": "YYYY-MM-DD (sugestão inteligente)",
  "type": "follow_up|ligacao|email|visita|outro"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            client_name: { type: "string" },
            priority: { type: "string" },
            due_date: { type: "string" },
            type: { type: "string" }
          }
        }
      });

      const client = clients.find(c => c.first_name === analysis.client_name);
      
      await createTaskMutation.mutateAsync({
        title: analysis.title,
        description: analysis.description,
        client_id: client?.id,
        client_name: analysis.client_name,
        priority: analysis.priority,
        due_date: analysis.due_date,
        type: analysis.type,
        auto_created: false
      });

      setTaskInput('');
      toast.success('✨ Tarefa criada com enriquecimento IA!');
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'pendente').length;
  const urgentCount = tasks.filter(t => t.status === 'pendente' && t.priority === 'alta').length;

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Gestor de Tarefas IA</h3>
          <p className="text-xs text-slate-600">{pendingCount} pendentes • {urgentCount} urgentes</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Criar tarefa com IA..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createSmartTask()}
            className="flex-1"
          />
          <Button onClick={createSmartTask} size="icon">
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={analyzeAndOrganize}
          disabled={analyzing}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Reorganizar por Prioridade IA
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}