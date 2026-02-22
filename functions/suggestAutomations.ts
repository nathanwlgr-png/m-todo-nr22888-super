import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados do CRM para análise
    const [clients, sales, tasks] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Sale.list(),
      base44.entities.Task.list()
    ]);

    // Preparar contexto para IA
    const crmContext = {
      totalClients: clients.length,
      coldClients: clients.filter(c => c.status === 'frio').length,
      warmClients: clients.filter(c => c.status === 'morno').length,
      hotClients: clients.filter(c => c.status === 'quente').length,
      clientsWithoutContactDays: clients.filter(c => {
        if (!c.last_contact_date) return true;
        const days = Math.floor((Date.now() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24));
        return days > 30;
      }).length,
      totalSales: sales.length,
      salesThisMonth: sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        const now = new Date();
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }).length,
      overdueTasks: tasks.filter(t => t.status === 'pendente' && t.due_date && new Date(t.due_date) < new Date()).length
    };

    // Usar IA para sugerir automações
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `
Você é um especialista em automação de CRM de vendas. Baseado nos dados do CRM, sugira 3-5 automações prioritárias que podem melhorar a conversão e retenção de clientes.

Dados atuais do CRM:
- Total de clientes: ${crmContext.totalClients}
- Clientes frios: ${crmContext.coldClients}
- Clientes mornos: ${crmContext.warmClients}
- Clientes quentes: ${crmContext.hotClients}
- Clientes sem contato há 30+ dias: ${crmContext.clientsWithoutContactDays}
- Total de vendas: ${crmContext.totalSales}
- Vendas este mês: ${crmContext.salesThisMonth}
- Tarefas atrasadas: ${crmContext.overdueTasks}

Para cada automação sugerida, forneça em JSON:
{
  "suggestions": [
    {
      "name": "nome da automação",
      "description": "descrição breve",
      "trigger_type": "tipo de gatilho (visit_completed, days_without_interaction, score_threshold, lead_created, status_change, client_created)",
      "trigger_condition": {dias ou range de scores},
      "action_type": "tipo de ação (send_email, send_whatsapp, create_task, update_client_status, send_alert, assign_to_user)",
      "action_config": {configuração específica},
      "priority": "alta/media/baixa",
      "expectedImpact": "descrição do impacto esperado"
    }
  ]
}
      `,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                trigger_type: { type: 'string' },
                trigger_condition: { type: 'object' },
                action_type: { type: 'string' },
                action_config: { type: 'object' },
                priority: { type: 'string' },
                expectedImpact: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      suggestions: response.suggestions || [],
      crmMetrics: crmContext
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});