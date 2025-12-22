import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const INACTIVITY_THRESHOLDS = {
  diagnosticar_necessidades: 7, // 7 dias sem contato
  apresentar_equipamento: 10,
  demonstracao_tecnica: 5,
  negociar_proposta: 3,
  fechar_venda: 2
};

export default function PipelineInactivityMonitor() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-pipeline-monitor'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    refetchInterval: 5 * 60 * 1000 // Recheck every 5 minutes
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-pipeline-monitor'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500),
    refetchInterval: 5 * 60 * 1000
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-pipeline-monitor'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
    refetchInterval: 5 * 60 * 1000
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-pipeline-monitor']);
      queryClient.invalidateQueries(['client-tasks']);
    }
  });

  useEffect(() => {
    checkInactivity();
  }, [clients, interactions, tasks]);

  const checkInactivity = async () => {
    const now = new Date();

    for (const client of clients) {
      // Pular se não estiver em uma etapa do pipeline
      if (!client.visit_objective) continue;

      // Pegar última interação do cliente
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      if (clientInteractions.length === 0) continue;

      const lastInteraction = clientInteractions[0];
      const lastInteractionDate = new Date(lastInteraction.created_date);
      const daysSinceLastInteraction = Math.floor((now - lastInteractionDate) / (1000 * 60 * 60 * 24));

      // Threshold para a etapa atual
      const threshold = INACTIVITY_THRESHOLDS[client.visit_objective] || 7;

      // Verificar se ultrapassou o threshold
      if (daysSinceLastInteraction >= threshold) {
        // Verificar se já existe tarefa de follow-up recente
        const recentFollowUpTask = tasks.find(t => 
          t.client_id === client.id && 
          t.type === 'follow_up' &&
          t.status === 'pendente' &&
          t.auto_created === true &&
          (now - new Date(t.created_date)) < (24 * 60 * 60 * 1000) // Criada nas últimas 24h
        );

        if (recentFollowUpTask) continue; // Já existe tarefa recente

        // Criar tarefa de follow-up com IA
        try {
          const prompt = `Cliente ${client.first_name} está ${daysSinceLastInteraction} dias sem contato na etapa "${client.visit_objective}".
          
PERFIL: ${client.behavioral_profile}
STATUS: ${client.status}
SCORE: ${client.purchase_score}%

Crie uma tarefa de follow-up estratégica. Retorne JSON:
{
  "title": "título acionável de 5-8 palavras",
  "description": "descrição detalhada do que fazer e como abordar (2-3 frases)",
  "priority": "alta" | "media" | "baixa"
}`;

          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" }
              }
            }
          });

          // Criar tarefa
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1); // Amanhã

          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: response.title,
            description: `${response.description}\n\n⚠️ Cliente inativo há ${daysSinceLastInteraction} dias na etapa "${client.visit_objective}".`,
            type: 'follow_up',
            priority: response.priority,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });

          console.log(`✓ Tarefa de inatividade criada para ${client.first_name}`);
        } catch (error) {
          console.error(`Erro ao criar tarefa para ${client.first_name}:`, error);
        }
      }
    }
  };

  // Componente invisível - apenas monitora em background
  return null;
}