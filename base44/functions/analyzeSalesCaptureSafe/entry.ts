import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();

    if (body.action === 'approve') {
      const rows = await base44.entities.CRMUpdateQueue.filter({ id: body.queue_id });
      const queue = rows?.[0];
      if (!queue || queue.status !== 'pendente') return Response.json({ error: 'Registro pendente não encontrado' }, { status: 404 });
      if (!queue.cliente_id) return Response.json({ error: 'Confirme o cliente antes de aceitar' }, { status: 400 });
      const draft = JSON.parse(queue.valor_novo || '{}');
      const sale = await base44.entities.Sale.create({
        client_id: queue.cliente_id,
        client_name: draft.client_name,
        equipment_name: draft.items?.map((item) => `${item.quantity || 1}x ${item.name}`).join(', ') || 'Venda capturada',
        sale_value: Number(draft.total_value || 0),
        sale_date: draft.sale_date || new Date().toISOString().slice(0, 10),
        payment_terms: draft.payment_terms || 'Não identificado',
        status: 'fechada',
        notes: `Venda confirmada por captura visual. Evidência: ${draft.file_url}`,
        salesperson: user.email
      });
      await base44.entities.CRMUpdateQueue.update(queue.id, { status: 'aplicado', data_aprovacao: new Date().toISOString(), data_aplicacao: new Date().toISOString(), observacao: `Venda ${sale.id} criada após aprovação de ${user.email}.` });
      return Response.json({ success: true, sale_id: sale.id });
    }

    if (!body.file_url) return Response.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    const analysis = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      file_urls: [body.file_url],
      prompt: `Analise esta foto ou vídeo curto de uma tela comercial. Extraia somente dados realmente visíveis: cliente ou clínica, código do cliente, produtos vendidos, quantidades, valores unitários, valor total, data e condição de pagamento. Não invente. Some valores apenas quando forem legíveis. Se houver várias telas, consolide sem duplicar linhas.`,
      response_json_schema: {
        type: 'object',
        properties: {
          client_name: { type: 'string' }, client_code: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit_value: { type: 'number' }, total_value: { type: 'number' } } } },
          total_value: { type: 'number' }, sale_date: { type: 'string' }, payment_terms: { type: 'string' }, confidence: { type: 'number' }, evidence_summary: { type: 'string' }
        }
      }
    });
    let client = null;
    if (analysis.client_code) client = (await base44.entities.Client.filter({ external_code: analysis.client_code }))?.[0] || null;
    if (!client && analysis.client_name) {
      const clients = await base44.entities.Client.list('-updated_date', 200);
      const target = analysis.client_name.toLowerCase();
      client = clients.find((item) => [item.full_name, item.first_name, item.clinic_name].filter(Boolean).some((name) => name.toLowerCase().includes(target) || target.includes(name.toLowerCase()))) || null;
    }
    const draft = { ...analysis, client_name: client?.full_name || analysis.client_name, file_url: body.file_url, file_name: body.file_name };
    const queue = await base44.entities.CRMUpdateQueue.create({ origem: 'agente', texto_original: `Captura visual: ${body.file_name || 'arquivo'}`, comando_interpretado: 'Criar venda após aprovação', cliente_id: client?.id || '', tipo_atualizacao: 'criar_venda', campo_alvo: 'Sale', valor_novo: JSON.stringify(draft), status: 'pendente', risco: 'alto', exige_aprovacao: true, agente_origem: 'assistente_voz_gemini', modelo_ia_usado: 'gemini_3_flash', data_criacao: new Date().toISOString(), observacao: analysis.evidence_summary });
    return Response.json({ success: true, queue_id: queue.id, draft, client_matched: Boolean(client), client_id: client?.id || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});