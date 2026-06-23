import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const criticalFields = new Set(['status_funil', 'valor_estimado', 'proposta', 'fechamento', 'phone', 'email', 'representante', 'city', 'client_type', 'status', 'pipeline_stage', 'sale_closed', 'projected_revenue', 'available_budget', 'responsavel', 'assigned_to', 'classification', 'classificacao']);
const allowedClientFields = new Set(['notes', 'next_action', 'next_contact_date', 'last_contact_date', 'last_contact_follow_up_date', 'equipment_interest', 'status', 'pipeline_stage', 'phone', 'email', 'representante', 'city', 'client_type', 'projected_revenue', 'available_budget', 'purchase_score']);
const allowedLeadFields = new Set(['notes', 'next_action', 'next_contact_date', 'last_contact_date', 'equipment_interest', 'status', 'pipeline_stage', 'phone', 'email', 'city', 'score', 'interest_level']);
const allowedSaleFields = new Set(['notes', 'status', 'sale_value', 'payment_terms']);

function normalizeField(field) {
  const value = String(field || '').trim().toLowerCase();
  const map = {
    observacao: 'notes', observação: 'notes', resumo_visita: 'notes', resumo_de_visita: 'notes', proxima_acao: 'next_action', 'próxima ação': 'next_action', data_followup: 'next_contact_date', data_de_followup: 'next_contact_date', interesse_detectado: 'purchase_score', telefone: 'phone', cidade: 'city', responsavel: 'representante', responsável: 'representante', status_funil: 'pipeline_stage', valor_estimado: 'projected_revenue', fechamento: 'sale_closed', classificacao_cliente: 'client_type', classificação_cliente: 'client_type'
  };
  return map[value] || value;
}

