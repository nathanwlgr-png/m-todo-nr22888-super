import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { whatsappToneGuidelines } from '../../shared/whatsappTone.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json();
    const { cliente_id, lead_id, score_id, contexto_extra } = payload;

    let score = null;
    if (score_id) score = (await base44.asServiceRole.entities.EliteLeadScore.filter({ id: score_id }))[0];
    if (!score && cliente_id) score = (await base44.asServiceRole.entities.EliteLeadScore.filter({ cliente_id }))[0];
    if (!score && lead_id) score = (await base44.asServiceRole.entities.EliteLeadScore.filter({ lead_id }))[0];

    let target = null;
    let tipo = 'cliente';
    if (cliente_id || score?.cliente_id) target = (await base44.asServiceRole.entities.Client.filter({ id: cliente_id || score.cliente_id }))[0];
    if (!target && (lead_id || score?.lead_id)) {
      tipo = 'lead';
      target = (await base44.asServiceRole.entities.Lead.filter({ id: lead_id || score.lead_id }))[0];
    }
    if (!target) return Response.json({ error: 'Cliente ou lead não encontrado' }, { status: 404 });

    const nome = target.first_name || target.full_name || target.company || target.clinic_name || 'cliente';
    const produto = score?.produto_recomendado || target.equipment_interest || target.interest || 'SMT-120VP';
    const acao = score?.proxima_melhor_acao || target.next_best_action || 'mandar_whatsapp';
    const prompt = `Responda em português do Brasil com uma mensagem curta de WhatsApp para venda consultiva Seamaty. Não prometa envio automático. Cliente: ${nome}. Clínica/empresa: ${target.clinic_name || target.company || ''}. Produto recomendado: ${produto}. Ação: ${acao}. Funil: ${score?.status_funil || target.pipeline_stage || target.status || ''}. Objeção provável: ${target.real_objections?.[0] || 'preço/ROI'}. Contexto extra: ${contexto_extra || ''}. Máximo 650 caracteres.\n\n${whatsappToneGuidelines({ ...target, pipeline_stage: score?.status_funil || target.pipeline_stage })}`;

    let mensagem = '';
    try {
      mensagem = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'gpt_5_5' });
    } catch (_error) {
      mensagem = `Olá ${nome}, tudo bem? Pensei no ${produto} para ajudar sua clínica a ganhar autonomia nos exames e reduzir dependência de laboratório externo. Posso te mostrar um caminho simples de ROI e próximos passos?`;
    }

    const pending = await base44.asServiceRole.entities.PendingMessage.create({
      canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: nome, destinatario_contato: target.phone || '', cliente_id: tipo === 'cliente' ? target.id : '', lead_id: tipo === 'lead' ? target.id : '', contexto: 'Plano Elite Fase II — Como vender agora', context: 'Plano Elite Fase II — Como vender agora', mensagem, message_content: mensagem, status: 'aguardando_aprovacao', criado_por_agente: 'gerarMensagemElite', modelo_ia_usado: 'gpt_5_5', aprovado_por_nathan: false, data_criacao: new Date().toISOString(), priority: score?.classificacao_score === 'fechamento_imediato' ? 'urgente' : 'alta', recipient_id: target.id, recipient_name: nome, recipient_phone: target.phone || '', ai_reasoning: score?.motivo_score || '', proxima_acao: acao,
    });

    await base44.asServiceRole.entities.EliteActionLog.create({ data_hora: new Date().toISOString(), usuario: user.email, cliente_id: tipo === 'cliente' ? target.id : '', lead_id: tipo === 'lead' ? target.id : '', agente: 'Plano Elite Fase II', ferramenta_usada: 'gerarMensagemElite', modelo_ia_usado: 'gpt_5_5', acao_sugerida: 'gerar mensagem comercial', acao_executada: 'criar PendingMessage aguardando aprovação', mensagem_gerada: mensagem, aprovado_pelo_usuario: false, resultado: 'PendingMessage criado; envio automático bloqueado', proxima_acao: acao, valor_potencial: score?.valor_estimado || 0 });

    return Response.json({ mensagem, pending_message_id: pending.id, status: 'aguardando_aprovacao', envio_automatico: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});