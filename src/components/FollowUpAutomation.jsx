import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export default function FollowUpAutomation() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-automation'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    refetchInterval: 60000, // Verifica a cada minuto
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-automation'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-automation'],
    queryFn: () => base44.entities.Alert.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-automation']);
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
  });

  useEffect(() => {
    if (!clients.length || !user) return;

    const processAutomation = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const client of clients) {
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