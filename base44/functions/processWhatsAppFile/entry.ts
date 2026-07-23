import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.file_url || !body.file_name) return Response.json({ error: 'file_url e file_name são obrigatórios' }, { status: 400 });

    const queue = await base44.entities.CRMUpdateQueue.create({
      origem: 'whatsapp',
      texto_original: `Arquivo recebido para análise: ${String(body.file_name).slice(0, 180)}`,
      comando_interpretado: 'Revisar arquivo antes de importar ou alterar registros',
      tipo_atualizacao: 'processar_arquivo_pendente',
      campo_alvo: 'arquivo_importacao',
      valor_novo: JSON.stringify({ file_url: body.file_url, file_type: body.file_type, file_name: body.file_name }),
      status: 'pendente',
      risco: 'alto',
      exige_aprovacao: true,
      agente_origem: 'processWhatsAppFile',
      data_criacao: new Date().toISOString(),
      observacao: 'Nenhum lead, visita ou dado comercial foi criado. Nenhuma resposta externa foi enviada.'
    });

    return Response.json({
      success: true,
      queue_id: queue.id,
      status: 'pendente',
      records_created: 0,
      messages_sent: 0,
      message: 'Arquivo registrado para revisão. Nenhuma importação ou envio foi realizado.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});