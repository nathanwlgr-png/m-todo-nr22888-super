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

    const payload = await req.json().catch(() => ({}));
    const maxStops = Math.max(1, Math.min(Number(payload.max_clients || payload.max_stops || 12), 12));
    let clients = Array.isArray(payload.clients) ? payload.clients : [];

    if (clients.length === 0 && payload.city) {
      const all = await base44.asServiceRole.entities.Client.list('-updated_date', 100);
      const targetCity = String(payload.city).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      clients = all.filter(c => String(c.city || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === targetCity);
    }

    if (!clients || clients.length === 0) {
      return Response.json({ error: 'Nenhum cliente fornecido ou encontrado para a cidade.', route: [], total_stops: 0 }, { status: 422 });
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

    // 2. Usar coordenadas quando existirem; se não, manter endereço/cidade como fallback do Google Maps.
    const withCoords = deduped.filter(c => isValidCoord(c.latitude, c.longitude));
    const withoutCoords = deduped.filter(c => !isValidCoord(c.latitude, c.longitude));
    const withAddressFallback = withoutCoords.filter(c => c.address || c.city || c.clinic_name || c.first_name);
    const withoutLocation = withoutCoords.filter(c => !c.address && !c.city && !c.clinic_name && !c.first_name);

    const scoreClient = (c) => (c.purchase_score || 0) * (c.status === 'quente' ? 1.5 : c.status === 'morno' ? 1.0 : 0.5)
      + (c.priority_level ? (6 - c.priority_level) * 5 : 0);

    const scoredCoords = withCoords.map(c => ({ ...c, _priority: scoreClient(c), location_source: 'coordenada' }));
    const scoredFallback = withAddressFallback.map(c => ({ ...c, _priority: scoreClient(c), location_source: 'endereco' }));
    const optimizedRoute = [...scoredCoords, ...scoredFallback]
      .sort((a, b) => b._priority - a._priority)
      .slice(0, maxStops);

    if (optimizedRoute.length === 0) {
      return Response.json({
        error: 'Não há endereço, cidade ou coordenada suficiente para gerar rota.',
        route: [],
        total_stops: 0,
        skipped_no_location: withoutLocation.length,
      }, { status: 422 });
    }

    // 3. Gerar link Google Maps aceitando coordenadas ou endereço textual.
    const waypoints = optimizedRoute.map(c => {
      if (isValidCoord(c.latitude, c.longitude)) return `${parseFloat(c.latitude)},${parseFloat(c.longitude)}`;
      return encodeURIComponent([c.clinic_name || c.first_name || '', c.address || '', c.city || '', 'Brasil'].filter(Boolean).join(', '));
    });
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1);
    const googleMapsUrl = waypoints.length === 1
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${middle.join('|')}&travelmode=driving&optimize=true`;

    const citiesSet = new Set(optimizedRoute.map(c => c.city).filter(Boolean));

    console.log('[generateOptimizedRoute] total:', clients.length, '→ dedup:', deduped.length, '→ rota:', optimizedRoute.length);

    return Response.json({
      route: optimizedRoute,
      total_stops: optimizedRoute.length,
      cities_covered: citiesSet.size,
      skipped_no_coords: withoutCoords.length,
      skipped_no_location: withoutLocation.length,
      google_maps_url: googleMapsUrl,
    });
  } catch (error) {
    console.error('[generateOptimizedRoute] erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});