import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const dayMs = 86400000;
const MODEL_SAFE = 'claude_sonnet_4_6';
const today = () => new Date().toISOString();
const daysSince = (date) => date ? Math.floor((Date.now() - new Date(date).getTime()) / dayMs) : 999;

function commandOf(text) {
  const t = String(text || '').trim();
  return (t.match(/^\/\S+/)?.[0] || '/texto').toLowerCase();
}

function rest(text) {
  return String(text || '').replace(/^\/\S+\s*/, '').trim();
}

function pipeParts(args) {
  const raw = String(args || '');
  return raw.includes('|') ? raw.split('|').map(p => p.trim()) : null;
}

function legacyNameAndRest(args) {
  const [name, ...restParts] = String(args || '').trim().split(/\s+/);
  return { name: name || '', detail: restParts.join(' ').trim() };
}

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

async function findClient(base44, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  const clients = await safeList(base44, 'Client', '-updated_date', 120);
  return clients.find(c => [c.first_name, c.full_name, c.clinic_name, c.razao_social].filter(Boolean).some(v => String(v).toLowerCase().includes(q))) || null;
}

async function createTelegramLog(base44, data) {
  const result = await safeCreate(base44, 'TelegramCommandLog', { data_hora: today(), status: 'interpretado', ...data });
  return result.record;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    // Aceita: payload real do webhook Telegram (body.message.text / edited_message),
    // chamada interna ({mensagem}) e teste ({text}).
    const text = body?.message?.text || body?.edited_message?.text || body.mensagem || body.text || '';
    const cmd = commandOf(text);
    const args = rest(text);
    let resposta = '';
    let queue = null;
    let pending = null;
    let client = null;
    let status = 'interpretado';
    let acao = '';

    if (cmd === '/resumo_dia') {
      const [scores, visits, pendingMessages, tasks] = await Promise.all([
        safeList(base44, 'EliteLeadScore', '-elite_score', 8),
        safeFilter(base44, 'Visit', { status: 'agendada' }, '-scheduled_date', 20),
        safeList(base44, 'PendingMessage', '-created_date', 20),
        safeFilter(base44, 'Task', { status: 'pendente' }, '-due_date', 50)
      ]);
      resposta = `Resumo do dia: ${scores.length} oportunidades ranqueadas, ${visits.length} visitas agendadas, ${pendingMessages.filter(m => ['pending','aguardando_aprovacao','ready_to_send','rascunho'].includes(m.status)).length} mensagens pendentes e ${tasks.length} follow-ups pendentes. Top ação: ${scores[0]?.proxima_melhor_acao || 'ativar Score Elite'}.`;
      acao = 'mostrar resumo do dia';
    } else if (cmd === '/quentes') {
      const scores = await safeList(base44, 'EliteLeadScore', '-elite_score', 20);
      resposta = scores.filter(s => (s.elite_score || 0) >= 71).slice(0, 8).map((s, i) => `${i + 1}. ${s.cidade || 'Sem cidade'} · ${s.produto_recomendado || 'Produto'} · ${s.elite_score}`).join('\n') || 'Nenhuma oportunidade quente encontrada.';
      acao = 'listar oportunidades quentes';
    } else if (cmd === '/propostas_paradas') {
      const proposals = await safeList(base44, 'ProposalEngagement', '-created_date', 30);
      resposta = proposals.filter(p => daysSince(p.created_date || p.view_timestamp) > 3).slice(0, 8).map((p, i) => `${i + 1}. ${p.client_name || p.client_id || 'Proposta'} sem resposta há ${daysSince(p.created_date || p.view_timestamp)} dias`).join('\n') || 'Nenhuma proposta parada encontrada.';
      acao = 'listar propostas paradas';
    } else if (cmd === '/inativos') {
      const clients = await safeList(base44, 'Client', '-purchase_score', 80);
      resposta = clients.filter(c => daysSince(c.last_contact_date || c.last_contact_follow_up_date) > 14 && (c.purchase_score || 0) >= 50).slice(0, 8).map((c, i) => `${i + 1}. ${c.first_name || c.clinic_name} · ${daysSince(c.last_contact_date || c.last_contact_follow_up_date)} dias sem contato`).join('\n') || 'Nenhum inativo com potencial encontrado.';
      acao = 'listar clientes inativos';
    } else if (cmd === '/cliente') {
      const name = pipeParts(args)?.[0] || args;
      client = await findClient(base44, name);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma alteração foi feita.'; status = 'erro'; acao = 'buscar resumo do cliente'; }
      else {
        const score = (await safeFilter(base44, 'EliteLeadScore', { cliente_id: client.id }))[0];
        resposta = `${client.first_name || client.full_name || client.clinic_name}: score ${score?.elite_score || client.purchase_score || 'sem score'}, funil ${client.pipeline_stage || client.status || 'sem status'}, próxima ação ${score?.proxima_melhor_acao || client.next_action || 'mandar WhatsApp manual'}.`;
        acao = 'buscar resumo do cliente';
      }
    } else if (cmd === '/visita') {
      const parts = pipeParts(args);
      const parsed = parts ? { name: parts[0], detail: parts.slice(1).join(' | ') } : legacyNameAndRest(args);
      client = await findClient(base44, parsed.name);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma alteração foi feita.'; status = 'erro'; acao = 'registrar visita via fila segura'; }
      else {
        const note = parsed.detail || args;
        const result = await safeCreate(base44, 'CRMUpdateQueue', { origem: 'telegram', texto_original: text, comando_interpretado: '/visita', cliente_id: client.id, tipo_atualizacao: 'resumo de visita', campo_alvo: 'notes', valor_novo: note, status: 'pendente', risco: 'baixo', exige_aprovacao: false, agente_origem: 'telegram_operacional_nr22888', modelo_ia_usado: MODEL_SAFE, data_criacao: today(), observacao: 'Baixo risco: pronto para aplicar no CRM após conferência.' });
        queue = result.record;
        await safeCreate(base44, 'EliteActionLog', { data_hora: today(), usuario: user.email, cliente_id: client.id, agente: 'Telegram Operacional NR22888', ferramenta_usada: 'processTelegramCommandSafe', modelo_ia_usado: MODEL_SAFE, acao_sugerida: 'registrar visita', acao_executada: queue ? 'criar CRMUpdateQueue baixo risco' : 'CRMUpdateQueue indisponível', aprovado_pelo_usuario: false, resultado: note });
        resposta = queue ? `Anotação de visita preparada para ${client.first_name || client.clinic_name}. Fila criada para aplicar com segurança.` : `Fila segura indisponível: ${result.error}. Nenhum dado foi alterado.`;
        status = queue ? 'interpretado' : 'erro';
        acao = 'registrar visita via fila segura';
      }
    } else if (cmd === '/followup') {
      const parts = pipeParts(args);
      const parsed = parts ? { name: parts[0], detail: parts.slice(1).join(' | ') } : legacyNameAndRest(args);
      client = await findClient(base44, parsed.name);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma tarefa foi criada.'; status = 'erro'; acao = 'criar follow-up'; }
      else {
        const due = parsed.detail || 'próximo contato';
        const result = await safeCreate(base44, 'Task', { client_id: client.id, client_name: client.first_name || client.clinic_name, title: `Follow-up: ${client.first_name || client.clinic_name}`, description: `Criado pelo Telegram: ${due}`, status: 'pendente', priority: 'media', type: 'follow_up', auto_created: true, assigned_to: user.email, assigned_to_name: user.full_name || user.email });
        resposta = result.record ? `Follow-up criado para ${client.first_name || client.clinic_name}: ${due}.` : `Task indisponível: ${result.error}. Nenhum dado foi alterado.`;
        status = result.record ? 'interpretado' : 'erro';
        acao = 'criar follow-up';
      }
    } else if (cmd === '/whatsapp') {
      const parts = pipeParts(args);
      const parsed = parts ? { name: parts[0], detail: parts.slice(1).join(' | ') } : legacyNameAndRest(args);
      client = await findClient(base44, parsed.name);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma mensagem foi criada.'; status = 'erro'; acao = 'criar PendingMessage WhatsApp'; }
      else {
        const objetivo = parsed.detail || 'retomar conversa comercial';
        const score = (await safeFilter(base44, 'EliteLeadScore', { cliente_id: client.id }))[0];
        const nome = client.first_name || client.full_name || client.clinic_name || 'cliente';
        const produto = score?.produto_recomendado || client.equipment_interest || 'Seamaty';
        const mensagem = `Olá ${nome}, tudo bem? Pensei em te chamar sobre ${objetivo}, principalmente olhando o potencial do ${produto} para sua rotina. Posso te mostrar um caminho simples e objetivo para avaliarmos o próximo passo?`;
        const result = await safeCreate(base44, 'PendingMessage', { canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: nome, destinatario_contato: client.phone || '', cliente_id: client.id, contexto: 'Telegram Operacional NR22888 — WhatsApp seguro', context: 'Telegram Operacional NR22888 — WhatsApp seguro', mensagem, message_content: mensagem, status: 'aguardando_aprovacao', criado_por_agente: 'telegram_operacional_nr22888', modelo_ia_usado: MODEL_SAFE, aprovado_por_nathan: false, data_criacao: today(), priority: score?.elite_score >= 71 ? 'alta' : 'media', recipient_id: client.id, recipient_name: nome, recipient_phone: client.phone || '', ai_reasoning: objetivo, proxima_acao: 'Nathan revisar e enviar manualmente pelo WhatsApp' });
        pending = result.record;
        await safeCreate(base44, 'EliteActionLog', { data_hora: today(), usuario: user.email, cliente_id: client.id, agente: 'Telegram Operacional NR22888', ferramenta_usada: 'processTelegramCommandSafe', modelo_ia_usado: MODEL_SAFE, acao_sugerida: 'gerar WhatsApp seguro', acao_executada: pending ? 'criar PendingMessage aguardando aprovação' : 'PendingMessage indisponível', mensagem_gerada: mensagem, aprovado_pelo_usuario: false, resultado: pending ? 'PendingMessage criado; envio automático bloqueado' : result.error });
        resposta = pending ? 'Mensagem WhatsApp criada para aprovação. Nada foi enviado automaticamente.' : `PendingMessage indisponível: ${result.error}. Nada foi enviado.`;
        status = pending ? 'interpretado' : 'erro';
        acao = 'criar PendingMessage WhatsApp';
      }
    } else if (cmd === '/atualizar') {
      const parts = pipeParts(args);
      let parsed;
      if (parts) parsed = { name: parts[0], field: parts[1] || 'notes', value: parts.slice(2).join(' | ') };
      else {
        const [name, field, ...valueParts] = String(args || '').trim().split(/\s+/);
        parsed = { name, field: field || 'notes', value: valueParts.join(' ') };
      }
      client = await findClient(base44, parsed.name);
      if (!client) { resposta = 'Cliente não encontrado. Nenhuma atualização foi criada.'; status = 'erro'; acao = 'criar CRMUpdateQueue'; }
      else {
        const critical = ['status_funil','valor_estimado','proposta','fechamento','telefone','phone','email','responsavel','responsável','cidade','classificacao','classificação'].includes(String(parsed.field || '').toLowerCase());
        const result = await safeCreate(base44, 'CRMUpdateQueue', { origem: 'telegram', texto_original: text, comando_interpretado: '/atualizar', cliente_id: client.id, tipo_atualizacao: 'atualizacao_crm', campo_alvo: parsed.field || 'notes', valor_novo: parsed.value, status: 'pendente', risco: critical ? 'alto' : 'baixo', exige_aprovacao: critical, agente_origem: 'telegram_operacional_nr22888', modelo_ia_usado: MODEL_SAFE, data_criacao: today(), observacao: critical ? 'Campo crítico: exige aprovação de Nathan.' : 'Baixo risco: pode ser aplicado após conferência.' });
        queue = result.record;
        resposta = queue ? `Atualização segura criada para ${client.first_name || client.clinic_name}. Risco: ${critical ? 'alto' : 'baixo'}.` : `CRMUpdateQueue indisponível: ${result.error}. Nenhum dado foi alterado.`;
        acao = 'criar CRMUpdateQueue';
        status = queue ? (critical ? 'pendente_aprovacao' : 'interpretado') : 'erro';
      }
    } else {
      resposta = 'Comando não reconhecido. Use /resumo_dia, /cliente, /visita, /followup, /whatsapp, /quentes, /propostas_paradas, /inativos ou /atualizar.';
      acao = 'orientar comandos disponíveis';
    }

    const log = await createTelegramLog(base44, { usuario: user.email, mensagem_recebida: text, intencao_detectada: cmd, cliente_detectado: client?.first_name || client?.clinic_name || '', acao_sugerida: acao, crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '', status, resposta_gerada: resposta });
    return Response.json({ resposta, comando: cmd, telegram_log_id: log?.id || '', crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '', envio_automatico: false });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await safeCreate(base44, 'TelegramCommandLog', { data_hora: today(), mensagem_recebida: '', intencao_detectada: 'erro', status: 'erro', erro: error.message });
    } catch (_e) {}
    return Response.json({ error: error.message, envio_automatico: false }, { status: 500 });
  }
});