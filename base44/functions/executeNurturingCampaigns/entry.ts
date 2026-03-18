import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar campanhas ativas
    const campaigns = await base44.asServiceRole.entities.NurturingCampaign.filter({
      status: 'active'
    });

    let messagesCreated = 0;

    for (const campaign of campaigns) {
      // Buscar execuções ativas desta campanha
      const executions = await base44.asServiceRole.entities.CampaignExecution.filter({
        campaign_id: campaign.id,
        status: 'active'
      });

      for (const execution of executions) {
        // Verificar se é hora de enviar próxima mensagem
        const nextActionDate = new Date(execution.next_action_date);
        if (nextActionDate > new Date()) continue;

        // Buscar cliente
        const client = await base44.asServiceRole.entities.Client.get(execution.client_id);
        if (!client) continue;

        // Pegar próximo passo da campanha
        const nextStep = campaign.steps.find(s => s.step_number === execution.current_step + 1);
        if (!nextStep) {
          // Campanha completa
          await base44.asServiceRole.entities.CampaignExecution.update(execution.id, {
            status: 'completed'
          });
          continue;
        }

        // Personalizar conteúdo com IA
        let content = nextStep.content_template;
        
        if (campaign.personalization_rules?.use_numerology && client.numerology_number) {
          const personalizedContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `
Personalize esta mensagem de campanha de nutrição para o cliente:

CLIENTE:
- Nome: ${client.first_name}
- Número Numerológico: ${client.numerology_number}
- Perfil Comportamental: ${client.behavioral_profile}
- Status: ${client.status}
- Histórico: ${client.visit_history?.length || 0} visitas

TEMPLATE DA MENSAGEM:
${content}

PERSONALIZE:
1. Use o nome do cliente
2. Adapte o tom ao perfil numerológico
3. Use gatilhos mentais apropriados
4. Mantenha natural e conversacional

RETORNE APENAS A MENSAGEM PERSONALIZADA.
            `
          });
          content = personalizedContent;
        } else {
          // Substituições básicas
          content = content
            .replace('[nome]', client.first_name || client.full_name)
            .replace('[empresa]', client.clinic_name || '');
        }

        // Criar mensagem pendente para aprovação
        await base44.asServiceRole.entities.PendingMessage.create({
          recipient_id: client.id,
          recipient_name: client.full_name,
          recipient_phone: client.phone,
          channel: nextStep.channel,
          message_content: content,
          email_subject: nextStep.subject,
          context: `Campanha: ${campaign.campaign_name} - Passo ${nextStep.step_number}`,
          ai_reasoning: `Parte da campanha de nutrição "${campaign.campaign_name}" para segmento "${campaign.segment_id}". ${nextStep.trigger_condition || ''}`,
          priority: campaign.campaign_type === 'upsell' ? 'alta' : 'media',
          status: 'pending'
        });

        // Atualizar execução
        await base44.asServiceRole.entities.CampaignExecution.update(execution.id, {
          current_step: nextStep.step_number,
          next_action_date: new Date(Date.now() + (nextStep.delay_days || 1) * 24 * 60 * 60 * 1000).toISOString(),
          messages_sent: [
            ...(execution.messages_sent || []),
            {
              step: nextStep.step_number,
              sent_at: new Date().toISOString(),
              opened: false,
              replied: false
            }
          ]
        });

        messagesCreated++;
      }

      // Atualizar performance da campanha
      const allExecutions = await base44.asServiceRole.entities.CampaignExecution.filter({
        campaign_id: campaign.id
      });

      const performance = {
        sent: allExecutions.reduce((sum, e) => sum + (e.messages_sent?.length || 0), 0),
        opened: allExecutions.reduce((sum, e) => sum + e.messages_sent?.filter(m => m.opened).length || 0, 0),
        replied: allExecutions.reduce((sum, e) => sum + e.messages_sent?.filter(m => m.replied).length || 0, 0),
        converted: allExecutions.filter(e => e.converted).length
      };

      performance.open_rate = performance.sent > 0 ? (performance.opened / performance.sent * 100).toFixed(1) : 0;
      performance.conversion_rate = performance.sent > 0 ? (performance.converted / performance.sent * 100).toFixed(1) : 0;

      await base44.asServiceRole.entities.NurturingCampaign.update(campaign.id, {
        performance
      });
    }

    return Response.json({
      success: true,
      campaigns_processed: campaigns.length,
      messages_created: messagesCreated
    });

  } catch (error) {
    console.error('Campaign execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});