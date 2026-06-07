import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

        const body = await req.json().catch(() => ({}));
        console.log('[getNearbyVeterinaryClinics] payload recebido:', JSON.stringify(body));
        console.error('CAÇA COMERCIAL', {
            cidade: body.city,
            latitude: body.latitude,
            longitude: body.longitude,
            raio: body.radiusKm,
            endpoint: 'getNearbyVeterinaryClinics',
            payload: body,
        });

        const { latitude, longitude, city, state, radiusKm = 20 } = body;

        const hasGPS = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined &&
                       !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) &&
                       isFinite(parseFloat(latitude)) && isFinite(parseFloat(longitude)) &&
                       parseFloat(latitude) !== 0 && parseFloat(longitude) !== 0 &&
                       Math.abs(parseFloat(latitude)) <= 90 && Math.abs(parseFloat(longitude)) <= 180;

        const hasCity = typeof city === 'string' && city.trim().length >= 3;

        if (!hasGPS && !hasCity) {
            return Response.json({
                error: 'Informe GPS válido (latitude + longitude) ou cidade com pelo menos 3 caracteres.',
                tip: 'Modo A: { latitude, longitude, radiusKm } — Modo B: { city, state }'
            }, { status: 422 });
        }

        const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'Configuração de mapa indisponível. Contate o suporte.' }, { status: 500 });
        }

        let searchUrl;
        if (hasGPS) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radius = Math.min(radiusKm, 50) * 1000;
            searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=veterinary_care&keyword=clinica+veterinaria&language=pt-BR&key=${apiKey}`;
            console.log('[getNearbyVeterinaryClinics] modo GPS:', lat, lng, `raio=${radius}m`);
        } else {
            const cityQuery = encodeURIComponent(`clínica veterinária ${city.trim()}${state ? ', ' + state : ''}`);
            searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${cityQuery}&type=veterinary_care&language=pt-BR&key=${apiKey}`;
            console.log('[getNearbyVeterinaryClinics] modo cidade:', city);
        }

        const t0 = Date.now();
        const placesResponse = await fetch(searchUrl);
        const placesData = await placesResponse.json();
        console.log('[getNearbyVeterinaryClinics] status Google:', placesData.status, 'resultados:', placesData.results?.length || 0, `${Date.now()-t0}ms`);

        if (placesData.status === 'ZERO_RESULTS') {
            return Response.json({ success: true, total_found: 0, clinics: [], message: 'Nenhuma clínica encontrada nesta área.' });
        }

        if (placesData.status !== 'OK') {
            const errMsg = placesData.error_message || placesData.status;
            console.error('[getNearbyVeterinaryClinics] erro Google Places:', errMsg);
            return Response.json({
                error: `Serviço de mapa indisponível (${placesData.status}). Tente novamente em alguns instantes.`
            }, { status: 502 });
        }

        const results = placesData.results || [];
        const MAX_DETAILS = 15; // limitar para não travar
        const clinics = [];

        for (const place of results.slice(0, MAX_DETAILS)) {
            try {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry&language=pt-BR&key=${apiKey}`;
                const detailsResponse = await fetch(detailsUrl);
                const detailsData = await detailsResponse.json();

                const details = detailsData.result || {};
                const lat = details.geometry?.location?.lat || place.geometry?.location?.lat;
                const lng = details.geometry?.location?.lng || place.geometry?.location?.lng;

                clinics.push({
                    name: details.name || place.name,
                    address: details.formatted_address || place.formatted_address || place.vicinity || null,
                    phone: details.formatted_phone_number || null,
                    website: details.website || null,
                    rating: details.rating || place.rating || null,
                    total_ratings: details.user_ratings_total || 0,
                    location: lat && lng ? { lat, lng } : null,
                    google_maps_url: lat && lng
                        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
                    place_id: place.place_id,
                    city: city || null,
                });
            } catch (detailErr) {
                console.warn('[getNearbyVeterinaryClinics] erro ao buscar detalhe:', place.place_id, detailErr.message);
            }
        }

        // Ordenar: rating maior primeiro
        clinics.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        console.log('[getNearbyVeterinaryClinics] retornando', clinics.length, 'clínicas, total ms:', Date.now()-t0);
        return Response.json({ success: true, total_found: clinics.length, clinics });

    } catch (error) {
        console.error('[getNearbyVeterinaryClinics] erro fatal:', error.message);
        return Response.json({ error: 'Erro interno ao buscar clínicas. Tente novamente.' }, { status: 500 });
    }
});