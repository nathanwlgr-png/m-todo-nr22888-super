import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, stage_id, stage_name, from_stage } = await req.json().catch(() => ({}));

    if (!client_id || !stage_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar cliente
    const clients = await base44.entities.Client.filter({ id: client_id }).catch(() => []);
    if (!clients.length) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clients[0];

    // Criar interação de movimento
    await base44.entities.Interaction.create({
      client_id,
      client_name: client.clinic_name,
      type: 'other',
      direction: 'outbound',
      subject: `Etapa atualizada: ${from_stage || 'Inicial'} → ${stage_name}`,
      notes: `Cliente avançou no funil de vendas para: ${stage_name}`,
      outcome: 'positive',
      ai_category: 'fechamento',
      ai_sentiment: 'positivo',
      created_by_name: user.full_name
    }).catch(() => {});

    // Buscar estágio para pegar trigger de automação
    const stage = await base44.entities.FunnelStage.filter({ 
      name: stage_name 
    }).catch(() => []);

    let automationResults = {};

    if (stage.length > 0 && stage[0].automation_trigger) {
      // Disparar automação configurada para esta etapa
      const automationRes = await base44.functions.invoke('processAutomationRules', {
        trigger_type: 'pipeline_stage_change',
        event_data: {
          client_id,
          stage_id,
          stage_name,
          clinic_name: client.clinic_name,
          client_status: client.status
        }
      }).catch(() => ({}));

      automationResults = automationRes?.data || {};
    }

    // Atualizar cliente
    await base44.entities.Client.update(client_id, {
      pipeline_stage: stage_name,
      stage_entered_date: new Date().toISOString(),
      status: getStatusByStage(stage_name)
    }).catch(() => {});

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      client_id,
      stage_name,
      interaction_created: true,
      automation_triggered: Object.keys(automationResults).length > 0,
      automation_results: automationResults
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getStatusByStage(stageName) {
  const stageMap = {
    'Lead Qualificado': 'frio',
    'Oportunidade': 'frio',
    'Proposta': 'morno',
    'Negociação': 'morno',
    'Fechado': 'quente'
  };
  return stageMap[stageName] || 'morno';
}