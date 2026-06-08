import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// deno-lint-ignore no-undef
// eslint-disable-next-line no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { city = 'Marília', location, message } = await req.json();

    // Fetch active clients
    const allClients = await base44.asServiceRole.entities.Client.list();
    
    // Filter by city if provided
    const clientsInCity = allClients.filter(c => {
      const clientCity = (c.city || '').toLowerCase().trim();
      const searchCity = city.toLowerCase().trim();
      return clientCity.includes(searchCity) || searchCity.includes(clientCity);
    });

    // Sort by priority
    const sorted = clientsInCity
      .filter(c => c.clinic_name) // Only with full data
      .sort((a, b) => {
        // Score first
        const scoreA = (a.purchase_score || 0);
        const scoreB = (b.purchase_score || 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Then status
        const statusWeight = { quente: 3, morno: 2, frio: 1 };
        return (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      })
      .slice(0, 10); // Top 10

    // Build response
    const response = `✅ **Rota Inteligente - Modo Seguro**

📍 **Cidade:** ${city}
🏥 **Clínicas encontradas:** ${sorted.length}

**Top Prioridades de Hoje:**
${sorted.map((c, i) => `${i+1}. **${c.clinic_name || c.first_name}** | ${c.city} | Score: ${c.purchase_score}% | Status: ${c.status}`).join('\n')}

**Próximas ações:**
• Clientes com score > 70% estão quentes
• Contate os 3 primeiros hoje
• Prepare SPIN antes de cada visita

[Abrir rota no Google Maps](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)})`;

    return Response.json({
      success: true,
      response,
      clients_count: sorted.length,
      city,
    });
  } catch (error) {
    console.error('Erro em rota inteligente:', error);
    return Response.json({ 
      error: 'Modo seguro ativado. Use Google Maps para a rota.',
      fallback: true,
    }, { status: 200 }); // Return 200 with fallback flag
  }
});