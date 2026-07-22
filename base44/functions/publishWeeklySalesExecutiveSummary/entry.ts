import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const forecast = body.forecast || {};
    const reportDocumentId = body.report_document_id || '';
    const generatedAt = new Date().toISOString();
    const dashboardName = 'Previsão e Relatório Executivo Semanal';
    const recommendations = (forecast.recommendations || []).slice(0, 3);
    const priorityClients = (forecast.high_probability_clients || []).slice(0, 5);

    const dashboardData = {
      user_email: user.email,
      dashboard_name: dashboardName,
      is_default: false,
      widgets_enabled: ['kpi_cards', 'revenue_chart', 'sales_funnel', 'top_clients'],
      refresh_interval: 604800,
      filters: { date_range: 'proximos_30_dias' },
      layout: [{
        widget_id: 'weekly_sales_executive_summary',
        widget_type: 'weekly_sales_executive_summary',
        position: { x: 0, y: 0 },
        size: { w: 12, h: 6 },
        config: {
          generated_at: generatedAt,
          report_document_id: reportDocumentId,
          predicted_sales_count: forecast.predicted_sales_count || 0,
          predicted_revenue: forecast.predicted_revenue || 0,
          confidence_level: forecast.confidence_level || 0,
          conversion_rate_forecast: forecast.conversion_rate_forecast || forecast.conversion_rate || 0,
          market_conditions: forecast.market_conditions || {},
          recommendations,
          priority_clients: priorityClients
        }
      }]
    };

    if (body.validate_only) {
      return Response.json({ success: true, validated: true, dashboard: dashboardData });
    }

    const existing = await base44.asServiceRole.entities.DashboardConfig.filter({
      user_email: user.email,
      dashboard_name: dashboardName
    }, '-updated_date', 1);
    const saved = existing.length
      ? await base44.asServiceRole.entities.DashboardConfig.update(existing[0].id, dashboardData)
      : await base44.asServiceRole.entities.DashboardConfig.create(dashboardData);

    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const clientLines = priorityClients.map((client, index) =>
      `${index + 1}. ${client.client_name || 'Cliente'} — ${client.probability || 0}% — ${currency.format(client.expected_value || 0)}`
    );
    const recommendationLines = recommendations.map((item, index) => `${index + 1}. ${item}`);
    const summary = [
      '📊 NR22888 — RESUMO EXECUTIVO SEMANAL',
      `Previsão 30 dias: ${forecast.predicted_sales_count || 0} venda(s)`,
      `Receita prevista: ${currency.format(forecast.predicted_revenue || 0)}`,
      `Confiança: ${forecast.confidence_level || 0}%`,
      `Conversão prevista: ${forecast.conversion_rate_forecast || forecast.conversion_rate || 0}%`,
      clientLines.length ? `\nPrioridades:\n${clientLines.join('\n')}` : '',
      recommendationLines.length ? `\nPróximas ações:\n${recommendationLines.join('\n')}` : '',
      `\nRelatório: ${reportDocumentId || 'gerado'}`,
      'Origem: telegram_operacional_nr22888'
    ].filter(Boolean).join('\n').slice(0, 4000);

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return Response.json({ error: 'Telegram não configurado', dashboard_config_id: saved.id }, { status: 500 });

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: summary }),
      signal: AbortSignal.timeout(10000)
    });
    const telegramData = await telegramResponse.json();
    if (!telegramData.ok) return Response.json({ error: telegramData.description || 'Falha no Telegram', dashboard_config_id: saved.id }, { status: 502 });

    return Response.json({ success: true, dashboard_config_id: saved.id, telegram_sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});