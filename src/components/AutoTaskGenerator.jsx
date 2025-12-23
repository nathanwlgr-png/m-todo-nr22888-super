import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Auto Task Generator Component (Enhanced)
 * - Monitors client behaviors and auto-generates tasks
 * - Tracks engagement score based on interactions
 * - Implements cooldown buffer to prevent duplicate tasks
 * - Runs in background on Home page
 */

// Task creation cooldown: 48h per client per behavior type
const TASK_COOLDOWN_HOURS = 48;

// Engagement scoring weights
const ENGAGEMENT_WEIGHTS = {
  proposal_view: 15,
  proposal_download: 25,
  table_download: 20,
  email_open: 10,
  whatsapp_response: 30,
  visit_scheduled: 25,
  document_request: 15,
  phone_call: 20
};

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

  const { data: interactions = [] } = useQuery({
    queryKey: ['all-interactions'],
    queryFn: () => base44.entities.Interaction.list('-interaction_date', 500),
    refetchInterval: 300000,
    staleTime: 240000
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => base44.entities.ClientDocument.list('-created_date', 500),
    refetchInterval: 300000,
    staleTime: 240000
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries(['all-tasks', 'tasks'])
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  // Helper: Check if task was recently created (cooldown)
  const hasRecentTask = (clientId, behaviorType) => {
    const cooldownTime = new Date(Date.now() - TASK_COOLDOWN_HOURS * 60 * 60 * 1000);
    return tasks.some(
      t => t.client_id === clientId && 
           t.auto_created && 
           (t.description?.includes(behaviorType) || t.title.includes(behaviorType)) &&
           new Date(t.created_date) > cooldownTime
    );
  };

  // Helper: Calculate engagement score
  const calculateEngagementScore = (clientId) => {
    let score = 0;
    const recentInteractions = interactions.filter(
      i => i.client_id === clientId && 
           new Date(i.interaction_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    recentInteractions.forEach(interaction => {
      const type = interaction.interaction_type?.toLowerCase() || '';
      if (type.includes('proposta') && type.includes('visualiz')) score += ENGAGEMENT_WEIGHTS.proposal_view;
      if (type.includes('proposta') && type.includes('download')) score += ENGAGEMENT_WEIGHTS.proposal_download;
      if (type.includes('tabela') && type.includes('download')) score += ENGAGEMENT_WEIGHTS.table_download;
      if (type.includes('email') && type.includes('abr')) score += ENGAGEMENT_WEIGHTS.email_open;
      if (type.includes('whatsapp') && type.includes('respond')) score += ENGAGEMENT_WEIGHTS.whatsapp_response;
      if (type.includes('visita') && type.includes('agend')) score += ENGAGEMENT_WEIGHTS.visit_scheduled;
      if (type.includes('documento') && type.includes('solic')) score += ENGAGEMENT_WEIGHTS.document_request;
      if (type.includes('ligação') || type.includes('telefone')) score += ENGAGEMENT_WEIGHTS.phone_call;
    });

    return Math.min(score, 100); // Cap at 100
  };

  useEffect(() => {
    if (clients.length === 0) return;

    // Executar análise a cada 10 minutos
    const checkBehaviors = async () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      for (const client of clients) {
        // Calculate and update engagement score
        const engagementScore = calculateEngagementScore(client.id);
        if (engagementScore > 0 && client.engagement_score !== engagementScore) {
          await updateClientMutation.mutateAsync({
            id: client.id,
            data: { engagement_score: engagementScore }
          });
        }

        // Skip if already has 3+ pending tasks (prevent overload)
        const pendingTaskCount = tasks.filter(
          t => t.client_id === client.id && t.status === 'pendente'
        ).length;
        if (pendingTaskCount >= 3) continue;

        // BEHAVIOR 1: Email sent but no response after 3 days
        if (followupLogs.length > 0) {
          const recentLogs = followupLogs.filter(
            log => log.client_id === client.id && 
                   new Date(log.sent_date) > threeDaysAgo &&
                   log.status === 'sent'
          );

          if (recentLogs.length > 0 && !hasRecentTask(client.id, 'Follow-up')) {
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

              const priority = engagementScore > 60 ? 'alta' : client.status === 'quente' ? 'alta' : 'media';

              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: task.title,
                description: `${task.description} | Engagement: ${engagementScore}% | Perfil: ${client.numerology_number || 'N/A'}`,
                type: task.type,
                priority,
                due_date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
                status: 'pendente',
                auto_created: true
              });

              console.log(`✅ Auto-created follow-up task for ${client.first_name} (engagement: ${engagementScore}%)`);
            } catch (error) {
              console.error('Error creating auto-task:', error);
            }
          }
        }

        // BEHAVIOR 2: Status dropped to "frio"
        if (client.status === 'frio' && client.purchase_score < 40 && !hasRecentTask(client.id, 'Reengajar')) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Reengajar cliente frio',
            description: `Cliente esfriou (score: ${client.purchase_score}%, engagement: ${engagementScore}%). Perfil ${client.numerology_number}: ${client.behavioral_profile}`,
            type: 'ligacao',
            priority: 'alta',
            due_date: new Date().toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
        }

        // BEHAVIOR 3: High score but no recent visit
        const daysSinceLastVisit = client.last_visit_date 
          ? Math.floor((today - new Date(client.last_visit_date)) / (1000 * 60 * 60 * 24))
          : 999;

        if (client.purchase_score > 70 && daysSinceLastVisit > 14 && !hasRecentTask(client.id, 'visita')) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Agendar visita de fechamento',
            description: `Score alto (${client.purchase_score}%, engagement: ${engagementScore}%) mas sem visita há ${daysSinceLastVisit} dias. Momento ideal!`,
            type: 'visita',
            priority: 'alta',
            due_date: new Date(today.setDate(today.getDate() + 2)).toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
        }

        // BEHAVIOR 4: Viewed proposal but no follow-up
        const clientDocs = documents.filter(d => d.client_id === client.id && d.type === 'proposta');
        const recentProposalViews = interactions.filter(
          i => i.client_id === client.id && 
               i.interaction_type?.toLowerCase().includes('proposta') &&
               new Date(i.interaction_date) > threeDaysAgo
        );

        if (clientDocs.length > 0 && recentProposalViews.length > 0 && !hasRecentTask(client.id, 'proposta')) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Cliente visualizou proposta - Follow-up urgente',
            description: `Cliente demonstrou interesse (visualizou proposta há ${Math.floor((today - new Date(recentProposalViews[0].interaction_date)) / (1000 * 60 * 60 * 24))} dias). Engagement: ${engagementScore}%`,
            type: 'ligacao',
            priority: 'alta',
            due_date: new Date().toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
        }

        // BEHAVIOR 5: High engagement but no action
        if (engagementScore > 70 && !client.last_visit_date && !hasRecentTask(client.id, 'engagement')) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Cliente altamente engajado - Agendar reunião',
            description: `Engagement score: ${engagementScore}%. Cliente está ativo mas precisa de próximo passo estratégico.`,
            type: 'visita',
            priority: 'alta',
            due_date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
        }

        // BEHAVIOR 6: Downloaded financial table but no contact
        const tableDownloads = interactions.filter(
          i => i.client_id === client.id &&
               i.interaction_type?.toLowerCase().includes('tabela') &&
               new Date(i.interaction_date) > sevenDaysAgo
        );

        if (tableDownloads.length > 0 && !hasRecentTask(client.id, 'tabela')) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Cliente baixou simulação financeira - Validar viabilidade',
            description: `Cliente está analisando investimento (${tableDownloads.length}x). Momento para esclarecer dúvidas financeiras. Engagement: ${engagementScore}%`,
            type: 'ligacao',
            priority: client.status === 'quente' ? 'alta' : 'media',
            due_date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
        }
      }
    };

    // Executar apenas 1x ao carregar, depois desabilitar automático
    // checkBehaviors();
    
    // DESABILITADO: Evitar rate limit. Usuário pode acionar manualmente se necessário
  }, [clients, followupLogs, tasks, interactions, documents]);

  return null; // Silent background component
}