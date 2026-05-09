import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { clients = [], sales = [], leads = [], consumables = [] } = body;

    // Calcular score para cada cliente
    const scored = clients.map(client => {
      let score = 0;
      let priority = 'frio';
      let action_type = 'follow_up';
      let action_description = 'Contato de prospecção';

      // Verifique vendas recentes
      const clientSales = sales.filter(s => s.client_id === client.id);
      const lastSaleDate = clientSales.length > 0 ? new Date(clientSales[0].sale_date) : null;
      const daysSinceLastSale = lastSaleDate ? Math.floor((Date.now() - lastSaleDate) / 86400000) : 999;

      // EQUIPAMENTO
      if (!client.equipment_sold && client.available_budget > 50000) {
        score += 35;
        priority = 'urgente';
        action_type = 'venda_equipamento';
        action_description = 'Budget confirmado, sem equipamento. Demonstração técnica.';
      } else if (daysSinceLastSale > 60 && client.purchase_score > 60) {
        score += 25;
        priority = 'quente';
        action_type = 'follow_up';
        action_description = 'Cliente parado. Reativação urgente.';
      }

      // INSUMOS
      const clientConsumables = consumables.filter(c => c.client_id === client.id);
      if (clientConsumables.some(c => c.alert_generated)) {
        score += 20;
        if (priority !== 'urgente') priority = 'quente';
        action_type = 'reposicao_insumo';
        action_description = `${clientConsumables.length} consumível(is) em falta. Venda recorrente.`;
      }

      // ENGAJAMENTO
      const daysActive = client.total_visits_count || 0;
      if (daysActive > 5) score += 10;
      
      // PIPELINE
      if (client.pipeline_stage === 'proposta') {
        score += 15;
        priority = 'urgente';
        action_description = 'Proposta em análise. Pressionar fechamento.';
      }

      // STATUS
      if (client.status === 'quente') score += 15;
      else if (client.status === 'morno') score += 5;

      // LIMITE 0-100
      score = Math.min(Math.max(score, 0), 100);
      if (score >= 75) priority = 'urgente';
      else if (score >= 60) priority = 'quente';
      else if (score >= 40) priority = 'potencial';
      else priority = 'frio';

      return {
        id: client.id,
        name: client.full_name || 'Sem nome',
        city: client.city || 'Sem cidade',
        phone: client.phone || '',
        score,
        priority,
        action_type,
        action_description,
        last_contact: client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString('pt-BR') : 'Nunca',
        potential_value: client.available_budget || 0,
        consumables_count: clientConsumables.length,
      };
    });

    // Top 10
    const top10 = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Resumo
    const summary = {
      urgente: top10.filter(x => x.priority === 'urgente').length,
      quente: top10.filter(x => x.priority === 'quente').length,
      potencial: top10.filter(x => x.priority === 'potencial').length,
      consumables: consumables.filter(c => c.alert_generated).length,
    };

    // Insights
    const insights = [];
    if (summary.urgente > 0) insights.push(`${summary.urgente} clientes URGENTES para contato hoje`);
    if (consumables.filter(c => c.alert_generated).length > 0) {
      const totalInsumos = consumables.filter(c => c.alert_generated).length;
      insights.push(`${totalInsumos} oportunidades de reposição de insumos`);
    }
    const topClientsValue = top10.reduce((a, c) => a + c.potential_value, 0);
    if (topClientsValue > 0) {
      insights.push(`Potencial total do TOP 10: R$ ${(topClientsValue / 1000).toFixed(0)}k`);
    }

    return Response.json({
      summary,
      priorities: top10,
      insights,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});