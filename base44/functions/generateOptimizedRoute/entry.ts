import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const isValidCoord = (lat, lng) => {
  const la = parseFloat(lat), lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) && isFinite(la) && isFinite(lo) &&
         Math.abs(la) <= 90 && Math.abs(lo) <= 180 && !(la === 0 && lo === 0);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clients } = await req.json().catch(() => ({}));

    if (!clients || clients.length === 0) {
      return Response.json({ error: 'Nenhum cliente fornecido.' }, { status: 422 });
    }

    // 1. Remover duplicados por nome+cidade+telefone+cnpj
    const seen = new Set();
    const deduped = clients.filter(c => {
      const key = [
        (c.clinic_name || c.first_name || '').toLowerCase().trim(),
        (c.city || '').toLowerCase().trim(),
        (c.phone || '').replace(/\D/g, ''),
        (c.cnpj || '').replace(/\D/g, ''),
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 2. Filtrar apenas com coordenadas válidas
    const withCoords = deduped.filter(c => isValidCoord(c.latitude, c.longitude));
    const withoutCoords = deduped.filter(c => !isValidCoord(c.latitude, c.longitude));

    if (withCoords.length === 0) {
      return Response.json({
        error: 'Não há pontos com localização válida para gerar rota.',
        tip: 'Geocodifique os clientes antes de gerar a rota.',
        without_coords_count: withoutCoords.length,
        route: [],
        total_stops: 0,
      });
    }

    // 3. Priorizar: score alto + temperatura quente + menor distância (Nearest Neighbor simplificado)
    const scored = withCoords.map(c => ({
      ...c,
      _priority: (c.purchase_score || 0) * (c.status === 'quente' ? 1.5 : c.status === 'morno' ? 1.0 : 0.5)
        + (c.priority_level ? (6 - c.priority_level) * 5 : 0),
    }));

    scored.sort((a, b) => b._priority - a._priority);

    // 4. Limitar a 12 visitas
    const optimizedRoute = scored.slice(0, 12);

    // 5. Gerar link Google Maps com waypoints válidos
    const waypoints = optimizedRoute.map(c => `${parseFloat(c.latitude)},${parseFloat(c.longitude)}`);
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1);
    let googleMapsUrl = null;
    if (waypoints.length === 1) {
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    } else {
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${middle.join('|')}&travelmode=driving&optimize=true`;
    }

    // Agrupar por cidade para info
    const citiesSet = new Set(optimizedRoute.map(c => c.city).filter(Boolean));

    console.log('[generateOptimizedRoute] total:', clients.length, '→ dedup:', deduped.length, '→ com coords:', withCoords.length, '→ rota:', optimizedRoute.length);

    return Response.json({
      route: optimizedRoute,
      total_stops: optimizedRoute.length,
      cities_covered: citiesSet.size,
      skipped_no_coords: withoutCoords.length,
      google_maps_url: googleMapsUrl,
    });
  } catch (error) {
    console.error('[generateOptimizedRoute] erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});