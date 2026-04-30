import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * whatsappMasterOrchestrator v2 — Orquestrador Master melhorado
 * Suporta: inteligência de vendas, identificação de clientes, deduplicação, comandos rápidos
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    // --- INTELIGÊNCIA DE VENDAS ---
    if (action === 'getSalesIntelligence') {
      const [clients, sales, tasks, visits] = await Promise.all([
        base44.entities.Client.list('-purchase_score', 200),
        base44.entities.Sale.list('-sale_date', 100),
        base44.entities.Task.filter({ status: 'pendente' }),
        base44.entities.Visit.filter({ status: 'agendada' })
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const hotClients = clients.filter(c => (c.purchase_score || 0) > 70).slice(0, 5);
      const monthSales = sales.filter(s => new Date(s.sale_date) >= monthStart && ['fechada','entregue'].includes(s.status));
      const totalRevenue = monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
      const upcomingVisits = visits
        .filter(v => new Date(v.scheduled_date) >= now)
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
        .slice(0, 5);

      const noContact7d = clients.filter(c => {
        if (!c.last_contact_date) return true;
        return (now - new Date(c.last_contact_date)) / 86400000 > 7;
      }).length;

      return Response.json({
        success: true,
        intelligence: {
          topHotClients: hotClients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.full_name || ''}`.trim(),
            clinic: c.clinic_name,
            score: c.purchase_score,
            city: c.city,
            lastContact: c.last_contact_date,
            phone: c.phone,
            nextAction: c.ai_next_best_action || 'Fazer follow-up',
            stage: c.pipeline_stage
          })),
          metrics: {
            totalRevenueMonth: totalRevenue,
            salesCountMonth: monthSales.length,
            avgTicket: monthSales.length > 0 ? Math.round(totalRevenue / monthSales.length) : 0,
            hotClientsCount: hotClients.length,
            overdueTasks: overdueTasks.length,
            upcomingVisitsCount: upcomingVisits.length,
            noContactIn7Days: noContact7d,
            totalClients: clients.length
          },
          upcomingVisits: upcomingVisits.map(v => ({
            client: v.client_name,
            date: v.scheduled_date,
            location: v.location,
            type: v.visit_type
          })),
          urgentTasks: overdueTasks.slice(0, 5).map(t => ({
            title: t.title,
            client: t.client_name,
            due: t.due_date,
            priority: t.priority
          }))
        }
      });
    }

    // --- IDENTIFICAR CLIENTE ---
    if (action === 'identifyClient') {
      const { query, city } = data || {};
      if (!query) return Response.json({ error: 'query obrigatório' }, { status: 400 });

      const result = await base44.functions.invoke('smartClientMatcher', { query, city });
      return Response.json({ success: true, ...result.data });
    }

    // --- DEDUPLICAÇÃO ---
    if (action === 'deduplicateCRM') {
      const { mode = 'scan', entity = 'Client' } = data || {};
      const result = await base44.functions.invoke('deduplicateAndClean', { mode, entity });
      return Response.json({ success: true, ...result.data });
    }

    // --- DASHBOARD RÁPIDO ---
    if (action === 'getQuickDashboard') {
      const [clients, tasks, alerts, pendingMsgs] = await Promise.all([
        base44.entities.Client.filter({ status: 'quente' }, '-purchase_score', 10),
        base44.entities.Task.filter({ status: 'pendente' }),
        base44.entities.Alert.filter({ read: false }),
        base44.entities.PendingMessage.filter({ status: 'pending' })
      ]);

      const now = new Date();
      const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
      const today = tasks.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d.toDateString() === now.toDateString();
      });

      return Response.json({
        success: true,
        dashboard: {
          hotClients: clients.length,
          pendingTasks: tasks.length,
          overdueTasks: overdue.length,
          todayTasks: today.length,
          unreadAlerts: alerts.length,
          pendingMessages: pendingMsgs.length,
          topHot: clients.slice(0, 3).map(c => ({
            name: c.first_name || c.full_name,
            score: c.purchase_score,
            city: c.city,
            phone: c.phone
          }))
        }
      });
    }

    // --- COMANDOS RÁPIDOS ---
    if (action === 'getQuickCommands') {
      return Response.json({
        success: true,
        commands: [
          { emoji: '📊', cmd: 'relatório', desc: 'Relatório vendas do período' },
          { emoji: '🔥', cmd: 'quentes', desc: 'Top 5 leads quentes agora' },
          { emoji: '🗺️', cmd: 'rota hoje', desc: 'Otimiza minha rota de hoje' },
          { emoji: '💼', cmd: 'proposta [cliente]', desc: 'Gera proposta personalizada' },
          { emoji: '🔍', cmd: 'pesquisa [nome]', desc: 'Pesquisa clínica completa' },
          { emoji: '🏦', cmd: 'score [CNPJ]', desc: 'Consulta score de crédito' },
          { emoji: '📤', cmd: 'importar', desc: 'Importação em massa' },
          { emoji: '📅', cmd: 'agenda hoje', desc: 'Agenda completa do dia' },
          { emoji: '🔔', cmd: 'reativar', desc: 'Clientes inativos para contatar' },
          { emoji: '💡', cmd: 'sugestões', desc: '3 ações estratégicas agora' },
          { emoji: '🧹', cmd: 'limpar duplicatas', desc: 'Deduplicação inteligente do CRM' },
          { emoji: '📈', cmd: 'dashboard', desc: 'KPIs em tempo real' }
        ]
      });
    }

    // --- PROCESSAR COMANDO ---
    if (action === 'processCommand') {
      const { cmd } = data || {};
      const cmdLower = (cmd || '').toLowerCase();

      if (cmdLower.includes('quentes')) {
        const clients = await base44.entities.Client.filter({ status: 'quente' }, '-purchase_score', 5);
        return Response.json({
          success: true,
          hotClients: clients.map(c => ({
            name: `${c.first_name || ''} (${c.city || 'sem cidade'})`,
            score: c.purchase_score,
            phone: c.phone,
            stage: c.pipeline_stage,
            lastContact: c.last_contact_date
          }))
        });
      }

      if (cmdLower.includes('dashboard')) {
        return base44.functions.invoke('whatsappMasterOrchestrator', { action: 'getQuickDashboard', data: {} });
      }

      return Response.json({ success: false, error: 'Comando não reconhecido. Use "comandos" para ver a lista.' });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});