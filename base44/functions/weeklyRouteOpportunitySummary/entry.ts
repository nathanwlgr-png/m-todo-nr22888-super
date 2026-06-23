import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const [clients, visits, tasks, users] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 5000),
      base44.asServiceRole.entities.Visit.list('-scheduled_date', 1000).catch(() => []),
      base44.asServiceRole.entities.Task.list('-due_date', 1000).catch(() => []),
      base44.asServiceRole.entities.User.list().catch(() => [])
    ]);

    const clientById = new Map(clients.map((client) => [client.id, client]));
    const weekVisits = visits.filter((visit) => {
      const date = String(visit.scheduled_date || '').slice(0, 10);
      return date >= startDate && date <= endDate && visit.status === 'realizada';
    });

    const weekRouteTasks = tasks.filter((task) => {
      const due = String(task.due_date || '').slice(0, 10);
      const title = String(task.title || '');
      return due >= startDate && due <= endDate && title.includes('Sniper Comercial Semana');
    });

    const visitedIds = new Set(weekVisits.map((visit) => visit.client_id).filter(Boolean));
    const routeIds = new Set(weekRouteTasks.map((task) => task.client_id).filter(Boolean));
    const allIds = [...new Set([...visitedIds, ...routeIds])];

    const cityOrder = ['BAURU', 'BOTUCATU', 'OURINHOS', 'ASSIS', 'LINS', 'MARÍLIA', 'MARILIA'];
    const getName = (client, fallback) => client?.clinic_name || client?.full_name || client?.first_name || fallback || 'Clínica';
    const getTags = (client) => client?.custom_tags || [];
    const getThreat = (client) => {
      const tags = getTags(client);
      if (tags.includes('Ataque_IDEXX')) return 'IDEXX';
      if (tags.includes('Lab_Proprio_Alta_Prioridade')) return 'Lab próprio / hospital 24h';
      if (tags.includes('Base_Seamaty_Upsell')) return 'Upsell Seamaty';
      if (tags.includes('Concorrente_Oculto_Validar')) return 'Concorrente oculto';
      return 'Sem ameaça crítica marcada';
    };
    const getOpportunityStatus = (client, task, visit) => {
      if (client?.pipeline_stage === 'fechado') return 'Fechado';
      if (client?.pipeline_stage === 'proposta') return 'Proposta em andamento';
      if (client?.pipeline_stage === 'negociacao') return 'Negociação';
      if (visit?.status === 'realizada' && task?.status === 'concluida') return 'Visitado e tarefa concluída';
      if (visit?.status === 'realizada') return 'Visitado — atualizar próxima ação';
      if (task?.status === 'concluida') return 'Tarefa concluída — confirmar resultado';
      if (task?.status === 'pendente') return 'Pendente na rota';
      return client?.status === 'quente' ? 'Quente' : client?.status === 'frio' ? 'Radar' : 'Em qualificação';
    };
    const getNextAction = (client, status) => {
      if (status === 'Fechado') return 'Registrar fechamento, entrega e pós-venda.';
      if (status === 'Proposta em andamento') return 'Fazer follow-up da proposta e pedir decisão.';
      if (status === 'Negociação') return 'Tratar objeções e ajustar condição comercial.';
      if (status.includes('Visitado')) return client?.next_action || 'Registrar resultado da visita, gerar SPIN e enviar WhatsApp de continuidade.';
      if (status === 'Pendente na rota') return 'Reagendar visita ou contato WhatsApp ainda esta semana.';
      return client?.next_action || 'Manter no radar e validar oportunidade na próxima passagem pela cidade.';
    };

    const rows = allIds.map((id) => {
      const client = clientById.get(id);
      const visit = weekVisits.find((item) => item.client_id === id);
      const task = weekRouteTasks.find((item) => item.client_id === id);
      const status = getOpportunityStatus(client, task, visit);
      return {
        cidade: client?.city || visit?.location || 'Cidade não informada',
        clinica: getName(client, visit?.client_name || task?.client_name),
        visitada: visitedIds.has(id) ? 'Sim' : 'Não',
        status,
        ameaca: getThreat(client),
        score: Number(client?.purchase_score || 0),
        produto: String(client?.equipment_suggestion || client?.equipment_interest || 'VG1/VG2 Hemogás').split('|')[0].trim(),
        proxima: getNextAction(client, status)
      };
    }).sort((a, b) => {
      const rankA = cityOrder.indexOf(String(a.cidade || '').toUpperCase());
      const rankB = cityOrder.indexOf(String(b.cidade || '').toUpperCase());
      const cityA = rankA < 0 ? 99 : rankA;
      const cityB = rankB < 0 ? 99 : rankB;
      if (cityA !== cityB) return cityA - cityB;
      return b.score - a.score;
    });

    const byCity = rows.reduce((acc, row) => {
      if (!acc[row.cidade]) acc[row.cidade] = [];
      acc[row.cidade].push(row);
      return acc;
    }, {});

    const htmlRows = rows.map((row) => `
      <tr>
        <td>${row.cidade}</td>
        <td><strong>${row.clinica}</strong></td>
        <td>${row.visitada}</td>
        <td>${row.status}</td>
        <td>${row.ameaca}</td>
        <td>${row.score}</td>
        <td>${row.produto}</td>
        <td>${row.proxima}</td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;color:#64748b">Nenhuma visita realizada ou rota Sniper encontrada no período.</td></tr>';

    const citySummary = Object.entries(byCity).map(([city, items]) => {
      const visited = items.filter((item) => item.visitada === 'Sim').length;
      return `<li><strong>${city}</strong>: ${visited}/${items.length} visitadas · ${items.filter((item) => item.status.includes('Proposta')).length} em proposta · ${items.filter((item) => item.ameaca === 'IDEXX').length} IDEXX</li>`;
    }).join('') || '<li>Sem rotas registradas no período.</li>';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; max-width: 960px; margin: 0 auto; }
    h1 { color: #0f172a; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .kpi { background: #f1f5f9; border-radius: 12px; padding: 14px; text-align: center; }
    .kpi strong { font-size: 26px; display: block; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
    th { background: #0f172a; color: #fff; padding: 9px; text-align: left; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
    ul { line-height: 1.7; }
    .footer { margin-top: 28px; color: #64748b; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>Resumo Semanal de Rotas e Oportunidades</h1>
  <p><strong>Período:</strong> ${startDate} a ${endDate}</p>
  <div class="kpis">
    <div class="kpi"><strong>${weekVisits.length}</strong>Visitas realizadas</div>
    <div class="kpi"><strong>${weekRouteTasks.length}</strong>Tarefas de rota</div>
    <div class="kpi"><strong>${rows.filter((row) => row.status.includes('Proposta')).length}</strong>Em proposta</div>
    <div class="kpi"><strong>${rows.filter((row) => row.ameaca === 'IDEXX').length}</strong>Ataques IDEXX</div>
  </div>
  <h2>Resumo por rota</h2>
  <ul>${citySummary}</ul>
  <h2>Clínicas e status das oportunidades</h2>
  <table>
    <tr><th>Cidade</th><th>Clínica</th><th>Visitada</th><th>Status</th><th>Ameaça</th><th>Score</th><th>Produto</th><th>Próxima ação</th></tr>
    ${htmlRows}
  </table>
  <p class="footer">CRM NR22888 · Fluxo: Dashboard Sniper → Cliente → Investigação → SPIN → WhatsApp → Proposta → Fechamento</p>
</body>
</html>`;

    const recipients = [...new Set(users.filter((user) => user.email && user.role === 'admin').map((user) => user.email))];
    const finalRecipients = recipients.length > 0 ? recipients : ['nathan.wlgr@gmail.com'];

    for (const email of finalRecipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Resumo semanal de rotas e oportunidades — ${startDate} a ${endDate}`,
        body: html,
        from_name: 'CRM NR22888'
      });
      await base44.asServiceRole.entities.Alert.create({
        user_email: email,
        title: 'Resumo semanal de rotas e oportunidades',
        message: `Resumo enviado por e-mail. Período ${startDate} a ${endDate}: ${weekVisits.length} visitas realizadas, ${weekRouteTasks.length} tarefas de rota, ${rows.length} oportunidades acompanhadas.`,
        type: 'high_score_lead',
        priority: 'alta',
        link_to: '/ScheduledAgenda',
        read: false,
        dismissed: false
      });
    }

    await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'route',
      user_message: 'Resumo semanal automático de clínicas visitadas e oportunidades por rota',
      ai_response: `Resumo semanal enviado para ${finalRecipients.length} destinatário(s). Visitas: ${weekVisits.length}. Tarefas de rota: ${weekRouteTasks.length}. Oportunidades: ${rows.length}.`,
      source: 'automation',
      success: true,
      model_used: 'CRM_NR22888_operacional'
    });

    return Response.json({
      success: true,
      recipients: finalRecipients.length,
      period: { start: startDate, end: endDate },
      visits_done: weekVisits.length,
      route_tasks: weekRouteTasks.length,
      opportunities: rows.length,
      cities: Object.keys(byCity)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});