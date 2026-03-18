import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Sincroniza dados CRM com DataWrapper para atualizar gráficos em tempo real
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    if (action === 'getSalesGeo') {
      // Fetch clientes agrupados por cidade + vendedor
      const clients = await base44.entities.Client.list('-purchase_score');
      const sales = await base44.entities.Sale.list('-sale_date');

      const geoData = {};
      clients.forEach(c => {
        const city = c.city || 'Outro';
        if (!geoData[city]) {
          geoData[city] = {
            total_clients: 0,
            total_sales: 0,
            total_revenue: 0,
            hot_clients: 0,
            avg_score: 0
          };
        }
        geoData[city].total_clients++;
        geoData[city].avg_score += c.purchase_score || 0;
        if (c.status === 'quente') geoData[city].hot_clients++;
      });

      sales.forEach(s => {
        const client = clients.find(c => c.id === s.client_id);
        if (client) {
          const city = client.city || 'Outro';
          if (geoData[city]) {
            geoData[city].total_sales++;
            geoData[city].total_revenue += s.sale_value || 0;
          }
        }
      });

      // Normalizar average
      Object.keys(geoData).forEach(city => {
        geoData[city].avg_score = Math.round(geoData[city].avg_score / geoData[city].total_clients);
      });

      return Response.json({
        success: true,
        geoData,
        timestamp: new Date().toISOString(),
        totalCities: Object.keys(geoData).length,
        summary: {
          totalClients: clients.length,
          totalSales: sales.length,
          totalRevenue: sales.reduce((s, v) => s + (v.sale_value || 0), 0)
        }
      });
    }

    if (action === 'getSalesPerVendor') {
      // Análise por vendedor responsável
      const clients = await base44.entities.Client.list();
      const sales = await base44.entities.Sale.list('-sale_date');
      
      const vendorData = {};
      
      clients.forEach(c => {
        const vendor = c.created_by || 'Não atribuído';
        if (!vendorData[vendor]) {
          vendorData[vendor] = {
            clients: 0,
            sales: 0,
            revenue: 0,
            avg_score: 0,
            hot_count: 0
          };
        }
        vendorData[vendor].clients++;
        vendorData[vendor].avg_score += c.purchase_score || 0;
        if (c.status === 'quente') vendorData[vendor].hot_count++;
      });

      sales.forEach(s => {
        const client = clients.find(c => c.id === s.client_id);
        if (client) {
          const vendor = client.created_by || 'Não atribuído';
          if (vendorData[vendor]) {
            vendorData[vendor].sales++;
            vendorData[vendor].revenue += s.sale_value || 0;
          }
        }
      });

      // Normalizar e calcular métricas
      Object.keys(vendorData).forEach(vendor => {
        const data = vendorData[vendor];
        data.avg_score = Math.round(data.avg_score / data.clients);
        data.conversion_rate = Math.round((data.sales / data.clients) * 100);
        data.avg_ticket = data.sales > 0 ? Math.round(data.revenue / data.sales) : 0;
      });

      return Response.json({
        success: true,
        vendorData: Object.entries(vendorData)
          .map(([vendor, metrics]) => ({ vendor, ...metrics }))
          .sort((a, b) => b.revenue - a.revenue)
      });
    }

    if (action === 'exportForDatawrapper') {
      // Exporta dados formatados para integração com DataWrapper API
      const clients = await base44.entities.Client.list();
      const sales = await base44.entities.Sale.list('-sale_date');

      const regionMap = {
        'Marília': 'SP - Interior',
        'Bauru': 'SP - Interior',
        'Araraquara': 'SP - Interior',
        'São Carlos': 'SP - Interior',
        'Ribeirão Preto': 'SP - Interior',
        'Sorocaba': 'SP - Interior',
        'Campinas': 'SP - Interior',
        'São Paulo': 'SP - Capital'
      };

      const csvData = clients.map(c => ({
        city: c.city,
        region: regionMap[c.city] || 'Outro',
        status: c.status,
        score: c.purchase_score,
        revenue: sales
          .filter(s => s.client_id === c.id)
          .reduce((sum, s) => sum + (s.sale_value || 0), 0)
      }));

      return Response.json({
        success: true,
        exportData: csvData,
        format: 'json',
        rows: csvData.length
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});