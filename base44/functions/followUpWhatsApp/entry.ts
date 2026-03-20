import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TEMPLATES = {
  suave: (nome, equipamento) =>
    `Olá ${nome}! 😊\n\nPassou um tempinho desde nossa conversa e queria saber se você teve a chance de pensar na proposta do *${equipamento}*.\n\nSe tiver alguma dúvida ou quiser ajustar algum detalhe, estou à disposição!\n\nAbraços,\nEquipe Seamaty Brasil 🐾`,
  consultivo: (nome, equipamento) =>
    `Olá ${nome}! 👋\n\nEstava revisando nossa proposta do *${equipamento}* e queria entender melhor sua situação atual.\n\nPosso te mostrar como outros clientes conseguiram viabilizar a aquisição com condições especiais. Que tal conversarmos 10 minutinhos?\n\nEquipe Seamaty Brasil`,
  urgente: (nome, equipamento) =>
    `Olá ${nome}! ⚡\n\nNossa proposta do *${equipamento}* ainda está disponível, mas as condições de pagamento têm prazo.\n\nPara garantir as melhores condições — *pagamento via PIX com desconto especial* — precisamos de uma resposta até amanhã.\n\nMe chame agora! Equipe Seamaty Brasil`,
};

function getTemplate(score) {
  if (!score || score >= 700) return TEMPLATES.suave;
  if (score >= 500) return TEMPLATES.consultivo;
  return TEMPLATES.urgente;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dias_sem_resposta = 3, client_ids = [] } = await req.json();

    // Buscar clientes em negociação
    let clientes;
    if (client_ids.length > 0) {
      clientes = await Promise.all(client_ids.map(id => base44.entities.Client.get(id).catch(() => null)));
      clientes = clientes.filter(Boolean);
    } else {
      clientes = await base44.entities.Client.filter({ pipeline_stage: 'negociacao' });
    }

    // Filtrar sem resposta há N dias
    const agora = Date.now();
    const pendentes = clientes.filter(c => {
      if (!c.last_contact_date) return true;
      const diff = (agora - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= dias_sem_resposta;
    });

    // Buscar scores CNPJ
    const consultas = await base44.entities.CNPJConsulta.list('-created_date', 200);
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
      const equipamento = c.equipment_interest || c.equipment_sold || 'Seamaty VG2';
      const mensagem = templateFn(nome, equipamento);

      const phoneIntl = phone.startsWith('55') ? phone : `55${phone}`;
      const url = `https://api.whatsapp.com/send?phone=${phoneIntl}&text=${encodeURIComponent(mensagem)}`;
      whatsapp_urls.push({ client_id: c.id, client_name: c.clinic_name || c.full_name, url, mensagem });

      // Registrar interação
      await base44.entities.Interaction.create({
        client_id: c.id,
        client_name: c.clinic_name || c.full_name,
        type: 'whatsapp',
        direction: 'outbound',
        subject: `Follow-up automático — ${equipamento}`,
        notes: mensagem,
        ai_category: 'followup_automatico',
        ai_priority: score < 500 ? 'alta' : 'media',
        outcome: 'neutral',
      });

      // Atualizar data do último contato
      await base44.entities.Client.update(c.id, {
        last_contact_date: new Date().toISOString().slice(0, 10),
      });

      enviados++;
    }

    return Response.json({
      success: true,
      total_pendentes: pendentes.length,
      enviados,
      sem_telefone,
      whatsapp_urls,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});