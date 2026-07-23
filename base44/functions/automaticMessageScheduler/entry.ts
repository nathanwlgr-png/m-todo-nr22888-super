import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, automationConfig = {}, confirmed_by_user } = await req.json();
    const getSettings = () => base44.entities.AutomationSettings.filter({ user_email: user.email });

    if (action === 'get_status') {
      const settings = await getSettings();
      return Response.json({
        success: true,
        enabled: Boolean(settings[0]?.automation_enabled),
        config: settings[0] || null
      });
    }

    if (action === 'disable') {
      const settings = await getSettings();
      if (settings[0]) await base44.entities.AutomationSettings.update(settings[0].id, {
        automation_enabled: false,
        last_updated: new Date().toISOString()
      });
      return Response.json({ success: true, enabled: false, message: 'Preparação automática de rascunhos desativada.' });
    }

    if (action === 'enable') {
      if (confirmed_by_user !== true) {
        return Response.json({ success: false, requires_confirmation: true, message: 'Confirmação humana obrigatória.' }, { status: 409 });
      }
      const settings = await getSettings();
      const data = {
        user_email: user.email,
        automation_enabled: true,
        message_types_enabled: automationConfig.message_types_enabled || {
          turbo_venda: false, follow_up: false, conquistar: false,
          reativacao: false, proposta: false, lembranca_visita: false
        },
        send_time: automationConfig.send_time || '09:00',
        max_messages_per_day: Math.max(1, Math.min(Number(automationConfig.max_messages_per_day) || 20, 100)),
        avoid_time_ranges: automationConfig.avoid_time_ranges || [],
        last_updated: new Date().toISOString()
      };
      if (settings[0]) await base44.entities.AutomationSettings.update(settings[0].id, data);
      else await base44.entities.AutomationSettings.create(data);
      return Response.json({ success: true, enabled: true, message: 'Preparação de rascunhos ativada; nenhum envio será automático.' });
    }

    if (action === 'execute_now') {
      if (confirmed_by_user !== true) {
        return Response.json({ success: false, requires_confirmation: true, message: 'Confirmação humana obrigatória.' }, { status: 409 });
      }
      const settings = await getSettings();
      const config = settings[0];
      if (!config?.automation_enabled) return Response.json({ success: false, message: 'Preparação de rascunhos não está ativada.' });

      const types = config.message_types_enabled || {};
      const maxDrafts = Math.max(1, Math.min(Number(config.max_messages_per_day) || 20, 100));
      const clients = await base44.entities.Client.list('-updated_date', 200);
      const pending = await base44.entities.PendingMessage.filter({ status: 'aguardando_aprovacao' }, '-created_date', 200);
      const drafts = [];

      for (const client of clients) {
        if (drafts.length >= maxDrafts || !client.phone) continue;
        const daysSince = client.last_contact_date
          ? Math.floor((Date.now() - new Date(client.last_contact_date).getTime()) / 86400000)
          : Number.POSITIVE_INFINITY;
        let messageType = '';
        let message = '';
        if (types.turbo_venda && client.status === 'quente') {
          messageType = 'turbo_venda';
          message = `Olá ${client.first_name || 'Doutor(a)'}. Revisei o momento da clínica e preparei uma sugestão objetiva. Posso te apresentar em uma conversa rápida?`;
        } else if (types.follow_up && daysSince > 7) {
          messageType = 'follow_up';
          message = `Olá ${client.first_name || 'Doutor(a)'}. Passando para acompanhar nossa última conversa. Existe algum ponto técnico ou comercial que eu possa esclarecer?`;
        } else if (types.reativacao && client.status === 'frio') {
          messageType = 'reativacao';
          message = `Olá ${client.first_name || 'Doutor(a)'}. Tenho uma atualização que pode fazer sentido para a rotina da clínica. Posso te encaminhar um resumo objetivo?`;
        } else if (types.conquistar && !client.last_contact_date) {
          messageType = 'conquistar';
          message = `Olá ${client.first_name || 'Doutor(a)'}. Trabalho com diagnóstico veterinário e preparei uma abordagem objetiva para a realidade da clínica. Posso te apresentar?`;
        }
        if (!message || pending.some((item) => item.cliente_id === client.id && item.contexto === `automacao_${messageType}`)) continue;
        const name = client.first_name || client.full_name || client.clinic_name || 'Cliente';
        drafts.push({
          canal: 'whatsapp', destinatario_nome: name, destinatario_contato: client.phone,
          cliente_id: client.id, contexto: `automacao_${messageType}`, mensagem: message,
          status: 'aguardando_aprovacao', criado_por_agente: 'automaticMessageScheduler',
          aprovado_por_nathan: false, data_criacao: new Date().toISOString(),
          recipient_id: client.id, recipient_name: name, recipient_phone: client.phone,
          channel: 'whatsapp', message_content: message, context: `automacao_${messageType}`,
          priority: client.status === 'quente' ? 'alta' : 'media'
        });
      }
      if (drafts.length) await base44.entities.PendingMessage.bulkCreate(drafts);
      return Response.json({
        success: true,
        message: `${drafts.length} rascunho(s) preparado(s) para aprovação. Nenhuma mensagem foi enviada.`,
        prepared_count: drafts.length,
        queue_status: 'aguardando_aprovacao',
        sent_count: 0,
        automatic_send: false
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});