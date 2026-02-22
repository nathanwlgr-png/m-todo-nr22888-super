import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados de vendas e pipeline
    const [sales, leads, clients, tasks] = await Promise.all([
      base44.entities.Sale.list(),
      base44.entities.Lead.list(),
      base44.entities.Client.list(),
      base44.entities.Task.list()
    ]);

    // Calcular métricas de histórico
    const now = new Date();
    const thisMonth = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });

    const lastMonth = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      const lastMonthDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return saleDate.getMonth() === lastMonthDate.getMonth() && saleDate.getFullYear() === lastMonthDate.getFullYear();
    });

    const last3Months = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getTime() > now.getTime() - 90 * 24 * 60 * 60 * 1000;
    });

    const thisMonthRevenue = thisMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const lastMonthRevenue = lastMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const last3MonthsRevenue = last3Months.reduce((sum, s) => sum + (s.sale_value || 0), 0);

    const hotLeads = leads.filter(l => l.predictive_score > 70).length;
    const warmLeads = leads.filter(l => l.predictive_score >= 40 && l.predictive_score <= 70).length;
    const coldLeads = leads.filter(l => l.predictive_score < 40).length;

    // Usar IA para análise preditiva
    const analysisPrompt = `
Você é um analista de vendas especializado em previsões. Analise os dados de histórico e pipeline de vendas:

HISTÓRICO:
- Receita este mês: R$ ${thisMonthRevenue.toFixed(2)}
- Receita mês passado: R$ ${lastMonthRevenue.toFixed(2)}
- Receita últimos 3 meses: R$ ${last3MonthsRevenue.toFixed(2)}
- Crescimento mês a mês: ${lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 'N/A'}%
- Total de vendas (histórico): ${sales.length}

PIPELINE:
- Leads quentes (score > 70): ${hotLeads}
- Leads mornos (score 40-70): ${warmLeads}
- Leads frios (score < 40): ${coldLeads}
- Total de clientes: ${clients.length}
- Tarefas ativas: ${tasks.filter(t => t.status === 'pendente').length}

Com base nesses dados, forneça uma análise preditiva em JSON com:
1. Previsão de receita para os próximos 30 dias
2. Probabilidade de atingir meta (assumindo meta de R$ 100.000)
3. Recomendações de ações prioritárias
4. Identificação de riscos
5. Oportunidades de upsell/cross-sell

Responda em JSON estruturado.
    `;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          forecast30Days: { type: 'number' },
          goalAttainmentProbability: { type: 'number' },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          },
          risks: {
            type: 'array',
            items: { type: 'string' }
          },
          opportunities: {
            type: 'array',
            items: { type: 'string' }
          },
          trendAnalysis: { type: 'string' }
        }
      }
    });

    return Response.json({
      historical: {
        thisMonthRevenue,
        lastMonthRevenue,
        last3MonthsRevenue,
        growthPercentage: lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : null,
        totalSales: sales.length
      },
      pipeline: {
        hotLeads,
        warmLeads,
        coldLeads,
        totalClients: clients.length,
        activeTasks: tasks.filter(t => t.status === 'pendente').length
      },
      forecast: analysis
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});