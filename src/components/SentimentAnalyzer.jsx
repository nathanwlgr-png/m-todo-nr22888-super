import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SentimentAnalyzer() {
  const queryClient = useQueryClient();

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-recent'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 20),
    refetchInterval: 300000, // 5 minutos
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  useEffect(() => {
    analyzeRecentInteractions();
  }, [interactions]);

  const analyzeRecentInteractions = async () => {
    for (const interaction of interactions) {
      // Analisar apenas interações inbound recentes que ainda não foram analisadas
      if (
        interaction.direction === 'inbound' && 
        !interaction.sentiment_analyzed &&
        interaction.notes
      ) {
        await analyzeSentiment(interaction);
      }
    }
  };

  const analyzeSentiment = async (interaction) => {
    try {
      const prompt = `
Analise o sentimento e tom da seguinte mensagem de cliente:

MENSAGEM:
"${interaction.notes}"

CONTEXTO:
- Cliente: ${interaction.client_name}
- Tipo: ${interaction.type}
- Resultado: ${interaction.outcome || 'não definido'}

Retorne APENAS um JSON no seguinte formato:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0-100,
  "urgency": "low" | "medium" | "high",
  "keywords": [lista de palavras-chave relevantes],
  "summary": "resumo em 1 frase",
  "action_needed": true/false,
  "recommended_action": "ação sugerida se action_needed=true"
}
`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            confidence: { type: "number" },
            urgency: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            action_needed: { type: "boolean" },
            recommended_action: { type: "string" }
          }
        }
      });

      // Atualizar a interação com análise de sentimento
      await base44.entities.Interaction.update(interaction.id, {
        sentiment_analyzed: true,
        sentiment: analysis.sentiment,
        sentiment_confidence: analysis.confidence,
        sentiment_summary: analysis.summary
      });

      // Se for negativo ou ação necessária, criar alerta
      if (analysis.sentiment === 'negative' || (analysis.action_needed && analysis.urgency === 'high')) {
        const user = await base44.auth.me();
        
        await createAlertMutation.mutateAsync({
          user_email: interaction.created_by || user.email,
          title: analysis.sentiment === 'negative' 
            ? `⚠️ Sentimento negativo: ${interaction.client_name}`
            : `🔔 Ação urgente: ${interaction.client_name}`,
          message: `${analysis.summary}\n\nAção recomendada: ${analysis.recommended_action}`,
          type: 'client_cold',
          priority: analysis.urgency === 'high' ? 'alta' : 'media',
          link_to: `ClientProfile?id=${interaction.client_id}`
        });

        toast.warning(`Alerta criado para ${interaction.client_name}`, {
          description: analysis.summary
        });
      }

      // Se for muito positivo, criar alerta de oportunidade
      if (analysis.sentiment === 'positive' && analysis.confidence > 80) {
        const user = await base44.auth.me();
        
        await createAlertMutation.mutateAsync({
          user_email: interaction.created_by || user.email,
          title: `✨ Oportunidade: ${interaction.client_name}`,
          message: `Cliente demonstrou interesse positivo!\n\n${analysis.summary}\n\nAção: ${analysis.recommended_action || 'Aproveitar momento para avançar negociação'}`,
          type: 'high_score_lead',
          priority: 'alta',
          link_to: `ClientProfile?id=${interaction.client_id}`
        });
      }

    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
    }
  };

  return null; // Componente invisível
}