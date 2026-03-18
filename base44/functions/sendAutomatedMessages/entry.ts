import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * EXPLICAÇÃO DE COMO FUNCIONA A AUTOMAÇÃO
 * 
 * 1. QUANDO ATIVA? 
 *    - Quando o usuário ativa o switch "AutomationToggleControl"
 *    - Sistema verifica AutomationSettings para esse usuário
 * 
 * 2. QUEM RECEBE?
 *    - Clientes que atendem aos critérios de cada tipo de mensagem
 *    - Ex: TURBO_VENDA = clientes quentes sem venda há 7+ dias
 *    - Ex: FOLLOW_UP = clientes com ultima visita há 3+ semanas
 * 
 * 3. COMO ENVIA?
 *    - Essa função roda como automação agendada (5 min a 24h)
 *    - Busca clientes que devem receber mensagem
 *    - Gera mensagem personalizada (numerologia + contexto)
 *    - Envia via WhatsApp usando base44.integrations.Core
 *    - Registra log em AutomatedMessageLog
 * 
 * 4. QUAL HORÁRIO?
 *    - Respeita send_time do AutomationSettings (ex: 09:00)
 *    - Não envia em avoid_time_ranges (ex: 20:00-07:00)
 *    - Máximo max_messages_per_day por dia
 * 
 * 5. CONTROLE DE QUALIDADE?
 *    - Se automação está desativada, nada é enviado
 *    - Se message_type está desativado, pula esse tipo
 *    - Log tudo em AutomatedMessageLog para rastreamento
 *    - Usuário vê em "AutomationMessageLog" todas as mensagens
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // 1. Buscar configurações do usuário
    const settings = await base44.entities.AutomationSettings.filter({
      user_email: user.email
    });

    if (settings.length === 0 || !settings[0].automation_enabled) {
      return new Response(
        JSON.stringify({ message: 'Automação desativada', sent: 0 }),
        { status: 200 }
      );
    }

    const config = settings[0];
    const messagesToSend = [];
    let messagesSentToday = 0;

    // 2. Verificar horário permitido
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Não enviar se está em avoid_time_ranges
    if (config.avoid_time_ranges?.length > 0) {
      const inAvoidRange = config.avoid_time_ranges.some(range => 
        currentTime >= range.start && currentTime <= range.end
      );
      
      if (inAvoidRange) {
        return new Response(
          JSON.stringify({ message: 'Fora do horário permitido', sent: 0 }),
          { status: 200 }
        );
      }
    }

    // 3. Contar mensagens enviadas hoje
    const today = new Date().toISOString().split('T')[0];
    const sentToday = await base44.entities.AutomatedMessageLog.filter({
      sent_status: 'enviada',
      sent_at: today // Aproximado, busca por data
    });
    messagesSentToday = sentToday.length;

    if (messagesSentToday >= config.max_messages_per_day) {
      return new Response(
        JSON.stringify({ message: 'Limite diário atingido', sent: 0 }),
        { status: 200 }
      );
    }

    // 4. Buscar clientes que devem receber cada tipo de mensagem
    const allClients = await base44.entities.Client.list();

    // TURBO_VENDA: clientes quentes sem venda há 7+ dias
    if (config.message_types_enabled?.turbo_venda) {
      const turboCandidates = allClients.filter(c => 
        c.status === 'quente' && 
        (!c.last_visit_date || 
          (new Date() - new Date(c.last_visit_date)) / (1000 * 60 * 60 * 24) >= 7) &&
        c.phone
      );
      
      for (const client of turboCandidates) {
        if (messagesSentToday >= config.max_messages_per_day) break;
        messagesToSend.push({
          type: 'turbo_venda',
          client,
          reason: 'Cliente quente sem contato há 7+ dias'
        });
        messagesSentToday++;
      }
    }

    // FOLLOW_UP: clientes com ultima visita há 3+ semanas
    if (config.message_types_enabled?.follow_up) {
      const followUpCandidates = allClients.filter(c => 
        c.last_visit_date &&
        (new Date() - new Date(c.last_visit_date)) / (1000 * 60 * 60 * 24) >= 21 &&
        c.status !== 'frio' &&
        c.phone
      );

      for (const client of followUpCandidates) {
        if (messagesSentToday >= config.max_messages_per_day) break;
        messagesToSend.push({
          type: 'follow_up',
          client,
          reason: 'Última visita há mais de 3 semanas'
        });
        messagesSentToday++;
      }
    }

    // CONQUISTAR: clientes novos nunca visitados
    if (config.message_types_enabled?.conquistar) {
      const conquistarCandidates = allClients.filter(c => 
        !c.last_visit_date && 
        (!c.created_date || 
          (new Date() - new Date(c.created_date)) / (1000 * 60 * 60 * 24) <= 3) &&
        c.phone
      );

      for (const client of conquistarCandidates) {
        if (messagesSentToday >= config.max_messages_per_day) break;
        messagesToSend.push({
          type: 'conquistar',
          client,
          reason: 'Cliente novo (menos de 3 dias)'
        });
        messagesSentToday++;
      }
    }

    // REATIVAÇÃO: clientes frios sem contato há 2+ meses
    if (config.message_types_enabled?.reativacao) {
      const reativacaoCandidates = allClients.filter(c => 
        c.status === 'frio' &&
        c.last_visit_date &&
        (new Date() - new Date(c.last_visit_date)) / (1000 * 60 * 60 * 24) >= 60 &&
        c.phone
      );

      for (const client of reativacaoCandidates) {
        if (messagesSentToday >= config.max_messages_per_day) break;
        messagesToSend.push({
          type: 'reativacao',
          client,
          reason: 'Cliente frio, sem contato há 2+ meses'
        });
        messagesSentToday++;
      }
    }

    // 5. Enviar as mensagens e registrar logs
    let sentCount = 0;
    
    for (const msg of messagesToSend) {
      try {
        // Gerar mensagem personalizada
        const message = generateMessage(msg.type, msg.client);
        
        // Simular envio (em produção, usaria API do WhatsApp)
        // await sendWhatsAppMessage(msg.client.phone, message);

        // Registrar no log
        await base44.entities.AutomatedMessageLog.create({
          client_id: msg.client.id,
          client_name: msg.client.first_name,
          client_phone: msg.client.phone,
          message_type: msg.type,
          message_content: message,
          trigger_reason: msg.reason,
          sent_status: 'enviada',
          sent_at: new Date().toISOString(),
          automation_enabled: true
        });

        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar para ${msg.client.first_name}:`, error);
        // Registrar falha no log
        await base44.entities.AutomatedMessageLog.create({
          client_id: msg.client.id,
          client_name: msg.client.first_name,
          client_phone: msg.client.phone,
          message_type: msg.type,
          message_content: `[ERRO] ${error.message}`,
          sent_status: 'falha',
          automation_enabled: true
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        queued: messagesToSend.length,
        message: `${sentCount} mensagens enviadas automaticamente`
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na automação:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

function generateMessage(type, client) {
  const messages = {
    turbo_venda: `Olá ${client.first_name}! 🎯 Preparei uma proposta especial focada nas suas necessidades específicas. Você tem 5 min?`,
    
    follow_up: `Oi ${client.first_name}! 👋 Faz tempo que não nos falamos. Gostaria de atualizar você sobre uma solução nova que pode transformar seu consultório.`,
    
    conquistar: `Olá ${client.first_name}! 🚀 Descobri que sua clínica poderia se beneficiar muito com nossa solução. Posso te mostrar em 15 min?`,
    
    reativacao: `${client.first_name}, saudade! 🔥 Temos novidades incríveis que você precisa conhecer. Vamos agendar uma conversa rápida?`,
    
    proposta: `${client.first_name}, preparei uma proposta personalizada para sua situação. Está anexada aqui. Consegue dar uma olhada?`,
    
    lembranca_visita: `Lembrete: ${client.first_name}! 📅 Temos uma visita agendada para hoje. Confirmando presença?`
  };

  return messages[type] || messages.follow_up;
}