import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Vincula números de telefone salvos nos contatos com clientes do CRM
 * Analisa variações de nome para fazer match (apelidos, nomes parciais etc)
 * Retorna sugestões de dicas de abordagem com base nas mensagens analisadas
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contatos = [], mensagens = [], acao = 'vincular' } = await req.json();
    // contatos: [{ nome_salvo: 'Dr Marcos', numero: '5514999887766' }]
    // mensagens: [{ numero: '5514999887766', texto: 'Preciso de orçamento', data: '2026-02-20' }]

    const clientes = await base44.entities.Client.list('-updated_date', 500).catch(() => []);

    // Normaliza número para comparação
    const normalizePhone = (p) => (p || '').replace(/\D/g, '').replace(/^0/, '').replace(/^55/, '').slice(-9);

    if (acao === 'vincular') {
      const vinculos = [];
      const semVinculo = [];

      for (const contato of contatos) {
        const numNorm = normalizePhone(contato.numero);
        
        // Busca por número exato
        let clienteMatch = clientes.find(c => normalizePhone(c.phone) === numNorm);
        
        // Se não achou por número, tenta por nome (parcial)
        if (!clienteMatch && contato.nome_salvo) {
          const nomeLower = contato.nome_salvo.toLowerCase().replace(/[^a-záéíóúâêîôûãõ ]/gi, '').trim();
          clienteMatch = clientes.find(c => {
            const cn = ((c.first_name || '') + ' ' + (c.full_name || '') + ' ' + (c.clinic_name || '')).toLowerCase();
            const parts = nomeLower.split(' ').filter(p => p.length > 2);
            return parts.some(p => cn.includes(p));
          });
        }

        if (clienteMatch) {
          // Atualizar telefone do cliente se não tiver
          if (!clienteMatch.phone && contato.numero) {
            await base44.entities.Client.update(clienteMatch.id, {
              phone: contato.numero.replace(/\D/g, '')
            }).catch(() => {});
          }
          vinculos.push({
            contato_nome: contato.nome_salvo,
            numero: contato.numero,
            cliente_id: clienteMatch.id,
            cliente_nome: clienteMatch.first_name,
            clinica: clienteMatch.clinic_name,
            status: clienteMatch.status,
            score: clienteMatch.purchase_score,
            match_tipo: clienteMatch.phone ? 'numero' : 'nome',
          });
        } else {
          semVinculo.push({ contato_nome: contato.nome_salvo, numero: contato.numero });
        }
      }

      return Response.json({ success: true, acao: 'vincular', vinculos, sem_vinculo: semVinculo,
        total_vinculados: vinculos.length, total_sem_vinculo: semVinculo.length });
    }

    if (acao === 'analisar_mensagens') {
      // Para cada mensagem, encontra o cliente e gera dica de abordagem via IA
      const analises = [];

      for (const msg of mensagens.slice(0, 20)) { // limite 20 msgs
        const numNorm = normalizePhone(msg.numero);
        const clienteMatch = clientes.find(c => normalizePhone(c.phone) === numNorm);

        if (!clienteMatch) continue;

        // Usar IA para analisar a mensagem e gerar dica
        const dica = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em vendas de equipamentos veterinários.

MENSAGEM RECEBIDA do cliente ${clienteMatch.first_name} (${clienteMatch.clinic_name || clienteMatch.city}):
"${msg.texto}"

PERFIL DO CLIENTE:
- Status: ${clienteMatch.status}
- Score: ${clienteMatch.purchase_score}%
- Pipeline: ${clienteMatch.pipeline_stage}
- Dores: ${clienteMatch.main_pains?.join(', ') || 'N/A'}
- Último contato: ${clienteMatch.last_contact_date || 'nunca'}

Com base na mensagem, gere:
1. INTENÇÃO: O que o cliente quer/sente em 1 frase
2. URGÊNCIA: baixa/média/alta
3. RESPOSTA IDEAL: mensagem exata para enviar no WhatsApp (máx 3 linhas, tom consultivo)
4. PRÓXIMO PASSO: ação específica

Responda em JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              intencao: { type: "string" },
              urgencia: { type: "string" },
              resposta_ideal: { type: "string" },
              proximo_passo: { type: "string" }
            }
          }
        }).catch(() => ({ intencao: 'Análise indisponível', urgencia: 'média', resposta_ideal: '', proximo_passo: '' }));

        // Atualizar last_contact_date se mensagem for recente
        if (msg.data) {
          await base44.entities.Client.update(clienteMatch.id, {
            last_contact_date: msg.data
          }).catch(() => {});
        }

        analises.push({
          numero: msg.numero,
          cliente_id: clienteMatch.id,
          cliente_nome: clienteMatch.first_name,
          clinica: clienteMatch.clinic_name,
          mensagem_original: msg.texto,
          ...dica,
          whatsapp_link: dica.resposta_ideal
            ? `https://wa.me/${msg.numero.replace(/\D/g,'')}?text=${encodeURIComponent(dica.resposta_ideal)}`
            : null
        });
      }

      return Response.json({ success: true, acao: 'analisar_mensagens', analises });
    }

    if (acao === 'dica_imediata') {
      // Gera dica imediata para um número/mensagem específica
      const { numero, mensagem_texto } = await req.json().catch(() => ({}));
      const numNorm = normalizePhone(numero);
      const clienteMatch = clientes.find(c => normalizePhone(c.phone) === numNorm);

      const contexto = clienteMatch
        ? `Cliente: ${clienteMatch.first_name} | Status: ${clienteMatch.status} | Score: ${clienteMatch.purchase_score}%`
        : 'Contato desconhecido no CRM';

      const dica = await base44.integrations.Core.InvokeLLM({
        prompt: `Mensagem recebida: "${mensagem_texto}"\n${contexto}\n\nGere resposta ideal em 2-3 linhas para WhatsApp. Tom consultivo, profissional.`
      });

      // Enviar dica via WhatsApp para o vendedor
      const whatsappVendedor = user.phone || '5514991676428';
      const msgDica = `🤖 *DICA IMEDIATA*\n\nNúmero: ${numero}\nCliente CRM: ${clienteMatch?.first_name || 'Desconhecido'}\n\nMensagem recebida:\n"${mensagem_texto}"\n\n💡 Resposta sugerida:\n${dica}`;

      return Response.json({
        success: true,
        cliente: clienteMatch ? { id: clienteMatch.id, nome: clienteMatch.first_name, status: clienteMatch.status } : null,
        dica,
        whatsapp_vendedor_link: `https://wa.me/${whatsappVendedor}?text=${encodeURIComponent(msgDica.substring(0, 3800))}`
      });
    }

    return Response.json({ error: 'Ação inválida. Use: vincular, analisar_mensagens, dica_imediata' }, { status: 400 });

  } catch (error) {
    console.error('Erro vincularTelefones:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});