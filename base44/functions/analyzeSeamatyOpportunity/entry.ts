import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    // Buscar cliente + dados em paralelo (evita rate limit com sequential calls)
    const [clients, visits, tasks, sales] = await Promise.all([
      base44.entities.Client.filter({ id: client_id }),
      base44.entities.Visit.filter({ client_id }).catch(() => []),
      base44.entities.Task.filter({ client_id, status: 'pendente' }).catch(() => []),
      base44.entities.Sale.filter({ client_id }).catch(() => []),
    ]);

    if (!clients.length) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    const client = clients[0];

    // Análise automática (sem criar tela)
    const analysis = {
      clinic_name: client.clinic_name || client.first_name,
      city: client.city,
      score: client.purchase_score || 0,
      status: client.status || 'morno',
      
      // Equipamentos recomendados baseado em análise
      recommended_equipment: client.equipment_interest || 'VG2',
      reason: generateReason(client, visits, sales),
      
      // Potenciais
      financial_potential: calculateFinancialPotential(client, sales),
      recurrence_potential: calculateRecurrencePotential(visits),
      
      // Temperatura do lead
      lead_temperature: calculateLeadTemperature(client, visits, tasks),
      
      // Recomendações invisíveis
      insights: generateInsights(client, visits, sales, tasks),
      
      // Próxima ação
      next_action: client.next_action || 'Enviar proposta de equipamento',
    };

    return Response.json(analysis);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReason(client, visits, sales) {
  if (!client.last_purchase_date) return 'Nunca comprou. Primeira oportunidade.';
  
  const lastPurchase = new Date(client.last_purchase_date);
  const daysSincePurchase = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));
  
  if (daysSincePurchase > 180) return 'Renovação de equipamento (última compra há +6 meses)';
  if (daysSincePurchase > 90) return 'Oportunidade de comodato estratégico';
  if (client.equipment_sold === 'VG2' && !client.equipment_interest?.includes('rotor')) {
    return 'Venda cruzada: rotores e reagentes';
  }
  
  return 'Oportunidade de expansão de capacidade';
}

function calculateFinancialPotential(client, sales) {
  const avgSaleValue = sales.length > 0 
    ? sales.reduce((a, s) => a + (s.sale_value || 0), 0) / sales.length
    : 0;
  
  return Math.round((avgSaleValue || client.average_purchase_value || 0) * 1.3); // Potencial +30%
}

function calculateRecurrencePotential(visits) {
  if (visits.length === 0) return 0;
  
  const daysSpan = visits.length > 1 
    ? (new Date(visits[0].scheduled_date) - new Date(visits[visits.length - 1].scheduled_date)) / (1000 * 60 * 60 * 24)
    : 30;
  
  const frequency = Math.round((30 / (daysSpan / visits.length)) * 1000) / 10; // % de recorrência esperada
  return Math.min(frequency, 100);
}

function calculateLeadTemperature(client, visits, tasks) {
  let temp = client.purchase_score || 0;
  
  // Bonus por atividades recentes
  const now = new Date();
  const recentVisits = visits.filter(v => 
    (now - new Date(v.scheduled_date)) < 7 * 24 * 60 * 60 * 1000
  ).length;
  
  const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
  
  temp += recentVisits * 10;
  temp += pendingTasks * 5;
  
  return Math.min(temp, 100);
}

function generateInsights(client, visits, sales, tasks) {
  const insights = [];
  
  if (!client.last_contact_date) {
    insights.push('Sem contato registrado. Prospecção fria.');
  }
  
  if (visits.length === 0 && client.status === 'quente') {
    insights.push('Lead quente sem visita programada. Urgência alta.');
  }
  
  if (sales.length === 0 && client.purchase_score > 60) {
    insights.push('Score alto mas sem compra. Possível objeção em preço.');
  }
  
  if (tasks.filter(t => t.status === 'pendente').length > 3) {
    insights.push('Múltiplas tarefas pendentes. Priorizar follow-up.');
  }
  
  if (!client.equipment_sold && client.clinic_name) {
    insights.push('Sem equipamento Seamaty. Oportunidade verde-campo.');
  }
  
  return insights;
}