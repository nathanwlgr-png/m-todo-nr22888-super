import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MonthlyReportGenerator() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  useEffect(() => {
    const checkAndGenerateReport = async () => {
      const now = new Date();
      const currentDay = now.getDate();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // Gerar relatório no penúltimo dia do mês
      if (currentDay === lastDayOfMonth - 1) {
        const lastReportKey = `last_report_generated_${now.getMonth()}_${now.getFullYear()}`;
        const alreadyGenerated = localStorage.getItem(lastReportKey);
        
        if (!alreadyGenerated) {
          await generateMonthlyReport();
          localStorage.setItem(lastReportKey, 'true');
        }
      }
    };

    checkAndGenerateReport();
    
    // Checar a cada hora
    const interval = setInterval(checkAndGenerateReport, 3600000);
    return () => clearInterval(interval);
  }, [clients, sales, visits, tasks]);

  const generateMonthlyReport = async () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtrar dados do mês
    const monthlySales = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const monthlyVisits = visits.filter(v => {
      const visitDate = new Date(v.scheduled_date);
      return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
    });
    
    const newClients = clients.filter(c => {
      const createdDate = new Date(c.created_date);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    });

    const possibleSales = clients.filter(c => {
      const hasClosedSale = sales.some(s => 
        s.client_id === c.id && (s.status === 'fechada' || s.status === 'entregue')
      );
      return !hasClosedSale; // Possível venda = ainda não comprou
    });

    // Estatísticas
    const totalRevenue = monthlySales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const closedSalesCount = monthlySales.filter(s => s.status === 'fechada' || s.status === 'entregue').length;
    const completedVisits = monthlyVisits.filter(v => v.status === 'realizada').length;

    const reportContent = `
═══════════════════════════════════════
📊 RELATÓRIO MENSAL - ${monthName.toUpperCase()}
═══════════════════════════════════════

📈 PERFORMANCE GERAL
────────────────────────────────────
• Vendas Fechadas: ${closedSalesCount}
• Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Novos Clientes: ${newClients.length}
• Possíveis Vendas (sem compra): ${possibleSales.length}
• Visitas Realizadas: ${completedVisits}

🎯 POSSÍVEIS VENDAS ATIVAS
────────────────────────────────────
${possibleSales.slice(0, 10).map(c => `
• ${c.first_name} (ID: ${c.id})
  - ${c.razao_social || c.clinic_name || 'Sem razão social'}
  - CNPJ: ${c.cnpj || 'Não informado'}
  - Cidade: ${c.city || 'Não informada'}
  - Status: ${c.status} | Score: ${c.purchase_score}%
  - Última visita: ${c.last_visit_date || 'Nunca'}
  - Necessidades Lab: ${c.lab_needs?.join(', ') || 'Não definidas'}
  - Canal preferido: ${c.communication_preferences?.preferred_channel || 'Não definido'}
`).join('\n')}

💰 VENDAS DO MÊS
────────────────────────────────────
${monthlySales.map(s => `
• ${s.client_name} - ${s.equipment_name}
  R$ ${s.sale_value?.toLocaleString('pt-BR')} - ${s.status}
  Data: ${s.sale_date}
`).join('\n')}

🆕 NOVOS CADASTROS
────────────────────────────────────
${newClients.map(c => `
• ${c.first_name} (ID: ${c.id})
  - Razão Social: ${c.razao_social || 'Não informada'}
  - CNPJ: ${c.cnpj || 'Não informado'}
  - Clínica: ${c.clinic_name || 'Não informada'}
  - Cidade: ${c.city || 'Não informada'}
  - Perfil: ${c.behavioral_profile}
  - Score: ${c.purchase_score}%
`).join('\n')}

────────────────────────────────────
📅 Gerado automaticamente em ${now.toLocaleString('pt-BR')}
    `;

    try {
      const user = await base44.auth.me();
      
      // Enviar relatório por email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `📊 Relatório Mensal Venda NR - ${monthName}`,
        body: reportContent
      });

      console.log('Relatório mensal gerado e enviado:', monthName);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  return null; // Componente invisível
}