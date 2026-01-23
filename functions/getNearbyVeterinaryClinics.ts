import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { latitude, longitude, radius_km = 5 } = await req.json();

        if (!latitude || !longitude) {
            return Response.json({ 
                error: 'Latitude e longitude são obrigatórios' 
            }, { status: 400 });
        }

        const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!apiKey) {
            return Response.json({ 
                error: 'Google Maps API key não configurada' 
            }, { status: 500 });
        }

        // Buscar clínicas veterinárias próximas usando Google Maps Places API
        const radius = radius_km * 1000; // Converter km para metros
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=veterinary_care&keyword=clinica+veterinaria&language=pt-BR&key=${apiKey}`;

        const placesResponse = await fetch(placesUrl);
        const placesData = await placesResponse.json();

        if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', placesData);
            return Response.json({ 
                error: `Erro na API do Google Maps: ${placesData.status}`,
                details: placesData.error_message 
            }, { status: 500 });
        }

        const clinics = [];

        // Para cada clínica encontrada, buscar detalhes adicionais
        for (const place of placesData.results || []) {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry&language=pt-BR&key=${apiKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();

            if (detailsData.status === 'OK') {
                const details = detailsData.result;
                
                clinics.push({
                    name: details.name || place.name,
                    address: details.formatted_address || place.vicinity,
                    phone: details.formatted_phone_number || null,
                    website: details.website || null,
                    rating: details.rating || place.rating || null,
                    total_ratings: details.user_ratings_total || 0,
                    is_open: details.opening_hours?.open_now || null,
                    location: {
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                    },
                    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${details.geometry.location.lat},${details.geometry.location.lng}&query_place_id=${place.place_id}`,
                    place_id: place.place_id
                });
            }
        }

        // Ordenar por avaliação
        clinics.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        return Response.json({
            success: true,
            total_found: clinics.length,
            search_center: { latitude, longitude },
            radius_km: radius_km,
            clinics: clinics
        });

    } catch (error) {
        console.error('Error finding nearby clinics:', error);
        return Response.json({ 
            error: error.message || 'Erro ao buscar clínicas próximas' 
        }, { status: 500 });
    }
});