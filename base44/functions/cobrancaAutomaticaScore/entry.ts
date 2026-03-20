import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Gera mensagem de cobrança/negociação baseada no score Serasa estimado
function gerarMensagemCobranca({ razao_social, score, nome_contato, produto, valor }) {
  const primeiroNome = nome_contato ? nome_contato.split(' ')[0] : 'Prezado(a)';
  
  if (score >= 700) {
    return `Olá ${primeiroNome}! 😊

Analisamos o perfil da *${razao_social}* e temos uma ótima notícia:

✅ *Score aprovado!* Vocês se qualificam para nossas condições especiais:

🏦 *Boleto bancário* em até 12x
💳 *Cartão* em até 18x
⚡ *PIX à vista* com 5% de desconto

${produto ? `📦 Produto: *${produto}*` : ''}
${valor ? `💰 Valor: *R$ ${Number(valor).toLocaleString('pt-BR')}*` : ''}

Gostaria de avançar com a proposta? Posso enviar os detalhes agora mesmo! 🚀`;
  }

  if (score >= 650) {
    return `Olá ${primeiroNome}!

Analisamos o cadastro da *${razao_social}* e preparamos uma proposta especial:

⚠️ *Condições aprovadas com entrada:*
✅ Boleto com *30% de entrada* + saldo em até 6x
💳 Cartão de crédito em até 12x
⚡ PIX à vista com *8% de desconto*

${produto ? `📦 Produto: *${produto}*` : ''}
${valor ? `💰 Valor: *R$ ${Number(valor).toLocaleString('pt-BR')}*` : ''}

Essas são nossas melhores condições disponíveis agora. Podemos fechar?`;
  }

  if (score >= 500) {
    return `Olá ${primeiroNome},

Após análise do perfil da *${razao_social}*, disponibilizamos as seguintes formas de pagamento:

💳 *Cartão de crédito* em até 10x
⚡ *PIX antecipado* com 10% de desconto

${produto ? `📦 Produto: *${produto}*` : ''}
${valor ? `💰 Valor: *R$ ${Number(valor).toLocaleString('pt-BR')}*` : ''}

Para agilizar o processo, recomendamos o PIX para liberar o equipamento mais rapidamente. Confirma?`;
  }

  // Score < 500
  return `Olá ${primeiroNome},

Para prosseguir com o pedido da *${razao_social}*, nossa política exige:

⚡ *PIX à vista* — pagamento antes do faturamento
🔒 Isso garante agilidade na entrega e processamento imediato

${produto ? `📦 Produto: *${produto}*` : ''}
${valor ? `💰 Valor: *R$ ${Number(valor).toLocaleString('pt-BR')}*` : ''}

Assim que confirmarmos o pagamento, iniciamos o processo de entrega imediatamente. Posso enviar a chave PIX?`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { 
      client_id, 
      cnpj, 
      phone, 
      produto, 
      valor,
      // Se já tem score calculado, usa direto
      score_override
    } = body;

    let score = score_override;
    let razao_social = body.razao_social || '';
    let nome_contato = body.nome_contato || '';

    // Buscar dados do cliente se client_id fornecido
    if (client_id) {
      const clients = await base44.entities.Client.filter({ id: client_id });
      if (clients.length > 0) {
        const client = clients[0];
        razao_social = razao_social || client.clinic_name || client.full_name || '';
        nome_contato = nome_contato || client.first_name || client.full_name || '';
      }
    }

    // Buscar score do CNPJ se não fornecido
    if (!score && cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      const consultas = await base44.entities.CNPJConsulta.filter({ cnpj: cnpjLimpo });
      if (consultas.length > 0) {
        const ultima = consultas.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        score = ultima.score_estimado;
        razao_social = razao_social || ultima.razao_social;
      }
    }

    // Score padrão se não encontrado
    if (!score) score = 500;

    const mensagem = gerarMensagemCobranca({ razao_social, score, nome_contato, produto, valor });

    // Determinar forma de pagamento recomendada
    let forma_pagamento;
    let nivel_risco;
    if (score >= 700) { forma_pagamento = 'boleto'; nivel_risco = 'BAIXO'; }
    else if (score >= 650) { forma_pagamento = 'boleto_entrada'; nivel_risco = 'MÉDIO-BAIXO'; }
    else if (score >= 500) { forma_pagamento = 'cartao_pix'; nivel_risco = 'MÉDIO'; }
    else { forma_pagamento = 'pix_avista'; nivel_risco = 'ALTO'; }

    // Salvar no histórico de interações
    if (client_id) {
      await base44.entities.Interaction.create({
        client_id,
        client_name: razao_social,
        type: 'whatsapp',
        direction: 'outbound',
        subject: `Cobrança automática — Score ${score} — ${forma_pagamento}`,
        notes: mensagem,
        outcome: 'neutral',
        ai_category: 'cobranca_score',
        ai_priority: score < 500 ? 'alta' : score < 650 ? 'media' : 'baixa'
      });
    }

    // Abrir WhatsApp se phone fornecido
    let whatsapp_url = null;
    if (phone) {
      const phoneIntl = phone.replace(/\D/g, '');
      const phoneFormatado = phoneIntl.startsWith('55') ? phoneIntl : `55${phoneIntl}`;
      whatsapp_url = `https://api.whatsapp.com/send?phone=${phoneFormatado}&text=${encodeURIComponent(mensagem)}`;
    }

    return Response.json({
      success: true,
      score,
      nivel_risco,
      forma_pagamento_recomendada: forma_pagamento,
      mensagem,
      whatsapp_url,
      razao_social
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});