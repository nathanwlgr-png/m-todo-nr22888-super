import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar regras ativas
    const rules = await base44.asServiceRole.entities.AutoFollowUpRule.filter({ active: true });
    
    if (rules.length === 0) {
      return Response.json({ message: 'Nenhuma regra ativa', executed: 0 });
    }

    const clients = await base44.asServiceRole.entities.Client.list();
    const interactions = await base44.asServiceRole.entities.Interaction.list();
    const visits = await base44.asServiceRole.entities.Visit.list();
    const executions = await base44.asServiceRole.entities.AutoFollowUpExecution.list();
    const sales = await base44.asServiceRole.entities.Sale.list();

    let totalExecuted = 0;
    const results = [];

    for (const rule of rules) {
      const ruleExecutions = [];

      for (const client of clients) {
        // Verificar se cliente já atingiu máximo de execuções
        const clientExecutions = executions.filter(e => 
          e.rule_id === rule.id && 
          e.client_id === client.id &&
          e.status === 'success'
        );

        if (clientExecutions.length >= (rule.max_executions_per_client || 3)) {
          continue;
        }

        // Verificar cooldown
        const lastExecution = clientExecutions
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        
        if (lastExecution) {
          const daysSinceLastExecution = (Date.now() - new Date(lastExecution.created_date)) / (1000 * 60 * 60 * 24);
          if (daysSinceLastExecution < (rule.cooldown_days || 7)) {
            continue;
          }
        }

        // Verificar se cliente atende critérios
        const config = rule.trigger_config || {};
        
        // Filtro por status
        if (config.target_status?.length > 0 && !config.target_status.includes(client.status)) {
          continue;
        }

        // Filtro por pipeline
        if (config.target_pipeline_stage?.length > 0 && 
            !config.target_pipeline_stage.includes(client.pipeline_stage)) {
          continue;
        }

        // Filtro por score
        if (config.min_score && (client.purchase_score || 0) < config.min_score) {
          continue;
        }
        if (config.max_score && (client.purchase_score || 0) > config.max_score) {
          continue;
        }

        // Filtro por segmento
        if (config.target_segments?.length > 0 && !config.target_segments.includes(client.ai_segment)) {
          continue;
        }

        // Verificar gatilho específico
        let shouldTrigger = false;
        let triggerReason = '';

        switch (rule.trigger_type) {
          case 'inactivity_days': {
            const clientInteractions = interactions.filter(i => i.client_id === client.id);
            if (clientInteractions.length === 0 && client.created_date) {
              const daysSinceCreation = (Date.now() - new Date(client.created_date)) / (1000 * 60 * 60 * 24);
              if (daysSinceCreation >= (config.days_threshold || 7)) {
                shouldTrigger = true;
                triggerReason = `${Math.floor(daysSinceCreation)} dias sem interação desde o cadastro`;
              }
            } else if (clientInteractions.length > 0) {
              const lastInteraction = clientInteractions.sort((a, b) => 
                new Date(b.created_date) - new Date(a.created_date)
              )[0];
              const daysSinceLastInteraction = (Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24);
              if (daysSinceLastInteraction >= (config.days_threshold || 7)) {
                shouldTrigger = true;
                triggerReason = `${Math.floor(daysSinceLastInteraction)} dias sem interação`;
              }
            }
            break;
          }

          case 'after_visit': {
            const clientVisits = visits.filter(v => 
              v.client_id === client.id && 
              v.status === 'realizada'
            );
            if (clientVisits.length > 0) {
              const lastVisit = clientVisits.sort((a, b) => 
                new Date(b.scheduled_date) - new Date(a.scheduled_date)
              )[0];
              const daysSinceVisit = (Date.now() - new Date(lastVisit.scheduled_date)) / (1000 * 60 * 60 * 24);
              if (daysSinceVisit >= (config.days_threshold || 3) && daysSinceVisit <= (config.days_threshold || 3) + 1) {
                shouldTrigger = true;
                triggerReason = `Follow-up pós-visita (${Math.floor(daysSinceVisit)} dias)`;
              }
            }
            break;
          }

          case 'score_drop': {
            const healthScore = client.health_score || 0;
            const previousScore = client.purchase_score || 50;
            if (previousScore - healthScore > 20) {
              shouldTrigger = true;
              triggerReason = `Queda no score (${previousScore}% → ${healthScore}%)`;
            }
            break;
          }

          case 'status_change': {
            if (client.status === 'frio' && client.updated_date) {
              const daysSinceUpdate = (Date.now() - new Date(client.updated_date)) / (1000 * 60 * 60 * 24);
              if (daysSinceUpdate <= 2) {
                shouldTrigger = true;
                triggerReason = 'Cliente mudou para status frio';
              }
            }
            break;
          }

          case 'approaching_deadline': {
            if (client.decision_deadline) {
              const daysUntilDeadline = (new Date(client.decision_deadline) - Date.now()) / (1000 * 60 * 60 * 24);
              if (daysUntilDeadline > 0 && daysUntilDeadline <= (config.days_threshold || 7)) {
                shouldTrigger = true;
                triggerReason = `Prazo de decisão em ${Math.ceil(daysUntilDeadline)} dias`;
              }
            }
            break;
          }
        }

        if (!shouldTrigger) continue;

        // Gerar mensagem personalizada com IA
        let message = rule.message_template || '';
        let emailSubject = rule.email_subject_template || 'Follow-up';

        if (rule.use_ai_personalization) {
          try {
            const intelligence = client.ai_sales_intelligence || {};
            const aiPrompt = `Você é PRIMORI, especialista em follow-ups de vendas veterinárias.

CLIENTE: ${client.first_name}
STATUS: ${client.status}
PIPELINE: ${client.pipeline_stage || 'N/A'}
SCORE: ${client.purchase_score || 50}
HEALTH SCORE: ${client.health_score || 'N/A'}
SEGMENTO: ${client.ai_segment || 'N/A'}
LTV 24m: R$ ${intelligence.ltv_24_months || 0}
EQUIPAMENTO INTERESSE: ${client.equipment_interest || 'N/A'}
ÚLTIMA INTERAÇÃO: ${interactions.filter(i => i.client_id === client.id)[0]?.created_date || 'N/A'}

GATILHO: ${rule.trigger_type}
RAZÃO: ${triggerReason}

TEMPLATE BASE: ${rule.message_template || 'Crie uma mensagem de follow-up personalizada'}

Gere uma mensagem personalizada e um assunto de email (se aplicável).
Seja consultivo, demonstre valor e inclua um CTA claro.`;

            const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: aiPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  email_subject: { type: "string" }
                }
              }
            });

            message = aiResult.message;
            emailSubject = aiResult.email_subject;
          } catch (error) {
            console.error('Erro ao personalizar com IA:', error);
          }
        }

        // Enviar através dos canais
        const channelsUsed = [];
        let executionStatus = 'success';
        let errorMsg = null;

        for (const channel of rule.channels) {
          try {
            if (channel === 'email' && client.email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: client.email,
                subject: emailSubject,
                body: message
              });
              channelsUsed.push('email');
            } else if (channel === 'whatsapp' && client.phone) {
              // WhatsApp via link (não envia automaticamente, mas registra)
              channelsUsed.push('whatsapp');
            } else if (channel === 'notification') {
              channelsUsed.push('notification');
            }
          } catch (error) {
            console.error(`Erro ao enviar via ${channel}:`, error);
            executionStatus = 'partial';
            errorMsg = error.message;
          }
        }

        // Criar tarefa se configurado
        let taskId = null;
        if (rule.create_task && rule.task_config) {
          try {
            const task = await base44.asServiceRole.entities.Task.create({
              client_id: client.id,
              client_name: client.first_name,
              title: rule.task_config.title || `Follow-up: ${rule.name}`,
              description: `Gerado automaticamente pela regra: ${rule.name}\n${triggerReason}`,
              type: rule.task_config.type || 'follow_up',
              priority: rule.task_config.priority || 'media',
              due_date: new Date(Date.now() + (rule.task_config.days_offset || 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              auto_created: true
            });
            taskId = task.id;
          } catch (error) {
            console.error('Erro ao criar tarefa:', error);
          }
        }

        // Registrar execução
        await base44.asServiceRole.entities.AutoFollowUpExecution.create({
          rule_id: rule.id,
          rule_name: rule.name,
          client_id: client.id,
          client_name: client.first_name,
          trigger_reason: triggerReason,
          channels_used: channelsUsed,
          message_sent: message,
          email_subject: emailSubject,
          ai_personalized: rule.use_ai_personalization,
          status: executionStatus,
          error_message: errorMsg,
          task_created_id: taskId,
          execution_time_ms: Date.now() - startTime
        });

        ruleExecutions.push({
          client: client.first_name,
          channels: channelsUsed,
          status: executionStatus
        });

        totalExecuted++;
      }

      // Atualizar estatísticas da regra
      if (ruleExecutions.length > 0) {
        await base44.asServiceRole.entities.AutoFollowUpRule.update(rule.id, {
          execution_count: (rule.execution_count || 0) + ruleExecutions.length,
          success_count: (rule.success_count || 0) + ruleExecutions.filter(e => e.status === 'success').length,
          last_execution: new Date().toISOString()
        });
      }

      results.push({
        rule: rule.name,
        executions: ruleExecutions.length,
        details: ruleExecutions
      });
    }

    return Response.json({
      success: true,
      total_executed: totalExecuted,
      execution_time_ms: Date.now() - startTime,
      results
    });

  } catch (error) {
    console.error('Erro ao processar follow-ups:', error);
    return Response.json({ 
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
});