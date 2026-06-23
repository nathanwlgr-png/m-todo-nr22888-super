import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekEndDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [clients, tasks, users] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 5000),
      base44.asServiceRole.entities.Task.list('-due_date', 1000).catch(() => []),
      base44.asServiceRole.entities.User.list().catch(() => [])
    ]);

    const routeTasks = tasks.filter((task) => {
      const title = String(task.title || '');
      const due = String(task.due_date || '');
      return title.includes('Sniper Comercial Semana') && due >= today && due <= weekEndDate && task.status !== 'concluida' && task.status !== 'cancelada';
    });

    const routeClientIds = new Set(routeTasks.map((task) => task.client_id).filter(Boolean));
    const priorityCities = ['BAURU', 'BOTUCATU', 'OURINHOS', 'ASSIS', 'LINS', 'MARÍLIA', 'MARILIA'];

    const selected = clients
      .filter((client) => {
        const tags = client.custom_tags || [];
        const score = Number(client.purchase_score || 0);
        return routeClientIds.has(client.id) || (
          tags.includes('Sniper_Comercial_Semana') &&
          score >= 80 &&
          (
            tags.includes('Ataque_IDEXX') ||
            tags.includes('Lab_Proprio_Alta_Prioridade') ||
            tags.includes('Base_Seamaty_Upsell') ||
            /hospital|emerg|24h|laboratorio|laboratório/i.test(`${client.clinic_name || ''} ${client.notes || ''}`)
          )
        );
      })
      .sort((a, b) => {
        const cityA = priorityCities.indexOf(String(a.city || '').toUpperCase());
        const cityB = priorityCities.indexOf(String(b.city || '').toUpperCase());
        const rankA = cityA < 0 ? 99 : cityA;
        const rankB = cityB < 0 ? 99 : cityB;
        if (rankA !== rankB) return rankA - rankB;
        return Number(b.purchase_score || 0) - Number(a.purchase_score || 0);
      })
      .slice(0, 25);

    const getName = (client) => client.clinic_name || client.full_name || client.first_name || 'Clínica';
    const getThreat = (client) => {
      const tags = client.custom_tags || [];
      if (tags.includes('Ataque_IDEXX')) return 'IDEXX';
      if (tags.includes('Lab_Proprio_Alta_Prioridade')) return 'Lab/Hospital 24h';
      if (tags.includes('Base_Seamaty_Upsell')) return 'Upsell Seamaty';
      if (tags.includes('Concorrente_Oculto_Validar')) return 'Concorrente oculto';
      return 'Prioridade comercial';
    };
    const getProduct = (client) => String(client.equipment_suggestion || client.equipment_interest || 'VG1/VG2 Hemogás').split('|')[0].trim();

    const grouped = selected.reduce((acc, client) => {
      const city = client.city || 'Cidade não informada';
      if (!acc[city]) acc[city] = [];
      acc[city].push(client);
      return acc;
    }, {});

    const lines = Object.entries(grouped).map(([city, cityClients]) => {
      const items = cityClients.slice(0, 6).map((client) => `• ${getName(client)} — score ${Number(client.purchase_score || 0)} — ${getThreat(client)} — ${getProduct(client)}`).join('\n');
      return `${city}\n${items}`;
    });

    const message = selected.length > 0
      ? `Sniper Comercial da Semana (${today} a ${weekEndDate})\n\n${lines.join('\n\n')}\n\nAção: abrir as tarefas Sniper da semana, enviar WhatsApp curto e executar Investigação → SPIN → Proposta nas prioridades IDEXX, laboratório próprio, hospital 24h e upsell Seamaty.`
      : `Sniper Comercial da Semana (${today} a ${weekEndDate})\n\nNenhuma clínica prioritária encontrada na rota atual. Ação: revisar Ranking de Oportunidades e Agenda.`;

    const recipients = users.filter((user) => user.email && (user.role === 'admin' || user.email.includes('@'))).map((user) => user.email);
    const uniqueRecipients = [...new Set(recipients)];

    const alerts = uniqueRecipients.map((email) => ({
      user_email: email,
      title: 'Sniper Comercial da Semana',
      message: message.slice(0, 7000),
      type: 'high_score_lead',
      priority: selected.length > 0 ? 'alta' : 'media',
      link_to: '/',
      read: false,
      dismissed: false
    }));

    if (alerts.length > 0) {
      await base44.asServiceRole.entities.Alert.bulkCreate(alerts);
    }

    await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'route',
      user_message: 'Alerta automático semanal Sniper Comercial',
      ai_response: `Alerta semanal gerado para ${uniqueRecipients.length} usuário(s), com ${selected.length} clínicas prioritárias. Cidades: ${Object.keys(grouped).join(', ') || 'nenhuma'}`,
      source: 'automation',
      success: true,
      model_used: 'CRM_NR22888_operacional'
    });

    return Response.json({
      success: true,
      recipients: uniqueRecipients.length,
      priority_clinics: selected.length,
      cities: Object.keys(grouped),
      generated_at: now.toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});