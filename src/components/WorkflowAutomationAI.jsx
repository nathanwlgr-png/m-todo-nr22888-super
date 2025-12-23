import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GitBranch, Play, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

/**
 * IA de Automação de Workflow
 * Cria fluxos automáticos baseados em padrões
 */
export default function WorkflowAutomationAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries(['all-tasks'])
  });

  const analyzeWorkflow = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é uma IA especialista em automação de workflows de vendas.

CLIENTES (${clients.length}):
${clients.slice(0, 30).map(c => 
  `- ${c.first_name}: status=${c.status}, score=${c.purchase_score}%, ultima_visita=${c.last_visit_date || 'nunca'}`
).join('\n')}

TAREFAS RECENTES (${tasks.length}):
${tasks.slice(0, 20).map(t => `- ${t.title}: ${t.status}, prioridade=${t.priority}`).join('\n')}

ANALISE e crie um WORKFLOW AUTOMÁTICO otimizado. Retorne JSON:
{
  "workflow_name": "Nome do workflow",
  "triggers": [
    {
      "condition": "quando cliente status = quente E score > 70",
      "action": "criar_tarefa_urgente_ligacao"
    }
  ],
  "automated_tasks": [
    {
      "title": "Título da tarefa",
      "description": "Descrição",
      "client_name": "Nome cliente",
      "priority": "alta|media|baixa",
      "due_date": "YYYY-MM-DD",
      "trigger": "Condição que ativa"
    }
  ],
  "optimization_report": {
    "time_saved": "Tempo economizado",
    "efficiency_gain": "% de ganho",
    "recommendations": ["Recomendação 1", "Recomendação 2"]
  }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            workflow_name: { type: "string" },
            triggers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  condition: { type: "string" },
                  action: { type: "string" }
                }
              }
            },
            automated_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  client_name: { type: "string" },
                  priority: { type: "string" },
                  due_date: { type: "string" },
                  trigger: { type: "string" }
                }
              }
            },
            optimization_report: {
              type: "object",
              properties: {
                time_saved: { type: "string" },
                efficiency_gain: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      // Criar tarefas automáticas
      for (const task of result.automated_tasks) {
        const client = clients.find(c => c.first_name === task.client_name);
        if (client) {
          await createTaskMutation.mutateAsync({
            title: task.title,
            description: `[WORKFLOW AUTO] ${task.description}\n\nTrigger: ${task.trigger}`,
            client_id: client.id,
            client_name: task.client_name,
            priority: task.priority,
            due_date: task.due_date,
            auto_created: true
          });
        }
      }

      toast.success(`✨ Workflow "${result.workflow_name}" criado!`, {
        description: `${result.automated_tasks.length} tarefas automáticas • ${result.optimization_report.efficiency_gain} eficiência`,
        duration: 8000
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar workflow');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
          <GitBranch className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Automação de Workflow IA</h3>
          <p className="text-xs text-slate-600">Fluxos inteligentes automáticos</p>
        </div>
      </div>

      <Button
        onClick={analyzeWorkflow}
        disabled={analyzing}
        className="w-full bg-cyan-600 hover:bg-cyan-700"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Criando workflows...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Criar Workflow Automático
          </>
        )}
      </Button>

      <div className="mt-3 p-3 bg-white rounded-lg border border-cyan-200">
        <p className="text-xs font-semibold text-cyan-800 mb-1">🚀 Automações Criadas:</p>
        <ul className="text-xs text-slate-700 space-y-0.5">
          <li>• Tarefas baseadas em comportamento</li>
          <li>• Triggers de vendas inteligentes</li>
          <li>• Otimização de tempo automática</li>
        </ul>
      </div>
    </Card>
  );
}