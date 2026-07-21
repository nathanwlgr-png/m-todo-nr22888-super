import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEMPLATES = {
  suave: (nome, equipamento) =>
    `Olá ${nome}! 😊\n\nPassou um tempinho desde nossa conversa e queria saber se você teve a chance de pensar na proposta do *${equipamento}*.\n\nSe tiver alguma dúvida ou quiser ajustar algum detalhe, estou à disposição!\n\nAbraços,\nEquipe SEAMATY Brasil 🐾`,
  consultivo: (nome, equipamento) =>
    `Olá ${nome}! 👋\n\nEstava revisando nossa proposta do *${equipamento}* e queria entender melhor sua situação atual.\n\nPosso te mostrar como outros clientes conseguiram viabilizar a aquisição com condições especiais. Que tal conversarmos 10 minutinhos?\n\nEquipe SEAMATY Brasil`,
  urgente: (nome, equipamento) =>
    `Olá ${nome}! ⚡\n\nQueria retomar nossa conversa sobre *${equipamento}*.\n\nSe ainda fizer sentido para a clínica, posso verificar as condições comerciais vigentes e ajustar a proposta conforme sua necessidade. Podemos falar hoje?\n\nEquipe SEAMATY Brasil`,
};

function getTemplate(score) {
  if (!score || score >= 700) return TEMPLATES.suave;
  if (score >= 500) return TEMPLATES.consultivo;
  return TEMPLATES.urgente;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Auth opcional: se houver usuário, é chamada manual (retorna dados).
    // Se não houver, é automação scheduled (retorna apenas contadores, sem expor dados).
    const user = await base44.auth.me().catch(() => null);
    const isAutomacao = !user;

    const { dias_sem_resposta = 3, client_ids = [], dry_run = false } = await req.json().catch(() => ({}));

    let clientes;
    if (client_ids.length > 0) {
      clientes = await Promise.all(client_ids.map(id => sr.entities.Client.get(id).catch(() => null)));
      clientes = clientes.filter(Boolean);
    } else {
      clientes = await sr.entities.Client.filter({ pipeline_stage: 'negociacao' });
    }

    const agora = Date.now();
    const pendentes = clientes.filter(c => {
      if (!c.last_contact_date) return true;
      const diff = (agora - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= dias_sem_resposta;
    });

    const consultas = await sr.entities.CNPJConsulta.list('-created_date', 200);
    const scoreMap = {};
    consultas.forEach(q => { scoreMap[q.cnpj] = q.score_estimado; });

    let enviados = 0;
    let sem_telefone = 0;
    const whatsapp_urls = [];

    for (const c of pendentes) {
      const phone = (c.phone || '').replace(/\D/g, '');
      if (!phone) { sem_telefone++; continue; }

      const cnpjLimpo = (c.cnpj || '').replace(/\D/g, '');
      const score = scoreMap[cnpjLimpo] || null;
      const templateFn = getTemplate(score);
      const nome = c.first_name || (c.full_name || '').split(' ')[0] || 'cliente';
      const equipamento = c.equipment_interest || c.equipment_sold || 'equipamento Seamaty indicado para a clínica';
      const mensagem = templateFn(nome, equipamento);

      const phoneIntl = phone.startsWith('55') ? phone : `55${phone}`;
      const url = `https://api.whatsapp.com/send?phone=${phoneIntl}&text=${encodeURIComponent(mensagem)}`;
      whatsapp_urls.push({ client_id: c.id, client_name: c.clinic_name || c.full_name, url, mensagem });

      if (!dry_run) {
        await sr.entities.PendingMessage.create({
          recipient_id: c.id,
          recipient_name: c.clinic_name || c.full_name,
          recipient_phone: phoneIntl,
          channel: 'whatsapp',
          message_content: mensagem,
          context: `Follow-up sugerido para negociação sem resposta há ${dias_sem_resposta}+ dias`,
          ai_reasoning: `Score CNPJ/risco: ${score || 'não disponível'} | Equipamento: ${equipamento}`,
          status: 'pending',
          priority: score !== null && score < 500 ? 'alta' : 'media'
        });

        await sr.entities.AIInteractionLog.create({
          user_message: `Follow-up automático preparado para ${c.clinic_name || c.full_name}`,
          ai_response: mensagem,
          action_type: 'whatsapp',
          client_id: c.id,
          client_name: c.clinic_name || c.full_name,
          source: 'automation',
          success: true
        }).catch(() => null);
      }

      enviados++;
    }

    const response = {
      success: true,
      total_pendentes: pendentes.length,
      enviados,
      preparados_para_aprovacao: enviados,
      sem_telefone,
      dry_run,
      external_messages_sent: 0,
    };

    // Chamada manual retorna URLs; automação scheduled não expõe dados de clientes
    if (!isAutomacao) {
      response.whatsapp_urls = whatsapp_urls;
    }

    return Response.json(response);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});