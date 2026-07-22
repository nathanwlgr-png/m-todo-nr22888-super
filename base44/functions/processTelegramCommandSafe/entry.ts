import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const digits = (s) => String(s || '').replace(/\D/g, '');
const cmdOf = (t) => (String(t || '').trim().match(/^\/\S+/)?.[0] || '/texto').toLowerCase();
const argsOf = (t) => String(t || '').replace(/^\/\S+\s*/, '').trim();
const nameOf = (c) => c?.clinic_name || c?.first_name || c?.full_name || c?.razao_social || 'Cliente';
const days = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 999;

function api(base44, name) { return base44?.asServiceRole?.entities?.[name]; }
async function list(base44, name, sort, limit) { try { return await api(base44, name).list(sort, limit); } catch (_e) { return []; } }
async function filter(base44, name, q, sort, limit) { try { return await api(base44, name).filter(q, sort, limit); } catch (_e) { return []; } }
async function get(base44, name, id) { try { return id ? await api(base44, name).get(id) : null; } catch (_e) { return null; } }
async function create(base44, name, data) { try { return { record: await api(base44, name).create(data), error: '' }; } catch (e) { return { record: null, error: e.message }; } }
async function log(base44, user, text, cmd, resposta, extra = {}) {
  return await create(base44, 'TelegramCommandLog', { data_hora: now(), usuario: user.email, mensagem_recebida: text, intencao_detectada: cmd, resposta_gerada: resposta, status: extra.status || 'interpretado', ...extra });
}

function splitNameDetail(raw) {
  const parts = String(raw || '').includes('|') ? String(raw).split('|').map(p => p.trim()) : String(raw || '').trim().split(/\s+/);
  return String(raw || '').includes('|') ? { name: parts[0], detail: parts.slice(1).join(' | ') } : { name: parts[0] || '', detail: parts.slice(1).join(' ') };
}

async function findClients(base44, raw, limit = 6) {
  const q = String(raw || '').trim();
  if (!q) return [];
  const d = digits(q);
  const exact = [];
  if (/^[a-z0-9_-]{3,}$/i.test(q)) exact.push(['external_code', q]);
  if (d.length >= 10 && d.length <= 11) exact.push(['phone', d], ['phone', `55${d}`], ['cpf', d]);
  if (d.length === 14) exact.push(['cnpj', d]);
  for (const [field, value] of exact) {
    const rows = await filter(base44, 'Client', { [field]: value }, '-purchase_score', limit);
    if (rows.length) return rows.slice(0, limit);
  }
  const cityRows = await filter(base44, 'Client', { city: q }, '-purchase_score', limit);
  if (cityRows.length) return cityRows.slice(0, limit);
  const rows = await list(base44, 'Client', '-purchase_score', 80);
  const nq = norm(q);
  return rows.filter(c => [c.external_code, c.first_name, c.full_name, c.clinic_name, c.razao_social, c.city].filter(Boolean).some(v => norm(v).includes(nq))).slice(0, limit);
}

async function oneClient(base44, raw) {
  const rows = await findClients(base44, raw, 6);
  if (rows.length === 1) return { client: rows[0], resposta: '' };
  if (rows.length > 1) return { client: null, resposta: `Encontrei mais de um cliente. Especifique melhor:\n${rows.map((c, i) => `${i + 1}. ${nameOf(c)} · ${c.city || 'sem cidade'} · ${c.external_code || c.phone || 'sem código'}`).join('\n')}` };
  return { client: null, resposta: 'Cliente não encontrado. Tente nome, código, cidade, telefone ou CNPJ.' };
}

function randomCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
}

function catalogLink(request) {
  const appUrl = String(Deno.env.get('APP_URL') || 'https://nr22888-73878882.base44.app').replace(/\/+$/, '');
  return `${appUrl}/CatalogoCliente?codigo=${encodeURIComponent(request.client_code)}&pedido=${request.id}&token=${encodeURIComponent(request.access_token)}`;
}

async function findLead(base44, rawName, rawPhone) {
  const phone = digits(rawPhone);
  if (phone.length >= 10) {
    for (const value of [phone, phone.length <= 11 ? `55${phone}` : phone]) {
      const rows = await filter(base44, 'Lead', { phone: value }, '-updated_date', 1);
      if (rows.length) return rows[0];
    }
  }
  const rows = await list(base44, 'Lead', '-updated_date', 80);
  const wanted = norm(rawName);
  return rows.find(row => wanted && norm(row.full_name) === wanted) || null;
}

