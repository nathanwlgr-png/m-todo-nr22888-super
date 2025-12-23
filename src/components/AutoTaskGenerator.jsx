import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Auto Task Generator Component
 * Monitors client behaviors and auto-generates tasks
 * Runs in background on Home page
 */
export default function AutoTaskGenerator() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    refetchInterval: 300000, // Check every 5 minutes
    staleTime: 240000
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['all-followup-logs'],
    queryFn: () => base44.entities.FollowUpLog.list('-sent_date', 200),
    refetchInterval: 300000,
    staleTime: 240000
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500)
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries(['all-tasks', 'tasks'])
  });

  useEffect(() => {
    if (clients.length === 0 || followupLogs.length === 0) return;

    const checkBehaviors = async () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      for (const client of clients) {
        // Skip if already has pending task
        const hasPendingTask = tasks.some(
          t => t.client_id === client.id && t.status === 'pendente'
        );
        if (hasPendingTask) continue;

        // BEHAVIOR 1: Email sent but no response after 3 days
        const recentLogs = followupLogs.filter(
          log => log.client_id === client.id && 
                 new Date(log.sent_date) > threeDaysAgo &&
                 log.status === 'sent'
        );

        if (recentLogs.length > 0 && !client.last_visit_date) {
          // Check if task already created
          const taskExists = tasks.some(
            t => t.client_id === client.id && 
                 t.title.includes('Follow-up') &&
                 t.auto_created
          );

          if (!taskExists) {
            // Generate AI-powered task
            try {
              const aiSuggestion = await base44.integrations.Core.InvokeLLM({
                prompt: `Cliente ${client.first_name} recebeu follow-up há 3 dias mas não respondeu.
                
Perfil: ${client.numerology_number} - ${client.behavioral_profile}
Status: ${client.status}
Tipo: ${client.client_type}

Sugira UMA ação específica (ligação, WhatsApp, visita, ou email) adaptada ao perfil numerológico.
Formato: [TIPO] - [Título curto] | Descrição em 1 linha

Exemplo: ligacao - Ligar para checar dúvidas | Perfil analítico, precisa de mais informações técnicas`
              });

              const [type, rest] = aiSuggestion.split(' - ');
              const [title, description] = rest?.split(' | ') || ['Follow-up', 'Entrar em contato'];

              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: title?.trim() || 'Follow-up necessário',
                description: description?.trim() || 'Cliente não respondeu aos últimos contatos',
                type: type?.trim() || 'follow_up',
                priority: client.status === 'quente' ? 'alta' : 'media',
                due_date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
                status: 'pendente',
                auto_created: true
              });

              console.log(`✅ Auto-created task for ${client.first_name}`);
            } catch (error) {
              console.error('Error creating auto-task:', error);
            }
          }
        }

        // BEHAVIOR 2: Status dropped to "frio"
        if (client.status === 'frio' && client.purchase_score < 40) {
          const reengageTaskExists = tasks.some(
            t => t.client_id === client.id && 
                 t.title.includes('Reengajar') &&
                 t.auto_created
          );

          if (!reengageTaskExists) {
            await createTaskMutation.mutateAsync({
              client_id: client.id,
              client_name: client.first_name,
              title: 'Reengajar cliente frio',
              description: `Cliente esfriou (score: ${client.purchase_score}%). Perfil ${client.numerology_number}: ${client.behavioral_profile}`,
              type: 'ligacao',
              priority: 'alta',
              due_date: new Date().toISOString().split('T')[0],
              status: 'pendente',
              auto_created: true
            });
          }
        }

        // BEHAVIOR 3: High score but no recent visit
        const daysSinceLastVisit = client.last_visit_date 
          ? Math.floor((today - new Date(client.last_visit_date)) / (1000 * 60 * 60 * 24))
          : 999;

        if (client.purchase_score > 70 && daysSinceLastVisit > 14) {
          const visitTaskExists = tasks.some(
            t => t.client_id === client.id && 
                 t.type === 'visita' &&
                 t.status === 'pendente'
          );

          if (!visitTaskExists) {
            await createTaskMutation.mutateAsync({
              client_id: client.id,
              client_name: client.first_name,
              title: 'Agendar visita de fechamento',
              description: `Score alto (${client.purchase_score}%) mas sem visita há ${daysSinceLastVisit} dias. Momento ideal para fechar!`,
              type: 'visita',
              priority: 'alta',
              due_date: new Date(today.setDate(today.getDate() + 2)).toISOString().split('T')[0],
              status: 'pendente',
              auto_created: true
            });
          }
        }
      }
    };

    checkBehaviors();
  }, [clients, followupLogs, tasks]);

  return null; // Silent background component
}