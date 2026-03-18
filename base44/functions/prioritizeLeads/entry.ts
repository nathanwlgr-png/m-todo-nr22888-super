import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email } = await req.json();
    const targetEmail = user_email || user.email;

    // Fetch leads and clients
    const leads = await base44.entities.Lead.list();
    const clients = await base44.entities.Client.list();
    const interactions = await base44.entities.Interaction.list();
    const tasks = await base44.entities.Task.list();

    const allProspects = [...leads, ...clients.filter(c => c.status !== 'frio')];
    const prioritizedLeads = [];

    for (const prospect of allProspects) {
      let score = 0;
      const reasons = [];
      const urgencyFactors = [];

      // Hot status: +30
      if (prospect.status === 'quente' || prospect.ai_score > 70) {
        score += 30;
        reasons.push('Lead/cliente quente com alto score');
        urgencyFactors.push('Status quente');
      }

      // High AI score: +20
      if (prospect.ai_score > 80) {
        score += 20;
        reasons.push(`Score IA muito alto: ${prospect.ai_score}`);
      }

      // Days without contact
      const lastInteraction = interactions
        .filter(i => i.client_id === prospect.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      
      const daysWithoutContact = lastInteraction
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysWithoutContact > 7 && prospect.status === 'quente') {
        score += 25;
        reasons.push(`${daysWithoutContact} dias sem contato - urgente!`);
        urgencyFactors.push(`${daysWithoutContact} dias sem contato`);
      }

      // High conversion probability
      if (prospect.ai_sales_intelligence?.conversion_probability > 70) {
        score += 20;
        reasons.push('Alta probabilidade de conversão');
      }

      // Churn risk
      if (prospect.ai_sales_intelligence?.churn_risk > 60) {
        score += 15;
        reasons.push('Risco de perda - ação necessária');
        urgencyFactors.push('Risco de churn');
      }

      // Budget available
      if (prospect.available_budget > 50000) {
        score += 15;
        reasons.push('Alto budget disponível');
      }

      // Decision deadline
      if (prospect.decision_deadline) {
        const daysToDeadline = Math.floor((new Date(prospect.decision_deadline) - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToDeadline <= 7 && daysToDeadline > 0) {
          score += 20;
          reasons.push(`Deadline em ${daysToDeadline} dias`);
          urgencyFactors.push('Deadline próximo');
        }
      }

      // Engagement score
      if (prospect.engagement_score > 70) {
        score += 10;
        reasons.push('Alto engajamento recente');
      }

      // Open tasks
      const openTasks = tasks.filter(t => 
        t.client_id === prospect.id && 
        t.status === 'pendente'
      ).length;
      if (openTasks > 0) {
        score += 5;
      }

      if (score > 40) {
        const priorityLevel = score > 80 ? 'urgente' : score > 65 ? 'alta' : score > 50 ? 'media' : 'baixa';
        
        // Determine best contact time
        let bestTime = '9h-11h';
        if (prospect.communication_preferences?.preferred_time) {
          bestTime = prospect.communication_preferences.preferred_time;
        }

        // Determine action
        let action = 'Agendar ligação';
        if (daysWithoutContact > 14) {
          action = 'Retomar contato urgente';
        } else if (prospect.ai_sales_intelligence?.next_best_action) {
          action = prospect.ai_sales_intelligence.next_best_action;
        }

        prioritizedLeads.push({
          lead_id: prospect.id,
          lead_name: prospect.first_name || prospect.full_name,
          assigned_to: targetEmail,
          priority_score: Math.min(score, 100),
          priority_level: priorityLevel,
          ai_reasoning: reasons,
          recommended_action: action,
          best_contact_time: bestTime,
          conversion_probability: prospect.ai_sales_intelligence?.conversion_probability || 50,
          estimated_value: prospect.projected_revenue || prospect.available_budget || 0,
          urgency_factors: urgencyFactors,
          last_interaction: lastInteraction?.created_date,
          days_without_contact: daysWithoutContact
        });
      }
    }

    // Sort by score
    prioritizedLeads.sort((a, b) => b.priority_score - a.priority_score);

    // Save top 20 priorities
    for (const priority of prioritizedLeads.slice(0, 20)) {
      // Check if already exists
      const existing = await base44.entities.LeadPriority.filter({
        lead_id: priority.lead_id
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.LeadPriority.update(existing[0].id, priority);
      } else {
        await base44.asServiceRole.entities.LeadPriority.create(priority);
      }
    }

    // Create alert for urgent leads
    const urgentLeads = prioritizedLeads.filter(l => l.priority_level === 'urgente').slice(0, 3);
    for (const lead of urgentLeads) {
      await base44.asServiceRole.entities.Alert.create({
        user_email: targetEmail,
        title: '🎯 Lead Urgente!',
        message: `${lead.lead_name} - Score ${lead.priority_score}. ${lead.recommended_action}`,
        type: 'high_score_lead',
        priority: 'alta',
        link_to: `ClientProfile?id=${lead.lead_id}`
      });
    }

    return Response.json({
      success: true,
      total_analyzed: allProspects.length,
      prioritized: prioritizedLeads.length,
      urgent_count: urgentLeads.length,
      top_priorities: prioritizedLeads.slice(0, 10)
    });

  } catch (error) {
    console.error('Prioritization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});