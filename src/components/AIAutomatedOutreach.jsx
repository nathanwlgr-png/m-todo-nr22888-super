import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Clock, 
  Sparkles, 
  Loader2,
  Calendar,
  MessageSquare,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIAutomatedOutreach() {
  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list();
      return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
    },
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: async () => {
      try {
        return await base44.entities.Interaction.list();
      } catch {
        return [];
      }
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await base44.entities.Task.list();
      } catch {
        return [];
      }
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Identificar clientes que precisam de follow-up
  const clientsNeedingOutreach = useMemo(() => {
    return clients.filter(client => {
      const lastInteraction = interactions
        .filter(i => i.client_id === client.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      
      const daysSinceInteraction = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      // Critérios: status quente sem contato há 7+ dias, morno há 14+ dias, ou sem interação
      return (
        (client.status === 'quente' && daysSinceInteraction > 7) ||
        (client.status === 'morno' && daysSinceInteraction > 14) ||
        (client.status === 'frio' && daysSinceInteraction > 30) ||
        !lastInteraction
      );
    }).slice(0, 10);
  }, [clients, interactions]);

  // Gerar mensagens personalizadas com IA
  const generatePersonalizedMessages = async () => {
    if (clientsNeedingOutreach.length === 0) {
      toast.info('Todos os clientes estão com follow-ups em dia!');
      return;
    }

    setGenerating(true);
    try {
      const messagesGenerated = [];

      for (const client of clientsNeedingOutreach.slice(0, 5)) {
        const clientInteractions = interactions.filter(i => i.client_id === client.id);
        const lastInteraction = clientInteractions[0];

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um consultor de vendas veterinárias especializado. Gere uma mensagem de follow-up personalizada para:

CLIENTE: ${client.first_name} (${client.clinic_name || ''})
STATUS: ${client.status}
CIDADE: ${client.city || ''}
EQUIPAMENTO ATUAL: ${client.current_equipment || 'Não informado'}
SCORE DE COMPRA: ${client.purchase_score || 0}%
ÚLTIMA INTERAÇÃO: ${lastInteraction ? new Date(lastInteraction.created_date).toLocaleDateString('pt-BR') : 'Nenhuma'}
OBJEÇÕES CONHECIDAS: ${client.real_objections?.join(', ') || 'Não registradas'}
PERFIL COMPORTAMENTAL: ${client.behavioral_profile || 'Não definido'}

GERE:
1. Assunto de email atrativo
2. Mensagem de WhatsApp curta e direta (máx 150 caracteres)
3. Email completo personalizado (3 parágrafos)
4. Melhor horário para contato (considerando perfil)
5. Gatilho mental a usar

Seja específico, use o nome da pessoa, mencione contexto relevante, e crie senso de urgência sem ser agressivo.`,
          response_json_schema: {
            type: "object",
            properties: {
              email_subject: { type: "string" },
              whatsapp_message: { type: "string" },
              email_body: { type: "string" },
              best_time: { type: "string" },
              trigger: { type: "string" }
            }
          }
        });

        messagesGenerated.push({
          client,
          messages: response
        });

        // Criar tarefa automaticamente
        await createTaskMutation.mutateAsync({
          client_id: client.id,
          client_name: client.first_name,
          title: `Follow-up: ${client.first_name}`,
          description: `📧 Email: ${response.email_subject}\n\n📱 WhatsApp: ${response.whatsapp_message}\n\n⏰ Melhor horário: ${response.best_time}\n\n💡 Gatilho: ${response.trigger}`,
          type: 'follow_up',
          priority: client.status === 'quente' ? 'alta' : 'media',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          auto_created: true
        });
      }

      toast.success(`${messagesGenerated.length} mensagens personalizadas geradas e agendadas!`);
    } catch (error) {
      console.error('Erro ao gerar mensagens:', error);
      toast.error('Erro ao gerar mensagens');
    } finally {
      setGenerating(false);
    }
  };

  // Agendar touchpoints automatizados
  const scheduleAutomatedTouchpoints = async () => {
    setScheduling(true);
    try {
      const scheduleResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise a base de ${clients.length} clientes e crie um cronograma de touchpoints automatizados para os próximos 30 dias.

REGRAS:
- Clientes quentes: contato a cada 5-7 dias
- Clientes mornos: contato a cada 10-14 dias  
- Clientes frios: contato a cada 21-30 dias
- Variar tipo de contato: email, WhatsApp, ligação
- Considerar fusos e horários comerciais

DADOS:
- Clientes quentes: ${clients.filter(c => c.status === 'quente').length}
- Clientes mornos: ${clients.filter(c => c.status === 'morno').length}
- Clientes frios: ${clients.filter(c => c.status === 'frio').length}

Retorne um cronograma estruturado dos próximos 30 dias com:
- Datas específicas
- Clientes prioritários por data
- Tipo de abordagem recomendada
- Horário sugerido

Formate como lista de ações diárias.`,
      });

      // Criar tarefas para as próximas semanas
      const today = new Date();
      const priorities = ['quente', 'morno', 'frio'];
      let tasksCreated = 0;

      for (let i = 0; i < 3; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (i + 1) * 7);
        
        const statusClients = clients.filter(c => c.status === priorities[i]);
        
        for (const client of statusClients.slice(0, 3)) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: `Touchpoint automático: ${client.first_name}`,
            description: `🤖 Contato programado automaticamente\n\nStatus: ${client.status}\nÚltima interação registrada no sistema\n\nAção: Enviar mensagem de follow-up personalizada`,
            type: 'follow_up',
            priority: client.status === 'quente' ? 'alta' : 'media',
            due_date: targetDate.toISOString().split('T')[0],
            auto_created: true
          });
          tasksCreated++;
        }
      }

      toast.success(`Cronograma criado! ${tasksCreated} touchpoints agendados para os próximos 21 dias`, {
        description: scheduleResponse.substring(0, 100) + '...'
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao agendar touchpoints');
    } finally {
      setScheduling(false);
    }
  };

  // Analisar padrões de atividade
  const analyzeBestTimes = async () => {
    try {
      toast.info('Analisando padrões de resposta...', { duration: 2000 });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os padrões de interação e sugira horários ótimos para outreach:

DADOS:
- Total de interações: ${interactions.length}
- Interações por tipo: ${interactions.reduce((acc, i) => {
  acc[i.type] = (acc[i.type] || 0) + 1;
  return acc;
}, {})}
- Clientes por região: ${clients.reduce((acc, c) => {
  const city = c.city || 'Sem cidade';
  acc[city] = (acc[city] || 0) + 1;
  return acc;
}, {})}

Com base em padrões de veterinários e clínicas, sugira:
1. Melhores horários para email (considerando que veterinários checam email)
2. Melhores horários para WhatsApp
3. Melhores dias da semana
4. Horários a EVITAR (procedimentos, consultas)

Seja específico com horários e justifique baseado no dia-a-dia veterinário.`,
        response_json_schema: {
          type: "object",
          properties: {
            best_email_times: { type: "array", items: { type: "string" } },
            best_whatsapp_times: { type: "array", items: { type: "string" } },
            best_days: { type: "array", items: { type: "string" } },
            avoid_times: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      toast.success('Análise concluída!', {
        description: `📧 Email: ${response.best_email_times?.[0] || 'N/A'} | 📱 WhatsApp: ${response.best_whatsapp_times?.[0] || 'N/A'}`,
        duration: 8000
      });
    } catch (error) {
      toast.error('Erro ao analisar padrões');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pendente' && t.auto_created);

  return (
    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Outreach Automatizado com IA</h3>
          <p className="text-xs text-slate-600">Mensagens personalizadas e agendamentos inteligentes</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 bg-white rounded-lg border border-violet-200 text-center">
          <p className="text-xs text-violet-600 mb-1">Precisam Follow-up</p>
          <p className="text-2xl font-bold text-violet-700">{clientsNeedingOutreach.length}</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-purple-200 text-center">
          <p className="text-xs text-purple-600 mb-1">Tasks Agendadas</p>
          <p className="text-2xl font-bold text-purple-700">{pendingTasks.length}</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-pink-200 text-center">
          <p className="text-xs text-pink-600 mb-1">Total Clientes</p>
          <p className="text-2xl font-bold text-pink-700">{clients.length}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Gerar Mensagens Personalizadas */}
        <div className="p-3 bg-white rounded-lg border border-violet-200">
          <div className="flex items-start gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-violet-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-800">Mensagens Personalizadas com IA</p>
              <p className="text-xs text-slate-600 mt-1">
                Gera emails e WhatsApp customizados baseados em histórico e perfil de cada cliente
              </p>
            </div>
          </div>
          <Button
            onClick={generatePersonalizedMessages}
            disabled={generating || clientsNeedingOutreach.length === 0}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando mensagens...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Mensagens (Top 5)
              </>
            )}
          </Button>
        </div>

        {/* Agendar Touchpoints */}
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <div className="flex items-start gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-800">Cronograma Automatizado</p>
              <p className="text-xs text-slate-600 mt-1">
                Cria touchpoints inteligentes para os próximos 30 dias baseado em status e histórico
              </p>
            </div>
          </div>
          <Button
            onClick={scheduleAutomatedTouchpoints}
            disabled={scheduling}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {scheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando cronograma...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Touchpoints (30 dias)
              </>
            )}
          </Button>
        </div>

        {/* Horários Ótimos */}
        <div className="p-3 bg-white rounded-lg border border-pink-200">
          <div className="flex items-start gap-2 mb-2">
            <Clock className="w-4 h-4 text-pink-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-pink-800">Análise de Horários Ótimos</p>
              <p className="text-xs text-slate-600 mt-1">
                Identifica melhores horários para contato baseado em padrões de atividade
              </p>
            </div>
          </div>
          <Button
            onClick={analyzeBestTimes}
            variant="outline"
            className="w-full border-2 border-pink-300 hover:bg-pink-50"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analisar Padrões
          </Button>
        </div>
      </div>

      {/* Preview de Clientes Precisando Outreach */}
      {clientsNeedingOutreach.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            ⚠️ Clientes Precisando Follow-up ({clientsNeedingOutreach.length})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {clientsNeedingOutreach.slice(0, 5).map(client => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-amber-50 rounded text-xs">
                <span className="font-medium text-slate-800">{client.first_name}</span>
                <Badge className={
                  client.status === 'quente' ? 'bg-red-500' :
                  client.status === 'morno' ? 'bg-orange-500' : 'bg-blue-500'
                }>
                  {client.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-xs text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>{pendingTasks.length} touchpoints automáticos agendados</span>
          </div>
        </div>
      )}
    </Card>
  );
}