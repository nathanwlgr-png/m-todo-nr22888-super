import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // GERA PACOTES DE AÇÕES PROATIVAS baseados em ai_sales_intelligence
    if (action === 'generate_packages') {
      const clients = await base44.asServiceRole.entities.Client.list('-health_score', 40);
      const eligible = clients.filter(c =>
        c.status === 'quente' ||
        (c.ai_sales_intelligence?.conversion_probability || 0) > 35 ||
        (c.health_score || 0) > 60
      ).slice(0, 10);

      const packages = await Promise.all(eligible.map(async (client) => {
        const intel = client.ai_sales_intelligence || {};
        try {
          const pkg = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Você é Nathan, consultor técnico sênior da SEAMATY Brasil, especialista em equipamentos diagnósticos veterinários Seamaty.

PERFIL COMPLETO DO CLIENTE:
Nome: ${client.first_name} | Clínica: ${client.clinic_name || 'N/A'} | Cidade: ${client.city || 'N/A'}
Status: ${client.status} | Pipeline: ${client.pipeline_stage || 'N/A'}
Número Numerológico: ${client.numerology_number || '?'} | Perfil: ${client.behavioral_profile || 'N/A'}
Equipamento de interesse: ${client.equipment_interest || 'N/A'}
Equipamento sugerido: ${client.equipment_suggestion || 'N/A'}
Prob. Conversão: ${intel.conversion_probability || 0}% | Health Score: ${client.health_score || 0}
Gatilhos efetivos: ${(intel.key_triggers || []).join(', ') || 'N/A'}
Objeções previstas: ${(intel.predicted_objections || []).join(', ') || 'N/A'}
Oportunidades cross-sell: ${(intel.cross_sell_opportunities || []).map(o => o.product).join(', ') || 'N/A'}
Última ação: ${client.ai_next_best_action || 'N/A'}
Tempo sem contato: calculado internamente

Monte um PACOTE DE AÇÕES PROATIVAS completo, priorizado e pronto para execução.
A mensagem WhatsApp deve ser personalizada com o estilo numerológico do cliente.
auto_executable=true apenas se conversion_probability > 70 e status=quente.`,
            response_json_schema: {
              type: 'object',
              properties: {
                confidence_score: { type: 'number' },
                priority: { type: 'string' },
                auto_executable: { type: 'boolean' },
                whatsapp_message: { type: 'string' },
                primary_action: { type: 'string' },
                trigger_to_use: { type: 'string' },
                best_time: { type: 'string' },
                main_argument: { type: 'string' },
                expected_outcome: { type: 'string' },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      step: { type: 'number' },
                      action: { type: 'string' },
                      channel: { type: 'string' },
                      content: { type: 'string' },
                      timing: { type: 'string' }
                    }
                  }
                }
              }
            }
          });

          return {
            client_id: client.id,
            client_name: `${client.first_name}${client.clinic_name ? ' - ' + client.clinic_name : ''}`,
            client_phone: client.phone,
            client_status: client.status,
            conversion_probability: intel.conversion_probability || 0,
            health_score: client.health_score || 0,
            numerology_number: client.numerology_number,
            package: pkg
          };
        } catch (_) {
          return null;
        }
      }));

      const valid = packages.filter(Boolean);
      return Response.json({ packages: valid, total: valid.length });
    }

    // EXECUTA UM PACOTE DE AÇÃO
    if (action === 'execute_package') {
      const { client_id, package_data } = body;
      const client = await base44.asServiceRole.entities.Client.get(client_id);
      const clientName = `${client.first_name}${client.clinic_name ? ' - ' + client.clinic_name : ''}`;

      await Promise.all([
        base44.asServiceRole.entities.Task.create({
          client_id,
          client_name: clientName,
          title: package_data.primary_action,
          description: `[IA Proativa] ${package_data.main_argument}\nGatilho: ${package_data.trigger_to_use}\nMelhor horário: ${package_data.best_time}`,
          type: 'follow_up',
          priority: 'alta',
          auto_created: true
        }),
        base44.asServiceRole.entities.Interaction.create({
          client_id,
          client_name: clientName,
          type: 'whatsapp',
          direction: 'outbound',
          subject: 'Ação Proativa IA',
          notes: package_data.whatsapp_message,
          outcome: 'neutral',
          ai_tags: ['proactive_action', package_data.trigger_to_use || ''],
          ai_priority: 'alta'
        }),
        base44.asServiceRole.entities.Client.update(client_id, {
          last_contact_date: new Date().toISOString().split('T')[0],
          ai_next_best_action: package_data.expected_outcome
        })
      ]);

      return Response.json({ success: true });
    }

    // FEEDBACK LOOP - AUTOAPRENDIZAGEM
    if (action === 'submit_feedback') {
      const { client_id, result, action_taken, client_response } = body;
      const client = await base44.asServiceRole.entities.Client.get(client_id);
      const existing = client.ai_sales_intelligence || {};

      const adjusted = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Loop de autoaprendizagem de vendas. Ajuste os scores baseado no feedback real:

AÇÃO EXECUTADA: ${action_taken}
RESULTADO: ${result} (positivo/neutro/negativo)
RESPOSTA DO CLIENTE: ${client_response || 'sem resposta registrada'}
SCORES ANTERIORES: conversion_probability=${existing.conversion_probability}%, health_score=${client.health_score}
STATUS DO CLIENTE: ${client.status}

Calcule os novos scores com base no resultado real. Se positivo, aumente. Se negativo, reduza.
Sugira ajuste de abordagem e próxima melhor ação.`,
        response_json_schema: {
          type: 'object',
          properties: {
            new_conversion_probability: { type: 'number' },
            new_health_score: { type: 'number' },
            next_best_action: { type: 'string' },
            approach_adjustment: { type: 'string' },
            status_recommendation: { type: 'string' }
          }
        }
      });

      await base44.asServiceRole.entities.Client.update(client_id, {
        health_score: Math.min(100, Math.max(0, adjusted.new_health_score)),
        ai_next_best_action: adjusted.next_best_action,
        ai_sales_intelligence: {
          ...existing,
          conversion_probability: Math.min(100, Math.max(0, adjusted.new_conversion_probability)),
          best_approach: adjusted.approach_adjustment,
          last_ai_analysis: new Date().toISOString()
        }
      });

      return Response.json({ success: true, updated: adjusted });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});