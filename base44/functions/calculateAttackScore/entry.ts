import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await base44.entities.Client.list('-updated_date', 1000)
      .then(clients => clients.find(c => c.id === client_id));

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calcular scores parciais
    const scoreEstrutura = client.company_size === 'media' || client.company_size === 'grande' ? 20 : 10;
    const scoreFinanceiro = (client.available_budget || 0) > 50000 ? 20 : 10;
    const scoreInfluencia = client.status === 'quente' ? 20 : 10;
    const scoreRecorrencia = (client.average_purchase_value || 0) > 5000 ? 20 : 10;
    const scoreFechamento = (client.purchase_score || 0) >= 70 ? 20 : 10;
    const scoreEquipamento = !client.equipment_sold ? 25 : 5;

    const scoreAtaque = scoreEstrutura + scoreFinanceiro + scoreInfluencia + scoreRecorrencia + scoreFechamento + scoreEquipamento;

    // Determinar classificação
    let classificacao;
    if (scoreAtaque >= 95) classificacao = 'Ataque Imediato';
    else if (scoreAtaque >= 85) classificacao = 'Visita esta semana';
    else if (scoreAtaque >= 75) classificacao = 'WhatsApp + Agendamento';
    else if (scoreAtaque >= 60) classificacao = 'Nutrição';
    else classificacao = 'Monitoramento';

    return Response.json({
      client_id,
      client_name: client.first_name,
      scoreAtaque,
      classificacao,
      breakdown: {
        scoreEstrutura,
        scoreFinanceiro,
        scoreInfluencia,
        scoreRecorrencia,
        scoreFechamento,
        scoreEquipamento
      },
      equipamento_recomendado: !client.equipment_sold ? 'Sem equipamento - Prioridade VG1/VG2' : 'Recorrência/Expansão',
      potencial_faturamento: (client.available_budget || 0) * 0.7
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});