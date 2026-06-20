import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const dayMs = 86400000;
const today = () => new Date().toISOString();
const daysSince = (date) => date ? Math.floor((Date.now() - new Date(date).getTime()) / dayMs) : 999;

function commandOf(text) {
  const t = String(text || '').trim();
  return (t.match(/^\/\S+/)?.[0] || '/texto').toLowerCase();
}

function rest(text) {
  return String(text || '').replace(/^\/\S+\s*/, '').trim();
}

async function findClient(base44, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 120);
  return clients.find(c => [c.first_name, c.full_name, c.clinic_name, c.razao_social].filter(Boolean).some(v => String(v).toLowerCase().includes(q))) || null;
}

async function createTelegramLog(base44, data) {
  return await base44.asServiceRole.entities.TelegramCommandLog.create({ data_hora: today(), status: 'interpretado', ...data });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const text = body.mensagem || body.text || '';
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
        base44.asServiceRole.entities.EliteLeadScore.list('-elite_score', 8),
        base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }),
        base44.asServiceRole.entities.PendingMessage.list('-created_date', 20),
        base44.asServiceRole.entities.Task.filter({ status: 'pendente' })
      ]);
      resposta = `Resumo do dia: ${scores.length} oportunidades ranqueadas, ${visits.length} visitas agendadas, ${pendingMessages.filter(m => ['pending','aguardando_aprovacao','ready_to_send','rascunho'].includes(m.status)).length} mensagens pendentes e ${tasks.length} follow-ups pendentes. Top ação: ${scores[0]?.proxima_melhor_acao || 'ativar Score Elite'}.`;
      acao = 'mostrar resumo do dia';
    } else if (cmd === '/quentes') {
      const scores = await base44.asServiceRole.entities.EliteLeadScore.list('-elite_score', 20);
      resposta = scores.filter(s => (s.elite_score || 0) >= 71).slice(0, 8).map((s, i) => `${i + 1}. ${s.cidade || 'Sem cidade'} · ${s.produto_recomendado || 'Produto'} · ${s.elite_score}`).join('\n') || 'Nenhuma oportunidade quente encontrada.';
      acao = 'listar oportunidades quentes';
    } else if (cmd === '/propostas_paradas') {
      const proposals = await base44.asServiceRole.entities.ProposalEngagement.list('-created_date', 30);
      resposta = proposals.filter(p => daysSince(p.created_date || p.view_timestamp) > 3).slice(0, 8).map((p, i) => `${i + 1}. ${p.client_name || p.client_id || 'Proposta'} sem resposta há ${daysSince(p.created_date || p.view_timestamp)} dias`).join('\n') || 'Nenhuma proposta parada encontrada.';
      acao = 'listar propostas paradas';
    } else if (cmd === '/inativos') {
      const clients = await base44.asServiceRole.entities.Client.list('-purchase_score', 80);
      resposta = clients.filter(c => daysSince(c.last_contact_date || c.last_contact_follow_up_date) > 14 && (c.purchase_score || 0) >= 50).slice(0, 8).map((c, i) => `${i + 1}. ${c.first_name || c.clinic_name} · ${daysSince(c.last_contact_date || c.last_contact_follow_up_date)} dias sem contato`).join('\n') || 'Nenhum inativo com potencial encontrado.';
      acao = 'listar clientes inativos';
    } else if (cmd === '/cliente') {
      client = await findClient(base44, args);
      if (!client) throw new Error('Cliente não encontrado');
      const score = (await base44.asServiceRole.entities.EliteLeadScore.filter({ cliente_id: client.id }))[0];
      resposta = `${client.first_name || client.full_name || client.clinic_name}: score ${score?.elite_score || client.purchase_score || 'sem score'}, funil ${client.pipeline_stage || client.status || 'sem status'}, próxima ação ${score?.proxima_melhor_acao || client.next_action || 'mandar WhatsApp manual'}.`;
      acao = 'buscar resumo do cliente';
    } else if (cmd === '/visita') {
      const [name, ...noteParts] = args.split(' ');
      client = await findClient(base44, name);
      if (!client) throw new Error('Cliente não encontrado');
      const note = noteParts.join(' ') || args;
      queue = await base44.asServiceRole.entities.CRMUpdateQueue.create({ origem: 'telegram', texto_original: text, comando_interpretado: '/visita', cliente_id: client.id, tipo_atualizacao: 'resumo de visita', campo_alvo: 'notes', valor_novo: note, status: 'pendente', risco: 'baixo', exige_aprovacao: false, agente_origem: 'telegram_operacional_nr22888', modelo_ia_usado: 'sonnet_4_6', data_criacao: today(), observacao: 'Baixo risco: pronto para aplicar no CRM após conferência.' });
      await base44.asServiceRole.entities.EliteActionLog.create({ data_hora: today(), usuario: user.email, cliente_id: client.id, agente: 'Telegram Operacional NR22888', ferramenta_usada: 'processTelegramCommandSafe', acao_sugerida: 'registrar visita', acao_executada: 'criar CRMUpdateQueue baixo risco', aprovado_pelo_usuario: false, resultado: note });
      resposta = `Anotação de visita preparada para ${client.first_name || client.clinic_name}. Fila criada para aplicar com segurança.`;
      acao = 'registrar visita via fila segura';
    } else if (cmd === '/followup') {
      const [name, ...dateParts] = args.split(' ');
      client = await findClient(base44, name);
      if (!client) throw new Error('Cliente não encontrado');
      const due = dateParts.join(' ') || 'próximo contato';
      await base44.asServiceRole.entities.Task.create({ client_id: client.id, client_name: client.first_name || client.clinic_name, title: `Follow-up: ${client.first_name || client.clinic_name}`, description: `Criado pelo Telegram: ${due}`, status: 'pendente', priority: 'media', type: 'follow_up', auto_created: true, assigned_to: user.email, assigned_to_name: user.full_name || user.email });
      resposta = `Follow-up criado para ${client.first_name || client.clinic_name}: ${due}.`;
      acao = 'criar follow-up';
    } else if (cmd === '/whatsapp') {
      const [name, ...goalParts] = args.split(' ');
      client = await findClient(base44, name);
      if (!client) throw new Error('Cliente não encontrado');
      const objetivo = goalParts.join(' ') || 'retomar conversa comercial';
      const score = (await base44.asServiceRole.entities.EliteLeadScore.filter({ cliente_id: client.id }))[0];
      const nome = client.first_name || client.full_name || client.clinic_name || 'cliente';
      const produto = score?.produto_recomendado || client.equipment_interest || 'Seamaty';
      const mensagem = `Olá ${nome}, tudo bem? Pensei em te chamar sobre ${objetivo}, principalmente olhando o potencial do ${produto} para sua rotina. Posso te mostrar um caminho simples e objetivo para avaliarmos o próximo passo?`;
      pending = await base44.asServiceRole.entities.PendingMessage.create({ canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: nome, destinatario_contato: client.phone || '', cliente_id: client.id, contexto: 'Telegram Operacional NR22888 — WhatsApp seguro', context: 'Telegram Operacional NR22888 — WhatsApp seguro', mensagem, message_content: mensagem, status: 'aguardando_aprovacao', criado_por_agente: 'telegram_operacional_nr22888', modelo_ia_usado: 'sonnet_4_6', aprovado_por_nathan: false, data_criacao: today(), priority: score?.elite_score >= 71 ? 'alta' : 'media', recipient_id: client.id, recipient_name: nome, recipient_phone: client.phone || '', ai_reasoning: objetivo, proxima_acao: 'Nathan revisar e enviar manualmente pelo WhatsApp' });
      await base44.asServiceRole.entities.EliteActionLog.create({ data_hora: today(), usuario: user.email, cliente_id: client.id, agente: 'Telegram Operacional NR22888', ferramenta_usada: 'processTelegramCommandSafe', modelo_ia_usado: 'sonnet_4_6', acao_sugerida: 'gerar WhatsApp seguro', acao_executada: 'criar PendingMessage aguardando aprovação', mensagem_gerada: mensagem, aprovado_pelo_usuario: false, resultado: 'PendingMessage criado; envio automático bloqueado' });
      resposta = `Mensagem WhatsApp criada para aprovação. Nada foi enviado automaticamente.`;
      acao = 'criar PendingMessage WhatsApp';
    } else if (cmd === '/atualizar') {
      const [name, field, ...valueParts] = args.split(' ');
      client = await findClient(base44, name);
      if (!client) throw new Error('Cliente não encontrado');
      const critical = ['status_funil','valor_estimado','proposta','fechamento','telefone','phone','email','responsavel','responsável','cidade','classificacao','classificação'].includes(String(field || '').toLowerCase());
      queue = await base44.asServiceRole.entities.CRMUpdateQueue.create({ origem: 'telegram', texto_original: text, comando_interpretado: '/atualizar', cliente_id: client.id, tipo_atualizacao: 'atualizacao_crm', campo_alvo: field || 'notes', valor_novo: valueParts.join(' '), status: 'pendente', risco: critical ? 'alto' : 'baixo', exige_aprovacao: critical, agente_origem: 'telegram_operacional_nr22888', modelo_ia_usado: 'gpt_5_5', data_criacao: today(), observacao: critical ? 'Campo crítico: exige aprovação de Nathan.' : 'Baixo risco: pode ser aplicado após conferência.' });
      resposta = `Atualização segura criada para ${client.first_name || client.clinic_name}. Risco: ${critical ? 'alto' : 'baixo'}.`;
      acao = 'criar CRMUpdateQueue';
      status = critical ? 'pendente_aprovacao' : 'interpretado';
    } else {
      resposta = 'Comando não reconhecido. Use /resumo_dia, /cliente, /visita, /followup, /whatsapp, /quentes, /propostas_paradas, /inativos ou /atualizar.';
      acao = 'orientar comandos disponíveis';
    }

    const log = await createTelegramLog(base44, { usuario: user.email, mensagem_recebida: text, intencao_detectada: cmd, cliente_detectado: client?.first_name || client?.clinic_name || '', acao_sugerida: acao, crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '', status, resposta_gerada: resposta });
    return Response.json({ resposta, comando: cmd, telegram_log_id: log.id, crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '', envio_automatico: false });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.TelegramCommandLog.create({ data_hora: today(), mensagem_recebida: '', intencao_detectada: 'erro', status: 'erro', erro: error.message });
    } catch (_e) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});