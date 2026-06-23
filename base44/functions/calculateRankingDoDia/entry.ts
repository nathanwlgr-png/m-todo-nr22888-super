import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DAY_MS = 86400000;

function daysSince(date) {
  if (!date) return 999;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return 999;
  return Math.floor((Date.now() - time) / DAY_MS);
}

function getSniperScore(client) {
  let score = client.purchase_score || client.health_score || 0;
  if (client.status === 'quente') score += 30;
  if (client.status === 'morno') score += 10;
  if (client.pipeline_stage === 'negociacao') score += 20;
  if (client.pipeline_stage === 'proposta') score += 10;
  const dias = daysSince(client.last_contact_date || client.last_contact_follow_up_date);
  if (dias <= 3) score += 10;
  if (dias > 14) score -= 10;
  if (!client.equipment_sold && (client.available_budget || 0) > 50000) score += 15;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function priorityFromScore(score) {
  if (score >= 75) return 'urgente';
  if (score >= 60) return 'quente';
  if (score >= 40) return 'potencial';
  return 'frio';
}

function actionFor(client, score, clientConsumables) {
  if (!client.equipment_sold && (client.available_budget || 0) > 50000) {
    return { action_type: 'venda_equipamento', action_description: 'Budget confirmado, sem equipamento. Priorizar demonstração Seamaty.' };
  }
  if (client.pipeline_stage === 'proposta' || client.pipeline_stage === 'negociacao') {
    return { action_type: 'follow_up', action_description: 'Negociação em andamento. Fazer follow-up para fechamento.' };
  }
  if (clientConsumables.length > 0) {
    return { action_type: 'reposicao_insumo', action_description: `${clientConsumables.length} oportunidade(s) de insumo/recorrência para verificar.` };
  }
  if (daysSince(client.last_contact_date || client.last_contact_follow_up_date) > 14 && score >= 40) {
    return { action_type: 'reativacao', action_description: 'Cliente com potencial e sem contato recente. Reativar hoje.' };
  }
  return { action_type: 'follow_up', action_description: 'Contato consultivo do dia pelo fluxo Sniper.' };
}

async function safeList(base44, entityName, sort, limit) {
  const api = base44?.asServiceRole?.entities?.[entityName];
  if (!api?.list) return [];
  try { return await api.list(sort, limit); } catch (_e) { return []; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const clients = Array.isArray(body.clients) && body.clients.length > 0 ? body.clients : await safeList(base44, 'Client', '-updated_date', 300);
    const sales = Array.isArray(body.sales) && body.sales.length > 0 ? body.sales : await safeList(base44, 'Sale', '-created_date', 120);
    const consumables = Array.isArray(body.consumables) && body.consumables.length > 0 ? body.consumables : await safeList(base44, 'ConsumableOrder', '-created_date', 120);

    const scored = clients
      .filter(client => client?.id && (client.phone || client.email || client.clinic_name || client.full_name || client.first_name))
      .map(client => {
        const clientSales = sales.filter(s => s.client_id === client.id);
        const clientConsumables = consumables.filter(c => c.client_id === client.id && (c.alert_generated || c.status === 'ativo'));
        const score = getSniperScore(client);
        const action = actionFor(client, score, clientConsumables);
        return {
          id: client.id,
          name: client.clinic_name || client.full_name || client.first_name || client.razao_social || 'Cliente sem nome',
          city: client.city || 'Sem cidade',
          phone: client.phone || '',
          score,
          priority: priorityFromScore(score),
          action_type: action.action_type,
          action_description: action.action_description,
          last_contact: client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString('pt-BR') : 'Nunca',
          potential_value: client.available_budget || client.projected_revenue || 0,
          consumables_count: clientConsumables.length,
          sales_count: clientSales.length,
        };
      });

    const top10 = scored.sort((a, b) => b.score - a.score).slice(0, 10);
    const summary = {
      urgente: top10.filter(x => x.priority === 'urgente').length,
      quente: top10.filter(x => x.priority === 'quente').length,
      potencial: top10.filter(x => x.priority === 'potencial').length,
      consumables: top10.reduce((total, x) => total + (x.consumables_count || 0), 0),
    };

    const insights = [];
    if (summary.urgente > 0) insights.push(`${summary.urgente} clientes urgentes para contato hoje`);
    if (summary.quente > 0) insights.push(`${summary.quente} clientes quentes no Top 10`);
    if (summary.consumables > 0) insights.push(`${summary.consumables} sinais de insumos/recorrência no Top 10`);
    const topClientsValue = top10.reduce((a, c) => a + (c.potential_value || 0), 0);
    if (topClientsValue > 0) insights.push(`Potencial do Top 10: R$ ${topClientsValue.toLocaleString('pt-BR')}`);
    if (insights.length === 0 && top10.length > 0) insights.push('Ranking alinhado ao Sniper do Dia e pronto para execução em campo.');

    return Response.json({ summary, priorities: top10, insights, total_analisado: scored.length, generated_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});