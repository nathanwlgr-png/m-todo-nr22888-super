import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `Você é a Central Inteligente NR22888, copiloto comercial de Nathan Rosa para vendas B2B veterinárias Seamaty/Compete.

Você deve ajudar com:
- Ranking do dia
- Briefing diário
- Preparar visita
- Mensagens WhatsApp
- Roteiros SPIN Selling
- Marketing Instagram
- Campanhas por equipamento
- Análise de cliente
- Rotas comerciais
- Investigação de campo
- Numerologia comercial
- Cálculo de oportunidade
- Pós-visita
- Próximo passo

REGRAS ABSOLUTAS:
- Nunca invente dados que não estejam no CRM.
- Se faltar dado, diga claramente: "faltam dados no CRM".
- Priorize venda de equipamento antes de insumos.
- Use linguagem direta, prática e comercial.
- Use SPIN Selling e neuromarketing com elegância.
- Use numerologia apenas como inteligência interna, nunca de forma estranha para o cliente.
- Nunca envie WhatsApp sem aprovação do Nathan.
- Nunca publique Instagram sem aprovação do Nathan.

REGRAS TÉCNICAS SEAMATY:
- Nunca anunciar 36 parâmetros.
- SMT-120VP: apenas rotores circulares até 24 parâmetros.
- QT3: rotores circulares e setorizados até 24 parâmetros.
- Lab 3DX: hemogasometria, imunofluorescência e bioquímica com rotores circulares e setorizados.
- Não usar insumos/rotores nas artes principais.
- Se for marketing para tutor: traduzir técnico em benefício emocional.
- Se for marketing para veterinário: usar linguagem técnica consultiva.

Responda sempre em português, de forma estruturada com títulos e bullets quando apropriado.`;

async function callOpenAI(messages, model = 'gpt-4o-mini') {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  return await res.json();
}

async function buildContext(base44, action, clientId, location) {
  const ctx = {};

  if (action === 'briefing' || action === 'ranking') {
    const [clients, tasks, visits, sales, leads] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 30).catch(() => []),
      base44.asServiceRole.entities.Task.filter({ status: 'pendente' }, '-due_date', 20).catch(() => []),
      base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }, '-scheduled_date', 10).catch(() => []),
      base44.asServiceRole.entities.Sale.list('-sale_date', 20).catch(() => []),
      base44.asServiceRole.entities.Lead.filter({ stage: 'novo' }, '-created_date', 10).catch(() => []),
    ]);
    ctx.clients = clients;
    ctx.tasks = tasks;
    ctx.visits = visits;
    ctx.sales = sales;
    ctx.leads = leads;
    if (location?.lat) ctx.location = location;
  }

  if (action === 'prepare_visit' && clientId) {
    const [client, visits, tasks, sales] = await Promise.all([
      base44.asServiceRole.entities.Client.get(clientId).catch(() => null),
      base44.asServiceRole.entities.Visit.filter({ client_id: clientId }, '-scheduled_date', 5).catch(() => []),
      base44.asServiceRole.entities.Task.filter({ client_id: clientId }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.Sale.filter({ client_id: clientId }, '-sale_date', 5).catch(() => []),
    ]);
    ctx.client = client;
    ctx.visits = visits;
    ctx.tasks = tasks;
    ctx.sales = sales;
  }

  if (action === 'whatsapp' && clientId) {
    const client = await base44.asServiceRole.entities.Client.get(clientId).catch(() => null);
    ctx.client = client;
  }

  if (action === 'route') {
    const [clients, visits] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 20).catch(() => []),
      base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }, '-scheduled_date', 10).catch(() => []),
    ]);
    ctx.clients = clients;
    ctx.visits = visits;
    if (location?.lat) ctx.location = location;
  }

  if (action === 'field_research') {
    const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 20).catch(() => []);
    ctx.leads = leads;
    if (location?.lat) ctx.location = location;
  }

  return ctx;
}

