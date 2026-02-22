import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl } = await req.json();
    
    if (!fileUrl) {
      return Response.json({ error: 'File URL required' }, { status: 400 });
    }

    // Extract data from file
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Extraia TODOS os dados estruturados deste arquivo Excel de clientes.
      
Retorne um array com os seguintes campos (se disponíveis):
- first_name (nome responsável/proprietário)
- clinic_name (nome da clínica)
- city (cidade)
- phone (telefone)
- email
- address (endereço)
- cnpj

Importante: Retorne CADA LINHA como um cliente separado, mesmo que pareça duplicado. Não filtre nada.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          clients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                clinic_name: { type: "string" },
                city: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                cnpj: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Fetch existing clients
    const existingClients = await base44.asServiceRole.entities.Client.list('-updated_date', 5000);
    
    const results = {
      created: [],
      duplicates: [],
      errors: [],
      totalProcessed: response.clients?.length || 0
    };

    for (const clientData of (response.clients || [])) {
      if (!clientData.first_name?.trim()) continue;

      // Check for duplicates by name + city or phone
      const duplicate = existingClients.find(c => 
        (c.first_name?.toLowerCase() === clientData.first_name?.toLowerCase() && 
         c.city?.toLowerCase() === clientData.city?.toLowerCase()) ||
        (clientData.phone && c.phone && 
         c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, ''))
      );

      if (duplicate) {
        results.duplicates.push({
          name: clientData.first_name,
          clinic: clientData.clinic_name,
          city: clientData.city,
          phone: clientData.phone,
          existingId: duplicate.id
        });
        continue;
      }

      try {
        const created = await base44.asServiceRole.entities.Client.create({
          first_name: clientData.first_name.trim(),
          clinic_name: clientData.clinic_name?.trim(),
          city: clientData.city?.trim(),
          phone: clientData.phone?.trim(),
          email: clientData.email?.trim(),
          address: clientData.address?.trim(),
          cnpj: clientData.cnpj?.trim(),
          status: 'morno',
          purchase_score: 50,
          decision_role: 'proprietario'
        });

        results.created.push({
          id: created.id,
          name: clientData.first_name,
          city: clientData.city
        });

        // Add to existing list to check further duplicates in this batch
        existingClients.push(created);
      } catch (error) {
        results.errors.push({
          name: clientData.first_name,
          city: clientData.city,
          reason: error.message
        });
      }
    }

    return Response.json({
      success: true,
      summary: {
        processed: results.totalProcessed,
        created: results.created.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});