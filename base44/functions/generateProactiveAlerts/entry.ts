import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar dados do CRM
    const [clients, interactions, tasks, coachingSessions, sales, churnRisks] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 200),
      base44.asServiceRole.entities.Interaction.list('-created_date', 500),
      base44.asServiceRole.entities.Task.list('-due_date', 200),
      base44.asServiceRole.entities.CoachingSession.list('-created_date', 50),
      base44.asServiceRole.entities.Sale.list('-created_date', 100),
      base44.asServiceRole.entities.ClientScore.list()
    ]);

    const now = new Date();
    const alerts = [];

    // Análise 1: Clientes em risco de churn sem contato
    for (const client of clients.filter(c => c.status !== 'perdido')) {
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      const lastInteraction = clientInteractions[0];
      
      const daysSinceContact = lastInteraction 
        ? Math.floor((now - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;
      
      const clientScore = churnRisks.find(cr => cr.client_id === client.id);
      const churnRisk = clientScore?.churn_risk || 0;

      // Cliente quente sem contato há mais de 7 dias
      if (client.status === 'quente' && daysSinceContact > 7) {
        alerts.push({
          type: 'churn_risk',
          priority: 'high',
          client_id: client.id,
          client_name: client.first_name || client.clinic_name,
          title: `🔥 Cliente Quente Esfriando: ${client.first_name}`,
          message: `Sem contato há ${daysSinceContact} dias. Score: ${client.purchase_score}%. Risco de perder!`,
          action_needed: 'Contato urgente necessário',
          recommended_actions: [
            'Ligar imediatamente',
            'Enviar proposta personalizada',
            'Agendar visita presencial'
          ],
          days_since_contact: daysSinceContact,
          urgency_score: 95
        });
      }

      // Alto risco de churn
      if (churnRisk > 60 && daysSinceContact > 14) {
        alerts.push({
          type: 'churn_critical',
          priority: 'critical',
          client_id: client.id,
          client_name: client.first_name || client.clinic_name,
          title: `⚠️ RISCO CRÍTICO: ${client.first_name}`,
          message: `Churn risk ${churnRisk}%, ${daysSinceContact} dias sem contato. Cliente em risco iminente!`,
          action_needed: 'AÇÃO IMEDIATA NECESSÁRIA',
          recommended_actions: [
            'Reunião de emergência',
            'Oferta especial personalizada',
            'Contato do gerente comercial'
          ],
          days_since_contact: daysSinceContact,
          urgency_score: 100
        });
      }

      // Cliente com alta pontuação mas sem proposta
      if (client.purchase_score >= 70 && client.pipeline_stage === 'qualificado') {
        const hasProposal = interactions.some(i => 
          i.client_id === client.id && 
          (i.type === 'proposal_sent' || i.subject?.toLowerCase().includes('proposta'))
        );
        
        if (!hasProposal) {
          alerts.push({
            type: 'hot_opportunity',
            priority: 'high',
            client_id: client.id,
            client_name: client.first_name || client.clinic_name,
            title: `💎 Oportunidade Quente: ${client.first_name}`,
            message: `Score ${client.purchase_score}%, qualificado mas SEM PROPOSTA enviada. Momento de agir!`,
            action_needed: 'Enviar proposta personalizada',
            recommended_actions: [
              'Gerar proposta com IA',
              'Incluir cases de sucesso',
              'Agendar apresentação'
            ],
            urgency_score: 85
          });
        }
      }
    }

    // Análise 2: Tarefas atrasadas críticas
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status !== 'pendente') return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now;
    });

    for (const task of overdueTasks.slice(0, 5)) {
      const daysOverdue = Math.floor((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24));
      
      if (task.priority === 'alta') {
        alerts.push({
          type: 'overdue_task',
          priority: 'high',
          client_id: task.client_id,
          client_name: task.client_name,
          title: `📅 Tarefa Crítica Atrasada: ${task.client_name}`,
          message: `"${task.title}" atrasada há ${daysOverdue} dias. Prioridade ALTA.`,
          action_needed: 'Executar tarefa agora',
          task_id: task.id,
          urgency_score: 80
        });
      }
    }

    // Análise 3: Deals quentes próximos de fechar
    const hotDeals = clients.filter(c => 
      c.pipeline_stage === 'negociacao' && 
      c.purchase_score >= 75
    );

    for (const deal of hotDeals) {
      const lastContact = interactions.filter(i => i.client_id === deal.id)[0];
      const daysSinceContact = lastContact
        ? Math.floor((now - new Date(lastContact.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceContact > 3) {
        alerts.push({
          type: 'hot_deal',
          priority: 'high',
          client_id: deal.id,
          client_name: deal.first_name || deal.clinic_name,
          title: `🎯 Deal Quente Parado: ${deal.first_name}`,
          message: `Em negociação, score ${deal.purchase_score}%, mas ${daysSinceContact} dias sem contato. Fechar AGORA!`,
          action_needed: 'Follow-up de fechamento',
          recommended_actions: [
            'Ligação de fechamento',
            'Criar senso de urgência',
            'Oferecer incentivo de fechamento'
          ],
          urgency_score: 90
        });
      }
    }

    // Análise 4: Performance de Coaching
    const recentCoaching = coachingSessions.filter(c => {
      const sessionDate = new Date(c.created_date);
      const daysSince = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    });

    const avgScore = recentCoaching.reduce((sum, c) => sum + (c.overall_score || 0), 0) / Math.max(recentCoaching.length, 1);

    if (avgScore < 60 && recentCoaching.length >= 2) {
      alerts.push({
        type: 'coaching_alert',
        priority: 'medium',
        title: `📊 Performance em Queda`,
        message: `Score médio de coaching: ${avgScore.toFixed(0)}/100. Necessário treinamento adicional.`,
        action_needed: 'Revisar técnicas de vendas',
        recommended_actions: [
          'Fazer role-play focado em objeções',
          'Revisar playbook de vendas',
          'Solicitar coaching 1-on-1'
        ],
        urgency_score: 60
      });
    }

    // Análise 5: Vendas recentes para follow-up pós-venda
    const recentSales = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      const daysSince = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
      return daysSince >= 7 && daysSince <= 10 && s.status === 'fechada';
    });

    for (const sale of recentSales.slice(0, 3)) {
      const postSaleInteraction = interactions.find(i => 
        i.client_id === sale.client_id && 
        new Date(i.created_date) > new Date(sale.sale_date)
      );

      if (!postSaleInteraction) {
        alerts.push({
          type: 'post_sale',
          priority: 'medium',
          client_id: sale.client_id,
          client_name: sale.client_name,
          title: `🤝 Follow-up Pós-Venda: ${sale.client_name}`,
          message: `Venda fechada há 7-10 dias. Momento ideal para garantir satisfação e upsell.`,
          action_needed: 'Contato pós-venda',
          recommended_actions: [
            'Verificar satisfação com equipamento',
            'Oferecer treinamento adicional',
            'Sugerir produtos complementares'
          ],
          urgency_score: 55
        });
      }
    }

    // Usar IA para priorizar e enriquecer alertas
    if (alerts.length > 0) {
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de alertas inteligente de CRM. Analise estes ${alerts.length} alertas e:

1. Priorize os 10 mais críticos
2. Adicione insights contextuais
3. Sugira timing ideal de ação

ALERTAS:
${alerts.map((a, i) => `${i + 1}. [${a.priority}] ${a.title}: ${a.message}`).join('\n')}

Retorne JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            top_priorities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alert_index: { type: "number" },
                  ai_insight: { type: "string" },
                  best_time_to_act: { type: "string" },
                  expected_outcome: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Enriquecer alertas com insights IA
      for (const priority of aiAnalysis.top_priorities.slice(0, 10)) {
        if (alerts[priority.alert_index]) {
          alerts[priority.alert_index].ai_insight = priority.ai_insight;
          alerts[priority.alert_index].best_time_to_act = priority.best_time_to_act;
          alerts[priority.alert_index].expected_outcome = priority.expected_outcome;
        }
      }
    }

    // Ordenar por urgência
    alerts.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));

    // Salvar top alertas no banco
    const topAlerts = alerts.slice(0, 15);
    for (const alert of topAlerts) {
      try {
        await base44.asServiceRole.entities.Alert.create({
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          client_id: alert.client_id,
          client_name: alert.client_name,
          action_needed: alert.action_needed,
          recommended_actions: alert.recommended_actions || [],
          metadata: {
            urgency_score: alert.urgency_score,
            ai_insight: alert.ai_insight,
            best_time_to_act: alert.best_time_to_act,
            expected_outcome: alert.expected_outcome,
            days_since_contact: alert.days_since_contact
          },
          is_read: false,
          created_by: user.email
        });
      } catch (error) {
        console.error('Erro ao salvar alerta:', error);
      }
    }

    return Response.json({
      success: true,
      alerts_generated: topAlerts.length,
      critical_count: topAlerts.filter(a => a.priority === 'critical').length,
      high_count: topAlerts.filter(a => a.priority === 'high').length,
      alerts: topAlerts
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});