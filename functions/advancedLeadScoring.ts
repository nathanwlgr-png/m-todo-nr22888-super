import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all leads and interactions
    const [allLeads, allInteractions] = await Promise.all([
      base44.asServiceRole.entities.Lead.list().catch(() => []),
      base44.asServiceRole.entities.Interaction.list().catch(() => [])
    ]);

    // Score each lead
    const scoredLeads = await Promise.all(
      allLeads.map(async (lead) => {
        // Get lead interactions
        const leadInteractions = allInteractions.filter(i => i.client_id === lead.id);

        // Score calculation
        let score = 0;

        // Engagement metrics (40 points)
        const lastInteractionDays = leadInteractions.length > 0 
          ? Math.floor((Date.now() - new Date(leadInteractions[0].created_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (lastInteractionDays <= 7) score += 15;
        else if (lastInteractionDays <= 14) score += 10;
        else if (lastInteractionDays <= 30) score += 5;

        score += Math.min(leadInteractions.length * 2, 25); // Up to 25 for interaction count

        // Firmographics (60 points)
        if (lead.company_size === '200+') score += 15;
        else if (lead.company_size === '51-200') score += 12;
        else if (lead.company_size === '11-50') score += 8;
        else if (lead.company_size === '1-10') score += 4;

        if (lead.urgency === 'imediata') score += 20;
        else if (lead.urgency === '1_3_meses') score += 15;
        else if (lead.urgency === '3_6_meses') score += 10;
        else score += 5;

        if (lead.budget_range === '200k+') score += 15;
        else if (lead.budget_range === '100k_200k') score += 12;
        else if (lead.budget_range === '50k_100k') score += 10;
        else score += 5;

        if (lead.stage === 'em_contato') score += 10;
        else if (lead.stage === 'qualificado') score += 5;

        // Cap at 100
        score = Math.min(score, 100);

        return {
          ...lead,
          predictive_score: score,
          engagement_level: leadInteractions.length,
          last_interaction: leadInteractions[0]?.created_date || null,
          priority_level: score >= 70 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low'
        };
      })
    );

    // Sort by score
    scoredLeads.sort((a, b) => b.predictive_score - a.predictive_score);

    // Create tasks for high-priority leads
    const highPriorityLeads = scoredLeads.filter(l => l.predictive_score >= 70);

    for (const lead of highPriorityLeads) {
      try {
        await base44.asServiceRole.entities.Task?.create?.({
          client_id: lead.id,
          client_name: lead.full_name,
          title: `Follow-up: ${lead.full_name} (Score: ${Math.round(lead.predictive_score)})`,
          description: `Lead de alta qualidade. Urgência: ${lead.urgency}. Orçamento: ${lead.budget_range}`,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pendente',
          priority: 'alta',
          type: 'follow_up',
          auto_created: true,
          assigned_to: lead.assigned_to || user.email
        });
      } catch (e) {
        console.log('Task creation optional:', e.message);
      }
    }

    return Response.json({
      success: true,
      total_leads_scored: scoredLeads.length,
      high_priority_count: highPriorityLeads.length,
      leads_by_priority: {
        critical: scoredLeads.filter(l => l.priority_level === 'critical').length,
        high: scoredLeads.filter(l => l.priority_level === 'high').length,
        medium: scoredLeads.filter(l => l.priority_level === 'medium').length,
        low: scoredLeads.filter(l => l.priority_level === 'low').length
      },
      top_leads: scoredLeads.slice(0, 10).map(l => ({
        id: l.id,
        name: l.full_name,
        company: l.company,
        score: Math.round(l.predictive_score),
        priority: l.priority_level,
        engagement: l.engagement_level,
        last_interaction: l.last_interaction
      })),
      all_scored_leads: scoredLeads,
      tasks_created: highPriorityLeads.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('advancedLeadScoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});