function buildUserMessage(action, message, ctx) {
  const now = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const lines = [`Data: ${now}`, `Ação solicitada: ${action}`];

  if (message) lines.push(`Mensagem do usuário: ${message}`);

  if (ctx.client) {
    const c = ctx.client;
    lines.push(`\n--- CLIENTE ---`);
    lines.push(`Nome: ${c.first_name || ''} ${c.full_name || ''}`);
    lines.push(`Clínica: ${c.clinic_name || 'N/A'}`);
    lines.push(`Cidade: ${c.city || 'N/A'}`);
    lines.push(`Status: ${c.status || 'N/A'}`);
    lines.push(`Pipeline: ${c.pipeline_stage || 'N/A'}`);
    lines.push(`Equipamento atual: ${c.current_equipment || 'Sem equipamento'}`);
    lines.push(`Equipamento vendido: ${c.equipment_sold || 'Nenhum'}`);
    lines.push(`Interesse: ${c.equipment_interest || 'N/A'}`);
    lines.push(`Score de compra: ${c.purchase_score || 0}`);
    lines.push(`Último contato: ${c.last_contact_date || 'Nunca'}`);
    lines.push(`Próxima ação: ${c.next_action || 'N/A'}`);
    if (c.notes) lines.push(`Notas: ${c.notes.slice(0, 300)}`);
  }

  if (ctx.clients?.length) {
    lines.push(`\n--- CLIENTES (${ctx.clients.length} recentes) ---`);
    ctx.clients.slice(0, 15).forEach(c => {
      const diasSemContato = c.last_contact_date
        ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
        : 999;
      lines.push(`• ${c.first_name || c.full_name} | ${c.city || ''} | Status: ${c.status} | Pipeline: ${c.pipeline_stage} | Dias sem contato: ${diasSemContato} | Score: ${c.purchase_score || 0}`);
    });
  }

  if (ctx.tasks?.length) {
    lines.push(`\n--- TAREFAS PENDENTES (${ctx.tasks.length}) ---`);
    ctx.tasks.slice(0, 10).forEach(t => {
      lines.push(`• [${t.priority}] ${t.title} — ${t.client_name || ''} — vence: ${t.due_date || 'sem data'}`);
    });
  }

  if (ctx.visits?.length) {
    lines.push(`\n--- VISITAS (${ctx.visits.length}) ---`);
    ctx.visits.slice(0, 8).forEach(v => {
      lines.push(`• ${v.client_name} | ${new Date(v.scheduled_date).toLocaleDateString('pt-BR')} ${new Date(v.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} | ${v.visit_type} | ${v.location || ''}`);
    });
  }

  if (ctx.sales?.length) {
    lines.push(`\n--- VENDAS RECENTES (${ctx.sales.length}) ---`);
    ctx.sales.slice(0, 8).forEach(s => {
      lines.push(`• ${s.client_name} | ${s.equipment_name} | R$ ${s.sale_value?.toLocaleString('pt-BR')} | ${s.status}`);
    });
  }

  if (ctx.leads?.length) {
    lines.push(`\n--- LEADS (${ctx.leads.length}) ---`);
    ctx.leads.slice(0, 8).forEach(l => {
      lines.push(`• ${l.full_name} | ${l.company || ''} | ${l.city || ''} | Stage: ${l.stage}`);
    });
  }

  if (ctx.location?.lat) {
    lines.push(`\n--- LOCALIZAÇÃO ATUAL ---`);
    lines.push(`Lat: ${ctx.location.lat}, Lng: ${ctx.location.lng}`);
  }

  return lines.join('\n');
}

Deno.serve(async (req) => {
  const startMs = Date.now();

  if (!OPENAI_API_KEY) {
    return Response.json({ error: 'OPENAI_API_KEY não configurada. Acesse Dashboard → Settings → Environment Variables.' }, { status: 500 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action = 'general', message = '', client_id, location } = body;

  const validActions = ['briefing', 'ranking', 'prepare_visit', 'whatsapp', 'marketing', 'route', 'field_research', 'numerology', 'general'];
  const safeAction = validActions.includes(action) ? action : 'general';

  // Buscar contexto do CRM
  const ctx = await buildContext(base44, safeAction, client_id, location);

  // Montar mensagem do usuário com dados reais
  const userContent = buildUserMessage(safeAction, message, ctx);

  // Chamar OpenAI
  let aiText = '';
  let tokensUsed = 0;
  let modelUsed = 'gpt-4o-mini';

  const completion = await callOpenAI([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ], modelUsed);

  aiText = completion.choices?.[0]?.message?.content || 'Sem resposta da IA.';
  tokensUsed = completion.usage?.total_tokens || 0;

  const durationMs = Date.now() - startMs;

  // Salvar log (não bloquear resposta se falhar)
  base44.asServiceRole.entities.AIInteractionLog.create({
    user_message: message || `[${safeAction}]`,
    ai_response: aiText.slice(0, 2000),
    action_type: safeAction,
    client_id: client_id || null,
    client_name: ctx.client?.clinic_name || ctx.client?.full_name || null,
    source: 'central_ia_master',
    tokens_used: tokensUsed,
    model_used: modelUsed,
    duration_ms: durationMs,
    success: true,
  }).catch(() => {});

  return Response.json({
    success: true,
    action: safeAction,
    response: aiText,
    tokens_used: tokensUsed,
    duration_ms: durationMs,
  });
});