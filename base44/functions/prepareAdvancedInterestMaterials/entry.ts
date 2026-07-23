import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const unwrap = (response) => response?.data || response || {};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { segment_id, trigger_version } = await req.json();
    if (!segment_id) return Response.json({ error: 'segment_id obrigatório' }, { status: 400 });

    const segment = await base44.asServiceRole.entities.ClientSegment.get(segment_id).catch(() => null);
    if (!segment) return Response.json({ error: 'Segmento não encontrado' }, { status: 404 });
    if (segment.segment_name !== 'Interesse Avançado') {
      return Response.json({ success: true, skipped: true, reason: 'Segmento fora de Interesse Avançado' });
    }

    const clientIds = [...new Set((segment.client_ids || []).filter(Boolean))];
    if (!clientIds.length) {
      return Response.json({ success: true, queued: 0, failures: [], message: 'Segmento sem clientes' });
    }

    const version = trigger_version || segment.updated_date || segment.id;
    const marker = `advanced-interest:${segment.id}:${version}`;
    const clients = (await Promise.all(clientIds.map((id) =>
      base44.asServiceRole.entities.Client.get(id).catch(() => null)
    ))).filter(Boolean);

    const pendingByClient = await Promise.all(clients.map((client) =>
      base44.asServiceRole.entities.PendingMessage.filter({ cliente_id: client.id }, '-created_date', 20).catch(() => [])
    ));
    const pendingIds = new Set(clients.filter((client, index) =>
      pendingByClient[index].some((item) => String(item.contexto || item.context || '').includes(marker))
    ).map((client) => client.id));
    const clientsToPrepare = clients.filter((client) => !pendingIds.has(client.id));

    if (!clientsToPrepare.length) {
      return Response.json({ success: true, queued: 0, duplicated: clients.length, failures: [] });
    }

    const [pdfResponse, priceTable] = await Promise.all([
      base44.asServiceRole.functions.invoke('generateVG2ScientificPDF', {}),
      base44.asServiceRole.entities.SeamatyPriceTable.filter({ product_type: 'equipamento', is_active: true }, 'product_name', 200)
    ]);
    const pdf = unwrap(pdfResponse);
    if (!pdf.success || !pdf.file_url) throw new Error(pdf.error || 'PDF científico não foi gerado');
    if (!priceTable.length) throw new Error('Tabela de equipamentos Seamaty sem itens ativos');

    const results = [];
    for (const client of clientsToPrepare) {
      try {
        let equipment = null;
        const previousSuggestion = normalize(client.equipment_suggestion);
        if (previousSuggestion) {
          equipment = priceTable.find((item) => {
            const name = normalize(item.product_name);
            const code = normalize(item.product_code);
            return name.includes(previousSuggestion) || previousSuggestion.includes(name) || code === previousSuggestion;
          });
        }

        if (!equipment) {
          const choice = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Escolha exatamente um equipamento Seamaty para este cliente. Retorne somente um product_code da lista.\nCliente: ${client.first_name || client.full_name || 'Cliente'}\nClínica: ${client.clinic_name || 'Não informada'}\nTipo: ${client.client_type || 'Não informado'}\nVolume: ${client.current_volume || 'Não informado'}\nEquipamento atual: ${client.current_equipment || 'Não informado'}\nInteresse: ${client.equipment_interest || 'Não informado'}\nNecessidades: ${(client.lab_needs || []).join(', ') || 'Não informadas'}\nDores: ${(client.main_pains || []).join(', ') || 'Não informadas'}\nOpções: ${priceTable.map((item) => `${item.product_code} — ${item.product_name}: ${item.description || ''}`).join('\n')}`,
            response_json_schema: {
              type: 'object',
              properties: {
                product_code: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['product_code', 'reason']
            }
          });
          equipment = priceTable.find((item) => normalize(item.product_code) === normalize(choice.product_code));
          if (!equipment) throw new Error('Sugestão da IA não corresponde à tabela de preços');
          client._recommendationReason = choice.reason;
        }

        const proposalResponse = await base44.asServiceRole.functions.invoke('generateWhatsAppProposal', {
          client_id: client.id,
          equipment_code: equipment.product_code,
          include_payment_terms: true,
          include_calibration: false
        });
        const proposal = unwrap(proposalResponse);
        if (!proposal.success || !proposal.proposal_content) {
          throw new Error(proposal.error || 'Proposta não foi gerada');
        }

        const clientName = client.first_name || client.full_name || client.clinic_name || 'Cliente';
        const message = `${proposal.proposal_content}\n\nMaterial científico VG2: ${pdf.file_url}`;
        await base44.asServiceRole.entities.PendingMessage.create({
          canal: 'whatsapp',
          destinatario_nome: clientName,
          destinatario_contato: client.phone || '',
          cliente_id: client.id,
          contexto: `${marker} | Segmento Interesse Avançado | Equipamento sugerido: ${equipment.product_name}`,
          mensagem: message,
          status: 'aguardando_aprovacao',
          criado_por_agente: 'whatsapp_master_agent_NR22888',
          modelo_ia_usado: 'automatic',
          aprovado_por_nathan: false,
          data_criacao: new Date().toISOString(),
          recipient_id: client.id,
          recipient_name: clientName,
          recipient_phone: client.phone || '',
          channel: 'whatsapp',
          message_content: message,
          context: `${marker} | Proposta e PDF científico preparados para aprovação manual.`,
          ai_reasoning: client._recommendationReason || `Equipamento ${equipment.product_name} já sugerido pela IA no perfil do cliente.`,
          priority: 'alta'
        });
        results.push({ client_id: client.id, success: true, equipment_code: equipment.product_code });
      } catch (error) {
        results.push({ client_id: client.id, success: false, error: error.message });
      }
    }

    return Response.json({
      success: true,
      segment_id: segment.id,
      pdf_url: pdf.file_url,
      queued: results.filter((item) => item.success).length,
      duplicated: pendingIds.size,
      failures: results.filter((item) => !item.success)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});