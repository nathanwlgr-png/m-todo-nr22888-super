import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Sistema de mensagens automáticas rodando em background
export default function AutoMessageSystem() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    refetchInterval: 300000, // 5 minutos
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 50),
    refetchInterval: 300000,
  });

  useEffect(() => {
    checkTriggers();
  }, [clients, interactions]);

  const checkTriggers = async () => {
    const now = new Date();

    for (const client of clients) {
      // Gatilho 1: Pós-visita (após 24h da última visita)
      if (client.last_visit_date) {
        const lastVisit = new Date(client.last_visit_date);
        const hoursSinceVisit = (now - lastVisit) / (1000 * 60 * 60);
        
        if (hoursSinceVisit >= 24 && hoursSinceVisit <= 26) {
          await sendPostVisitMessage(client);
        }
      }

      // Gatilho 2: Lembrete de proposta (cliente quente sem interação há 3 dias)
      if (client.status === 'quente') {
        const lastInteraction = interactions
          .filter(i => i.client_id === client.id)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

        if (lastInteraction) {
          const daysSinceInteraction = (now - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24);
          
          if (daysSinceInteraction >= 3 && daysSinceInteraction <= 3.5) {
            await sendProposalReminder(client);
          }
        }
      }

      // Gatilho 3: Cliente frio há muito tempo (30 dias sem contato)
      const lastInteraction = interactions
        .filter(i => i.client_id === client.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      if (lastInteraction) {
        const daysSinceInteraction = (now - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24);
        
        if (daysSinceInteraction >= 30 && daysSinceInteraction <= 31 && client.status === 'frio') {
          await sendReEngagementMessage(client);
        }
      }
    }
  };

  const sendPostVisitMessage = async (client) => {
    try {
      const user = await base44.auth.me();
      
      const prompt = `
Crie uma mensagem de follow-up pós-visita personalizada para o cliente.

DADOS DO CLIENTE:
- Nome: ${client.first_name || client.full_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Última visita: ${client.last_visit_date}

ESTILO DO VENDEDOR:
${user.communication_style || 'Profissional e amigável'}

INSTRUÇÕES:
- Agradeça pela reunião
- Pergunte se ficou alguma dúvida
- Ofereça-se para enviar informações adicionais
- Mantenha tom leve e profissional
- Máximo 3 parágrafos curtos

Gere a mensagem:
`;

      const message = await base44.integrations.Core.InvokeLLM({ prompt });

      // Enviar por email
      if (client.email) {
        await base44.integrations.Core.SendEmail({
          to: client.email,
          subject: `Obrigado pela reunião, ${client.first_name}!`,
          body: message
        });

        // Registrar interação
        await base44.entities.Interaction.create({
          client_id: client.id,
          client_name: client.first_name,
          type: 'email',
          direction: 'outbound',
          subject: 'Follow-up pós-visita',
          notes: 'Email automático enviado 24h após visita',
          outcome: 'positive'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem pós-visita:', error);
    }
  };

  const sendProposalReminder = async (client) => {
    try {
      const user = await base44.auth.me();
      
      const prompt = `
Crie uma mensagem de lembrete sobre proposta pendente.

CLIENTE: ${client.first_name}
STATUS: Cliente quente, sem contato há 3 dias

ESTILO: ${user.communication_style || 'Consultivo e empático'}

INSTRUÇÕES:
- Relembre sutilmente a proposta
- Ofereça ajuda com dúvidas
- Sugira um horário para conversar
- Seja amigável, não insistente
- 2-3 parágrafos

Mensagem:
`;

      const message = await base44.integrations.Core.InvokeLLM({ prompt });

      if (client.email) {
        await base44.integrations.Core.SendEmail({
          to: client.email,
          subject: `${client.first_name}, como posso ajudar?`,
          body: message
        });

        await base44.entities.Interaction.create({
          client_id: client.id,
          client_name: client.first_name,
          type: 'email',
          direction: 'outbound',
          subject: 'Lembrete de proposta',
          notes: 'Email automático - cliente quente sem contato há 3 dias'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  };

  const sendReEngagementMessage = async (client) => {
    try {
      const user = await base44.auth.me();
      
      const prompt = `
Crie uma mensagem de reengajamento para cliente frio.

CLIENTE: ${client.first_name}
Sem contato há 30 dias

OBJETIVO: Reativar relacionamento de forma leve

INSTRUÇÕES:
- Pergunte como estão as coisas
- Compartilhe algo de valor (novidade, dica)
- Não mencione venda diretamente
- Tom casual e amigável
- 2 parágrafos curtos

Mensagem:
`;

      const message = await base44.integrations.Core.InvokeLLM({ prompt });

      if (client.email) {
        await base44.integrations.Core.SendEmail({
          to: client.email,
          subject: `Olá ${client.first_name}, tudo bem?`,
          body: message
        });

        await base44.entities.Interaction.create({
          client_id: client.id,
          client_name: client.first_name,
          type: 'email',
          direction: 'outbound',
          subject: 'Reengajamento',
          notes: 'Email automático - tentativa de reativação após 30 dias'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar reengajamento:', error);
    }
  };

  return null; // Componente invisível, roda em background
}