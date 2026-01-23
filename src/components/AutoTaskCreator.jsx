import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoTaskCreator({ client, interactions = [], sales = [], visits = [] }) {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const generateTasks = async () => {
    setLoading(true);
    try {
      const daysSinceLastInteraction = interactions.length > 0 ?
        Math.floor((Date.now() - new Date(interactions[0].created_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      const prompt = `Crie tarefas e lembretes INTELIGENTES baseados nas previsões da IA para este cliente.

CLIENTE: ${client.first_name}
Status: ${client.status} | Pipeline: ${client.pipeline_stage || 'lead'}
Health: ${client.health_score || 50}% | Churn Risk: ${client.ai_sales_intelligence?.churn_risk || 0}%
LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}
Última interação: ${daysSinceLastInteraction} dias

HISTÓRICO:
- Vendas: ${sales.length}
- Visitas: ${visits.length}
- Interações: ${interactions.length}

Com base em:
1. Churn risk e health score
2. LTV e potencial
3. Pipeline stage
4. Tempo desde última interação

CRIE 3-5 TAREFAS ACIONÁVEIS:
- Título claro
- Descrição com contexto
- Prioridade (alta/media/baixa)
- Tipo (ligacao/email/visita/follow_up)
- Prazo sugerido (dias a partir de hoje)

Seja ESPECÍFICO e ACIONÁVEL.`;

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
                  priority: { type: "string", enum: ["alta", "media", "baixa"] },
                  type: { type: "string", enum: ["ligacao", "email", "visita", "follow_up", "outro"] },
                  due_days: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTasks(result.tasks);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const createAllTasks = async () => {
    setCreating(true);
    try {
      for (const task of tasks) {
        const dueDate = new Date(Date.now() + task.due_days * 24 * 60 * 60 * 1000);
        
        await base44.entities.Task.create({
          client_id: client.id,
          client_name: client.first_name,
          title: task.title,
          description: `${task.description}\n\n💡 Motivo: ${task.reason}`,
          priority: task.priority,
          type: task.type,
          due_date: dueDate.toISOString().split('T')[0],
          auto_created: true
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success(`${tasks.length} tarefas criadas automaticamente!`);
      setTasks(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar tarefas');
    } finally {
      setCreating(false);
    }
  };

  if (!tasks) {
    return (
      <Card className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">✅ Tarefas Automáticas IA</h3>
            <p className="text-xs text-white/80">Baseado em previsões e health score</p>
          </div>
        </div>
        <Button
          onClick={generateTasks}
          disabled={loading}
          className="w-full h-10 bg-white text-green-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Tarefas IA'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-lg border-2 border-green-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-green-600" />
          Tarefas Sugeridas pela IA
        </h3>
        <Badge className="bg-green-600 text-white">{tasks.length} tarefas</Badge>
      </div>

      <div className="space-y-2 mb-3">
        {tasks.map((task, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-start justify-between mb-1">
              <p className="font-semibold text-sm text-slate-800">{task.title}</p>
              <Badge className={
                task.priority === 'alta' ? 'bg-red-500 text-white' :
                task.priority === 'media' ? 'bg-orange-500 text-white' :
                'bg-blue-500 text-white'
              }>
                {task.priority}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mb-2">{task.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="bg-slate-200 px-2 py-1 rounded">{task.type}</span>
              <span>•</span>
              <span>📅 {task.due_days} dia{task.due_days !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-xs text-green-700 mt-1">💡 {task.reason}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={createAllTasks}
          disabled={creating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 mr-1" />
              Criar Todas
            </>
          )}
        </Button>
        <Button
          onClick={() => setTasks(null)}
          variant="outline"
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}