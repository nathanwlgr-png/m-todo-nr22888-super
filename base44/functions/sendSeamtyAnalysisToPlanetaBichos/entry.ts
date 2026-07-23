import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const message = [
      'Rascunho técnico SEAMATY preparado para revisão humana.',
      '',
      'O conteúdo científico, parâmetros, faixas laboratoriais, casos clínicos, autores, artigos, DOI, resultados e referências não foram gerados por inferência.',
      'Informação não confirmada: qualquer dado técnico deverá ser incluído somente após validação em fonte oficial e registro previamente validado no CRM.',
      'Nenhuma condição comercial, preço ou recomendação clínica foi adicionada.',
      '',
      'Nenhum envio externo foi realizado.'
    ].join('\n');

    if (payload.dry_run === true) {
      return Response.json({
        success: true,
        dry_run: true,
        message: 'Validação concluída sem criar registros e sem realizar envios'
      });
    }

    const pendingMessage = await base44.entities.PendingMessage.create({
      canal: 'whatsapp',
      channel: 'whatsapp',
      destinatario_nome: 'Planeta Bichos',
      contexto: 'Rascunho técnico SEAMATY sujeito a validação humana e documental',
      context: 'Material preparado para revisão; informação técnica não confirmada',
      mensagem: message,
      message_content: message,
      status: 'aguardando_aprovacao',
      criado_por_agente: 'sendSeamtyAnalysisToPlanetaBichos',
      modelo_ia_usado: 'nenhum',
      aprovado_por_nathan: false,
      data_criacao: new Date().toISOString(),
      priority: 'media'
    });

    return Response.json({
      success: true,
      pending_message_id: pendingMessage.id,
      message: 'Rascunho criado em PendingMessage e aguardando aprovação; nenhum envio foi realizado'
    });
  } catch (error) {
    console.error('Erro ao preparar rascunho SEAMATY:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});