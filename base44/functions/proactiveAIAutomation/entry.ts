import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role para automações do sistema
    const leads = await base44.asServiceRole.entities.Lead.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    
    const automations = [];
    const alerts = [];
    const pendingMessages = [];
    const tasks = [];

    // ===== AUTOMAÇÕES PARA LEADS =====
    for (const lead of leads) {
      const now = new Date();
      const lastContact = lead.last_contact_date ? new Date(lead.last_contact_date) : null;
      const daysSinceContact = lastContact ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24)) : 999;

      // 1. Leads com score alto sem contato recente
      if (lead.predictive_score >= 70 && daysSinceContact > 3) {
        alerts.push({
          type: 'high_priority_lead',
          title: `Lead Quente: ${lead.full_name}`,
          message: `Score ${lead.predictive_score} - Sem contato há ${daysSinceContact} dias`,
          priority: 'high',
          related_entity: 'Lead',
          related_entity_id: lead.id,
          action_url: `/lead-profile?id=${lead.id}`
        });

        tasks.push({
          title: `Follow-up urgente: ${lead.full_name}`,
          description: `Lead com score ${lead.predictive_score}. ${lead.next_best_action || 'Entrar em contato'}`,
          priority: 'alta',
          due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_entity_type: 'Lead',
          related_entity_id: lead.id,
          assigned_to: lead.assigned_to
        });

        // Gerar mensagem personalizada para aprovação
        const messagePrompt = `Crie uma mensagem de follow-up personalizada para o lead ${lead.full_name} da empresa ${lead.company || 'não informada'}.

Score preditivo: ${lead.predictive_score}
Interesse: ${lead.interest || 'não informado'}
Último contato: há ${daysSinceContact} dias
Próxima ação sugerida: ${lead.next_best_action || 'Reengajar'}

A mensagem deve:
- Ser amigável e profissional
- Mencionar o interesse dele
- Oferecer valor (informação, demo, proposta)
- Ter call-to-action claro
- Máximo 3-4 linhas

Não use formatação markdown.`;

        try {
          const messageContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: messagePrompt
          });

          pendingMessages.push({
            recipient_id: lead.id,
            recipient_name: lead.full_name,
            recipient_phone: lead.phone,
            channel: 'whatsapp',
            message_content: messageContent,
            ai_reasoning: `Lead quente (score ${lead.predictive_score}) sem contato há ${daysSinceContact} dias. Follow-up urgente necessário.`,
            priority: 'alta',
            status: 'pending'
          });
        } catch (e) {
          console.error('Erro ao gerar mensagem:', e);
        }

        automations.push({
          type: 'hot_lead_followup',
          lead_id: lead.id,
          action: 'created_task_and_alert'
        });
      }

      // 2. Leads com score caindo
      if (lead.predictive_score < 50 && lead.predictive_score > 0 && daysSinceContact > 7) {
        alerts.push({
          type: 'lead_cooling',
          title: `Lead Esfriando: ${lead.full_name}`,
          message: `Score ${lead.predictive_score} - Risco de perda. Sem contato há ${daysSinceContact} dias`,
          priority: 'medium',
          related_entity: 'Lead',
          related_entity_id: lead.id,
          action_url: `/lead-profile?id=${lead.id}`
        });

        automations.push({
          type: 'cooling_lead_alert',
          lead_id: lead.id,
          action: 'created_alert'
        });
      }

      // 3. Leads com sinais de compra
      if (lead.buying_signals && lead.buying_signals.length > 0 && daysSinceContact > 2) {
        tasks.push({
          title: `Sinais de compra detectados: ${lead.full_name}`,
          description: `Sinais: ${lead.buying_signals.join(', ')}. Ação: ${lead.next_best_action || 'Enviar proposta'}`,
          priority: 'urgente',
          due_date: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_entity_type: 'Lead',
          related_entity_id: lead.id,
          assigned_to: lead.assigned_to
        });

        automations.push({
          type: 'buying_signals_detected',
          lead_id: lead.id,
          action: 'created_urgent_task'
        });
      }
    }

    // ===== AUTOMAÇÕES PARA CLIENTES =====
    for (const client of clients) {
      const now = new Date();
      
      // 4. Clientes com health score baixo
      if (client.health_score && client.health_score < 50) {
        alerts.push({
          type: 'client_at_risk',
          title: `Cliente em Risco: ${client.first_name}`,
          message: `Health Score: ${client.health_score}. Risco de churn detectado.`,
          priority: 'high',
          related_entity: 'Client',
          related_entity_id: client.id,
          action_url: `/client-profile?id=${client.id}`
        });

        tasks.push({
          title: `Check-in urgente: ${client.first_name}`,
          description: `Health Score baixo (${client.health_score}). Verificar satisfação e necessidades.`,
          priority: 'alta',
          due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_entity_type: 'Client',
          related_entity_id: client.id
        });

        automations.push({
          type: 'low_health_score',
          client_id: client.id,
          action: 'created_checkin_task'
        });
      }

      // 5. Oportunidades de upsell/cross-sell
      if (client.ai_sales_intelligence?.cross_sell_opportunities?.length > 0) {
        const topOpportunity = client.ai_sales_intelligence.cross_sell_opportunities[0];
        if (topOpportunity.probability >= 70) {
          alerts.push({
            type: 'upsell_opportunity',
            title: `Oportunidade: ${client.first_name}`,
            message: `${topOpportunity.product} - Prob: ${topOpportunity.probability}% - Valor: R$ ${topOpportunity.expected_value}`,
            priority: 'medium',
            related_entity: 'Client',
            related_entity_id: client.id,
            action_url: `/client-profile?id=${client.id}`
          });

          automations.push({
            type: 'cross_sell_opportunity',
            client_id: client.id,
            product: topOpportunity.product,
            action: 'created_opportunity_alert'
          });
        }
      }
    }

    // ===== SALVAR TUDO NO BANCO =====
    const results = {
      automations_executed: automations.length,
      alerts_created: 0,
      tasks_created: 0,
      pending_messages_created: 0
    };

    // Criar alertas
    for (const alert of alerts) {
      try {
        await base44.asServiceRole.entities.Alert.create(alert);
        results.alerts_created++;
      } catch (e) {
        console.error('Erro ao criar alerta:', e);
      }
    }

    // Criar tarefas
    for (const task of tasks) {
      try {
        await base44.asServiceRole.entities.Task.create(task);
        results.tasks_created++;
      } catch (e) {
        console.error('Erro ao criar task:', e);
      }
    }

    // Criar mensagens pendentes
    for (const msg of pendingMessages) {
      try {
        await base44.asServiceRole.entities.PendingMessage.create(msg);
        results.pending_messages_created++;
      } catch (e) {
        console.error('Erro ao criar pending message:', e);
      }
    }

    return Response.json({
      success: true,
      ...results,
      automations_details: automations
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});