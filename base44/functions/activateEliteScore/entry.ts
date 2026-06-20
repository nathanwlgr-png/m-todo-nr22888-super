import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const dayMs = 86400000;
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));
const daysSince = (date) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / dayMs)) : 999;
const classify = (score) => score <= 30 ? 'frio' : score <= 50 ? 'aquecer' : score <= 70 ? 'oportunidade' : score <= 85 ? 'quente' : 'fechamento_imediato';

function nextAction(pessoa, score) {
  const stage = pessoa.pipeline_stage || pessoa.stage || pessoa.status || 'lead';
  const dias = score.dias_sem_resposta ?? 999;
  if (stage === 'proposta' && score.chance_fechamento >= 70) return 'pedir_decisao';
  if (stage === 'negociacao') return 'oferecer_condicao_especial';
  if (dias > 21) return 'reativar';
  if (score.chance_fechamento >= 86) return 'ligar';
  if (score.prioridade_visita >= 75) return 'visitar';
  if (stage === 'qualificado') return 'enviar_proposta';
  return 'mandar_whatsapp';
}

function buildScore(pessoa, tipo, ctx) {
  const interacoes = ctx.interacoes.filter(i => i.client_id === pessoa.id);
  const visitas = ctx.visitas.filter(v => v.client_id === pessoa.id);
  const propostas = ctx.propostas.filter(p => p.client_id === pessoa.id);
  const mensagens = ctx.mensagens.filter(m => m.cliente_id === pessoa.id || m.recipient_id === pessoa.id || m.lead_id === pessoa.id);
  const ultima = pessoa.last_contact_follow_up_date || pessoa.last_contact_date || interacoes[0]?.created_date || propostas[0]?.view_timestamp || pessoa.updated_date;
  const diasResposta = daysSince(ultima);
  const diasCompra = daysSince(pessoa.last_purchase_date);
  const status = pessoa.pipeline_stage || pessoa.stage || pessoa.status || 'lead';
  const propostaAberta = propostas.some(p => p.action_taken === 'visualizou' || p.view_timestamp || p.engagement_score > 0);
  const visitaRecente = visitas.some(v => daysSince(v.scheduled_date) <= 30);
  const respondeu = interacoes.some(i => i.direction === 'inbound' || i.outcome === 'positive') || mensagens.some(m => ['respondeu', 'convertido'].includes(m.status));
  const valor = pessoa.projected_revenue || pessoa.estimated_deal_value || pessoa.valor_real_poder_compra || pessoa.available_budget || 0;
  const interesse = clamp((pessoa.purchase_score || pessoa.predictive_score || pessoa.conversion_probability || 35) + (propostaAberta ? 15 : 0) + (respondeu ? 15 : 0));
  const potencial = clamp((valor >= 50000 ? 75 : valor >= 20000 ? 60 : 40) + (pessoa.current_volume?.includes('mais') ? 15 : 0));
  const urgencia = clamp((pessoa.urgency === 'imediata' ? 85 : 45) + (status === 'negociacao' ? 20 : 0) + (diasResposta > 14 ? 10 : 0));
  const capacidade = clamp(pessoa.available_budget ? Math.min(95, pessoa.available_budget / 1000) : pessoa.company_size === 'grande' ? 80 : pessoa.budget_range === '200k+' ? 90 : 55);
  const chance = clamp(interesse * 0.35 + potencial * 0.25 + urgencia * 0.2 + capacidade * 0.2 + (visitaRecente ? 5 : 0));
  const elite = clamp(chance + (propostaAberta ? 5 : 0) - (diasResposta > 30 ? 10 : 0));
  const produto = pessoa.equipment_interest || pessoa.interest || pessoa.equipment_suggestion || (pessoa.current_equipment ? 'insumos e upgrade Seamaty' : 'SMT-120VP');
  const score = {
    cliente_id: tipo === 'cliente' ? pessoa.id : pessoa.client_id || '', lead_id: tipo === 'lead' ? pessoa.id : '', oportunidade_id: tipo === 'oportunidade' ? pessoa.id : '',
    cidade: pessoa.city || '', segmento: pessoa.client_type || pessoa.industry || pessoa.company_size || '', elite_score: elite, classificacao_score: classify(elite), potencial_compra: potencial,
    urgencia, capacidade_pagamento: capacidade, interesse_detectado: interesse, ultima_interacao: ultima || new Date().toISOString(), dias_sem_resposta: diasResposta === 999 ? null : diasResposta,
    dias_sem_compra: diasCompra === 999 ? null : diasCompra, status_funil: status, chance_fechamento: chance, valor_estimado: valor, produto_recomendado: produto,
    prioridade_campo: clamp(chance + (visitaRecente ? 10 : 0)), prioridade_whatsapp: clamp(interesse + (diasResposta > 7 ? 10 : 0)), prioridade_visita: clamp(potencial + urgencia / 2),
    modelo_ia_usado: 'EliteScoreEngine_deterministico_FaseII', data_atualizacao: new Date().toISOString(), motivo_score: `Interesse ${interesse}, potencial ${potencial}, urgência ${urgencia}, capacidade ${capacidade}.`,
  };
  score.proxima_melhor_acao = nextAction(pessoa, score);
  return score;
}

