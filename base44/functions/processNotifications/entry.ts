import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const notifications = [];

    // Fetch all necessary data
    const [clients, leads, visits, tasks, goals, interactions, documentEngagements] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Visit.list(),
      base44.asServiceRole.entities.Task.list(),
      base44.asServiceRole.entities.SalesGoal.list(),
      base44.asServiceRole.entities.Interaction.list(),
      base44.asServiceRole.entities.DocumentEngagement.list()
    ]);

    const now = new Date();

    // Get user preferences (in real scenario, would fetch from user settings)
    const userEmail = user.email;

    // 1. Check goals achieved or near deadline
    for (const goal of goals.filter(g => g.status === 'active')) {
      const progress = (goal.current_value / goal.target_value) * 100;
      
      // Goal achieved
      if (progress >= 100) {
        const existingAlert = await base44.asServiceRole.entities.Alert.filter({
          user_email: userEmail,
          type: 'goal_achieved',
          message: { $regex: goal.title }
        });

        if (existingAlert.length === 0) {
          notifications.push({
            user_email: userEmail,
            title: '🎉 Meta Atingida!',
            message: `Parabéns! Você completou a meta: ${goal.title}`,
            type: 'goal_achieved',
            priority: 'alta',
            link_to: `Goals`,
            read: false,
            dismissed: false
          });
        }
      }

      // Goal near deadline (3 days or less)
      const daysUntilDeadline = Math.ceil((new Date(goal.end_date) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 3 && daysUntilDeadline > 0 && progress < 100) {
        const existingAlert = await base44.asServiceRole.entities.Alert.filter({
          user_email: userEmail,
          type: 'goal_near_deadline',
          message: { $regex: goal.title },
          created_date: { $gte: new Date(Date.now() - 86400000).toISOString() } // Last 24h
        });

        if (existingAlert.length === 0) {
          notifications.push({
            user_email: userEmail,
            title: '⏰ Meta Próxima do Prazo',
            message: `Meta "${goal.title}" vence em ${daysUntilDeadline} dias. Progresso: ${progress.toFixed(0)}%`,
            type: 'goal_near_deadline',
            priority: 'alta',
            link_to: `Goals`,
            read: false,
            dismissed: false
          });
        }
      }
    }

    // 2. Hot clients without contact
    const hotClients = clients.filter(c => c.status === 'quente');
    for (const client of hotClients) {
      const clientInteractions = interactions
        .filter(i => i.client_id === client.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      if (clientInteractions.length > 0) {
        const lastInteraction = new Date(clientInteractions[0].created_date);
        const daysSinceContact = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));

        if (daysSinceContact >= 7) {
          const existingAlert = await base44.asServiceRole.entities.Alert.filter({
            user_email: userEmail,
            type: 'hot_client_inactive',
            message: { $regex: client.first_name },
            created_date: { $gte: new Date(Date.now() - 86400000 * 2).toISOString() }
          });

          if (existingAlert.length === 0) {
            notifications.push({
              user_email: userEmail,
              title: '🔥 Cliente Quente sem Contato',
              message: `${client.first_name} (${client.clinic_name || 'Sem clínica'}) - ${daysSinceContact} dias sem interação`,
              type: 'hot_client_inactive',
              priority: 'alta',
              link_to: `ClientProfile?id=${client.id}`,
              read: false,
              dismissed: false
            });
          }
        }
      }
    }

    // 3. Visit reminders (24 hours before)
    const upcomingVisits = visits.filter(v => {
      if (v.status !== 'agendada') return false;
      const visitDate = new Date(v.scheduled_date);
      const hoursUntilVisit = (visitDate - now) / (1000 * 60 * 60);
      return hoursUntilVisit > 0 && hoursUntilVisit <= 24;
    });

    for (const visit of upcomingVisits) {
      const visitDate = new Date(visit.scheduled_date);
      const hoursUntilVisit = Math.floor((visitDate - now) / (1000 * 60 * 60));

      const existingAlert = await base44.asServiceRole.entities.Alert.filter({
        user_email: userEmail,
        type: 'visit_reminder',
        message: { $regex: visit.client_name },
        created_date: { $gte: new Date(Date.now() - 3600000).toISOString() } // Last hour
      });

      if (existingAlert.length === 0) {
        notifications.push({
          user_email: userEmail,
          title: '📅 Lembrete de Visita',
          message: `Visita com ${visit.client_name} em ${hoursUntilVisit}h - ${visit.location || 'Local não especificado'}`,
          type: 'visit_reminder',
          priority: 'alta',
          link_to: `VisitManager`,
          read: false,
          dismissed: false
        });
      }
    }

    // 4. Proposal viewed notifications
    const recentEngagements = documentEngagements.filter(d => {
      if (d.document_type !== 'proposta') return false;
      const firstViewDate = new Date(d.first_viewed_at);
      const hoursSinceView = (now - firstViewDate) / (1000 * 60 * 60);
      return hoursSinceView <= 1; // Last hour
    });

    for (const engagement of recentEngagements) {
      const existingAlert = await base44.asServiceRole.entities.Alert.filter({
        user_email: userEmail,
        type: 'proposal_viewed',
        message: { $regex: engagement.client_name },
        created_date: { $gte: new Date(Date.now() - 3600000).toISOString() }
      });

      if (existingAlert.length === 0) {
        notifications.push({
          user_email: userEmail,
          title: '👀 Proposta Visualizada!',
          message: `${engagement.client_name} acabou de abrir a proposta "${engagement.document_title}"`,
          type: 'proposal_viewed',
          priority: 'alta',
          link_to: `DocumentTracking`,
          read: false,
          dismissed: false
        });
      }
    }

    // 5. Overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (t.status !== 'pendente' || !t.due_date) return false;
      return new Date(t.due_date) < now;
    });

    for (const task of overdueTasks) {
      const daysOverdue = Math.floor((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24));
      
      const existingAlert = await base44.asServiceRole.entities.Alert.filter({
        user_email: userEmail,
        type: 'task_overdue',
        message: { $regex: task.title },
        created_date: { $gte: new Date(Date.now() - 86400000).toISOString() }
      });

      if (existingAlert.length === 0) {
        notifications.push({
          user_email: userEmail,
          title: '⚠️ Tarefa Atrasada',
          message: `"${task.title}" - ${daysOverdue} dia(s) de atraso`,
          type: 'task_overdue',
          priority: daysOverdue > 3 ? 'alta' : 'media',
          link_to: `Tasks`,
          read: false,
          dismissed: false
        });
      }
    }

    // 6. High score leads
    const highScoreLeads = leads.filter(l => 
      l.ai_score && l.ai_score >= 70 && l.stage === 'novo'
    );

    for (const lead of highScoreLeads) {
      const existingAlert = await base44.asServiceRole.entities.Alert.filter({
        user_email: userEmail,
        type: 'high_score_lead',
        message: { $regex: lead.full_name },
        created_date: { $gte: new Date(Date.now() - 86400000 * 2).toISOString() }
      });

      if (existingAlert.length === 0) {
        notifications.push({
          user_email: userEmail,
          title: '⭐ Lead Qualificado!',
          message: `${lead.full_name} - Score: ${lead.ai_score}. Alta probabilidade de conversão!`,
          type: 'high_score_lead',
          priority: 'alta',
          link_to: `LeadProfile?id=${lead.id}`,
          read: false,
          dismissed: false
        });
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await Promise.all(
        notifications.map(n => base44.asServiceRole.entities.Alert.create(n))
      );
    }

    return Response.json({
      success: true,
      notifications_created: notifications.length,
      details: {
        goals: notifications.filter(n => n.type.includes('goal')).length,
        clients: notifications.filter(n => n.type.includes('client')).length,
        visits: notifications.filter(n => n.type === 'visit_reminder').length,
        proposals: notifications.filter(n => n.type === 'proposal_viewed').length,
        tasks: notifications.filter(n => n.type === 'task_overdue').length,
        leads: notifications.filter(n => n.type.includes('lead')).length
      }
    });

  } catch (error) {
    console.error('Notification processing error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});