import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
    }

    // Extrair dados do Excel
    const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
      json_schema: {
        type: "object",
        properties: {
          clients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                full_name: { type: "string" },
                clinic_name: { type: "string" },
                city: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                cnpj: { type: "string" },
                current_equipment: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (extractResult.status === 'error') {
      return Response.json({ 
        success: false, 
        error: extractResult.details 
      }, { status: 500 });
    }

    const clientsData = extractResult.output?.clients || [];

    // Região laranja permitida
    const ORANGE_REGION_CITIES = [
      'Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 
      'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'
    ];

    // Buscar clientes existentes
    const existingClients = await base44.asServiceRole.entities.Client.list('-updated_date', 1000);
    
    const created = [];
    const rejected = [];
    const duplicates = [];

    for (const clientData of clientsData) {
      if (!clientData.first_name && !clientData.full_name) {
        rejected.push({ reason: 'Nome vazio', data: clientData });
        continue;
      }

      // Verificar se cidade está na região laranja
      const cityMatch = ORANGE_REGION_CITIES.some(validCity => 
        clientData.city?.toLowerCase().includes(validCity.toLowerCase())
      );

      if (!cityMatch && clientData.city) {
        rejected.push({ 
          reason: 'Cidade fora da região laranja', 
          name: clientData.first_name || clientData.full_name,
          city: clientData.city 
        });
        continue;
      }

      // Verificar duplicatas
      const duplicate = existingClients.find(c => 
        (c.first_name?.toLowerCase() === clientData.first_name?.toLowerCase()) ||
        (c.full_name?.toLowerCase() === clientData.full_name?.toLowerCase()) ||
        (clientData.phone && c.phone && c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, ''))
      );

      if (duplicate) {
        duplicates.push({
          name: clientData.first_name || clientData.full_name,
          existing_id: duplicate.id
        });
        continue;
      }

      // Criar cliente
      try {
        const newClient = await base44.asServiceRole.entities.Client.create({
          first_name: clientData.first_name || clientData.full_name?.split(' ')[0],
          full_name: clientData.full_name || clientData.first_name,
          clinic_name: clientData.clinic_name,
          city: clientData.city,
          phone: clientData.phone,
          email: clientData.email,
          address: clientData.address,
          cnpj: clientData.cnpj,
          current_equipment: clientData.current_equipment,
          decision_role: 'proprietario',
          status: 'morno',
          purchase_score: 50
        });

        created.push(newClient);
      } catch (error) {
        rejected.push({ 
          reason: 'Erro ao criar: ' + error.message, 
          name: clientData.first_name || clientData.full_name 
        });
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: clientsData.length,
        created: created.length,
        duplicates: duplicates.length,
        rejected: rejected.length
      },
      created: created.map(c => ({ id: c.id, name: c.first_name, city: c.city })),
      duplicates: duplicates,
      rejected: rejected
    });

  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});