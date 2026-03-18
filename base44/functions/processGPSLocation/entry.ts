import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { latitude, longitude, radius = 5, city } = await req.json();

    // Buscar clínicas próximas usando IA com contexto da internet
    const searchPrompt = city 
      ? `Liste clínicas veterinárias em ${city}, Brasil. Para cada clínica encontrada, forneça: nome completo, endereço completo, telefone, website (se disponível), CNPJ (se disponível). Busque até 10 clínicas.`
      : `Liste clínicas veterinárias próximas às coordenadas ${latitude}, ${longitude} em um raio de ${radius}km. Para cada clínica, forneça: nome completo, endereço completo, telefone, website (se disponível), CNPJ (se disponível). Busque até 10 clínicas.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          clinics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                cnpj: { type: "string" },
                city: { type: "string" }
              }
            }
          }
        }
      }
    });

    const newLeads = [];
    const duplicates = [];

    for (const clinic of llmResponse.clinics || []) {
      // Verificar duplicidade por nome, CNPJ ou telefone
      const filters = [];
      if (clinic.cnpj) filters.push({ cnpj: clinic.cnpj });
      if (clinic.phone) filters.push({ phone: clinic.phone });
      
      let isDuplicate = false;

      // Verificar em Clients
      if (clinic.cnpj) {
        const existingClient = await base44.asServiceRole.entities.Client.filter({ cnpj: clinic.cnpj });
        if (existingClient.length > 0) isDuplicate = true;
      }
      if (clinic.phone && !isDuplicate) {
        const existingClientByPhone = await base44.asServiceRole.entities.Client.filter({ phone: clinic.phone });
        if (existingClientByPhone.length > 0) isDuplicate = true;
      }

      // Verificar em Leads
      if (!isDuplicate && clinic.phone) {
        const existingLead = await base44.asServiceRole.entities.Lead.filter({ phone: clinic.phone });
        if (existingLead.length > 0) isDuplicate = true;
      }

      if (isDuplicate) {
        duplicates.push(clinic.name);
        continue;
      }

      // Cadastrar novo lead
      const newLead = await base44.asServiceRole.entities.Lead.create({
        full_name: clinic.name,
        company: clinic.name,
        phone: clinic.phone || '',
        city: clinic.city || city || 'N/A',
        source: 'gps_discovery',
        notes: `Descoberto via GPS em ${new Date().toISOString().split('T')[0]} nas coordenadas ${latitude},${longitude}`,
        status: 'novo',
      });
      newLeads.push(newLead);
    }

    return Response.json({
      success: true,
      message: `${newLeads.length} novos leads cadastrados, ${duplicates.length} duplicados ignorados`,
      new_leads: newLeads.length,
      duplicates: duplicates.length,
      duplicate_names: duplicates
    });

  } catch (error) {
    console.error('processGPSLocation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});