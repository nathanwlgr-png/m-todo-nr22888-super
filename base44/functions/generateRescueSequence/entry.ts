import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mode, client_id, inactive_days_threshold = 30, limit = 50 } = body;

    // ── MODO: listar inativos ────────────────────────────────────────────────
    if (mode === 'list_inactive') {
      const allClients = await base44.entities.Client.list('-last_contact_date', 500);
      const now = Date.now();
      const inactive = allClients.filter(c => {
        if (!c.phone) return false;
        const lastContact = c.last_contact_date
          ? new Date(c.last_contact_date).getTime()
          : new Date(c.created_date).getTime();
        const daysSince = (now - lastContact) / 86400000;
        return daysSince >= inactive_days_threshold;
      }).slice(0, limit).map(c => ({
        id: c.id,
        name: c.first_name + (c.full_name ? ` ${c.full_name}` : ''),
        clinic_name: c.clinic_name || '',
        phone: c.phone,
        city: c.city || '',
        last_contact_date: c.last_contact_date || c.created_date,
        inactive_days: Math.floor((now - new Date(c.last_contact_date || c.created_date).getTime()) / 86400000),
        status: c.status || 'frio',
        equipment_interest: c.equipment_interest || '',
        equipment_sold: c.equipment_sold || '',
        purchase_score: c.purchase_score || 0,
        last_purchase_value: c.average_purchase_value || 0,
        pipeline_stage: c.pipeline_stage || 'lead'
      }));

      return Response.json({ success: true, inactive_clients: inactive, total: inactive.length });
    }

    // ── MODO: gerar sequência IA para um cliente ─────────────────────────────
    if (mode === 'generate' && client_id) {
      const clients = await base44.entities.Client.filter({ id: client_id });
      const client = clients[0];
      if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

      const now = Date.now();
      const lastContact = client.last_contact_date || client.created_date;
      const inactiveDays = Math.floor((now - new Date(lastContact).getTime()) / 86400000);
      const firstName = client.first_name || client.full_name?.split(' ')[0] || 'Doutor(a)';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o assistente de vendas da Seamaty, especialista em reativar clientes veterinários inativos.

PERFIL DO CLIENTE:
- Nome: ${firstName} ${client.full_name || ''}
- Clínica: ${client.clinic_name || 'não informado'}
- Cidade: ${client.city || 'não informado'}
- Inativo há: ${inactiveDays} dias
- Último contato: ${lastContact ? new Date(lastContact).toLocaleDateString('pt-BR') : 'nunca'}
- Equipamento de interesse: ${client.equipment_interest || 'SMT-120VP / VG2'}
- Equipamento atual: ${client.current_equipment || 'não informado'}
- Status CRM: ${client.status || 'frio'}
- Volume mensal de exames: ${client.current_volume || 'não informado'}
- Perfil comportamental: ${client.behavioral_profile || 'analítico'}

PRODUTOS SEAMATY disponíveis para oferecer:
- SMT-120VP: analisador bioquímico compacto (R$89k), resultado em 3-5 min
- VG2: hematologia completa (26 parâmetros), resultado em 3 min
- Kit combo SMT+VG2: desconto especial + bonificação em insumos

REGRAS DA SEQUÊNCIA:
1. Mensagem 1 (Dia 0): reativação suave, tom pessoal, sem mencionar produto
2. Mensagem 2 (Dia 3): agregar valor com dado/novidade relevante, sutil menção ao produto
3. Mensagem 3 (Dia 7): proposta de valor direta com urgência leve (oferta/bônus)

REGRAS DE ESCRITA:
- Máximo 3 frases por mensagem
- Usar primeiro nome do cliente
- Tom consultivo, nunca pressão
- Emojis moderados (máx 2 por msg)
- Personalizar com dados do perfil

Gere as 3 mensagens e a análise estratégica.`,
        response_json_schema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "number" },
                  text: { type: "string" },
                  day_offset: { type: "number" },
                  objective: { type: "string" }
                }
              }
            },
            ai_approach: { type: "string" },
            ai_score: { type: "number" },
            best_send_time: { type: "string" },
            key_triggers: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Calcular datas de agendamento
      const now2 = new Date();
      const messagesWithDates = (result.messages || []).map(m => ({
        step: m.step,
        text: m.text,
        status: 'pendente',
        scheduled_for: new Date(now2.getTime() + (m.day_offset || 0) * 86400000).toISOString()
      }));

      // Criar registro no banco
      const sequence = await base44.entities.RescueSequence.create({
        client_id: client.id,
        client_name: `${firstName} ${client.full_name || ''}`.trim(),
        client_phone: client.phone,
        inactive_days: inactiveDays,
        funnel_status: 'pendente',
        current_step: 0,
        total_steps: messagesWithDates.length,
        messages: messagesWithDates,
        ai_approach: result.ai_approach || '',
        ai_score: result.ai_score || 60,
        next_followup_date: messagesWithDates[0]?.scheduled_for || null,
        equipment_interest: client.equipment_interest || '',
        last_purchase_value: client.average_purchase_value || 0
      });

      return Response.json({
        success: true,
        sequence_id: sequence.id,
        messages: messagesWithDates,
        ai_approach: result.ai_approach,
        ai_score: result.ai_score,
        key_triggers: result.key_triggers || [],
        best_send_time: result.best_send_time || '09:00–11:00'
      });
    }

    // ── MODO: marcar step como enviado ──────────────────────────────────────
    if (mode === 'mark_sent') {
      const { sequence_id, step } = body;
      const seqs = await base44.entities.RescueSequence.filter({ id: sequence_id });
      const seq = seqs[0];
      if (!seq) return Response.json({ error: 'Sequência não encontrada' }, { status: 404 });

      const updatedMessages = (seq.messages || []).map(m =>
        m.step === step ? { ...m, status: 'enviada', sent_at: new Date().toISOString() } : m
      );
      const nextStep = (seq.messages || []).find(m => m.step > step && m.status === 'pendente');

      await base44.entities.RescueSequence.update(sequence_id, {
        messages: updatedMessages,
        current_step: step,
        funnel_status: 'mensagem_enviada',
        last_message_sent_at: new Date().toISOString(),
        next_followup_date: nextStep?.scheduled_for || null
      });

      // Atualizar last_contact_date no cliente
      await base44.entities.Client.update(seq.client_id, {
        last_contact_date: new Date().toISOString().split('T')[0]
      }).catch(() => null);

      return Response.json({ success: true, next_step: nextStep || null });
    }

    // ── MODO: atualizar status ───────────────────────────────────────────────
    if (mode === 'update_status') {
      const { sequence_id, funnel_status, notes, response_text } = body;
      const update = { funnel_status };
      if (notes) update.notes = notes;
      if (response_text) {
        update.response_text = response_text;
        update.response_received_at = new Date().toISOString();
      }
      if (funnel_status === 'agendado') {
        update.next_followup_date = body.next_followup_date || null;
      }
      await base44.entities.RescueSequence.update(sequence_id, update);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Modo inválido' }, { status: 400 });

  } catch (error) {
    console.error('generateRescueSequence error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});