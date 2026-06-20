import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Comando de Voz de Campo SAFE — NR22888 ──
// Interpreta linguagem natural de voz e PREPARA ações com segurança.
// NUNCA envia mensagem, NUNCA altera campo crítico direto, NUNCA aplica coordenada.
// Ações de risco viram fila/rascunho aguardando aprovação humana.

const MODEL_SAFE = 'claude_sonnet_4_6';
const today = () => new Date().toISOString();

function entityApi(base44, name) {
  return base44?.asServiceRole?.entities?.[name] || null;
}

async function safeList(base44, name, sort, limit) {
  const api = entityApi(base44, name);
  if (!api?.list) return [];
  try { return await api.list(sort, limit); } catch (_e) { return []; }
}

async function safeFilter(base44, name, filter, sort, limit) {
  const api = entityApi(base44, name);
  if (!api?.filter) return [];
  try { return await api.filter(filter, sort, limit); } catch (_e) { return []; }
}

async function safeCreate(base44, name, data) {
  const api = entityApi(base44, name);
  if (!api?.create) return { record: null, error: `${name} indisponível` };
  try { return { record: await api.create(data), error: '' }; } catch (error) { return { record: null, error: error.message }; }
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

async function findClient(base44, query) {
  const q = norm(query);
  if (!q) return null;
  const clients = await safeList(base44, 'Client', '-updated_date', 150);
  return clients.find(c => [c.first_name, c.full_name, c.clinic_name, c.razao_social].filter(Boolean).some(v => norm(v).includes(q))) || null;
}

// Extrai o "resto" depois de uma palavra-gatilho (ex: "abrir cliente joão" -> "joão")
function afterKeyword(text, keywords) {
  const t = norm(text);
  for (const k of keywords) {
    const idx = t.indexOf(norm(k));
    if (idx !== -1) return text.slice(idx + k.length).trim();
  }
  return '';
}

// Interpreta o texto de voz e devolve a intenção SAFE
function interpret(text) {
  const t = norm(text);

  // ── NAVEGAÇÃO (risco baixo, sem dado) ──
  if (/(nr campo|abrir nr|modo campo)/.test(t)) return { tipo: 'navegar', destino: '/', label: 'Abrir NR Campo' };
  if (/(sniper|inicio|início|hoje|dashboard)/.test(t)) return { tipo: 'navegar', destino: '/', label: 'Abrir Sniper do Dia' };
  if (/(whatsapp ?hub|abrir whatsapp)/.test(t)) return { tipo: 'navegar', destino: '/WhatsAppHub', label: 'Abrir WhatsAppHub' };
  if (/(rota do dia|abrir rota|rota inteligente|rota smart)/.test(t)) return { tipo: 'navegar', destino: '/SmartRouteOptimizer', label: 'Abrir Rota do Dia' };
  if (/(clientes quentes|mostrar quentes|oportunidades quentes)/.test(t)) return { tipo: 'listar', alvo: 'quentes', destino: '/RankingOportunidades', label: 'Mostrar clientes quentes' };
  if (/(propostas paradas|propostas sem resposta)/.test(t)) return { tipo: 'listar', alvo: 'propostas', destino: '/SalesFunnel', label: 'Mostrar propostas paradas' };
  if (/(pendencias|pendências|o que falta)/.test(t)) return { tipo: 'listar', alvo: 'pendencias', destino: '/TasksUnified', label: 'Mostrar pendências' };

  // ── CONFIRMAÇÃO MANUAL (não envia — só sinaliza) ──
  if (/(confirmar que enviei|confirmo envio|ja enviei|já enviei|enviei manual)/.test(t))
    return { tipo: 'confirmar_envio', label: 'Confirmar envio manual' };

  // ── AÇÕES COM CLIENTE ──
  if (/registrar visita|anotar visita|visita/.test(t)) {
    const resto = afterKeyword(text, ['registrar visita', 'anotar visita', 'visita']);
    const [nome, ...nota] = resto.split(/\s+/);
    return { tipo: 'visita', nomeCliente: nome, detalhe: nota.join(' ') || resto, label: 'Registrar visita' };
  }
  if (/follow.?up|acompanhamento|retornar/.test(t)) {
    const resto = afterKeyword(text, ['follow up', 'followup', 'acompanhamento', 'retornar']);
    const [nome, ...prazo] = resto.split(/\s+/);
    return { tipo: 'followup', nomeCliente: nome, detalhe: prazo.join(' ') || 'próximo contato', label: 'Criar follow-up' };
  }
  if (/gerar whatsapp|mandar whatsapp|mensagem whatsapp/.test(t)) {
    const resto = afterKeyword(text, ['gerar whatsapp', 'mandar whatsapp', 'mensagem whatsapp']);
    const [nome, ...obj] = resto.split(/\s+/);
    return { tipo: 'whatsapp', nomeCliente: nome, detalhe: obj.join(' ') || 'retomar conversa comercial', label: 'Gerar WhatsApp (rascunho)' };
  }
  if (/criar proposta|gerar proposta|proposta para/.test(t)) {
    const resto = afterKeyword(text, ['criar proposta para', 'gerar proposta para', 'proposta para', 'criar proposta', 'gerar proposta']);
    return { tipo: 'proposta', nomeCliente: resto.split(/\s+/)[0] || resto, label: 'Criar proposta (preparar)' };
  }
  if (/agendar visita|marcar visita/.test(t)) {
    const resto = afterKeyword(text, ['agendar visita', 'marcar visita']);
    const [nome, ...quando] = resto.split(/\s+/);
    return { tipo: 'agendar', nomeCliente: nome, detalhe: quando.join(' '), label: 'Agendar visita (preparar)' };
  }
  if (/abrir cliente|cliente/.test(t)) {
    const resto = afterKeyword(text, ['abrir cliente', 'cliente']);
    return { tipo: 'abrir_cliente', nomeCliente: resto, label: 'Abrir cliente' };
  }

  return { tipo: 'desconhecido', label: 'Comando não reconhecido' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const texto = body.texto_transcrito || body.text || body.mensagem || '';
    const origem = ['bixby', 'telegram', 'crm', 'voz_tablet', 'manual'].includes(body.origem) ? body.origem : 'crm';
    const usuario = body.usuario || user.email;

    if (!texto.trim()) {
      return Response.json({ resposta: 'Nenhum texto de voz recebido. Nada foi feito.', envio_automatico: false }, { status: 400 });
    }

    const intent = interpret(texto);
    let resposta = '';
    let risco = 'baixo';
    let exige_aprovacao = false;
    let status = 'interpretado';
    let navegacao_destino = '';
    let client = null;
    let queue = null, pending = null, task = null, eliteLog = null;

    if (intent.tipo === 'navegar') {
      navegacao_destino = intent.destino;
      resposta = `${intent.label}. Abrindo a tela. Nada foi alterado.`;
    } else if (intent.tipo === 'listar') {
      navegacao_destino = intent.destino;
      resposta = `${intent.label}. Abrindo a tela correspondente.`;
    } else if (intent.tipo === 'confirmar_envio') {
      // SAFE: não marca envio sozinho — sinaliza para Nathan confirmar na tela
      resposta = 'Anotado. Confirme o envio manual na tela de aprovação do WhatsApp para registrar como enviado.';
      navegacao_destino = '/WhatsAppHub';
    } else if (intent.tipo === 'abrir_cliente') {
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = `Cliente "${intent.nomeCliente}" não encontrado. Nada foi alterado.`; status = 'erro'; }
      else { navegacao_destino = `/ClienteDetalhe360?id=${client.id}`; resposta = `Abrindo ${client.first_name || client.clinic_name}.`; }
    } else if (intent.tipo === 'visita') {
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma alteração foi feita.'; status = 'erro'; }
      else {
        const r = await safeCreate(base44, 'CRMUpdateQueue', { origem: 'manual', texto_original: texto, comando_interpretado: 'voz: registrar visita', cliente_id: client.id, tipo_atualizacao: 'resumo de visita', campo_alvo: 'notes', valor_novo: intent.detalhe, status: 'pendente', risco: 'baixo', exige_aprovacao: false, agente_origem: 'comando_voz_safe', modelo_ia_usado: MODEL_SAFE, data_criacao: today(), observacao: 'Voz SAFE: anotação de visita pronta para aplicar após conferência.' });
        queue = r.record;
        resposta = queue ? `Visita preparada para ${client.first_name || client.clinic_name}. Aguardando sua conferência. Nada foi enviado.` : `Fila indisponível: ${r.error}.`;
        status = queue ? 'interpretado' : 'erro';
      }
    } else if (intent.tipo === 'followup') {
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma tarefa foi criada.'; status = 'erro'; }
      else {
        const r = await safeCreate(base44, 'Task', { client_id: client.id, client_name: client.first_name || client.clinic_name, title: `Follow-up: ${client.first_name || client.clinic_name}`, description: `Criado por voz: ${intent.detalhe}`, status: 'pendente', priority: 'media', type: 'follow_up', auto_created: true, assigned_to: usuario, assigned_to_name: user.full_name || usuario });
        task = r.record;
        resposta = task ? `Follow-up criado para ${client.first_name || client.clinic_name}: ${intent.detalhe}.` : `Task indisponível: ${r.error}.`;
        status = task ? 'interpretado' : 'erro';
      }
    } else if (intent.tipo === 'whatsapp') {
      // Mensagem WhatsApp = AÇÃO DE RISCO → rascunho aguardando aprovação. NUNCA envia.
      risco = 'alto'; exige_aprovacao = true;
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma mensagem foi criada.'; status = 'erro'; }
      else {
        const score = (await safeFilter(base44, 'EliteLeadScore', { cliente_id: client.id }))[0];
        const nome = client.first_name || client.full_name || client.clinic_name || 'cliente';
        const produto = score?.produto_recomendado || client.equipment_interest || 'Seamaty';
        const mensagem = `Olá ${nome}, tudo bem? Pensei em te chamar sobre ${intent.detalhe}, principalmente olhando o potencial do ${produto} para sua rotina. Posso te mostrar um caminho simples para avaliarmos o próximo passo?`;
        const r = await safeCreate(base44, 'PendingMessage', { canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: nome, destinatario_contato: client.phone || '', cliente_id: client.id, contexto: 'Comando de Voz SAFE — WhatsApp', context: 'Comando de Voz SAFE — WhatsApp', mensagem, message_content: mensagem, status: 'aguardando_aprovacao', criado_por_agente: 'comando_voz_safe', modelo_ia_usado: MODEL_SAFE, aprovado_por_nathan: false, data_criacao: today(), priority: (score?.elite_score || 0) >= 71 ? 'alta' : 'media', recipient_id: client.id, recipient_name: nome, recipient_phone: client.phone || '', ai_reasoning: intent.detalhe, proxima_acao: 'Nathan revisar e enviar manualmente pelo WhatsApp' });
        pending = r.record;
        resposta = pending ? `Rascunho de WhatsApp criado para ${nome}. Aguardando sua aprovação. Nada foi enviado automaticamente.` : `Rascunho indisponível: ${r.error}.`;
        status = pending ? 'pendente_aprovacao' : 'erro';
      }
    } else if (intent.tipo === 'proposta') {
      risco = 'medio';
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = 'Cliente não encontrado. Nada foi criado.'; status = 'erro'; }
      else {
        const r = await safeCreate(base44, 'Task', { client_id: client.id, client_name: client.first_name || client.clinic_name, title: `Preparar proposta: ${client.first_name || client.clinic_name}`, description: 'Solicitado por voz. Abrir Gerador de Propostas e revisar antes de enviar.', status: 'pendente', priority: 'alta', type: 'outro', auto_created: true, assigned_to: usuario, assigned_to_name: user.full_name || usuario });
        task = r.record;
        navegacao_destino = '/ProposalGenerator';
        resposta = task ? `Tarefa de proposta criada para ${client.first_name || client.clinic_name}. Abrindo o Gerador para você revisar.` : `Task indisponível: ${r.error}.`;
        status = task ? 'interpretado' : 'erro';
      }
    } else if (intent.tipo === 'agendar') {
      // Agendar = mexe em agenda/visita → preparar via fila, exige conferência
      risco = 'medio'; exige_aprovacao = true;
      client = await findClient(base44, intent.nomeCliente);
      if (!client) { resposta = 'Cliente não encontrado. Nada foi agendado.'; status = 'erro'; }
      else {
        const r = await safeCreate(base44, 'CRMUpdateQueue', { origem: 'manual', texto_original: texto, comando_interpretado: 'voz: agendar visita', cliente_id: client.id, tipo_atualizacao: 'agendar_visita', campo_alvo: 'visita', valor_novo: intent.detalhe || 'data a confirmar', status: 'pendente', risco: 'medio', exige_aprovacao: true, agente_origem: 'comando_voz_safe', modelo_ia_usado: MODEL_SAFE, data_criacao: today(), observacao: 'Voz SAFE: agendamento preparado, exige confirmação de data/hora por Nathan.' });
        queue = r.record;
        resposta = queue ? `Agendamento preparado para ${client.first_name || client.clinic_name} (${intent.detalhe || 'data a confirmar'}). Confirme a data na agenda.` : `Fila indisponível: ${r.error}.`;
        status = queue ? 'pendente_aprovacao' : 'erro';
      }
    } else {
      resposta = 'Não entendi o comando. Tente: "abrir cliente João", "registrar visita João boa reunião", "criar follow-up João amanhã", "gerar WhatsApp João retomar contato", "mostrar clientes quentes".';
      status = 'erro';
    }

    // EliteActionLog para ações comerciais com cliente
    if (client && ['visita', 'followup', 'whatsapp', 'proposta', 'agendar'].includes(intent.tipo)) {
      const el = await safeCreate(base44, 'EliteActionLog', { data_hora: today(), usuario, cliente_id: client.id, agente: 'Comando de Voz SAFE', ferramenta_usada: 'processVoiceCommandSafe', modelo_ia_usado: MODEL_SAFE, acao_sugerida: intent.label, acao_executada: status === 'erro' ? 'falhou' : 'preparado (aguardando aprovação/conferência)', mensagem_gerada: pending ? pending.mensagem : '', aprovado_pelo_usuario: false, resultado: resposta });
      eliteLog = el.record;
    }

    // VoiceCommandLog — rastreio sempre
    const vc = await safeCreate(base44, 'VoiceCommandLog', {
      data_hora: today(), origem, usuario, texto_transcrito: texto, comando_detectado: intent.tipo,
      cliente_detectado: client?.first_name || client?.clinic_name || '', cliente_id: client?.id || '',
      acao_sugerida: intent.label, crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '',
      task_id: task?.id || '', elite_action_log_id: eliteLog?.id || '', navegacao_destino,
      status, risco, exige_aprovacao, resposta_gerada: resposta,
    });

    return Response.json({
      resposta, comando: intent.tipo, navegacao_destino, status, risco, exige_aprovacao,
      voice_command_log_id: vc.record?.id || '', crm_update_queue_id: queue?.id || '',
      pending_message_id: pending?.id || '', task_id: task?.id || '',
      envio_automatico: false, alterou_dado_critico: false,
    });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await safeCreate(base44, 'VoiceCommandLog', { data_hora: today(), origem: 'crm', texto_transcrito: '', comando_detectado: 'erro', status: 'erro', erro: error.message });
    } catch (_e) {}
    return Response.json({ error: error.message, envio_automatico: false }, { status: 500 });
  }
});