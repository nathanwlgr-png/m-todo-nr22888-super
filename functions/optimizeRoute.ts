import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Otimiza rota entre clientes usando algoritmo de nearest neighbor
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locations, startPoint } = await req.json();

    if (!locations || locations.length === 0) {
      return Response.json({ error: 'Sem localizações' }, { status: 400 });
    }

    // Calcula distância euclidiana entre dois pontos
    const distance = (p1, p2) => {
      const dx = p1.lat - p2.lat;
      const dy = p1.lng - p2.lng;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Nearest Neighbor Algorithm para TSP
    const optimizeNearestNeighbor = (points) => {
      const route = [0]; // Começa no primeiro ponto
      const unvisited = new Set(points.map((_, i) => i).filter(i => i !== 0));

      let current = 0;
      while (unvisited.size > 0) {
        let nearest = -1;
        let minDist = Infinity;

        for (const idx of unvisited) {
          const dist = distance(points[current], points[idx]);
          if (dist < minDist) {
            minDist = dist;
            nearest = idx;
          }
        }

        route.push(nearest);
        unvisited.delete(nearest);
        current = nearest;
      }

      return route;
    };

    const optimizedRoute = optimizeNearestNeighbor(locations);

    // Calcula distância total
    let totalDistance = 0;
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      totalDistance += distance(
        locations[optimizedRoute[i]],
        locations[optimizedRoute[i + 1]]
      );
    }

    // Tempo estimado (assume 30km/h média em área urbana)
    const estimatedTimeMinutes = Math.round((totalDistance * 111 * 2) / 1); // ~111km por grau

    return Response.json({
      success: true,
      route: optimizedRoute,
      totalDistance: totalDistance.toFixed(2),
      estimatedTimeMinutes,
      waypoints: optimizedRoute.map(idx => locations[idx]),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});