async function createCatalogRequest(base44, recipient) {
  const requestData = {
    client_id: recipient.client_id || undefined,
    lead_id: recipient.lead_id || undefined,
    recipient_type: recipient.lead_id ? 'lead' : 'client',
    recipient_phone: recipient.phone || '', sent_via: 'telegram',
    client_code: recipient.code, client_name: recipient.name,
    access_token: crypto.randomUUID(), verification_code: randomCode(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'enviado', views_count: 0, engagement_score: 10, interest_level: 'frio',
    selected_items: [], revision: 0,
    change_history: [{ changed_at: now(), action: 'criado', actor: 'telegram' }]
  };
  return await create(base44, 'CatalogRequest', requestData);
}

function competitorFor(client, competitors) {
  const city = norm(client?.city);
  const eq = norm(`${client?.current_equipment || ''} ${client?.equipment_interest || ''} ${client?.equipment_sold || ''}`);
  // Verifica vínculo direto (equipamento/marca no perfil do cliente)
  const direct = competitors.find(c => c.marca_concorrente && eq.includes(norm(c.marca_concorrente)));
  if (direct) return { ...direct, _match_type: 'cliente' };
  // Fallback: mesmo cidade
  const byCity = competitors.find(c => city && norm(c.cidade) === city);
  if (byCity) return { ...byCity, _match_type: 'cidade' };
  return null;
}

async function sniper(base44, limit = 10) {
  const [scores, competitors] = await Promise.all([
    list(base44, 'EliteLeadScore', '-elite_score', limit),
    filter(base44, 'CompetitorTracker', { ativo: true }, '-ultima_investigacao', 30)
  ]);
  const out = [];
  for (const s of scores) {
    const c = await get(base44, 'Client', s.cliente_id);
    if (!c) continue;
    const comp = competitorFor(c, competitors);
    const compLabel = comp ? (comp._match_type === 'cliente' ? `Concorrente detectado: ${comp.nome}` : `Concorrente na cidade: ${comp.nome}`) : '';
    out.push(`${out.length + 1}. ${nameOf(c)} · ${c.city || 'sem cidade'} · score ${s.elite_score || c.purchase_score || 0}\nMotivo: ${s.motivo_score || 'prioridade comercial'}\nPróxima ação: ${s.proxima_melhor_acao || c.next_action || 'abrir conversa comercial'}\n${c.phone ? 'WhatsApp disponível' : 'sem WhatsApp'}${comp ? `\n${compLabel} · ${comp.argumento_contra || comp.oportunidade_detectada || 'usar ROI Seamaty'}` : ''}`);
    if (out.length >= limit) break;
  }
  return out;
}

async function concorrentes(base44, raw) {
  const q = norm(raw);
  const comps = await filter(base44, 'CompetitorTracker', { ativo: true }, '-ultima_investigacao', 50);
  // Tenta obter cidade a partir de clientes OU usa o termo direto como cidade
  const possibleClients = q ? await findClients(base44, raw, 2) : [];
  const cityFromClient = norm(possibleClients[0]?.city || '');
  const cityDirect = q; // o próprio termo pode ser o nome da cidade
  return comps.filter(c => {
    if (!q) return true;
    const text = norm(`${c.nome} ${c.marca_concorrente} ${c.cidade} ${c.uf} ${c.equipamento_instalado} ${(c.ultima_localizacao_vista || '')}`);
    const compCity = norm(c.cidade || '');
    return text.includes(q) || (cityFromClient && compCity === cityFromClient) || compCity === cityDirect || compCity.includes(q) || q.includes(compCity);
  }).slice(0, 6).map((c, i) => `${i + 1}. ${c.nome}${c.marca_concorrente ? ` · ${c.marca_concorrente}` : ''} · ${c.cidade || 'sem cidade'}\nEquipamento visto: ${c.equipamento_instalado || 'sem evidência'}\nAmeaça: ${c.nivel_ameaca || 'médio'}\nFonte: ${(c.ultimas_publicacoes || [])[0]?.fonte || (c.fontes_consultadas || [])[0] || 'sem fonte'}\nArgumento: ${c.argumento_contra || c.oportunidade_detectada || 'Velocidade, ROI e suporte Seamaty'}\nAção: usar no SPIN e proposta.`);
}

function visitDate(value) {
  if (!value) return 'sem data';
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}

async function investigateClient(base44, raw) {
  const found = await oneClient(base44, raw);
  if (!found.client) return { matched: false, ambiguous: found.resposta.includes('mais de um'), resposta: found.resposta };

  const client = found.client;
  const visits = await filter(base44, 'Visit', { client_id: client.id }, '-scheduled_date', 10);
  const nowMs = Date.now();
  const upcoming = visits
    .filter(v => ['agendada', 'remarcada'].includes(v.status) && new Date(v.scheduled_date).getTime() >= nowMs)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0];
  const visitLines = visits.slice(0, 5).map((v, i) => `${i + 1}. ${visitDate(v.scheduled_date)} · ${v.status || 'sem status'} · ${v.visit_type || 'visita'}${v.location ? ` · ${v.location}` : ''}`);
  const resposta = `CLIENTE INVESTIGADO — ${nameOf(client)}\nClínica: ${client.clinic_name || client.razao_social || 'não informada'}\nCidade: ${client.city || 'não informada'}\nWhatsApp: ${client.phone || 'sem telefone'}\nStatus comercial: ${client.pipeline_stage || client.status || 'sem status'}\nEquipamento atual: ${client.current_equipment || 'não informado'}\nInteresse: ${client.equipment_interest || client.equipment_suggestion || 'avaliar Seamaty'}\nScore: ${client.purchase_score ?? client.health_score ?? 'sem score'}\nPróxima ação: ${client.next_action || client.ai_next_best_action || 'fazer diagnóstico SPIN'}\nPróxima visita: ${upcoming ? `${visitDate(upcoming.scheduled_date)} · ${upcoming.status}` : 'nenhuma agendada'}\n\nVISITAS RECENTES/AGENDADAS\n${visitLines.length ? visitLines.join('\n') : 'Nenhuma visita registrada.'}`;
  return { matched: true, ambiguous: false, resposta, client };
}

