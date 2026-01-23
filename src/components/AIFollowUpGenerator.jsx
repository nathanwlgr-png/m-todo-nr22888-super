import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFollowUpGenerator({ visit, clientData }) {
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Follow-up criado!');
    }
  });

  const generateFollowUp = async () => {
    if (!visit || !clientData) return;

    try {
      setIsGenerating(true);

      const context = `
VISITA REALIZADA:
Cliente: ${clientData.first_name}
Data: ${visit.scheduled_date}
Tipo: ${visit.visit_type}
Notas: ${visit.result_notes || 'Sem notas'}

STATUS DO CLIENTE:
Score: ${clientData.purchase_score || 0}
Status: ${clientData.status}
Pipeline: ${clientData.pipeline_stage}
Objeções: ${clientData.real_objections?.join(', ') || 'Nenhuma'}

OBJETIVO: Gere uma mensagem de follow-up personalizada e uma tarefa específica para dar continuidade.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            task_title: { type: "string" },
            task_description: { type: "string" },
            priority: { type: "string" },
            due_days: { type: "number" }
          }
        }
      });

      setFollowUpMessage(result.message);

      // Criar tarefa automaticamente
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (result.due_days || 3));

      await createTaskMutation.mutateAsync({
        client_id: clientData.id,
        client_name: clientData.first_name,
        title: result.task_title,
        description: `${result.task_description}\n\n📝 Mensagem sugerida:\n${result.message}`,
        priority: result.priority || 'alta',
        type: 'follow_up',
        due_date: dueDate.toISOString().split('T')[0],
        auto_created: true
      });

      toast.success('Follow-up gerado e tarefa criada!');
    } catch (error) {
      toast.error('Erro ao gerar follow-up');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(followUpMessage);
    toast.success('Mensagem copiada!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Follow-up Automático
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateFollowUp}
          disabled={isGenerating}
          className="w-full mb-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Follow-up Inteligente'
          )}
        </Button>

        {followUpMessage && (
          <div className="bg-slate-50 p-4 rounded-lg border">
            <p className="text-sm mb-3 whitespace-pre-wrap">{followUpMessage}</p>
            <Button onClick={copyMessage} size="sm" variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Copiar Mensagem
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}