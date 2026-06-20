import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Alerta de Churn Silencioso — NR22888
// Detecta clientes quentes que pararam de interagir sem sinalizar saída
// Gera alerta com abordagem SPIN pronta + timing numerológico

function calcularNumeroDia(data) {
  const d = data.getDate();
  const m = data.getMonth() + 1;
  const y = data.getFullYear();
  const soma = String(d).split('').concat(String(m).split('')).concat(String(y).split(''))
    .reduce((acc, n) => acc + parseInt(n), 0);
  let r = soma;
  while (r > 9 && r !== 11 && r !== 22 && r !== 33) {
    r = String(r).split('').reduce((a, n) => a + parseInt(n), 0);
  }
  return r;
}

function calcularDiaPessoal(birthdate, hoje) {
  if (!birthdate) return null;
  const d = hoje.getDate();
  const m = hoje.getMonth() + 1;
  const nascimento = new Date(birthdate);
  const caminhoVida = calcularNumeroDia(nascimento);
  const soma = d + m + caminhoVida;
  let r = soma;
  while (r > 9 && r !== 11 && r !== 22 && r !== 33) {
    r = String(r).split('').reduce((a, n) => a + parseInt(n), 0);
  }
  return r;
}

const TIMING_POR_DIA = {
  1: 'Dia de início — ótimo para nova proposta',
  2: 'Dia de parceria — abordagem colaborativa',
  3: 'Dia de comunicação — tom leve, caso de sucesso',
  4: 'Dia de estabilidade — foco em ROI e segurança',
  5: 'Dia de mudança — apresentar inovação',
  6: 'Dia de responsabilidade — foco no cuidado animal',
  7: 'Dia de análise — mandar material, não pressionar',
  8: 'Dia de poder — perfeito para fechar e falar de investimento',
  9: 'Dia de conclusão — ótimo para encerrar pendências',
  11: 'Intuição elevada — proposta visionária',
  22: 'Construção de legado — foco em impacto a longo prazo',
};

