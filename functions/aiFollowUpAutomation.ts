import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, clientId, followUpData } = body;

    if (action === 'analyze') {
      return await analyzeClientForFollowUp(base44, clientId);
    } else if (action === 'schedule_followup') {
      return await scheduleFollowUp(base44, clientId, followUpData, user);
    } else if (action === 'get_suggestions') {
      return await getSuggestions(base44, clientId);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Follow-up automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function analyzeClientForFollowUp(base44, clientId) {
  try {
    // Get client data
    const client = await base44.asServiceRole.entities.Client.get(clientId).catch(() => null);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get message history
    const messages = await base44.asServiceRole.entities.AutomatedMessageLog.filter({
      client_id: clientId
    }).catch(() => []);

    // Get interaction history
    const interactions = await base44.asServiceRole.entities.Interaction.filter({
      client_id: clientId
    }).catch(() => []);

    // Build context for AI
    const context = {
      client_name: client.first_name,
      clinic_name: client.clinic_name,
      city: client.city,
      status: client.status,
      pipeline_stage: client.pipeline_stage,
      current_equipment: client.current_equipment,
      equipment_interest: client.equipment_interest,
      budget_available: client.available_budget,
      last_contact: client.last_contact_date,
      days_since_contact: client.last_contact_date ? 
        Math.floor((new Date() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24)) : 999,
      message_count: messages.length,
      last_messages: messages.slice(-5).map(m => ({
        content: m.message_content,
        date: m.sent_at,
        responded: m.response_received
      })),
      interaction_count: interactions?.length || 0,
      main_pains: client.main_pains || [],
      purchase_motivators: client.purchase_motivators || []
    };

    // Call AI to analyze and suggest follow-up
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analise este cliente e sugira a melhor estratégia de follow-up:

CLIENTE: ${JSON.stringify(context, null, 2)}

Baseado na análise, forneça em JSON:
{
  "urgency": "alto" | "médio" | "baixo",
  "days_to_contact": número de dias até contatar,
  "recommended_channel": "whatsapp" | "email" | "telefone" | "visita",
  "message_suggestion": "mensagem personalizada de follow-up",
  "task_title": "título da tarefa a criar",
  "predicted_conversion_probability": número 0-100,
  "key_pain_points": ["lista", "de", "dores"],
  "best_time_window": "9-11am" | "2-4pm" | "após horário comercial",
  "reason": "explicação breve"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          urgency: { type: 'string' },
          days_to_contact: { type: 'number' },
          recommended_channel: { type: 'string' },
          message_suggestion: { type: 'string' },
          task_title: { type: 'string' },
          predicted_conversion_probability: { type: 'number' },
          key_pain_points: { type: 'array', items: { type: 'string' } },
          best_time_window: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: aiResponse,
      context
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function scheduleFollowUp(base44, clientId, followUpData, user) {
  try {
    const client = await base44.asServiceRole.entities.Client.get(clientId).catch(() => null);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create task
    const taskDate = new Date();
    taskDate.setDate(taskDate.getDate() + (followUpData.days_to_contact || 3));

    const task = await base44.asServiceRole.entities.Task.create({
      title: followUpData.task_title || `Follow-up: ${client.first_name}`,
      description: `Canal: ${followUpData.recommended_channel}\n\nMensagem:\n${followUpData.message_suggestion}`,
      assigned_to: user.email,
      client_id: clientId,
      client_name: client.first_name,
      status: 'pendente',
      priority: followUpData.urgency === 'alto' ? 'alta' : 'media',
      type: 'follow_up',
      due_date: new Date(taskDate).toISOString().split('T')[0]
    });

    // Log the automation
    await base44.asServiceRole.entities.AutomatedMessageLog.create({
      client_id: clientId,
      client_phone: client.phone,
      message_type: 'ai_followup_scheduled',
      message_content: followUpData.message_suggestion,
      sent_status: 'pendente',
      trigger_reason: 'AI Follow-up Automation'
    });

    return Response.json({
      success: true,
      task_id: task.id,
      scheduled_date: taskDate.toISOString(),
      message: `✅ Follow-up agendado para ${taskDate.toLocaleDateString('pt-BR')}`
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function getSuggestions(base44, clientId) {
  try {
    // Get all clients that need follow-up (not contacted in last 7 days)
    const allClients = await base44.asServiceRole.entities.Client.list();
    
    const needsFollowUp = allClients.filter(c => {
      if (!c.last_contact_date) return true;
      const daysSince = Math.floor((new Date() - new Date(c.last_contact_date)) / (1000 * 60 * 60 * 24));
      return daysSince > 7;
    }).slice(0, 10); // Top 10 for processing

    const suggestions = [];

    for (const client of needsFollowUp) {
      try {
        const analysis = await analyzeClientForFollowUp(base44, client.id);
        if (analysis.ok) {
          const data = await analysis.json();
          suggestions.push({
            client_id: client.id,
            client_name: client.first_name,
            ...data.analysis
          });
        }
      } catch (e) {
        console.error(`Error analyzing client ${client.id}:`, e);
      }
    }

    return Response.json({
      success: true,
      suggestions: suggestions.sort((a, b) => b.urgency === 'alto' ? -1 : 1)
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}