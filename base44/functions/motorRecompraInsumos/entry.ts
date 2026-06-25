import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── MOTOR DE RECOMPRA DE INSUMOS — NR22888 ──
// Detecta clientes cujo pedido de reagente passou do prazo de recompra,
// cruza histórico de equipamento + intervalo, e PREPARA a mensagem de WhatsApp
// pronta na fila de aprovação (PendingMessage). NÃO envia nada sozinho.
// SAFE: nada é alterado no cliente. Apenas gera rascunhos para o Nathan aprovar.

function gerarMensagemRecompra(cliente, produto, equipamento, diasAtraso) {
  const nome = cliente.first_name || cliente.clinic_name || 'Doutor';
  const item = produto || 'reagentes';
  const eq = equipamento || 'seu equipamento Seamaty';
  return `Oi ${nome}, tudo bem? 😊\n\nVi aqui que seu estoque de ${item} para o ${eq} já deve estar chegando no fim (passou cerca de ${diasAtraso} dias do ciclo normal de reposição).\n\nPosso já liberar o mesmo pedido do último mês pra você, com a bonificação ativa deste mês? Assim a clínica não corre risco de parar exame nenhum. 🧪\n\nMe confirma que eu agilizo agora.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Suporta execução autenticada (botão) e automática (agendador)
    let isAutomated = false;
    try {
      const user = await base44.auth.me();
      if (!user) isAutomated = true;
    } catch (_e) { isAutomated = true; }

    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = !!body?.dry_run;
    } catch (_e) { /* sem body */ }

    const hoje = new Date();
    const preparados = [];

    // Buscar pedidos ativos em lote (evita N+1 / rate limit)
    const todosPedidos = await base44.asServiceRole.entities.ConsumableOrder
      .list('-created_date', 2000).catch(() => []);

    // Evitar duplicar rascunhos já na fila (status aguardando aprovação)
    const filaExistente = await base44.asServiceRole.entities.PendingMessage
      .filter({ status: 'aguardando_aprovacao' }, '-created_date', 1000).catch(() => []);
    const clientesJaNaFila = new Set(
      filaExistente.filter(m => m.contexto === 'recompra_insumo').map(m => m.cliente_id)
    );

    // Indexar clientes consultados (cache local para não repetir get)
    const clienteCache = {};
    const getCliente = async (id) => {
      if (!id) return null;
      if (clienteCache[id] !== undefined) return clienteCache[id];
      const c = await base44.asServiceRole.entities.Client.filter({ id }).then(r => r[0] || null).catch(() => null);
      clienteCache[id] = c;
      return c;
    };

    for (const pedido of todosPedidos) {
      if (pedido.status && pedido.status !== 'ativo') continue;
      if (!pedido.last_order_date || !pedido.client_id) continue;
      if (clientesJaNaFila.has(pedido.client_id)) continue;

      const ultimoPedido = new Date(pedido.last_order_date);
      const diasSemPedido = Math.floor((hoje - ultimoPedido) / 86400000);
      const intervalo = pedido.reorder_interval_days || 30;

      // Janela de recompra: passou do ciclo (gatilho a partir de 90% do intervalo)
      if (diasSemPedido < intervalo * 0.9) continue;

      const cliente = await getCliente(pedido.client_id);
      if (!cliente) continue;

      const diasAtraso = Math.max(0, diasSemPedido - intervalo);
      const mensagem = gerarMensagemRecompra(
        cliente, pedido.consumable_type, pedido.equipment_model, diasSemPedido
      );

      preparados.push({
        cliente_id: cliente.id,
        cliente_nome: cliente.first_name || cliente.clinic_name || 'Cliente',
        contato: cliente.phone || '',
        produto: pedido.consumable_type,
        dias_ciclo: diasSemPedido,
        dias_atraso: diasAtraso,
        mensagem,
      });

      // Marcar para não disparar de novo no mesmo ciclo (uma vez por janela)
      clientesJaNaFila.add(pedido.client_id);
    }

    if (dryRun) {
      return Response.json({
        success: true,
        dry_run: true,
        total_prontos_recompra: preparados.length,
        amostra: preparados.slice(0, 5),
        executadoEm: hoje.toISOString(),
      });
    }

    // Criar rascunhos na fila de aprovação (uma por cliente pronto)
    let criados = 0;
    for (const p of preparados) {
      const criado = await base44.asServiceRole.entities.PendingMessage.create({
        canal: 'whatsapp',
        destinatario_nome: p.cliente_nome,
        destinatario_contato: p.contato,
        cliente_id: p.cliente_id,
        contexto: 'recompra_insumo',
        mensagem: p.mensagem,
        status: 'aguardando_aprovacao',
        criado_por_agente: 'motorRecompraInsumos',
        priority: p.dias_atraso > 7 ? 'alta' : 'media',
        data_criacao: hoje.toISOString(),
      }).catch(() => null);
      if (criado) criados++;
    }

    // Alerta consolidado (se houver oportunidades)
    if (criados > 0) {
      await base44.asServiceRole.entities.Alert.create({
        title: `🧪 ${criados} recompra(s) de insumo prontas para aprovar`,
        type: 'recompra_insumo',
        message: `${criados} cliente(s) estão no ciclo de recompra de reagentes. Mensagens prontas na fila de aprovação do WhatsApp.`,
        priority: 'alta',
        status: 'pendente',
        created_date: hoje.toISOString(),
      }).catch(() => null);

      // Notificação interna via Telegram (se configurado)
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
      if (token && chatId) {
        const topo = preparados.slice(0, 5)
          .map(p => `• ${p.cliente_nome} — ${p.produto || 'reagente'} (${p.dias_ciclo}d)`).join('\n');
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🧪 MÁQUINA DE INSUMOS\n${criados} recompra(s) prontas para aprovar:\n\n${topo}\n\nAbra o WhatsApp Hub para aprovar e enviar.`,
          }),
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      total_prontos_recompra: preparados.length,
      rascunhos_criados: criados,
      modo: isAutomated ? 'automatico' : 'manual',
      executadoEm: hoje.toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});