function gerarMensagemSPIN(cliente, tipoProblemaSuspeitado) {
  const nome = cliente.first_name || 'Doutor';
  const equipamento = cliente.equipment_interest || 'equipamento Seamaty Brasil';

  if (tipoProblemaSuspeitado === 'reagente_parado') {
    return `Oi ${nome}, tudo bem? Estava passando pelos registros aqui e vi que seu fluxo de reagentes mudou. Queria saber: está tudo ok com o ${equipamento}? A gente quer garantir que a clínica nunca pare por falta de insumo.`;
  }
  if (tipoProblemaSuspeitado === 'sem_resposta') {
    return `Oi ${nome}, sei que a rotina é corrida. Só queria deixar registrado que estou aqui caso precisem de algo com o ${equipamento}. Tem alguma dúvida ou ajuste que precise?`;
  }
  if (tipoProblemaSuspeitado === 'proposta_aberta') {
    return `Oi ${nome}, você teve a chance de ver a proposta que enviei? Fico à disposição para ajustar qualquer detalhe — às vezes um número ou condição faz toda a diferença.`;
  }
  return `Oi ${nome}, estava pensando em você hoje. Como está o fluxo de exames na clínica? Qualquer apoio técnico ou comercial, estou aqui.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const hoje = new Date();
    const resultados = [];

    // Buscar clientes quentes e mornos
    const clientes = await base44.asServiceRole.entities.Client.filter({ status: 'quente' });
    const clientesMornos = await base44.asServiceRole.entities.Client.filter({ status: 'morno' });
    const todosClientes = [...clientes, ...clientesMornos];

    for (const cliente of todosClientes) {
      const alertas = [];

      // 1. Checar ConsumableOrders paradas
      const pedidos = await base44.asServiceRole.entities.ConsumableOrder.filter({
        client_id: cliente.id,
        status: 'ativo'
      });

      for (const pedido of pedidos) {
        if (!pedido.last_order_date) continue;
        const ultimoPedido = new Date(pedido.last_order_date);
        const diasSemPedido = Math.floor((hoje - ultimoPedido) / 86400000);
        const intervalo = pedido.reorder_interval_days || 12;

        if (diasSemPedido > intervalo * 1.3) {
          alertas.push({
            tipo: 'reagente_parado',
            diasAtraso: diasSemPedido - intervalo,
            produto: pedido.consumable_type,
            equipamento: pedido.equipment_model,
          });
        }
      }

      // 2. Checar silêncio prolongado (sem contato há 21+ dias com score > 50)
      if (cliente.last_contact_date) {
        const ultimoContato = new Date(cliente.last_contact_date);
        const diasSemContato = Math.floor((hoje - ultimoContato) / 86400000);
        const score = cliente.purchase_score || 0;

        if (diasSemContato >= 21 && score >= 50) {
          alertas.push({
            tipo: 'sem_resposta',
            dias: diasSemContato,
            score,
          });
        }
      }

      // 3. Checar proposta aberta sem resposta em 72h+
      const mensagensPendentes = await base44.asServiceRole.entities.WhatsAppMessage.filter({
        client_id: cliente.id,
        status: 'enviado_manual_confirmado_por_nathan',
      });

      for (const msg of mensagensPendentes) {
        const dataEnvio = new Date(msg.created_date);
        const horasSemResposta = Math.floor((hoje - dataEnvio) / 3600000);
        if (horasSemResposta >= 72) {
          alertas.push({
            tipo: 'proposta_aberta',
            horas: horasSemResposta,
          });
        }
      }

      if (alertas.length === 0) continue;

      // Calcular timing numerológico
      const diaPessoal = calcularDiaPessoal(cliente.birthdate, hoje);
      const diaNumero = calcularNumeroDia(hoje);
      const timingDescricao = diaPessoal
        ? TIMING_POR_DIA[diaPessoal] || 'Dia neutro'
        : TIMING_POR_DIA[diaNumero] || 'Dia neutro';

      // Definir melhor horário por tipo de cliente
      let melhorHorario = '09h30';
      if (cliente.client_type === 'hospital_veterinario') melhorHorario = '12h30';
      if (cliente.client_type === 'laboratorio_terceirizado') melhorHorario = '14h30';

      // Gerar mensagem SPIN para o primeiro alerta
      const tipoAlerta = alertas[0].tipo;
      const mensagemSPIN = gerarMensagemSPIN(cliente, tipoAlerta);

      // Montar alerta
      const alertaDescricao = alertas.map(a => {
        if (a.tipo === 'reagente_parado') return `${a.diasAtraso} dias de atraso no pedido de ${a.produto} (${a.equipamento})`;
        if (a.tipo === 'sem_resposta') return `${a.dias} dias sem contato (score: ${a.score})`;
        if (a.tipo === 'proposta_aberta') return `Proposta aberta há ${a.horas}h sem resposta`;
        return a.tipo;
      }).join(' | ');

      // Salvar alerta no CRM
      const nomeCliente = cliente.first_name || cliente.clinic_name || 'Cliente';
      const alertaCriado = await base44.asServiceRole.entities.Alert.create({
        title: `⚠️ Churn Silencioso — ${nomeCliente}`,
        type: 'churn_silencioso',
        message: `⚠️ CHURN SILENCIOSO — ${nomeCliente}\n📋 ${alertaDescricao}\n⏰ Melhor momento: ${melhorHorario} (${timingDescricao})\n💬 Mensagem sugerida:\n${mensagemSPIN}`,
        client_id: cliente.id,
        client_name: nomeCliente,
        user_email: 'nathan.wlgr@gmail.com',
        priority: 'alta',
        status: 'pendente',
        created_date: hoje.toISOString(),
      }).catch(() => null);

      // Salvar em AIInteractionLog
      await base44.asServiceRole.entities.AIInteractionLog.create({
        action_type: 'general',
        user_message: `Churn silencioso detectado: ${alertaDescricao}`,
        ai_response: mensagemSPIN,
        client_id: cliente.id,
        client_name: cliente.first_name || cliente.clinic_name,
        source: 'automation',
        success: true,
      }).catch(() => null);

      resultados.push({
        cliente: cliente.first_name || cliente.clinic_name,
        alertas: alertas.length,
        tipoAlerta,
        diaPessoal,
        timing: timingDescricao,
        melhorHorario,
      });
    }

    return Response.json({
      success: true,
      processados: todosClientes.length,
      alertasGerados: resultados.length,
      detalhes: resultados,
      executadoEm: hoje.toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});