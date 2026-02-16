import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { report_id } = await req.json();

    // Buscar configuração do relatório
    const report = await base44.asServiceRole.entities.ScheduledReport.get(report_id);
    if (!report) {
      return Response.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    const endDate = new Date();
    const startDate = new Date();
    
    // Definir período baseado no tipo de relatório
    if (report.report_type === 'diario') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (report.report_type === 'semanal') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (report.report_type === 'mensal') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const metricsData = {};
    const metrics = report.metrics_included || [];

    // Buscar dados baseado nas métricas selecionadas
    if (metrics.includes('novos_leads')) {
      const leads = await base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: startDate.toISOString() }
      });
      metricsData.novos_leads = {
        total: leads.length,
        por_fonte: leads.reduce((acc, l) => {
          acc[l.source] = (acc[l.source] || 0) + 1;
          return acc;
        }, {}),
        taxa_conversao: leads.filter(l => l.status === 'convertido').length / leads.length * 100
      };
    }

    if (metrics.includes('clientes_ativos')) {
      const clients = await base44.asServiceRole.entities.Client.filter({
        status: { $in: ['quente', 'morno'] }
      });
      metricsData.clientes_ativos = {
        total: clients.length,
        quentes: clients.filter(c => c.status === 'quente').length,
        mornos: clients.filter(c => c.status === 'morno').length,
        health_score_medio: clients.reduce((sum, c) => sum + (c.health_score || 0), 0) / clients.length
      };
    }

    if (metrics.includes('vendas_realizadas')) {
      const sales = await base44.asServiceRole.entities.Sale?.filter({
        created_date: { $gte: startDate.toISOString() }
      }).catch(() => []);
      
      const totalRevenue = sales.reduce((sum, s) => sum + (s.value || 0), 0);
      metricsData.vendas_realizadas = {
        total: sales.length,
        valor_total: totalRevenue,
        ticket_medio: sales.length > 0 ? totalRevenue / sales.length : 0,
        por_equipamento: sales.reduce((acc, s) => {
          const eq = s.equipment_name || 'Outros';
          acc[eq] = (acc[eq] || 0) + 1;
          return acc;
        }, {})
      };
    }

    if (metrics.includes('performance_equipe')) {
      const users = await base44.asServiceRole.entities.User.list();
      const interactions = await base44.asServiceRole.entities.Interaction?.filter({
        created_date: { $gte: startDate.toISOString() }
      }).catch(() => []);
      
      const performanceByUser = {};
      for (const user of users) {
        const userInteractions = interactions.filter(i => i.created_by === user.email);
        const userClients = await base44.asServiceRole.entities.Client.filter({
          assigned_to: user.email
        });
        
        performanceByUser[user.full_name || user.email] = {
          interacoes: userInteractions.length,
          clientes_atribuidos: userClients.length,
          sentimento_positivo: userInteractions.filter(i => i.sentiment === 'positive').length
        };
      }
      metricsData.performance_equipe = performanceByUser;
    }

    if (metrics.includes('alertas_churn')) {
      const churnAlerts = await base44.asServiceRole.entities.SentimentAlert?.filter({
        created_date: { $gte: startDate.toISOString() },
        status: 'open'
      }).catch(() => []);
      
      metricsData.alertas_churn = {
        total: churnAlerts.length,
        criticos: churnAlerts.filter(a => a.severity === 'critical').length,
        clientes_em_risco: [...new Set(churnAlerts.map(a => a.client_id))].length
      };
    }

    if (metrics.includes('oportunidades_ia')) {
      const priorities = await base44.asServiceRole.entities.LeadPriority?.filter({
        priority_level: { $in: ['urgente', 'alta'] },
        created_date: { $gte: startDate.toISOString() }
      }).catch(() => []);
      
      const totalValue = priorities.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      metricsData.oportunidades_ia = {
        total: priorities.length,
        valor_estimado: totalValue,
        alta_probabilidade: priorities.filter(p => (p.conversion_probability || 0) > 70).length
      };
    }

    if (metrics.includes('sentimento_clientes')) {
      const interactions = await base44.asServiceRole.entities.Interaction?.filter({
        created_date: { $gte: startDate.toISOString() }
      }).catch(() => []);
      
      const sentimentCounts = interactions.reduce((acc, i) => {
        acc[i.sentiment || 'neutral'] = (acc[i.sentiment || 'neutral'] || 0) + 1;
        return acc;
      }, {});
      
      metricsData.sentimento_clientes = {
        ...sentimentCounts,
        score_medio: interactions.reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / interactions.length
      };
    }

    if (metrics.includes('pipeline_status')) {
      const clients = await base44.asServiceRole.entities.Client.list();
      const pipelineStatus = clients.reduce((acc, c) => {
        acc[c.pipeline_stage || 'lead'] = (acc[c.pipeline_stage || 'lead'] || 0) + 1;
        return acc;
      }, {});
      
      metricsData.pipeline_status = pipelineStatus;
    }

    // Gerar HTML do relatório
    const htmlContent = generateReportHTML(report, metricsData, startDate, endDate);

    // Enviar email para cada destinatário
    const sendPromises = report.recipients.map(email => 
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `${report.report_name} - ${new Date().toLocaleDateString('pt-BR')}`,
        body: htmlContent
      })
    );

    await Promise.all(sendPromises);

    // Atualizar status do relatório
    await base44.asServiceRole.entities.ScheduledReport.update(report_id, {
      last_sent_date: new Date().toISOString(),
      last_sent_status: 'success'
    });

    return Response.json({
      success: true,
      recipients_count: report.recipients.length,
      metrics: metricsData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReportHTML(report, metrics, startDate, endDate) {
  const formatNumber = (num) => num?.toLocaleString('pt-BR') || '0';
  const formatCurrency = (num) => `R$ ${(num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatPercent = (num) => `${(num || 0).toFixed(1)}%`;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .metric-card { background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .metric-card h2 { margin-top: 0; color: #667eea; font-size: 18px; }
        .metric-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
        .metric-label { font-weight: 600; color: #64748b; }
        .metric-value { font-weight: bold; color: #1e293b; font-size: 18px; }
        .highlight { color: #10b981; font-size: 24px; font-weight: bold; }
        .warning { color: #f59e0b; }
        .danger { color: #ef4444; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${report.report_name}</h1>
        <p>Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}</p>
      </div>
  `;

  // Novos Leads
  if (metrics.novos_leads) {
    html += `
      <div class="metric-card">
        <h2>🎯 Novos Leads</h2>
        <div class="metric-row">
          <span class="metric-label">Total de Leads</span>
          <span class="metric-value highlight">${formatNumber(metrics.novos_leads.total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Taxa de Conversão</span>
          <span class="metric-value">${formatPercent(metrics.novos_leads.taxa_conversao)}</span>
        </div>
        ${Object.entries(metrics.novos_leads.por_fonte || {}).map(([fonte, count]) => `
          <div class="metric-row">
            <span class="metric-label">${fonte}</span>
            <span class="metric-value">${count}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Clientes Ativos
  if (metrics.clientes_ativos) {
    html += `
      <div class="metric-card">
        <h2>👥 Clientes Ativos</h2>
        <div class="metric-row">
          <span class="metric-label">Total Ativos</span>
          <span class="metric-value highlight">${formatNumber(metrics.clientes_ativos.total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Clientes Quentes</span>
          <span class="metric-value">${formatNumber(metrics.clientes_ativos.quentes)} <span class="badge badge-success">HOT</span></span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Clientes Mornos</span>
          <span class="metric-value">${formatNumber(metrics.clientes_ativos.mornos)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Health Score Médio</span>
          <span class="metric-value">${formatNumber(metrics.clientes_ativos.health_score_medio)}/100</span>
        </div>
      </div>
    `;
  }

  // Vendas Realizadas
  if (metrics.vendas_realizadas) {
    html += `
      <div class="metric-card">
        <h2>💰 Vendas Realizadas</h2>
        <div class="metric-row">
          <span class="metric-label">Total de Vendas</span>
          <span class="metric-value highlight">${formatNumber(metrics.vendas_realizadas.total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Valor Total</span>
          <span class="metric-value">${formatCurrency(metrics.vendas_realizadas.valor_total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Ticket Médio</span>
          <span class="metric-value">${formatCurrency(metrics.vendas_realizadas.ticket_medio)}</span>
        </div>
      </div>
    `;
  }

  // Performance da Equipe
  if (metrics.performance_equipe) {
    html += `
      <div class="metric-card">
        <h2>🏆 Performance da Equipe</h2>
        ${Object.entries(metrics.performance_equipe).map(([user, data]) => `
          <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px;">
            <strong>${user}</strong>
            <div class="metric-row" style="margin: 5px 0;">
              <span class="metric-label">Interações</span>
              <span class="metric-value">${data.interacoes}</span>
            </div>
            <div class="metric-row" style="margin: 5px 0;">
              <span class="metric-label">Clientes</span>
              <span class="metric-value">${data.clientes_atribuidos}</span>
            </div>
            <div class="metric-row" style="margin: 5px 0;">
              <span class="metric-label">Sentimento Positivo</span>
              <span class="metric-value">${data.sentimento_positivo}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Alertas de Churn
  if (metrics.alertas_churn) {
    html += `
      <div class="metric-card">
        <h2>⚠️ Alertas de Churn</h2>
        <div class="metric-row">
          <span class="metric-label">Total de Alertas</span>
          <span class="metric-value ${metrics.alertas_churn.total > 0 ? 'warning' : ''}">${formatNumber(metrics.alertas_churn.total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Críticos</span>
          <span class="metric-value danger">${formatNumber(metrics.alertas_churn.criticos)} <span class="badge badge-danger">URGENTE</span></span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Clientes em Risco</span>
          <span class="metric-value warning">${formatNumber(metrics.alertas_churn.clientes_em_risco)}</span>
        </div>
      </div>
    `;
  }

  // Oportunidades IA
  if (metrics.oportunidades_ia) {
    html += `
      <div class="metric-card">
        <h2>🤖 Oportunidades Identificadas pela IA</h2>
        <div class="metric-row">
          <span class="metric-label">Total de Oportunidades</span>
          <span class="metric-value highlight">${formatNumber(metrics.oportunidades_ia.total)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Valor Estimado</span>
          <span class="metric-value">${formatCurrency(metrics.oportunidades_ia.valor_estimado)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Alta Probabilidade (>70%)</span>
          <span class="metric-value">${formatNumber(metrics.oportunidades_ia.alta_probabilidade)} <span class="badge badge-success">HOT</span></span>
        </div>
      </div>
    `;
  }

  // Sentimento dos Clientes
  if (metrics.sentimento_clientes) {
    html += `
      <div class="metric-card">
        <h2>😊 Sentimento dos Clientes</h2>
        <div class="metric-row">
          <span class="metric-label">Positivo</span>
          <span class="metric-value">${formatNumber(metrics.sentimento_clientes.positive || 0)} <span class="badge badge-success">+</span></span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Neutral</span>
          <span class="metric-value">${formatNumber(metrics.sentimento_clientes.neutral || 0)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Negativo</span>
          <span class="metric-value">${formatNumber(metrics.sentimento_clientes.negative || 0)} <span class="badge badge-warning">-</span></span>
        </div>
      </div>
    `;
  }

  // Pipeline Status
  if (metrics.pipeline_status) {
    html += `
      <div class="metric-card">
        <h2>📈 Status do Pipeline</h2>
        ${Object.entries(metrics.pipeline_status).map(([stage, count]) => `
          <div class="metric-row">
            <span class="metric-label">${stage.toUpperCase()}</span>
            <span class="metric-value">${formatNumber(count)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  html += `
      <div class="footer">
        <p>Relatório gerado automaticamente pelo CRM NR22</p>
        <p style="font-size: 12px; margin-top: 10px;">📅 ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}