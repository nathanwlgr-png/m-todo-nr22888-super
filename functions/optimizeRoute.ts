import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_ids, start_address, visit_duration_minutes = 60 } = await req.json();

    if (!client_ids || client_ids.length === 0) {
      return Response.json({ error: 'No clients provided' }, { status: 400 });
    }

    // Fetch clients
    const clients = await Promise.all(
      client_ids.map(id => base44.entities.Client.get(id))
    );

    // Filter clients with valid addresses
    const validClients = clients.filter(c => c.address || c.cep);

    if (validClients.length === 0) {
      return Response.json({ error: 'No clients with valid addresses' }, { status: 400 });
    }

    // Build addresses array
    const destinations = validClients.map(c => {
      if (c.address) return c.address;
      if (c.cep && c.city) return `${c.cep}, ${c.city}, Brasil`;
      return null;
    }).filter(Boolean);

    const origin = start_address || destinations[0];

    // Simple optimization: calculate distances between all points
    // For production, you'd use Google Maps Directions API with waypoint optimization
    // Here we'll create a simple nearest-neighbor algorithm

    const optimizedOrder = [];
    const visited = new Set();
    let currentIndex = 0;
    
    // Start with first client
    optimizedOrder.push(validClients[0]);
    visited.add(0);

    // Nearest neighbor algorithm
    while (optimizedOrder.length < validClients.length) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < validClients.length; i++) {
        if (visited.has(i)) continue;

        // Simple distance estimation (in real app, use Google Distance Matrix API)
        const current = optimizedOrder[optimizedOrder.length - 1];
        const next = validClients[i];
        
        // Mock distance calculation (replace with actual API call)
        const distance = Math.random() * 50; // km
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        optimizedOrder.push(validClients[nearestIndex]);
        visited.add(nearestIndex);
      }
    }

    // Calculate estimated times
    let cumulativeTime = 0;
    const visits = optimizedOrder.map((client, index) => {
      const estimatedTravel = index === 0 ? 30 : 20; // minutes
      cumulativeTime += estimatedTravel;
      
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + cumulativeTime);
      
      const visit = {
        client_id: client.id,
        client_name: client.first_name,
        clinic_name: client.clinic_name,
        address: client.address || `${client.cep}, ${client.city}`,
        estimated_arrival: arrivalTime.toISOString(),
        estimated_duration_minutes: visit_duration_minutes,
        order: index + 1,
        completed: false
      };

      cumulativeTime += visit_duration_minutes;
      return visit;
    });

    // Build Google Maps URL with waypoints
    const waypointsString = visits.map(v => encodeURIComponent(v.address)).join('/');
    const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${waypointsString}`;

    // Calculate totals
    const totalDistance = visits.length * 15; // Mock: 15km average per visit
    const totalDuration = cumulativeTime;

    return Response.json({
      success: true,
      route: {
        total_distance_km: totalDistance,
        total_duration_minutes: totalDuration,
        visits,
        google_maps_url: googleMapsUrl,
        optimized_order: optimizedOrder.map(c => c.id)
      }
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});