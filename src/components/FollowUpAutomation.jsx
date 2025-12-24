import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export default function FollowUpAutomation() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-automation'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    refetchInterval: 300000, // Verifica a cada 5 minutos
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-automation'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    refetchInterval: 300000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-automation'],
    queryFn: () => base44.entities.Alert.list('-created_date', 200),
    refetchInterval: 300000,
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-automation']);
      queryClient.invalidateQueries(['calendar-events']);
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts-automation']);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['clients-automation']);
    },
  });

  // Análise diária de todos os clientes
  const runDailyAnalysis = async (client) => {
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de vendas veterinárias. Analise este cliente e responda as perguntas:

CLIENTE: ${client.first_name}
STATUS ATUAL: ${client.status}
SCORE: ${client.purchase_score || 0}
ÚLTIMO CONTATO: ${client.last_contact_date || 'Nunca'}
CLÍNICA: ${client.clinic_name || 'N/A'}
EQUIPAMENTO ATUAL: ${client.current_equipment || 'Nenhum'}

ANÁLISE DIÁRIA:
1. O status atual (${client.status}) está correto baseado nos dados? Se não, qual deveria ser?
2. Há sinais de urgência ou oportunidade?
3. Qual a probabilidade de fechamento nos próximos 7 dias (0-100)?
4. Qual a ação imediata recomendada?

Seja objetivo e direto.`,
        response_json_schema: {
          type: "object",
          properties: {
            status_correto: { type: "boolean" },
            status_sugerido: { type: "string", enum: ["quente", "morno", "frio"] },
            urgencia: { type: "string" },
            probabilidade_fechamento_7dias: { type: "number" },
            acao_imediata: { type: "string" },
            reasoning: { type: "string" }
          }
        }
      });

      // Atualizar status se necessário
      if (!analysis.status_correto && analysis.status_sugerido !== client.status) {
        await updateClientMutation.mutateAsync({
          id: client.id,
          data: {
            status: analysis.status_sugerido,
            purchase_score: analysis.probabilidade_fechamento_7dias || client.purchase_score,
            next_action: analysis.acao_imediata,
          }
        });

        await createAlertMutation.mutateAsync({
          user_email: user.email,
          title: `📊 Status Atualizado - ${client.first_name}`,
          message: `Status mudou para ${analysis.status_sugerido.toUpperCase()}. ${analysis.reasoning}`,
          type: 'high_score_lead',
          priority: 'media',
          link_to: `ClientProfile?id=${client.id}`,
        });
      }

      return analysis;
    } catch (error) {
      console.error('Erro na análise diária:', error);
      return null;
    }
  };

  // Análise profunda a cada 3 dias
  const runDeepAnalysis = async (client) => {
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vendas veterinárias. Faça uma análise PROFUNDA deste cliente:

DADOS DO CLIENTE:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Cidade: ${client.city || 'N/A'}
- Status: ${client.status}
- Score: ${client.purchase_score || 0}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Tipo: ${client.client_type || 'N/A'}
- Volume: ${client.current_volume || 'N/A'}
- Último Contato: ${client.last_contact_date || 'Nunca'}
- Próximo Contato: ${client.next_contact_date || 'Não agendado'}
- Orçamento: R$ ${client.available_budget || 0}
- Deadline: ${client.decision_deadline || 'N/A'}

HISTÓRICO DE VISITAS: ${JSON.stringify(client.visit_history || [])}
OBJEÇÕES: ${JSON.stringify(client.real_objections || [])}
DORES: ${JSON.stringify(client.main_pains || [])}

ANÁLISE PROFUNDA:
1. Avalie o perfil completo do cliente (0-100)
2. Identifique gaps críticos na abordagem
3. Sugira estratégia de fechamento personalizada
4. CRIE uma mensagem de WhatsApp personalizada e estruturada para enviar AGORA
5. Quando é o melhor momento para enviar essa mensagem?
6. Probabilidade de resposta positiva (0-100)

A mensagem deve ser:
- Personalizada com o nome
- Contexto específico da clínica/necessidade
- Call-to-action claro
- Tom adequado ao perfil
- Entre 100-200 palavras`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            perfil_score: { type: "number" },
            gaps_criticos: { type: "array", items: { type: "string" } },
            estrategia_fechamento: { type: "string" },
            mensagem_whatsapp: { type: "string" },
            melhor_momento_envio: { type: "string" },
            probabilidade_resposta: { type: "number" },
            pontos_chave: { type: "array", items: { type: "string" } },
            prioridade_envio: { type: "string", enum: ["urgente", "alta", "media", "baixa"] }
          }
        }
      });

      // Criar tarefa com a mensagem estruturada
      await createTaskMutation.mutateAsync({
        client_id: client.id,
        client_name: client.first_name,
        title: `📱 Mensagem Estruturada - ${client.first_name}`,
        description: `ANÁLISE PROFUNDA REALIZADA

✅ Score do Perfil: ${analysis.perfil_score}/100
📊 Probabilidade de Resposta: ${analysis.probabilidade_resposta}%
⏰ Melhor Momento: ${analysis.melhor_momento_envio}
🎯 Prioridade: ${analysis.prioridade_envio.toUpperCase()}

📝 MENSAGEM PRONTA PARA ENVIAR:
${analysis.mensagem_whatsapp}

🔍 GAPS CRÍTICOS:
${analysis.gaps_criticos.map((g, i) => `${i + 1}. ${g}`).join('\n')}

💡 ESTRATÉGIA:
${analysis.estrategia_fechamento}

📌 PONTOS-CHAVE:
${analysis.pontos_chave.map((p, i) => `• ${p}`).join('\n')}`,
        type: 'follow_up',
        priority: analysis.prioridade_envio === 'urgente' ? 'alta' : analysis.prioridade_envio === 'alta' ? 'alta' : 'media',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pendente',
        auto_created: true,
        assigned_to: user.email,
        assigned_to_name: user.full_name,
      });

      // Alerta de alta prioridade
      if (analysis.prioridade_envio === 'urgente' || analysis.prioridade_envio === 'alta') {
        await createAlertMutation.mutateAsync({
          user_email: user.email,
          title: `🚀 Mensagem Estruturada Pronta`,
          message: `${client.first_name}: ${analysis.probabilidade_resposta}% chance de resposta. Mensagem criada!`,
          type: 'high_score_lead',
          priority: 'alta',
          link_to: `ClientProfile?id=${client.id}`,
        });
      }

      return analysis;
    } catch (error) {
      console.error('Erro na análise profunda:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!clients.length || !user) return;

    const processAutomation = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const client of clients) {
        // ANÁLISE DIÁRIA: Todos os clientes ativos
        if (client.status !== 'perdido') {
          const lastAnalysis = client.health_score_updated ? parseISO(client.health_score_updated) : null;
          const daysSinceAnalysis = lastAnalysis ? differenceInDays(today, lastAnalysis) : 999;

          if (daysSinceAnalysis >= 1) {
            await runDailyAnalysis(client);
          }
        }

        // ANÁLISE PROFUNDA: A cada 3 dias
        if (client.status === 'quente' || client.status === 'morno') {
          const lastDeepAnalysis = client.competitor_analysis_date ? parseISO(client.competitor_analysis_date) : null;
          const daysSinceDeepAnalysis = lastDeepAnalysis ? differenceInDays(today, lastDeepAnalysis) : 999;

          if (daysSinceDeepAnalysis >= 3) {
            await runDeepAnalysis(client);
            await updateClientMutation.mutateAsync({
              id: client.id,
              data: {
                competitor_analysis_date: format(today, 'yyyy-MM-dd'),
                health_score_updated: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
              }
            });
          }
        }

        // Gatilho 1: Cliente quente sem contato há 3+ dias
        if (client.status === 'quente' && client.last_contact_date) {
          const lastContact = parseISO(client.last_contact_date);
          const daysSinceContact = differenceInDays(today, lastContact);

          if (daysSinceContact >= 3) {
            const existingTask = tasks.find(
              t => t.client_id === client.id && 
              t.type === 'follow_up' && 
              t.status === 'pendente' &&
              t.auto_created === true
            );

            if (!existingTask) {
              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: `Follow-up urgente - ${client.first_name}`,
                description: `Cliente QUENTE sem contato há ${daysSinceContact} dias. Fazer follow-up imediato!`,
                type: 'follow_up',
                priority: 'alta',
                due_date: format(today, 'yyyy-MM-dd'),
                status: 'pendente',
                auto_created: true,
                assigned_to: user.email,
                assigned_to_name: user.full_name,
              });

              await createAlertMutation.mutateAsync({
                user_email: user.email,
                title: `🔥 Cliente Quente Requer Atenção`,
                message: `${client.first_name} está quente mas sem contato há ${daysSinceContact} dias!`,
                type: 'high_score_lead',
                priority: 'alta',
                link_to: `ClientProfile?id=${client.id}`,
              });
            }
          }
        }

        // Gatilho 2: Cliente morno sem contato há 7+ dias
        if (client.status === 'morno' && client.last_contact_date) {
          const lastContact = parseISO(client.last_contact_date);
          const daysSinceContact = differenceInDays(today, lastContact);

          if (daysSinceContact >= 7) {
            const existingTask = tasks.find(
              t => t.client_id === client.id && 
              t.type === 'follow_up' && 
              t.status === 'pendente' &&
              t.auto_created === true
            );

            if (!existingTask) {
              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: `Follow-up - ${client.first_name}`,
                description: `Cliente morno sem contato há ${daysSinceContact} dias. Retomar contato.`,
                type: 'follow_up',
                priority: 'media',
                due_date: format(addDays(today, 1), 'yyyy-MM-dd'),
                status: 'pendente',
                auto_created: true,
                assigned_to: user.email,
                assigned_to_name: user.full_name,
              });
            }
          }
        }

        // Gatilho 3: Cliente frio há 30+ dias - tentar reengajamento
        if (client.status === 'frio' && client.last_contact_date) {
          const lastContact = parseISO(client.last_contact_date);
          const daysSinceContact = differenceInDays(today, lastContact);

          if (daysSinceContact >= 30 && daysSinceContact < 35) {
            const existingTask = tasks.find(
              t => t.client_id === client.id && 
              t.title.includes('Reengajamento') && 
              t.status === 'pendente' &&
              t.auto_created === true
            );

            if (!existingTask) {
              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: `Reengajamento - ${client.first_name}`,
                description: `Cliente frio há ${daysSinceContact} dias. Tentar nova abordagem ou campanha específica.`,
                type: 'follow_up',
                priority: 'baixa',
                due_date: format(addDays(today, 7), 'yyyy-MM-dd'),
                status: 'pendente',
                auto_created: true,
                assigned_to: user.email,
                assigned_to_name: user.full_name,
              });
            }
          }
        }

        // Gatilho 4: Próximo contato agendado chegou
        if (client.next_contact_date) {
          const nextContact = parseISO(client.next_contact_date);
          const daysUntilContact = differenceInDays(nextContact, today);

          if (daysUntilContact <= 0) {
            const existingAlert = alerts.find(
              a => a.link_to === `ClientProfile?id=${client.id}` &&
              a.type === 'high_score_lead' &&
              !a.dismissed
            );

            if (!existingAlert) {
              await createAlertMutation.mutateAsync({
                user_email: user.email,
                title: `📅 Follow-up Agendado Hoje`,
                message: `Hora de entrar em contato com ${client.first_name}!`,
                type: 'high_score_lead',
                priority: 'media',
                link_to: `ClientProfile?id=${client.id}`,
              });
            }
          }
        }

        // Gatilho 5: Score alto (80+) sem visita agendada
        if (client.purchase_score >= 80 && client.status === 'quente') {
          const hasScheduledVisit = tasks.some(
            t => t.client_id === client.id && 
            t.type === 'visita' && 
            t.status === 'pendente'
          );

          if (!hasScheduledVisit) {
            const existingTask = tasks.find(
              t => t.client_id === client.id && 
              t.title.includes('Agendar visita') && 
              t.status === 'pendente' &&
              t.auto_created === true
            );

            if (!existingTask) {
              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: `Agendar visita - ${client.first_name}`,
                description: `Cliente com score ${client.purchase_score} - alta probabilidade de fechamento. Agendar visita presencial!`,
                type: 'visita',
                priority: 'alta',
                due_date: format(today, 'yyyy-MM-dd'),
                status: 'pendente',
                auto_created: true,
                assigned_to: user.email,
                assigned_to_name: user.full_name,
              });

              await createAlertMutation.mutateAsync({
                user_email: user.email,
                title: `⭐ Oportunidade Premium`,
                message: `${client.first_name} tem score ${client.purchase_score}! Agende uma visita.`,
                type: 'high_score_lead',
                priority: 'alta',
                link_to: `ClientProfile?id=${client.id}`,
              });
            }
          }
        }

        // Gatilho 6: Deadline de decisão próximo (3 dias)
        if (client.decision_deadline) {
          const deadline = parseISO(client.decision_deadline);
          const daysUntilDeadline = differenceInDays(deadline, today);

          if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
            const existingAlert = alerts.find(
              a => a.link_to === `ClientProfile?id=${client.id}` &&
              a.title.includes('Deadline') &&
              !a.dismissed
            );

            if (!existingAlert) {
              await createAlertMutation.mutateAsync({
                user_email: user.email,
                title: `⏰ Deadline Próximo`,
                message: `${client.first_name} tem deadline em ${daysUntilDeadline} dias. Acelere o processo!`,
                type: 'high_score_lead',
                priority: 'alta',
                link_to: `ClientProfile?id=${client.id}`,
              });
            }
          }
        }

        // Gatilho 7: Sugestão de próximo contato baseado em status
        if (!client.next_contact_date && client.last_contact_date) {
          let suggestedDays = 7; // padrão
          if (client.status === 'quente') suggestedDays = 2;
          else if (client.status === 'morno') suggestedDays = 5;
          else if (client.status === 'frio') suggestedDays = 14;

          const suggestedDate = addDays(parseISO(client.last_contact_date), suggestedDays);
          
          await updateClientMutation.mutateAsync({
            id: client.id,
            data: {
              next_contact_date: format(suggestedDate, 'yyyy-MM-dd')
            }
          });
        }
      }
    };

    processAutomation();
  }, [clients, user, tasks, alerts]);

  return null; // Componente invisível que roda em background
}