import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clients } = await req.json();

    if (!clients || clients.length === 0) {
      return Response.json({ error: 'Nenhum cliente fornecido' }, { status: 400 });
    }

    // Ordenar clientes por score preditivo/probabilidade de conversão
    const sortedClients = [...clients].sort((a, b) => {
      const scoreA = (a.conversion_probability || 0) + (a.priority_score || 0);
      const scoreB = (b.conversion_probability || 0) + (b.priority_score || 0);
      return scoreB - scoreA;
    });

    // Agrupar por cidade para otimizar deslocamento
    const citiesMap = {};
    sortedClients.forEach(client => {
      const city = client.city || 'Sem cidade';
      if (!citiesMap[city]) {
        citiesMap[city] = [];
      }
      citiesMap[city].push(client);
    });

    // Montar rota priorizando clientes de alta conversão na mesma cidade
    const optimizedRoute = [];
    Object.keys(citiesMap).forEach(city => {
      const cityClients = citiesMap[city].sort((a, b) => {
        const scoreA = (a.conversion_probability || 0) + (a.priority_score || 0);
        const scoreB = (b.conversion_probability || 0) + (b.priority_score || 0);
        return scoreB - scoreA;
      });
      optimizedRoute.push(...cityClients);
    });

    return Response.json({ 
      route: optimizedRoute,
      total_stops: optimizedRoute.length,
      cities_covered: Object.keys(citiesMap).length
    });
  } catch (error) {
    console.error('Erro ao gerar rota:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});