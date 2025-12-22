import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function HealthScoreEngine() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-health'],
    queryFn: () => base44.entities.Client.list(),
    refetchInterval: 3600000 // 1 hora
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ['sales-health'],
    queryFn: () => base44.entities.Sale.list(),
    refetchInterval: 3600000
  });

  const { data: allInteractions = [] } = useQuery({
    queryKey: ['interactions-health'],
    queryFn: () => base44.entities.Interaction.list(),
    refetchInterval: 3600000
  });

  useEffect(() => {
    const calculateHealthScores = async () => {
      for (const client of clients) {
        const needsUpdate = !client.health_score_updated || 
          (new Date() - new Date(client.health_score_updated)) > 86400000; // 24h

        if (!needsUpdate) continue;

        try {
          // 1. Histórico de Compras (0-100)
          const clientSales = allSales.filter(s => s.client_id === client.id && s.status === 'fechada');
          const purchaseHistory = Math.min(100, clientSales.length * 25 + (clientSales.length > 0 ? 25 : 0));

          // 2. Nível de Engajamento (0-100)
          const clientInteractions = allInteractions.filter(i => i.client_id === client.id);
          const daysSinceLastVisit = client.last_visit_date 
            ? Math.floor((new Date() - new Date(client.last_visit_date)) / (1000 * 60 * 60 * 24))
            : 999;
          
          let engagementLevel = 0;
          engagementLevel += Math.min(40, (client.total_visits_count || 0) * 10);
          engagementLevel += Math.min(30, clientInteractions.length * 5);
          engagementLevel += daysSinceLastVisit < 7 ? 30 : daysSinceLastVisit < 30 ? 15 : 0;

          // 3. Status Weight (0-100)
          const statusWeight = client.status === 'quente' ? 90 : client.status === 'morno' ? 60 : 30;

          // 4. Análises IA (0-100)
          let aiAnalyses = 0;
          if (client.valor_real_poder_compra) aiAnalyses += 30;
          if (client.melhores_dias_venda?.length > 0) aiAnalyses += 25;
          if (client.competitor_analysis_date) aiAnalyses += 25;
          if (client.purchase_score >= 70) aiAnalyses += 20;

          // Calcular score final (média ponderada)
          const healthScore = Math.round(
            purchaseHistory * 0.25 +
            engagementLevel * 0.30 +
            statusWeight * 0.25 +
            aiAnalyses * 0.20
          );

          // Gerar explicação
          const explanation = `Score ${healthScore}: ${
            healthScore >= 80 ? 'Cliente engajado e com alto potencial' :
            healthScore >= 60 ? 'Relacionamento saudável, continuar nurturing' :
            healthScore >= 40 ? 'Precisa de mais atenção e follow-up' :
            'Risco de perder o cliente, ação urgente necessária'
          }. ${
            purchaseHistory >= 50 ? 'Histórico positivo de compras.' :
            'Ainda não realizou compras significativas.'
          } ${
            engagementLevel >= 70 ? 'Alto engajamento.' :
            engagementLevel >= 40 ? 'Engajamento moderado.' :
            'Baixo engajamento, aumentar contato.'
          }`;

          await base44.entities.Client.update(client.id, {
            health_score: healthScore,
            health_score_factors: {
              purchase_history: purchaseHistory,
              engagement_level: engagementLevel,
              status_weight: statusWeight,
              ai_analyses: aiAnalyses,
              explanation
            },
            health_score_updated: new Date().toISOString()
          });

        } catch (error) {
          console.error('Erro ao calcular health score:', error);
        }
      }
    };

    if (clients.length > 0) {
      calculateHealthScores();
    }
  }, [clients, allSales, allInteractions]);

  return null;
}