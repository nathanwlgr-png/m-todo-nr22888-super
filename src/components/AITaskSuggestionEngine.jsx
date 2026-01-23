import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, CheckCircle, Clock, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AITaskSuggestionEngine({ clientId, clientData, visits = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa criada!');
    }
  });

  const generateSuggestions = async () => {
    if (!clientData) return;

    try {
      setIsGenerating(true);

      const recentVisits = visits.slice(0, 3);
      const lastVisitNotes = recentVisits[0]?.result_notes || 'Sem notas';
      
      const context = `
Cliente: ${clientData.first_name}
Status: ${clientData.status || 'morno'}
Score: ${clientData.purchase_score || 0}/100
Equipamento: ${clientData.equipment_interest || 'Não definido'}
Último contato: ${clientData.last_contact_date || 'Nunca'}
Pipeline: ${clientData.pipeline_stage || 'lead'}
Dores: ${clientData.main_pains?.join(', ') || 'Não identificadas'}
Objeções: ${clientData.real_objections?.join(', ') || 'Nenhuma'}
Orçamento: R$ ${clientData.available_budget || 0}
Última visita: ${lastVisitNotes}

Sugira 3-5 tarefas ESPECÍFICAS e ACIONÁVEIS para avançar este cliente.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
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
                  priority: { type: "string" },
                  type: { type: "string" },
                  due_days: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.tasks || []);
      toast.success(`${result.tasks?.length || 0} tarefas geradas!`);
    } catch (error) {
      toast.error('Erro ao gerar sugestões');
    } finally {
      setIsGenerating(false);
    }
  };

  const createTask = async (suggestion) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (suggestion.due_days || 7));

    await createTaskMutation.mutateAsync({
      client_id: clientId,
      client_name: clientData.first_name,
      title: suggestion.title,
      description: `${suggestion.description}\n\n💡 ${suggestion.reason}`,
      priority: suggestion.priority || 'media',
      type: suggestion.type || 'follow_up',
      due_date: dueDate.toISOString().split('T')[0],
      auto_created: true
    });

    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  const priorityColors = {
    alta: 'bg-red-100 text-red-800 border-red-300',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    baixa: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Sugestões de IA
          </CardTitle>
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating}
            size="sm"
            className="bg-purple-600"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Tarefas'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Clique para gerar sugestões inteligentes
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${priorityColors[s.priority]}`}>
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{s.title}</h4>
                    <p className="text-sm mb-2">{s.description}</p>
                    <div className="flex gap-2 text-xs mb-2">
                      <Badge variant="outline">{s.type}</Badge>
                      <span>Em {s.due_days} dias</span>
                    </div>
                    <p className="text-xs italic">💡 {s.reason}</p>
                  </div>
                  <Button onClick={() => createTask(s)} size="sm" className="bg-green-600">
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}