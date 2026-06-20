const dayMs = 86400000;
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));
const daysSince = (date) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / dayMs)) : 999;

export function classificarEliteScore(score) {
  if (score <= 30) return 'frio';
  if (score <= 50) return 'aquecer';
  if (score <= 70) return 'oportunidade';
  if (score <= 85) return 'quente';
  return 'fechamento_imediato';
}

export function calcularProximaMelhorAcao({ pessoa = {}, score = {}, contexto = {} }) {
  const stage = pessoa.pipeline_stage || pessoa.stage || pessoa.status || 'lead';
  const diasSemResposta = score.dias_sem_resposta ?? daysSince(pessoa.last_contact_date || pessoa.last_contact_follow_up_date);
  const chance = score.chance_fechamento || pessoa.conversion_probability || pessoa.purchase_score || 0;
  const produto = score.produto_recomendado || pessoa.equipment_interest || pessoa.interest || pessoa.equipment_suggestion || 'SMT-120VP';
  let acao = 'mandar_whatsapp';
  if (stage === 'proposta' && chance >= 70) acao = 'pedir_decisao';
  else if (stage === 'negociacao') acao = 'oferecer_condicao_especial';
  else if (diasSemResposta > 21) acao = 'reativar';
  else if (chance >= 86) acao = 'ligar';
  else if ((score.prioridade_visita || 0) >= 75) acao = 'visitar';
  else if (!pessoa.equipment_interest && !pessoa.interest) acao = 'enviar_material';
  else if (stage === 'qualificado') acao = 'enviar_proposta';

  const objecao = pessoa.real_objections?.[0] || 'preço e retorno do investimento';
  return {
    proxima_melhor_acao: acao,
    motivo: `Score ${score.elite_score || chance} com funil ${stage} e ${diasSemResposta} dias sem resposta.`,
    risco_se_nao_agir: diasSemResposta > 14 ? 'Perder timing comercial e virar cliente frio.' : 'Concorrente avançar antes da proposta Seamaty.',
    melhor_horario_sugerido: contexto.melhor_horario || 'entre 9h e 11h ou 14h e 16h',
    mensagem_sugerida: `Olá ${pessoa.first_name || pessoa.full_name || pessoa.company || 'tudo bem'}! Pensei no ${produto} para reduzir tempo de exames e aumentar autonomia da clínica. Posso te mostrar um caminho simples de ROI?`,
    produto_recomendado: produto,
    objecao_provavel: objecao,
    resposta_da_objecao: `Entendo a preocupação com ${objecao}. A melhor análise é comparar custo terceirizado, tempo de resultado e ganho mensal com exames internos antes de decidir.`,
  };
}

export function calcularEliteScore({ pessoa = {}, tipo = 'cliente', visitas = [], interacoes = [], propostas = [], mensagens = [] }) {
  const ultimaInteracao = pessoa.last_contact_follow_up_date || pessoa.last_contact_date || interacoes[0]?.created_date || propostas[0]?.view_timestamp || pessoa.updated_date;
  const diasSemResposta = daysSince(ultimaInteracao);
  const diasSemCompra = daysSince(pessoa.last_purchase_date);
  const status = pessoa.pipeline_stage || pessoa.stage || pessoa.status || 'lead';
  const propostaAberta = propostas.some(p => p.action_taken === 'visualizou' || p.view_timestamp || p.engagement_score > 0);
  const visitaRecente = visitas.some(v => daysSince(v.scheduled_date) <= 30);
  const respondeu = interacoes.some(i => i.direction === 'inbound' || i.outcome === 'positive') || mensagens.some(m => ['respondeu', 'convertido'].includes(m.status));
  const valorEstimado = pessoa.projected_revenue || pessoa.estimated_deal_value || pessoa.valor_real_poder_compra || pessoa.available_budget || 0;
  const interesseDetectado = clamp((pessoa.purchase_score || pessoa.predictive_score || pessoa.conversion_probability || 35) + (propostaAberta ? 15 : 0) + (respondeu ? 15 : 0));
  const potencialCompra = clamp((valorEstimado >= 50000 ? 75 : valorEstimado >= 20000 ? 60 : 40) + (pessoa.current_volume?.includes('mais') ? 15 : 0));
  const urgencia = clamp((pessoa.urgency === 'imediata' ? 85 : 45) + (status === 'negociacao' ? 20 : 0) + (diasSemResposta > 14 ? 10 : 0));
  const capacidadePagamento = clamp(pessoa.available_budget ? Math.min(95, pessoa.available_budget / 1000) : pessoa.company_size === 'grande' ? 80 : pessoa.budget_range === '200k+' ? 90 : 55);
  const chanceFechamento = clamp(interesseDetectado * 0.35 + potencialCompra * 0.25 + urgencia * 0.2 + capacidadePagamento * 0.2 + (visitaRecente ? 5 : 0));
  const eliteScore = clamp(chanceFechamento + (propostaAberta ? 5 : 0) - (diasSemResposta > 30 ? 10 : 0));
  const produto = pessoa.equipment_interest || pessoa.interest || pessoa.equipment_suggestion || (pessoa.current_equipment ? 'insumos e upgrade Seamaty' : 'SMT-120VP');
  const base = {
    cliente_id: tipo === 'cliente' ? pessoa.id : pessoa.client_id || '',
    lead_id: tipo === 'lead' ? pessoa.id : '',
    oportunidade_id: tipo === 'oportunidade' ? pessoa.id : '',
    cidade: pessoa.city || '', segmento: pessoa.client_type || pessoa.industry || pessoa.company_size || '',
    elite_score: eliteScore, classificacao_score: classificarEliteScore(eliteScore), potencial_compra: potencialCompra,
    urgencia, capacidade_pagamento: capacidadePagamento, interesse_detectado: interesseDetectado,
    ultima_interacao: ultimaInteracao || new Date().toISOString(), dias_sem_resposta: diasSemResposta === 999 ? null : diasSemResposta,
    dias_sem_compra: diasSemCompra === 999 ? null : diasSemCompra, status_funil: status, chance_fechamento: chanceFechamento,
    valor_estimado: valorEstimado, produto_recomendado: produto,
    prioridade_campo: clamp(chanceFechamento + (visitaRecente ? 10 : 0)), prioridade_whatsapp: clamp(interesseDetectado + (diasSemResposta > 7 ? 10 : 0)), prioridade_visita: clamp(potencialCompra + urgencia / 2),
    modelo_ia_usado: 'EliteScoreEngine_deterministico_FaseII', data_atualizacao: new Date().toISOString(),
    motivo_score: `Interesse ${interesseDetectado}, potencial ${potencialCompra}, urgência ${urgencia}, capacidade ${capacidadePagamento}.`,
  };
  const acao = calcularProximaMelhorAcao({ pessoa, score: base });
  return { ...base, proxima_melhor_acao: acao.proxima_melhor_acao, ...acao };
}

export function formatCurrencyBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}