function findExisting(existing, score) {
  return existing.find(s => (score.cliente_id && s.cliente_id === score.cliente_id) || (score.lead_id && s.lead_id === score.lead_id) || (score.oportunidade_id && s.oportunidade_id === score.oportunidade_id));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 30), 50);

    const clientsRaw = await base44.asServiceRole.entities.Client.list('-purchase_score', limit);
    const leadsRaw = await base44.asServiceRole.entities.Lead.list('-predictive_score', Math.max(5, Math.floor(limit / 2)));
    const ctx = {
      visitas: await base44.asServiceRole.entities.Visit.list('-scheduled_date', 120),
      interacoes: await base44.asServiceRole.entities.Interaction.list('-created_date', 120),
      propostas: await base44.asServiceRole.entities.ProposalEngagement.list('-created_date', 120),
      mensagens: await base44.asServiceRole.entities.PendingMessage.list('-created_date', 120),
    };
    const existing = await base44.asServiceRole.entities.EliteLeadScore.list('-updated_date', 300);
    const candidates = [...clientsRaw.map(item => ({ item, tipo: 'cliente' })), ...leadsRaw.map(item => ({ item, tipo: 'lead' }))];

    let created = 0, updated = 0, errors = 0;
    const processed = [];
    for (const candidate of candidates) {
      try {
        const score = buildScore(candidate.item, candidate.tipo, ctx);
        const match = findExisting(existing, score);
        if (match) {
          await base44.asServiceRole.entities.EliteLeadScore.update(match.id, score);
          updated += 1;
        } else {
          const createdRecord = await base44.asServiceRole.entities.EliteLeadScore.create(score);
          existing.push(createdRecord);
          created += 1;
        }
        processed.push(score);
      } catch (error) {
        errors += 1;
        if (errors <= 3) console.error('Erro cálculo Elite:', error.message);
      }
    }

    const hot = processed.filter(s => s.classificacao_score === 'quente').length;
    const immediate = processed.filter(s => s.classificacao_score === 'fechamento_imediato').length;
    await base44.asServiceRole.entities.EliteActionLog.create({
      data_hora: new Date().toISOString(), usuario: user.email, agente: 'Plano Elite Fase II', ferramenta_usada: 'activateEliteScore', modelo_ia_usado: 'EliteScoreEngine_deterministico_FaseII',
      acao_sugerida: 'Ativar Score Elite', acao_executada: 'calculo_score_batch_principais', aprovado_pelo_usuario: true, resultado: `analisados=${processed.length}; criados=${created}; atualizados=${updated}; erros=${errors}`,
      proxima_acao: processed[0]?.proxima_melhor_acao || '', valor_potencial: processed.reduce((sum, s) => sum + (s.valor_estimado || 0), 0),
    });

    return Response.json({ total_analisado: processed.length, scores_criados: created, scores_atualizados: updated, oportunidades_quentes: hot, fechamentos_imediatos: immediate, mensagens_sugeridas: 0, erros_encontrados: errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});