function parseValue(field, raw) {
  const text = String(raw || '').trim();
  if (!text) return undefined;
  if (['projected_revenue', 'available_budget', 'purchase_score', 'score', 'sale_value'].includes(field)) {
    const number = Number(text.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.'));
    return Number.isFinite(number) ? number : undefined;
  }
  if (field === 'sale_closed') return ['sim', 'true', 'fechado', 'fechada'].includes(text.toLowerCase());
  return text;
}

function entityApi(base44, name) {
  return base44?.asServiceRole?.entities?.[name] || null;
}

async function safeUpdate(base44, entity, id, data) {
  const api = entityApi(base44, entity);
  if (!api?.update) return false;
  await api.update(id, data);
  return true;
}

async function safeLog(base44, data) {
  const api = entityApi(base44, 'EliteActionLog');
  if (!api?.create) return null;
  return await api.create(data);
}

async function findRecord(base44, entity, id) {
  if (!id) return null;
  const api = entityApi(base44, entity);
  if (!api?.filter) return null;
  try {
    const rows = await api.filter({ id });
    return rows?.[0] || null;
  } catch (_e) {
    return null;
  }
}

async function findQueue(base44, queueId) {
  const queueApi = entityApi(base44, 'CRMUpdateQueue');
  if (!queueApi?.filter) return { queue: null, error: 'CRMUpdateQueue indisponível' };
  try {
    const rows = await queueApi.filter({ id: queueId });
    return { queue: rows?.[0] || null, error: '' };
  } catch (_e) {
    return { queue: null, error: 'Atualização não encontrada' };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const queueId = body.queue_id || body.id;
    if (!queueId) return Response.json({ error: 'queue_id obrigatório' }, { status: 400 });

    const { queue, error: queueError } = await findQueue(base44, queueId);
    if (queueError === 'CRMUpdateQueue indisponível') return Response.json({ applied: false, status: 'erro', reason: queueError });
    if (!queue) return Response.json({ applied: false, status: 'nao_encontrado', reason: queueError || 'Atualização não encontrada' }, { status: 404 });
    if (queue.status === 'rejeitado' || queue.status === 'aplicado') return Response.json({ status: queue.status, message: 'Item já finalizado' });

    const field = normalizeField(queue.campo_alvo);
    const value = parseValue(field, queue.valor_novo);
    if (value === undefined || value === null || value === '') {
      await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'pendente', observacao: `${queue.observacao || ''}\nValor novo vazio ou inválido. Aplicação bloqueada.`.trim() });
      return Response.json({ applied: false, status: 'pendente', reason: 'valor inválido ou vazio' });
    }

    const isCritical = criticalFields.has(queue.campo_alvo) || criticalFields.has(field) || queue.risco !== 'baixo' || queue.exige_aprovacao === true;
    if (isCritical && queue.status !== 'aprovado') {
      await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'pendente', exige_aprovacao: true, observacao: `${queue.observacao || ''}\nCampo crítico ou risco médio/alto: exige aprovação antes de aplicar.`.trim() });
      return Response.json({ applied: false, status: 'pendente', requires_approval: true });
    }

    let entity = null;
    let allowed = null;
    let record = null;
    if (queue.cliente_id) { entity = 'Client'; allowed = allowedClientFields; record = await findRecord(base44, entity, queue.cliente_id); }
    else if (queue.lead_id) { entity = 'Lead'; allowed = allowedLeadFields; record = await findRecord(base44, entity, queue.lead_id); }
    else if (queue.oportunidade_id) { entity = 'Sale'; allowed = allowedSaleFields; record = await findRecord(base44, entity, queue.oportunidade_id); }

    if (!entity || !record) {
      await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'erro', observacao: `${queue.observacao || ''}\nCliente, lead ou oportunidade não encontrado.`.trim() });
      return Response.json({ applied: false, status: 'erro', reason: 'registro não encontrado' }, { status: 404 });
    }

    if (!allowed.has(field)) {
      await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'pendente', exige_aprovacao: true, observacao: `${queue.observacao || ''}\nCampo não permitido para aplicação automática: ${field}.` .trim() });
      return Response.json({ applied: false, status: 'pendente', reason: 'campo não permitido' });
    }

    const before = record[field];
    const finalValue = field === 'notes' && before ? `${before}\n\n[SAFE ${new Date().toLocaleDateString('pt-BR')}] ${value}` : value;
    const updated = await safeUpdate(base44, entity, record.id, { [field]: finalValue });
    if (!updated) {
      await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'erro', observacao: `${queue.observacao || ''}\nEntidade de destino indisponível: ${entity}.`.trim() });
      return Response.json({ applied: false, status: 'erro', reason: 'entidade de destino indisponível' });
    }
    await safeUpdate(base44, 'CRMUpdateQueue', queue.id, { status: 'aplicado', data_aplicacao: new Date().toISOString(), observacao: `${queue.observacao || ''}\nAplicado com segurança por ${user.email}.` .trim() });
    await safeLog(base44, { data_hora: new Date().toISOString(), usuario: user.email, cliente_id: queue.cliente_id || '', lead_id: queue.lead_id || '', oportunidade_id: queue.oportunidade_id || '', agente: queue.agente_origem || 'Fase II-SAFE', ferramenta_usada: 'aplicarAtualizacaoCRMComSeguranca', acao_sugerida: queue.comando_interpretado || queue.tipo_atualizacao || 'atualização CRM segura', acao_executada: `Atualizar ${entity}.${field}`, aprovado_pelo_usuario: true, resultado: `Antes: ${before ?? 'vazio'} | Depois: ${finalValue}`, proxima_acao: 'acompanhar resultado no CRM', observacao: `CRMUpdateQueue ${queue.id}` });

    return Response.json({ applied: true, entity, record_id: record.id, field, before, after: finalValue, status: 'aplicado' });
  } catch (error) {
    const message = String(error?.message || 'Erro interno');
    if (message.includes('Object not found') || message.includes('not found')) {
      return Response.json({ applied: false, status: 'nao_encontrado', reason: 'Registro não encontrado ou já removido' }, { status: 404 });
    }
    return Response.json({ applied: false, status: 'erro', reason: message }, { status: 500 });
  }
});