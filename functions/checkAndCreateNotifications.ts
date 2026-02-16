import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = user.notification_settings || {};
    const notifications = [];

    // Buscar dados necessários
    const clients = await base44.asServiceRole.entities.Client.list();
    const goals = await base44.asServiceRole.entities.SalesGoal.list();
    const visits = await base44.asServiceRole.entities.Visit.list();
    const tasks = await base44.asServiceRole.entities.Task.list();
    const interactions = await base44.asServiceRole.entities.Interaction.list();
    const leads = await base44.asServiceRole.entities.Lead.list();
    const documents = await base44.asServiceRole.entities.DocumentEngagement.list();

    const now = new Date();

    // 1. METAS PRÓXIMAS DE SEREM ATINGIDAS
    if (settings.goal_near_completion !== false) {
      const threshold = settings.goal_near_completion_threshold || 90;
      for (const goal of goals) {
        if (goal.status === 'active') {
          const progress = (goal.current_value / goal.target_value) * 100;
          if (progress >= threshold && progress < 100) {
            notifications.push({
              user_email: user.email,
              title: '🎯 Meta Próxima de Ser Atingida!',
              message: `${goal.title} está ${progress.toFixed(0)}% completa. Falta pouco!`,
              type: 'goal_near_completion',
              priority: 'alta',
              link_to: `InteractiveDashboard`
            });
          }
        }
      }
    }

    // 2. METAS ATINGIDAS
    if (settings.goal_achieved !== false) {
      for (const goal of goals) {
        if (goal.status === 'active' && goal.current_value >= goal.target_value) {
          notifications.push({
            user_email: user.email,
            title: '🎉 Meta Atingida!',
            message: `Parabéns! Você completou: ${goal.title}`,
            type: 'goal_achieved',
            priority: 'alta',
            link_to: `InteractiveDashboard`
          });
        }
      }
    }

    // 3. CLIENTES QUENTES SEM CONTATO
    if (settings.hot_client_no_contact !== false) {
      const daysThreshold = settings.hot_client_days_threshold || 7;
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      for (const client of clients) {
        if (client.status === 'quente') {
          const clientInteractions = interactions.filter(i => i.client_id === client.id);
          const lastInteraction = clientInteractions.length > 0
            ? new Date(Math.max(...clientInteractions.map(i => new Date(i.created_date))))
            : null;

          if (!lastInteraction || lastInteraction < cutoffDate) {
            notifications.push({
              user_email: user.email,
              title: '🔥 Cliente Quente Sem Contato',
              message: `${client.first_name} está há ${daysThreshold}+ dias sem interação`,
              type: 'client_cold',
              priority: 'alta',
              link_to: `ClientProfile?id=${client.id}`
            });
          }
        }
      }
    }

    // 4. CLIENTES ESFRIANDO
    if (settings.client_becoming_cold !== false) {
      const daysThreshold = settings.cold_client_days_threshold || 30;
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      for (const client of clients) {
        if (client.status !== 'frio') {
          const clientInteractions = interactions.filter(i => i.client_id === client.id);
          const lastInteraction = clientInteractions.length > 0
            ? new Date(Math.max(...clientInteractions.map(i => new Date(i.created_date))))
            : null;

          if (!lastInteraction || lastInteraction < cutoffDate) {
            notifications.push({
              user_email: user.email,
              title: '❄️ Cliente Esfriando',
              message: `${client.first_name} sem contato há ${daysThreshold}+ dias`,
              type: 'lead_inactive',
              priority: 'media',
              link_to: `ClientProfile?id=${client.id}`
            });
          }
        }
      }
    }

    // 5. LEMBRETES DE VISITAS
    if (settings.visit_reminder !== false) {
      const hoursThreshold = settings.visit_reminder_hours || 24;
      const reminderDate = new Date(now);
      reminderDate.setHours(reminderDate.getHours() + hoursThreshold);

      for (const visit of visits) {
        if (visit.status === 'agendada') {
          const visitDate = new Date(visit.scheduled_date);
          if (visitDate > now && visitDate <= reminderDate) {
            const hoursUntil = Math.round((visitDate - now) / (1000 * 60 * 60));
            notifications.push({
              user_email: user.email,
              title: '📅 Visita Agendada Próxima',
              message: `Visita com ${visit.client_name} em ${hoursUntil}h`,
              type: 'visit_reminder',
              priority: 'alta',
              link_to: `ScheduledAgenda`
            });
          }
        }
      }
    }

    // 6. PROPOSTAS VISUALIZADAS
    if (settings.proposal_viewed !== false) {
      const recentViews = documents.filter(doc => {
        if (doc.document_type === 'proposta' && doc.last_viewed_at) {
          const viewDate = new Date(doc.last_viewed_at);
          const hoursSinceView = (now - viewDate) / (1000 * 60 * 60);
          return hoursSinceView < 1; // Última hora
        }
        return false;
      });

      for (const doc of recentViews) {
        notifications.push({
          user_email: user.email,
          title: '👀 Proposta Visualizada!',
          message: `${doc.client_name} visualizou a proposta agora`,
          type: 'proposal_viewed',
          priority: 'alta',
          link_to: `ClientProfile?id=${doc.client_id}`
        });
      }
    }

    // 7. TAREFAS ATRASADAS
    if (settings.task_overdue !== false) {
      const overdueTasks = tasks.filter(task => {
        if (task.status === 'pendente' && task.due_date) {
          return new Date(task.due_date) < now;
        }
        return false;
      });

      if (overdueTasks.length > 0) {
        notifications.push({
          user_email: user.email,
          title: '⚠️ Tarefas Atrasadas',
          message: `Você tem ${overdueTasks.length} tarefa(s) atrasada(s)`,
          type: 'task_overdue',
          priority: 'alta',
          link_to: `Tasks`
        });
      }
    }

    // 8. LEADS COM SCORE ALTO
    if (settings.lead_high_score !== false) {
      const scoreThreshold = settings.lead_high_score_threshold || 80;
      const highScoreLeads = leads.filter(lead => 
        lead.ai_score >= scoreThreshold && lead.stage === 'novo'
      );

      for (const lead of highScoreLeads) {
        notifications.push({
          user_email: user.email,
          title: '⭐ Lead Altamente Qualificado',
          message: `${lead.full_name} tem score de ${lead.ai_score}. Contate agora!`,
          type: 'high_score_lead',
          priority: 'alta',
          link_to: `LeadProfile?id=${lead.id}`
        });
      }
    }

    // Criar notificações únicas (evitar duplicatas)
    const existingAlerts = await base44.asServiceRole.entities.Alert.filter({
      user_email: user.email,
      dismissed: false
    });

    const newNotifications = notifications.filter(notif => {
      return !existingAlerts.some(alert => 
        alert.title === notif.title && 
        alert.message === notif.message &&
        !alert.read
      );
    });

    // Criar notificações
    for (const notif of newNotifications) {
      await base44.asServiceRole.entities.Alert.create(notif);
    }

    return Response.json({
      success: true,
      notifications_created: newNotifications.length,
      notifications: newNotifications
    });

  } catch (error) {
    console.error('Error checking notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});