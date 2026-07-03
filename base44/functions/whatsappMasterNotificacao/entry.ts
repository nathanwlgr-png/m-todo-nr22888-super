// FUNÇÃO 3: WhatsApp Master Notificação - envia resumos, alertas e análises direto no WhatsApp via link
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, phone, custom_message } = await req.json();
    if (!phone || !phone.trim()) {
      return Response.json({ error: 'Parâmetro phone é obrigatório. Nenhum envio realizado.' }, { status: 400 });
    }
    const targetPhone = phone;

    let messageText = '';

    if (action === 'resumo_diario' || action === 'daily_summary') {
      // Buscar dados do dia
      const [clients, tasks, sales, visits, alerts] = await Promise.all([
        base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []),
        base44.asServiceRole.entities.Task.list('-due_date', 50).catch(() => []),
        base44.asServiceRole.entities.Sale.list('-sale_date', 30).catch(() => []),
        base44.asServiceRole.entities.Visit.list('-scheduled_date', 20).catch(() => []),
        base44.asServiceRole.entities.Alert.filter({ read: false }).catch(() => []),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const hotClients = clients.filter(c => c.status === 'quente');
      const pendingTasks = tasks.filter(t => t.status === 'pendente');
      const overdueTasks = pendingTasks.filter(t => t.due_date && t.due_date < today);
      const todayVisits = visits.filter(v => v.scheduled_date?.startsWith(today));
      const thisMonthSales = sales.filter(s => s.sale_date?.startsWith(new Date().toISOString().slice(0, 7)));
      const totalRevenue = thisMonthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);

      messageText = `🌅 *BOM DIA! RESUMO CRM NR22*\n`;
      messageText += `📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;
      messageText += `━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `🔥 *Clientes Quentes:* ${hotClients.length}\n`;
      messageText += `✅ *Tarefas Pendentes:* ${pendingTasks.length}\n`;
      if (overdueTasks.length > 0) messageText += `⚠️ *Atrasadas:* ${overdueTasks.length}\n`;
      messageText += `📍 *Visitas Hoje:* ${todayVisits.length}\n`;
      messageText += `💰 *Vendas/Mês:* ${thisMonthSales.length} (R$ ${totalRevenue.toLocaleString('pt-BR')})\n`;
      if (alerts.length > 0) messageText += `🔔 *Alertas:* ${alerts.length} não lidos\n`;
      messageText += `━━━━━━━━━━━━━━━━━━━\n\n`;

      if (hotClients.length > 0) {
        messageText += `🔥 *TOP QUENTES:*\n`;
        hotClients.slice(0, 3).forEach((c, i) => {
          messageText += `${i + 1}. ${c.first_name} - ${c.clinic_name || c.city} (${c.purchase_score}%)\n`;
        });
        messageText += `\n`;
      }

      if (todayVisits.length > 0) {
        messageText += `📍 *VISITAS HOJE:*\n`;
        todayVisits.forEach(v => {
          messageText += `• ${v.client_name} - ${v.scheduled_date?.split('T')[1]?.slice(0, 5) || 'horário n/d'}\n`;
        });
        messageText += `\n`;
      }

      messageText += `_Acesse o CRM para detalhes completos_`;
    }

    else if (action === 'alerta_clientes_frios') {
      const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []);
      const coldClients = clients.filter(c => {
        if (c.status !== 'quente' && c.status !== 'morno') return false;
        if (!c.last_contact_date) return true;
        const daysSince = Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000);
        return daysSince > 14;
      }).slice(0, 5);

      messageText = `❄️ *ALERTA: CLIENTES SEM CONTATO*\n\n`;
      coldClients.forEach((c, i) => {
        const days = c.last_contact_date
          ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
          : '?';
        messageText += `${i + 1}. *${c.first_name}* (${c.status})\n`;
        messageText += `   ${c.clinic_name || c.city} - ${days} dias sem contato\n\n`;
      });
      messageText += `_Entre em contato AGORA para não perder esses clientes!_`;
    }

    else if (action === 'relatorio_pipeline') {
      const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []);
      const stages = {
        lead: clients.filter(c => c.pipeline_stage === 'lead').length,
        qualificado: clients.filter(c => c.pipeline_stage === 'qualificado').length,
        proposta: clients.filter(c => c.pipeline_stage === 'proposta').length,
        negociacao: clients.filter(c => c.pipeline_stage === 'negociacao').length,
        fechado: clients.filter(c => c.pipeline_stage === 'fechado').length,
      };

      messageText = `📊 *PIPELINE DE VENDAS*\n\n`;
      messageText += `🌱 Lead: ${stages.lead}\n`;
      messageText += `⭐ Qualificado: ${stages.qualificado}\n`;
      messageText += `📄 Proposta: ${stages.proposta}\n`;
      messageText += `🤝 Negociação: ${stages.negociacao}\n`;
      messageText += `✅ Fechado: ${stages.fechado}\n\n`;
      messageText += `📈 *Total no funil:* ${Object.values(stages).reduce((a, b) => a + b, 0)}\n`;
      messageText += `💰 *Potencial:* ${(stages.proposta + stages.negociacao) * 45000 > 0 ? 'R$ ' + ((stages.proposta + stages.negociacao) * 45000).toLocaleString('pt-BR') : 'Calcular'}`;
    }

    else if (action === 'custom' && custom_message) {
      messageText = custom_message;
    }

    else {
      messageText = `🤖 *CRM NR22 - SISTEMA ATIVO*\n\nSistema funcionando perfeitamente!\n\n✅ WhatsApp integrado\n✅ IA Primori online\n✅ CRM completo ativo\n\nDigite *ajuda* no bot para ver todos os comandos!`;
    }

    // Gerar link WhatsApp
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappLink = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

    // Log da mensagem preparada. O envio real continua manual pelo link.
    await base44.asServiceRole.entities.WhatsAppMessage.create({
      contact_id: user.id || 'system',
      contact_name: 'Sistema NR22',
      contact_phone: targetPhone,
      direction: 'outbound_prepared',
      message: messageText,
      status: 'prepared',
      sent_by: user.email,
      sent_by_name: user.full_name,
      automated: false,
    }).catch(e => console.error('Log error:', e));

    return Response.json({
      success: true,
      message_text: messageText,
      whatsapp_link: whatsappLink,
      phone: targetPhone,
      action,
      chars: messageText.length,
    });

  } catch (error) {
    console.error('Erro whatsappMasterNotificacao:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});