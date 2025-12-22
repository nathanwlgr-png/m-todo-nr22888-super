import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, differenceInHours, addMonths, format, startOfMonth } from 'date-fns';

export default function AutomationEngine() {
  const queryClient = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ['automation-tasks'],
    queryFn: () => base44.entities.AutomationTask.filter({ active: true }),
    refetchInterval: 60000 // Check every minute
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-automation'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-automation'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-automation'],
    queryFn: () => base44.entities.ConsumableOrder.list()
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables-automation'],
    queryFn: () => base44.entities.Consumable.list()
  });

  const updateAutomationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-tasks']);
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data) => base44.integrations.Core.SendEmail(data)
  });

  useEffect(() => {
    if (automations.length === 0) return;

    const checkAndExecute = async () => {
      for (const automation of automations) {
        const shouldExecute = checkIfShouldExecute(automation);
        
        if (shouldExecute) {
          try {
            await executeAutomation(automation);
          } catch (error) {
            console.error('Erro ao executar automação:', error);
          }
        }
      }
    };

    checkAndExecute();
  }, [automations, clients, sales, orders, consumables]);

  const checkIfShouldExecute = (automation) => {
    if (!automation.active) return false;

    const now = new Date();
    const lastExecution = automation.last_execution ? new Date(automation.last_execution) : null;

    // Se nunca executou, executar
    if (!lastExecution) return true;

    // Verificar baseado na frequência
    switch (automation.frequency) {
      case 'daily':
        return differenceInHours(now, lastExecution) >= 24;
      case 'weekly':
        return differenceInDays(now, lastExecution) >= 7;
      case 'monthly':
        return differenceInDays(now, lastExecution) >= 30;
      case 'on_trigger':
        return true; // Sempre verificar triggers
      default:
        return false;
    }
  };

  const executeAutomation = async (automation) => {
    let result = { status: 'success', details: '', affected_records: 0 };

    try {
      switch (automation.task_type) {
        case 'email_followup':
          result = await executeEmailFollowup(automation);
          break;
        case 'monthly_report':
          result = await executeMonthlyReport(automation);
          break;
        case 'stock_alert':
          result = await executeStockAlert(automation);
          break;
        case 'consumable_reorder_reminder':
          result = await executeReorderReminder(automation);
          break;
        default:
          result.details = 'Tipo de automação não implementado';
      }
    } catch (error) {
      result = {
        status: 'error',
        details: error.message,
        affected_records: 0
      };
    }

    // Atualizar registro da automação
    await updateAutomationMutation.mutateAsync({
      id: automation.id,
      data: {
        last_execution: new Date().toISOString(),
        execution_count: (automation.execution_count || 0) + 1,
        last_result: result
      }
    });
  };

  const executeEmailFollowup = async (automation) => {
    const { trigger_conditions, email_template, email_subject } = automation.config || {};
    let affected = 0;

    // Filtrar clientes baseado nas condições
    const targetClients = clients.filter(client => {
      if (trigger_conditions?.status && client.status !== trigger_conditions.status) {
        return false;
      }

      // Verificar se tem venda
      const clientSales = sales.filter(s => s.client_id === client.id);
      if (trigger_conditions?.has_sale === false && clientSales.length > 0) {
        return false;
      }
      if (trigger_conditions?.has_sale === true && clientSales.length === 0) {
        return false;
      }

      // Verificar dias desde última interação
      if (trigger_conditions?.days_without_contact) {
        const lastInteractionDate = client.updated_date ? new Date(client.updated_date) : new Date(client.created_date);
        const daysSince = differenceInDays(new Date(), lastInteractionDate);
        if (daysSince < trigger_conditions.days_without_contact) {
          return false;
        }
      }

      return true;
    });

    // Enviar e-mails
    for (const client of targetClients) {
      if (!client.email) continue;

      const personalizedMessage = email_template
        ?.replace(/{{nome}}/g, client.first_name)
        ?.replace(/{{clinica}}/g, client.clinic_name || '')
        ?.replace(/{{cidade}}/g, client.city || '');

      await sendEmailMutation.mutateAsync({
        to: client.email,
        subject: email_subject || 'Follow-up',
        body: personalizedMessage || 'Olá! Estamos fazendo um follow-up.',
        from_name: 'Método NR'
      });

      affected++;
    }

    return {
      status: 'success',
      details: `${affected} e-mails enviados`,
      affected_records: affected
    };
  };

  const executeMonthlyReport = async (automation) => {
    const { recipients, report_type } = automation.config || {};
    
    // Calcular métricas do mês
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const monthSales = sales.filter(s => new Date(s.sale_date) >= monthStart);
    const monthOrders = orders.filter(o => new Date(o.order_date) >= monthStart);
    
    const totalSalesValue = monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const totalOrdersValue = monthOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    
    const report = `
📊 RELATÓRIO MENSAL - ${format(now, 'MMMM yyyy')}

💰 VENDAS
- Total de vendas: ${monthSales.length}
- Valor total: R$ ${totalSalesValue.toLocaleString('pt-BR')}
- Ticket médio: R$ ${monthSales.length > 0 ? (totalSalesValue / monthSales.length).toLocaleString('pt-BR') : 0}

📦 PEDIDOS DE INSUMOS
- Total de pedidos: ${monthOrders.length}
- Valor total: R$ ${totalOrdersValue.toLocaleString('pt-BR')}

👥 CLIENTES
- Novos clientes: ${clients.filter(c => new Date(c.created_date) >= monthStart).length}
- Total ativo: ${clients.length}

---
Relatório gerado automaticamente pelo sistema Método NR
    `;

    // Enviar para destinatários
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        await sendEmailMutation.mutateAsync({
          to: email,
          subject: `Relatório Mensal - ${format(now, 'MMMM yyyy')}`,
          body: report,
          from_name: 'Sistema Método NR'
        });
      }
    }

    return {
      status: 'success',
      details: `Relatório enviado para ${recipients?.length || 0} destinatários`,
      affected_records: recipients?.length || 0
    };
  };

  const executeStockAlert = async (automation) => {
    const { stock_threshold = 10, recipients = [] } = automation.config || {};
    
    // Verificar insumos com estoque baixo
    const lowStockItems = consumables.filter(c => 
      c.is_active && c.stock_quantity <= (c.min_stock || stock_threshold)
    );

    if (lowStockItems.length === 0) {
      return {
        status: 'success',
        details: 'Nenhum item com estoque baixo',
        affected_records: 0
      };
    }

    // Gerar alerta
    const alertMessage = `
🚨 ALERTA DE ESTOQUE BAIXO

Os seguintes insumos estão com estoque baixo:

${lowStockItems.map(item => `
• ${item.name}
  - Estoque atual: ${item.stock_quantity} ${item.unit_type}
  - Estoque mínimo: ${item.min_stock || stock_threshold}
  - Fornecedor: ${item.supplier || 'N/A'}
`).join('\n')}

Total de itens em alerta: ${lowStockItems.length}

---
Sistema de Controle de Estoque - Método NR
    `;

    // Enviar alertas
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        await sendEmailMutation.mutateAsync({
          to: email,
          subject: `⚠️ Alerta: ${lowStockItems.length} insumo(s) com estoque baixo`,
          body: alertMessage,
          from_name: 'Sistema Método NR'
        });
      }
    }

    return {
      status: 'success',
      details: `${lowStockItems.length} itens em alerta`,
      affected_records: lowStockItems.length
    };
  };

  const executeReorderReminder = async (automation) => {
    // Buscar clientes com previsão de pedido próximo
    const clientsNeedingReorder = [];

    for (const client of clients) {
      const clientOrders = orders.filter(o => o.client_id === client.id);
      if (clientOrders.length === 0) continue;

      // Calcular próximo pedido esperado
      const sortedOrders = clientOrders.sort((a, b) => 
        new Date(b.order_date) - new Date(a.order_date)
      );
      
      const lastOrder = sortedOrders[0];
      const daysSinceLastOrder = differenceInDays(new Date(), new Date(lastOrder.order_date));
      
      // Se passou mais de 30 dias, sugerir reposição
      if (daysSinceLastOrder >= 30 && client.email) {
        clientsNeedingReorder.push({
          client,
          daysSince: daysSinceLastOrder
        });
      }
    }

    // Enviar lembretes
    let sent = 0;
    for (const { client, daysSince } of clientsNeedingReorder) {
      await sendEmailMutation.mutateAsync({
        to: client.email,
        subject: 'Lembrete: Reposição de Insumos',
        body: `Olá ${client.first_name},

Percebemos que faz ${daysSince} dias desde seu último pedido de insumos.

Gostaríamos de verificar se você precisa de reposição.

Estamos à disposição!

Atenciosamente,
Equipe Método NR`,
        from_name: 'Método NR'
      });
      sent++;
    }

    return {
      status: 'success',
      details: `${sent} lembretes enviados`,
      affected_records: sent
    };
  };

  return null; // Background component
}