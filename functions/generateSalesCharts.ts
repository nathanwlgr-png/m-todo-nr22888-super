import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sales } = body;

    // Por vendedor
    const byVendor = {};
    sales.forEach(s => {
      const vendor = s.salesperson || 'Sem vendedor';
      byVendor[vendor] = (byVendor[vendor] || 0) + (s.sale_value || 0);
    });
    const byVendorChart = Object.entries(byVendor)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Por produto
    const byProduct = {};
    sales.forEach(s => {
      const product = s.equipment_name || 'Outros';
      byProduct[product] = (byProduct[product] || 0) + (s.sale_value || 0);
    });
    const byProductChart = Object.entries(byProduct)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Tendência dos últimos 30 dias
    const last30Days = {};
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' });
      last30Days[key] = 0;
    }

    sales.forEach(s => {
      if (s.sale_date) {
        const date = new Date(s.sale_date);
        const key = date.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' });
        if (last30Days.hasOwnProperty(key)) {
          last30Days[key] += (s.sale_value || 0);
        }
      }
    });

    const trendChart = Object.entries(last30Days).map(([date, value]) => ({ date, value }));

    return Response.json({
      by_salesperson: byVendorChart,
      by_product: byProductChart,
      trend: trendChart
    });
  } catch (error) {
    console.error('Error in generateSalesCharts:', error);
    return Response.json({
      by_salesperson: [],
      by_product: [],
      trend: [],
      error: error.message
    }, { status: 500 });
  }
});