async function investigateCompetitor(base44, raw) {
  const q = norm(raw);
  if (!q) return 'Use /investigar [concorrente, marca ou cidade].';
  const comps = await filter(base44, 'CompetitorTracker', { ativo: true }, '-ultima_investigacao', 50);
  const matches = comps.filter(c => norm(`${c.nome} ${c.marca_concorrente} ${c.cidade} ${c.uf}`).includes(q)).slice(0, 6);
  if (!matches.length) return 'Alvo não encontrado no radar. Cadastre-o na Investigação Suprema antes de pesquisar pelo Telegram.';
  if (matches.length > 1) return `Encontrei mais de um alvo. Especifique melhor:\n${matches.map((c, i) => `${i + 1}. ${c.nome} · ${c.marca_concorrente || 'sem marca'} · ${c.cidade || 'sem cidade'}`).join('\n')}`;

  const result = await base44.functions.invoke('investigarConcorrenteSupremo', { competitor_id: matches[0].id });
  const data = result?.data || result;
  const comp = data?.competitor || matches[0];
  const source = (comp.ultimas_publicacoes || [])[0]?.fonte || (comp.fontes_consultadas || [])[0] || 'sem evidência pública';
  return `INVESTIGAÇÃO SUPREMA — ${comp.nome}\nCidade: ${comp.cidade || 'não informada'}\nMarca: ${comp.marca_concorrente || 'não informada'}\nEquipamento: ${comp.equipamento_instalado || 'sem evidência pública'}\nAmeaça: ${comp.nivel_ameaca || 'medio'}\nSinal recente: ${(comp.ultimas_publicacoes || [])[0]?.resumo || comp.inteligencia_ia || 'sem evidência pública'}\nFonte: ${source}\nOportunidade: ${comp.oportunidade_detectada || 'avaliar abertura comercial'}\nArgumento Seamaty: ${comp.argumento_contra || 'velocidade, ROI e suporte'}\nPróxima ação: usar no SPIN antes do WhatsApp e da proposta.${data?.cached ? '\nCache de hoje usado para economizar IA/API.' : ''}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    // BLINDAGEM: valida TELEGRAM_CHAT_ID se configurado
    const allowedChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const incomingChatId = String(body?.message?.chat?.id || body?.edited_message?.chat?.id || '');
    if (allowedChatId && incomingChatId && incomingChatId !== allowedChatId) {
      return Response.json({ error: 'Chat não autorizado', envio_automatico: false }, { status: 403 });
    }
    const text = body?.message?.text || body?.edited_message?.text || body.mensagem || body.text || '';
    const cmd = cmdOf(text);
    const args = argsOf(text);
    let resposta = '', status = 'interpretado', client = null, lead = null, catalogRequest = null, queue = null, pending = null, task = null, acao = '';

    if (cmd === '/sniper' || cmd === '/ranking' || cmd === '/quentes') {
      const rows = await sniper(base44, cmd === '/sniper' || cmd === '/ranking' ? 10 : 8);
      resposta = rows.length ? `${cmd === '/sniper' ? 'SNIPER DO DIA — Modo Rua' : 'OPORTUNIDADES QUENTES'}\n${rows.join('\n\n')}` : 'Nenhuma oportunidade quente encontrada.';
      acao = 'listar oportunidades';
    } else if (cmd === '/hoje' || cmd === '/resumo_dia') {
      const [visits, tasks, messages, scores, comps] = await Promise.all([
        filter(base44, 'Visit', { status: 'agendada' }, 'scheduled_date', 30),
        filter(base44, 'Task', { status: 'pendente' }, '-due_date', 80),
        list(base44, 'PendingMessage', '-created_date', 40),
        list(base44, 'EliteLeadScore', '-elite_score', 10),
        filter(base44, 'CompetitorTracker', { ativo: true }, '-ultima_investigacao', 20)
      ]);
      const todayStr = today();
      const visitsToday = visits.filter(v => String(v.scheduled_date || '').startsWith(todayStr));
      const criticalTasks = tasks.filter(t => t.priority === 'alta' || (t.due_date && t.due_date <= todayStr));
      const pend = messages.filter(m => ['pending','aguardando_aprovacao','ready_to_send','rascunho','aprovado'].includes(m.status));
      const criticalComps = comps.filter(c => ['alto','critico'].includes(c.nivel_ameaca) || c.status_monitoramento === 'oportunidade_quente');
      resposta = `HOJE — Modo Rua\nVisitas: ${visitsToday.length}\nTarefas críticas: ${criticalTasks.length}\nClientes quentes: ${scores.length}\nWhatsApps pendentes/manuais: ${pend.length}\nConcorrentes críticos: ${criticalComps.length}\nPróxima ação: ${scores[0]?.proxima_melhor_acao || criticalTasks[0]?.title || 'abrir Sniper do Dia'}.`;
      acao = 'mostrar hoje';
    } else if (cmd === '/rota') {
      const rows = (await filter(base44, 'Visit', { status: 'agendada' }, 'scheduled_date', 30)).filter(v => String(v.scheduled_date || '').startsWith(today())).slice(0, 10);
      resposta = rows.length ? rows.map((v, i) => `${i + 1}. ${v.client_name || 'Cliente'} · ${v.location || 'sem local'} · ${v.scheduled_date || ''}`).join('\n') : 'Nenhuma visita de hoje encontrada. Abra Agenda/Rota no Dashboard.';
      acao = 'listar rota';
    } else if (cmd === '/cidade') {
      const rows = await findClients(base44, args, 10);
      resposta = rows.length ? rows.map((c, i) => `${i + 1}. ${nameOf(c)} · ${c.city || 'sem cidade'} · score ${c.purchase_score || c.health_score || 0} · ${c.phone ? 'WhatsApp ok' : 'sem WhatsApp'}`).join('\n') : 'Nenhum cliente prioritário encontrado para essa cidade.';
      acao = 'listar cidade';
    } else if (cmd === '/investigar') {
      const target = args.replace(/^(cliente|visitas?)\s+/i, '').trim();
      if (!target) {
        resposta = 'Use /investigar [cliente, código, telefone, CNPJ, concorrente, marca ou cidade].';
        status = 'erro';
      } else {
        const clientSearch = await investigateClient(base44, target);
        if (clientSearch.matched || clientSearch.ambiguous) {
          resposta = clientSearch.resposta;
          client = clientSearch.client || null;
        } else {
          resposta = await investigateCompetitor(base44, target);
        }
        status = resposta.startsWith('CLIENTE INVESTIGADO') || resposta.startsWith('INVESTIGAÇÃO SUPREMA') ? 'interpretado' : 'erro';
      }
      acao = 'executar busca investigativa';
    } else if (cmd === '/concorrente') {
      const rows = await concorrentes(base44, args);
      resposta = rows.join('\n\n') || 'Nenhum concorrente encontrado para esse termo/cidade/cliente.';
      acao = 'consultar concorrente';
    } else if (cmd === '/cliente') {
      const found = await oneClient(base44, args);
      if (!found.client) { resposta = found.resposta; status = found.resposta.includes('mais de um') ? 'interpretado' : 'erro'; acao = 'buscar cliente'; }
      else {
        client = found.client;
        const [scoreRows, comps] = await Promise.all([
          filter(base44, 'EliteLeadScore', { cliente_id: client.id }, '-data_atualizacao', 1),
          filter(base44, 'CompetitorTracker', { ativo: true }, '-ultima_investigacao', 30)
        ]);
        const score = scoreRows[0];
        const comp = competitorFor(client, comps);
        const compLabel = comp ? (comp._match_type === 'cliente' ? `Concorrente detectado: ${comp.nome}` : `Concorrente na cidade: ${comp.nome}`) : 'não detectado';
        resposta = `${nameOf(client)}\nCódigo: ${client.external_code || 'sem código'}\nCidade: ${client.city || 'sem cidade'}\nWhatsApp: ${client.phone || 'sem telefone'}\nStatus: ${client.pipeline_stage || client.status || 'sem status'}\nEquipamento atual: ${client.current_equipment || 'não informado'}\nOportunidade: ${score?.produto_recomendado || client.equipment_interest || client.equipment_suggestion || 'avaliar Seamaty'}\nÚltimo contato: ${client.last_contact_date || client.last_contact_follow_up_date || 'sem registro'}\nPróxima ação: ${score?.proxima_melhor_acao || client.next_action || 'abrir conversa consultiva'}\nScore: ${score?.elite_score || client.purchase_score || 'sem score'}\n${compLabel}${comp ? ` — ${comp.argumento_contra || comp.oportunidade_detectada || 'usar ROI Seamaty'}` : ''}\nSugestão: SPIN → WhatsApp manual → proposta/material.`;
        acao = 'resumo cliente';
      }
    } else if (cmd === '/inativos') {
      const rows = await list(base44, 'Client', '-purchase_score', 60);
      resposta = rows.filter(c => days(c.last_contact_date || c.last_contact_follow_up_date) > 14 && (c.purchase_score || 0) >= 50).slice(0, 8).map((c, i) => `${i + 1}. ${nameOf(c)} · ${c.city || 'sem cidade'} · ${days(c.last_contact_date || c.last_contact_follow_up_date)} dias sem contato · ${c.phone ? 'WhatsApp ok' : 'sem WhatsApp'}`).join('\n') || 'Nenhum inativo com potencial encontrado.';
      acao = 'listar inativos';
    } else if (cmd === '/comodato') {
      const scores = await list(base44, 'EliteLeadScore', '-elite_score', 25);
      const out = [];
      for (const s of scores) {
        const c = await get(base44, 'Client', s.cliente_id);
        if (c && ((s.elite_score || 0) >= 60 || c.status === 'quente')) out.push(`${out.length + 1}. ${nameOf(c)} · ${c.city || 'sem cidade'} · score ${s.elite_score || c.purchase_score || 0} · ${s.produto_recomendado || c.equipment_interest || 'avaliar comodato'}`);
        if (out.length >= 8) break;
      }
      resposta = out.join('\n') || 'Nenhum potencial de comodato encontrado sem IA.';
      acao = 'listar comodato';
    } else if (cmd === '/catalogo') {
      const fields = args.split('|').map(value => value.trim());
      const targetName = fields[0] || '';
      const targetPhone = fields[1] || '';
      const targetCity = fields[2] || '';
      if (!targetName) {
        resposta = 'Use /catalogo Nome | telefone | cidade. Se já for cliente, também pode usar apenas /catalogo Nome.';
        status = 'erro';
      } else {
        const found = await oneClient(base44, targetName);
        if (found.client) {
          client = found.client;
          const created = await createCatalogRequest(base44, { client_id: client.id, code: client.external_code || client.id, name: nameOf(client), phone: client.phone || '' });
          catalogRequest = created.record;
          const link = catalogRequest ? catalogLink(catalogRequest) : '';
          resposta = catalogRequest && link ? `CATÁLOGO RASTREÁVEL — ${nameOf(client)}\n${link}\n\nCódigo: ${catalogRequest.verification_code}\nVálido por 24 horas. Aberturas e produtos selecionados atualizam o interesse no CRM. Nada foi enviado automaticamente.` : `Não foi possível gerar o catálogo: ${created.error || 'APP_URL não configurada'}.`;
          status = catalogRequest && link ? 'interpretado' : 'erro';
        } else if (found.resposta.includes('mais de um')) {
          resposta = found.resposta;
          status = 'interpretado';
        } else {
          lead = await findLead(base44, targetName, targetPhone);
          if (!lead) {
            const createdLead = await create(base44, 'Lead', { full_name: targetName, phone: digits(targetPhone) || undefined, city: targetCity || undefined, source: 'importacao_manual', stage: 'novo', status: 'novo', assigned_to: user.email, predictive_score: 10, conversion_probability: 10, priority_level: 'low', next_best_action: 'Aguardar abertura do catálogo rastreável', notes: `Lead criado imediatamente pelo comando /catalogo no Telegram em ${now()}.` });
            lead = createdLead.record;
            if (!lead) { resposta = `Não foi possível criar o lead: ${createdLead.error}.`; status = 'erro'; }
          }
          if (lead) {
            const created = await createCatalogRequest(base44, { lead_id: lead.id, code: `LEAD-${lead.id}`, name: lead.full_name || targetName, phone: lead.phone || targetPhone });
            catalogRequest = created.record;
            const link = catalogRequest ? catalogLink(catalogRequest) : '';
            resposta = catalogRequest && link ? `NOVO LEAD + CATÁLOGO RASTREÁVEL\nLead: ${lead.full_name || targetName}${lead.city ? ` · ${lead.city}` : ''}\n${link}\n\nCódigo: ${catalogRequest.verification_code}\nVálido por 24 horas. 1 abertura = morno; 2 ou mais aberturas, ou seleção de produto = quente. Nada foi enviado automaticamente.` : `Lead criado, mas o catálogo falhou: ${created.error || 'APP_URL não configurada'}.`;
            status = catalogRequest && link ? 'interpretado' : 'erro';
          }
        }
      }
      acao = 'gerar catalogo rastreavel';
    } else if (['/visita','/tarefa','/followup','/whatsapp','/mensagem','/proposta','/material'].includes(cmd)) {
      const parsed = splitNameDetail(args);
      const found = await oneClient(base44, parsed.name);
      if (!found.client) { resposta = found.resposta; status = found.resposta.includes('mais de um') ? 'interpretado' : 'erro'; acao = `preparar ${cmd}`; }
      else {
        client = found.client;
        const detail = parsed.detail || 'próximo passo comercial';
        if (cmd === '/visita') {
          const r = await create(base44, 'CRMUpdateQueue', { origem: 'telegram', texto_original: text, comando_interpretado: '/visita', cliente_id: client.id, tipo_atualizacao: 'resumo de visita', campo_alvo: 'notes', valor_novo: detail, status: 'pendente', risco: 'baixo', exige_aprovacao: false, agente_origem: 'telegram_operacional_nr22888', modelo_ia_usado: 'claude_sonnet_4_6', data_criacao: now(), observacao: 'Baixo risco: pronto para aplicar no CRM após conferência.' });
          queue = r.record; resposta = queue ? `Anotação de visita preparada para ${nameOf(client)}. Fila segura criada.` : `Fila indisponível: ${r.error}.`; status = queue ? 'interpretado' : 'erro';
        } else if (cmd === '/whatsapp' || cmd === '/mensagem') {
          const msg = `Olá ${nameOf(client)}, tudo bem? Pensei em te chamar sobre ${detail}. Faz sentido avaliarmos um caminho Seamaty com foco em resultado rápido, ROI e menos dependência externa?`;
          const r = await create(base44, 'PendingMessage', { canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: nameOf(client), destinatario_contato: client.phone || '', cliente_id: client.id, contexto: 'Telegram Modo Rua — WhatsApp manual', context: 'Telegram Modo Rua — WhatsApp manual', mensagem: msg, message_content: msg, status: 'aguardando_aprovacao', criado_por_agente: 'telegram_operacional_nr22888', modelo_ia_usado: 'claude_sonnet_4_6', aprovado_por_nathan: false, data_criacao: now(), priority: 'media', recipient_id: client.id, recipient_name: nameOf(client), recipient_phone: client.phone || '', ai_reasoning: detail, proxima_acao: 'Nathan revisar e abrir WhatsApp manualmente' });
          pending = r.record;
          resposta = pending ? (cmd === '/mensagem'
            ? `Cliente: ${nameOf(client)}\nCidade: ${client.city || 'sem cidade'}\nObjetivo: ${detail}\nMensagem pronta para copiar:\n"${msg}"\nAção recomendada: revisar, copiar e enviar via WhatsApp manualmente. Nada foi enviado automaticamente.`
            : 'Mensagem pronta para revisão e envio manual. Nada foi enviado automaticamente.')
            : `PendingMessage indisponível: ${r.error}.`;
          status = pending ? 'interpretado' : 'erro';
        } else {
          const label = cmd === '/proposta' ? 'Preparar proposta' : cmd === '/material' ? 'Preparar material' : cmd === '/tarefa' ? 'Tarefa' : 'Follow-up';
          const r = await create(base44, 'Task', { client_id: client.id, client_name: nameOf(client), title: `${label}: ${nameOf(client)}`, description: `Criado pelo Telegram: ${detail}. Nada é enviado automaticamente.`, status: 'pendente', priority: cmd === '/proposta' || cmd === '/material' ? 'alta' : 'media', type: cmd === '/followup' ? 'follow_up' : 'outro', auto_created: true, assigned_to: user.email, assigned_to_name: user.full_name || user.email });
          task = r.record; resposta = task ? `${label} criado com segurança para ${nameOf(client)}.` : `Task indisponível: ${r.error}.`; status = task ? 'interpretado' : 'erro';
        }
        acao = `preparar ${cmd}`;
      }
    } else if (cmd === '/pedido') {
      // Registrar pedido de insumo
      const parsed = splitNameDetail(args);
      const found = await oneClient(base44, parsed.name);
      if (!found.client) { resposta = found.resposta; status = 'interpretado'; acao = 'registrar pedido'; }
      else {
        client = found.client;
        const detail = parsed.detail || 'insumo solicitado';
        const r = await create(base44, 'Task', { client_id: client.id, client_name: nameOf(client), title: `📦 Pedido insumo: ${nameOf(client)}`, description: `Pedido registrado via Telegram: ${detail}. Nada é enviado automaticamente.`, status: 'pendente', priority: 'alta', type: 'outro', auto_created: true, assigned_to: user.email, assigned_to_name: user.full_name || user.email });
        task = r.record; resposta = task ? `Pedido de insumo registrado para ${nameOf(client)}: ${detail}.` : `Erro ao registrar: ${r.error}.`; status = task ? 'interpretado' : 'erro';
      }
      acao = 'registrar pedido';
    } else if (cmd === '/ajuda') {
      resposta = `📋 COMANDOS DISPONÍVEIS — Modo Rua NR22888

/sniper ou /ranking — Top 10 oportunidades
/hoje — Resumo do dia
/rota — Visitas de hoje
/cliente [nome] — Resumo de rua do cliente
/cidade [cidade] — Clientes da cidade
/concorrente [marca] — Consulta rápida no radar
/investigar [cliente/código/telefone/CNPJ/concorrente] — Consulta cliente, status das visitas ou Investigação Suprema
/whatsapp ou /mensagem [nome|objetivo] — Gera mensagem (revisar no CRM)
/proposta [nome|produto] — Cria tarefa de proposta
/material [nome|material] — Cria tarefa de material
/visita [nome|anotação] — Registra visita (fila segura)
/tarefa [nome|ação] — Cria tarefa
/followup [nome] — Cria follow-up
/tarefas — Lista tarefas pendentes
/followups — Lista follow-ups pendentes
/alertas — Lista alertas não lidos
/pendencias — Lista mensagens e atualizações pendentes
/quentes — Oportunidades quentes
/inativos — Clientes inativos com potencial
/comodato — Potenciais de comodato
/pedido [nome|insumo] — Registra pedido de insumo
/catalogo [nome] — Gera catálogo rastreável para cliente existente
/catalogo [nome | telefone | cidade] — Cria lead imediatamente e gera catálogo rastreável
/campanha — Campanha ativa

⚠️ Nenhum comando envia mensagem automaticamente. Tudo passa por fila de aprovação.`;
      acao = 'menu de ajuda';
    } else if (cmd === '/tarefas') {
      const tasks = await filter(base44, 'Task', { status: 'pendente' }, '-due_date', 15);
      resposta = tasks.length ? `📋 TAREFAS PENDENTES (${tasks.length})\n${tasks.map((t, i) => `${i + 1}. ${t.title || 'sem título'}${t.client_name ? ' · ' + t.client_name : ''}${t.due_date ? ' · vence ' + t.due_date : ''} · ${t.priority || 'media'}`).join('\n')}` : 'Nenhuma tarefa pendente.';
      acao = 'listar tarefas';
    } else if (cmd === '/followups') {
      const tasks = await filter(base44, 'Task', { status: 'pendente', type: 'follow_up' }, '-due_date', 15);
      resposta = tasks.length ? `📋 FOLLOW-UPS PENDENTES (${tasks.length})\n${tasks.map((t, i) => `${i + 1}. ${t.title || 'sem título'}${t.client_name ? ' · ' + t.client_name : ''}${t.due_date ? ' · vence ' + t.due_date : ''}`).join('\n')}` : 'Nenhum follow-up pendente.';
      acao = 'listar follow-ups';
    } else if (cmd === '/alertas') {
      const alerts = await filter(base44, 'Alert', { read: false }, '-created_date', 15).catch(() => []);
      resposta = alerts.length ? `🔔 ALERTAS NÃO LIDOS (${alerts.length})\n${alerts.map((a, i) => `${i + 1}. ${a.title || a.message || 'sem título'}${a.priority ? ' · ' + a.priority : ''}`).join('\n')}` : 'Nenhum alerta não lido.';
      acao = 'listar alertas';
    } else if (cmd === '/pendencias') {
      const [pend, queue] = await Promise.all([
        list(base44, 'PendingMessage', '-created_date', 10),
        filter(base44, 'CRMUpdateQueue', { status: 'pendente' }, '-data_criacao', 10)
      ]);
      const pendActive = (pend || []).filter(m => ['pending','aguardando_aprovacao','ready_to_send','rascunho','aprovado'].includes(m.status));
      const parts = [];
      if (pendActive.length) parts.push(`📨 MENSAGENS PENDENTES (${pendActive.length})\n${pendActive.map((m, i) => `${i + 1}. ${m.destinatario_nome || m.recipient_name || 'sem nome'} · ${m.status} · ${m.canal || m.channel || 'whatsapp'}`).join('\n')}`);
      if (queue.length) parts.push(`🔄 FILA CRM (${queue.length})\n${queue.map((q, i) => `${i + 1}. ${q.comando_interpretado || q.tipo_atualizacao || 'atualização'} · ${q.cliente_id || 'sem cliente'} · ${q.risco || 'medio'}`).join('\n')}`);
      resposta = parts.length ? parts.join('\n\n') : 'Nenhuma pendência encontrada.';
      acao = 'listar pendencias';
    } else if (cmd === '/campanha') {
      const camps = await filter(base44, 'Campaign', { status: 'ativa' }, '-created_date', 1).catch(() => []);
      if (camps.length > 0) {
        const c = camps[0];
        resposta = `🎯 Campanha ativa: ${c.name || c.title || 'sem nome'}\nStatus: ${c.status}\nDescrição: ${c.description || 'sem descrição'}\nData: ${c.start_date || ''} → ${c.end_date || 'sem prazo'}`;
      } else {
        resposta = '📭 Nenhuma campanha ativa no momento. Proposta nova não vincula campanha encerrada.';
      }
      acao = 'consultar campanha';
    } else {
      resposta = 'Comando não reconhecido. Use /ajuda para ver todos os comandos disponíveis.';
      acao = 'orientar comandos';
    }

    if (body.validate_only) return Response.json({ resposta, comando: cmd, validated: true, envio_automatico: false });
    const detectedName = client ? nameOf(client) : lead?.full_name || '';
    const lg = await log(base44, user, text, cmd, resposta, { status, cliente_detectado: detectedName, acao_sugerida: acao, crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '' });
    return Response.json({ resposta, comando: cmd, telegram_log_id: lg.record?.id || '', crm_update_queue_id: queue?.id || '', pending_message_id: pending?.id || '', task_id: task?.id || '', lead_id: lead?.id || '', catalog_request_id: catalogRequest?.id || '', envio_automatico: false });
  } catch (error) {
    return Response.json({ error: error.message, envio_automatico: false }, { status: 500 });
  }
});