import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * optimizeRoute — Nearest Neighbor (TSP aproximado)
 * Retorna no formato que a página RouteOptimizer espera:
 * { success, route: { optimized_order, total_distance_km, total_duration_minutes, visits[], google_maps_url } }
 *
 * SAFE: não altera nenhum dado. Só calcula e devolve a rota.
 * Clientes sem coordenada são posicionados ao final (não distorcem o cálculo).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const locations = Array.isArray(body.locations) ? body.locations : [];
    const startPoint = body.startPoint || '';
    const visitDuration = Number(body?.options?.visit_duration_minutes) || 60;

    if (locations.length === 0) {
      return Response.json({ error: 'Sem localizações' }, { status: 400 });
    }

    // Haversine em km (real, não euclidiana)
    const distanceKm = (a, b) => {
      if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
      const R = 6371;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };

    // Separar quem tem coordenada de quem não tem
    const withCoords = locations.filter(l => l.lat != null && l.lng != null);
    const withoutCoords = locations.filter(l => l.lat == null || l.lng == null);

    let orderedWithCoords = withCoords;
    let totalDistance = 0;

    if (withCoords.length >= 2) {
      // Nearest Neighbor a partir do primeiro ponto
      const route = [0];
      const unvisited = new Set(withCoords.map((_, i) => i).filter(i => i !== 0));
      let current = 0;
      while (unvisited.size > 0) {
        let nearest = -1;
        let minDist = Infinity;
        for (const idx of unvisited) {
          const d = distanceKm(withCoords[current], withCoords[idx]);
          const dist = d == null ? Infinity : d;
          if (dist < minDist) { minDist = dist; nearest = idx; }
        }
        if (nearest === -1) nearest = [...unvisited][0];
        route.push(nearest);
        unvisited.delete(nearest);
        current = nearest;
      }
      orderedWithCoords = route.map(i => withCoords[i]);
      for (let i = 0; i < orderedWithCoords.length - 1; i++) {
        const d = distanceKm(orderedWithCoords[i], orderedWithCoords[i + 1]);
        if (d != null) totalDistance += d;
      }
    }

    // Ordem final: coordenadas otimizadas + sem-coordenada no fim
    const finalOrder = [...orderedWithCoords, ...withoutCoords];

    // Tempo: deslocamento (30km/h média urbana) + tempo por visita
    const travelMinutes = Math.round((totalDistance / 30) * 60);
    const totalDuration = travelMinutes + finalOrder.length * visitDuration;

    // Montar visitas com horário estimado a partir de agora
    const base = new Date();
    let acc = 0;
    const visits = finalOrder.map((l, idx) => {
      const arrival = new Date(base.getTime() + acc * 60000);
      acc += visitDuration + (idx < finalOrder.length - 1 ? Math.round(travelMinutes / Math.max(finalOrder.length - 1, 1)) : 0);
      return {
        client_id: l.id,
        client_name: l.name,
        clinic_name: l.clinic_name,
        address: l.address,
        has_coords: l.lat != null && l.lng != null,
        estimated_arrival: arrival.toISOString(),
      };
    });

    // Google Maps URL: usa coordenadas quando há, senão endereço textual
    const waypoints = finalOrder
      .map(l => (l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : (l.address || l.city || '')))
      .filter(Boolean)
      .map(encodeURIComponent);
    const origin = encodeURIComponent(startPoint || (waypoints[0] || ''));
    const destination = waypoints[waypoints.length - 1] || origin;
    const mids = waypoints.slice(0, -1);
    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}` +
      (mids.length ? `&waypoints=${mids.join('|')}` : '') +
      `&travelmode=driving`;

    return Response.json({
      success: true,
      route: {
        optimized_order: finalOrder.map(l => l.id),
        total_distance_km: Number(totalDistance.toFixed(2)),
        total_duration_minutes: totalDuration,
        visits,
        google_maps_url: googleMapsUrl,
        clients_without_coords: withoutCoords.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});