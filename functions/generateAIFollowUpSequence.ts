import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id, send_immediately = false } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    // Buscar dados do cliente
    const client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const [interactions, visits, tasks, sales] = await Promise.all([
      base44.asServiceRole.entities.Interaction.filter({ client_id }).catch(() => []),
      base44.asServiceRole.entities.Visit.filter({ client_id }).catch(() => []),
      base44.asServiceRole.entities.Task.filter({ client_id }).catch(() => []),
      base44.asServiceRole.entities.Sale.filter({ client_id }).catch(() => [])
    ]);

    const lastInteraction = interactions.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];

    const daysSinceLastContact = lastInteraction 
      ? Math.floor((Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
      : 999;

    // Gerar sequência personalizada com IA
    const sequence = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas e nurturing de leads.

CLIENTE: ${client.first_name}
Clínica: ${client.clinic_name || 'N/A'}
Status: ${client.status} | Score: ${client.purchase_score}%
Pipeline: ${client.pipeline_stage}

PERFIL NUMEROLÓGICO:
- Número: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo Decisão: ${client.decision_style}
- Tom Observado: ${client.client_tone || 'Não definido'}

HISTÓRICO:
- Total interações: ${interactions.length}
- Última interação: ${daysSinceLastContact} dias atrás
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Vendas: ${sales.length}
- Dores identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Equipamento interesse: ${client.equipment_interest || 'Não definido'}

TAREFA:
Crie uma sequência de follow-up COMPLETA e PERSONALIZADA com 3-5 mensagens progressivas.

Para CADA mensagem, defina:
1. Dia de envio (relativo a hoje: 0, 1, 3, 7, 14...)
2. Canal preferencial (email ou whatsapp)
3. Assunto (para email)
4. Corpo da mensagem COMPLETO e PRONTO para enviar
5. Objetivo desta mensagem específica
6. CTA (call-to-action) claro

REGRAS:
- Adapte tom ao perfil numerológico ${client.numerology_number}
- Seja progressivo: comece suave, aumente urgência gradualmente
- Use dores/interesses identificados
- Mencione valor específico (garantia 25 meses, bonificação, etc)
- Seja HUMANO, não robotizado
- Cada mensagem deve ter 2-4 parágrafos curtos
- Inclua perguntas abertas quando apropriado

Retorne JSON estruturado.`,
      response_json_schema: {
        type: "object",
        properties: {
          sequence_name: { type: "string" },
          total_messages: { type: "number" },
          estimated_duration_days: { type: "number" },
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day_offset: { type: "number" },
                channel: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                objective: { type: "string" },
                cta: { type: "string" }
              }
            }
          },
          reasoning: { type: "string" }
        }
      }
    });

    // Salvar sequência
    const followUpSequence = await base44.asServiceRole.entities.FollowUpSequence.create({
      name: sequence.sequence_name,
      trigger_type: 'manual',
      target_status: [client.status],
      active: true,
      steps: sequence.messages.map(msg => ({
        day_offset: msg.day_offset,
        channel: msg.channel,
        subject: msg.subject,
        message_template: msg.body,
        use_numerology: true
      }))
    });

    // Se envio imediato, enviar primeira mensagem
    if (send_immediately && sequence.messages.length > 0) {
      const firstMsg = sequence.messages[0];
      
      try {
        if (firstMsg.channel === 'email' && client.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: client.email,
            subject: firstMsg.subject,
            body: firstMsg.body
          });
        }

        await base44.asServiceRole.entities.FollowUpLog.create({
          client_id: client.id,
          client_name: client.first_name,
          sequence_id: followUpSequence.id,
          sequence_name: sequence.sequence_name,
          step_number: 1,
          channel: firstMsg.channel,
          status: 'sent',
          message_content: firstMsg.body
        });
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }

    return Response.json({
      success: true,
      sequence: {
        ...sequence,
        id: followUpSequence.id
      },
      first_message_sent: send_immediately
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});