import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ClientScoringEngine() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-scoring'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    refetchInterval: 60000, // 1 minuto
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-scoring'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500),
    refetchInterval: 60000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-scoring'],
    queryFn: () => base44.entities.Task.list('-updated_date', 500),
    refetchInterval: 60000,
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['followup-logs-scoring'],
    queryFn: () => base44.entities.FollowUpLog.list('-sent_date', 500),
    refetchInterval: 60000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-scoring'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client']);
    }
  });

  const calculateClientScore = (client) => {
    let score = 0;
    const now = new Date();
    const clientId = client.id;

    // 1. VENDAS FECHADAS (+40 pontos) - Cliente já comprou
    const clientSales = sales.filter(s => s.client_id === clientId && (s.status === 'fechada' || s.status === 'entregue'));
    if (clientSales.length > 0) {
      score += 40; // Cliente que já comprou vale muito
    }

    // 2. VISITAS RECENTES (+25 pontos)
    const clientVisits = visits.filter(v => v.client_id === clientId);
    const recentVisits = clientVisits.filter(v => {
      const visitDate = new Date(v.scheduled_date);
      const daysDiff = (now - visitDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // Últimos 30 dias
    });
    score += Math.min(recentVisits.length * 8, 25); // Máximo 25 pontos

    // 3. TAREFAS ATIVAS (+15 pontos)
    const activeTasks = tasks.filter(t => t.client_id === clientId && t.status === 'pendente');
    score += Math.min(activeTasks.length * 5, 15); // Máximo 15 pontos

    // 4. FOLLOW-UPS RECENTES (+15 pontos)
    const clientFollowups = followupLogs.filter(f => f.client_id === clientId);
    const recentFollowups = clientFollowups.filter(f => {
      const followupDate = new Date(f.sent_date);
      const daysDiff = (now - followupDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 15; // Últimos 15 dias
    });
    score += Math.min(recentFollowups.length * 5, 15); // Máximo 15 pontos

    // 5. DORES IDENTIFICADAS (+10 pontos)
    if (client.main_pains && client.main_pains.length > 0) {
      score += Math.min(client.main_pains.length * 3, 10);
    }

    // 6. GATILHOS USADOS (+10 pontos)
    if (client.triggers_used && client.triggers_used.length > 0) {
      score += Math.min(client.triggers_used.length * 3, 10);
    }

    // 7. TEMPO SEM CONTATO (PENALIDADE -30 pontos)
    const lastVisitDate = client.last_visit_date ? new Date(client.last_visit_date) : null;
    if (lastVisitDate) {
      const daysSinceLastContact = (now - lastVisitDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastContact > 60) {
        score -= 30; // Mais de 2 meses sem contato
      } else if (daysSinceLastContact > 30) {
        score -= 15; // Mais de 1 mês sem contato
      }
    } else {
      // Nunca teve visita
      const daysSinceCreated = (now - new Date(client.created_date)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated > 15) {
        score -= 20; // Criado há mais de 15 dias e nunca teve visita
      }
    }

    // 8. PROPOSTA ENVIADA (+20 pontos)
    if (client.notes?.toLowerCase().includes('proposta') || 
        client.notes?.toLowerCase().includes('orçamento')) {
      score += 20;
    }

    // 9. URGÊNCIA/INTERESSE (+15 pontos)
    if (client.visit_objective === 'fechar_venda' || client.visit_objective === 'negociar_proposta') {
      score += 15;
    }

    // 10. RECEITA PROJETADA (+5-15 pontos)
    if (client.projected_revenue) {
      if (client.projected_revenue > 100000) score += 15;
      else if (client.projected_revenue > 50000) score += 10;
      else score += 5;
    }

    // Normalizar score entre 0-100
    score = Math.max(0, Math.min(100, score));

    return score;
  };

  const getStatusFromScore = (score) => {
    if (score >= 70) return 'quente'; // 70-100: Quente
    if (score >= 40) return 'morno';  // 40-69: Morno
    return 'frio';                     // 0-39: Frio
  };

  useEffect(() => {
    if (!clients.length) return;

    // Processar apenas clientes que precisam de atualização
    clients.forEach(async (client) => {
      try {
        const newScore = calculateClientScore(client);
        const newStatus = getStatusFromScore(newScore);

        // Atualizar apenas se mudou significativamente (diferença > 5 pontos ou status mudou)
        const scoreDiff = Math.abs((client.purchase_score || 50) - newScore);
        if (scoreDiff > 5 || client.status !== newStatus) {
          await updateMutation.mutateAsync({
            id: client.id,
            data: {
              purchase_score: newScore,
              status: newStatus
            }
          });
        }
      } catch (error) {
        console.log('Scoring error for client:', client.id);
      }
    });
  }, [clients, visits, tasks, followupLogs, sales]);

  return null; // Background component
}