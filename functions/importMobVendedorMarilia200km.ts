import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMIT_DELAY = 1500;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { cnpj, mobvendedor_id } = body;

    const finalCnpj = cnpj || '13693877000157';
    const finalMobId = mobvendedor_id || '53';

    console.log(`Buscando clientes do MobVendedor - CNPJ: ${finalCnpj}, ID: ${finalMobId}`);

    // Busca clientes do MobVendedor
    const clientsResponse = await fetch(
      `https://api.targetsis.com.br/mobvendedor/clientes?cnpj=${finalCnpj}&distribuidor=${finalMobId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!clientsResponse.ok) {
      console.error('Erro na API MobVendedor:', clientsResponse.status);
      return Response.json({ 
        success: false, 
        error: 'Erro ao buscar clientes do MobVendedor', 
        synced: 0,
        total: 0,
        details: `Status: ${clientsResponse.status}`
      });
    }

    const clientsData = await clientsResponse.json();
    const allClients = clientsData.clientes || [];

    console.log(`Total de clientes encontrados: ${allClients.length}`);

    // Coordenadas de Marília-SP
    const mariliaLat = -22.2139;
    const mariliaLng = -49.9458;
    const radiusKm = 200;

    // Função para calcular distância (Haversine)
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    // Função para geocodificar cidade via API pública
    async function getCoordinates(cidade, estado = 'SP') {
      try {
        const query = encodeURIComponent(`${cidade}, ${estado}, Brasil`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'NR22-CRM-App'
            }
          }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }
        return null;
      } catch (error) {
        console.error(`Erro geocoding ${cidade}:`, error);
        return null;
      }
    }

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const processedClients = [];

    // Processar em lotes
    const batchSize = 3;

    for (let i = 0; i < allClients.length; i += batchSize) {
      const batch = allClients.slice(i, i + batchSize);
      
      for (const client of batch) {
        try {
          // Validar cidade
          const cidade = client.cidade?.trim();
          if (!cidade) {
            skippedCount++;
            continue;
          }

          // Geocodificar cidade
          const coords = await getCoordinates(cidade);
          await delay(200); // Rate limit para geocoding

          if (!coords) {
            console.log(`Não foi possível geocodificar: ${cidade}`);
            skippedCount++;
            continue;
          }

          // Calcular distância de Marília
          const distance = calculateDistance(mariliaLat, mariliaLng, coords.lat, coords.lng);

          // Filtrar por raio de 200km
          if (distance > radiusKm) {
            skippedCount++;
            continue;
          }

          console.log(`Cliente ${client.razao_social || client.nome} em ${cidade} - ${distance.toFixed(1)}km de Marília`);

          // Verificar se já existe
          const existing = await base44.asServiceRole.entities.Client.filter({
            external_code: client.codigo_cliente
          }).catch(() => []);

          const clientData = {
            external_code: client.codigo_cliente,
            first_name: (client.nome?.split(' ')[0] || client.razao_social?.split(' ')[0] || 'Cliente').substring(0, 50),
            full_name: (client.nome || client.razao_social || '').substring(0, 100),
            cnpj: client.cnpj,
            razao_social: client.razao_social,
            email: client.email,
            phone: client.telefone,
            address: client.endereco,
            cep: client.cep,
            city: cidade,
            clinic_name: (client.razao_social || client.nome || '').substring(0, 100),
            status: 'morno',
            lead_source: 'importacao_planilha',
            purchase_score: 50,
            notes: `Importado do MobVendedor - Distância de Marília: ${distance.toFixed(1)}km`
          };

          if (existing?.length > 0) {
            await base44.asServiceRole.entities.Client.update(existing[0].id, clientData);
            console.log(`Cliente atualizado: ${clientData.first_name}`);
          } else {
            await base44.asServiceRole.entities.Client.create(clientData);
            console.log(`Cliente criado: ${clientData.first_name}`);
          }

          syncedCount++;
          processedClients.push({
            nome: clientData.first_name,
            cidade: cidade,
            distancia_km: distance.toFixed(1)
          });

        } catch (e) {
          console.error(`Erro ao processar ${client.codigo_cliente}:`, e);
          errorCount++;
        }
      }

      // Rate limiting entre lotes
      if (i + batchSize < allClients.length) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    console.log(`Importação concluída: ${syncedCount} importados, ${skippedCount} fora do raio, ${errorCount} erros`);

    return Response.json({ 
      success: true, 
      synced: syncedCount,
      total: allClients.length,
      skipped: skippedCount,
      errors: errorCount,
      radius_km: radiusKm,
      center: 'Marília-SP',
      clients: processedClients
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      synced: 0
    }, { status: 500 });
  }
});