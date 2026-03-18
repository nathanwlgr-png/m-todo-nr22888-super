import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { clients_data = [], convert_leads = true } = body;

    // ─── 1. BUSCAR LEADS/PROSPECTS PARA CONVERTER ────────────────────────
    const [allLeads, existingClients] = await Promise.all([
      base44.asServiceRole.entities.Lead.list().catch(() => []),
      base44.asServiceRole.entities.Client.list().catch(() => [])
    ]);

    const createdClients = [];
    const errors = [];

    // ─── 2. CONVERTER LEADS COM SCORE ALTO EM CLIENTES ───────────────────
    let highScoreLeads = [];
    if (convert_leads) {
      highScoreLeads = allLeads.filter(l => {
        const score = l.predictive_score || 0;
        return score >= 60 || l.stage === 'qualificado' || l.stage === 'convertido';
      });

      for (const lead of highScoreLeads) {
        try {
          // Verificar duplicata
          const isDuplicate = existingClients.some(c =>
            (c.cnpj && lead.cnpj && c.cnpj.replace(/\D/g, '') === lead.cnpj.replace(/\D/g, '')) ||
            (c.full_name && lead.full_name && c.full_name.toLowerCase() === lead.full_name.toLowerCase()) ||
            (c.email && lead.email && c.email === lead.email)
          );

          if (!isDuplicate) {
            const newClient = await base44.asServiceRole.entities.Client.create({
              full_name: lead.full_name || lead.name || 'Lead Convertido',
              first_name: (lead.full_name || lead.name || '').split(' ')[0],
              email: lead.email || null,
              phone: lead.phone || null,
              clinic_name: lead.company || null,
              city: lead.city || null,
              cnpj: lead.cnpj || null,
              lead_source: 'importacao_planilha',
              pipeline_stage: 'qualificado',
              status: lead.predictive_score >= 70 ? 'quente' : 'morno',
              purchase_score: Math.round(lead.predictive_score || 50),
              representante: lead.assigned_to || 'Nathan',
              notes: `Convertido de Lead. Score: ${lead.predictive_score || 0}. Origem: ${lead.source}`
            });

            createdClients.push({
              id: newClient.id,
              name: newClient.full_name,
              status: 'criado'
            });
          }
        } catch (e) {
          errors.push(`Erro ao converter lead ${lead.full_name}: ${e.message}`);
        }
      }
    }

    // ─── 3. CADASTRAR CLIENTES DO ARRAY ────────────────────────────────────
    for (const clientData of clients_data) {
      try {
        const isDuplicate = existingClients.some(c =>
          (c.cnpj && clientData.cnpj && c.cnpj.replace(/\D/g, '') === clientData.cnpj.replace(/\D/g, '')) ||
          (c.email && clientData.email && c.email === clientData.email) ||
          (c.phone && clientData.phone && c.phone === clientData.phone)
        );

        if (!isDuplicate) {
          const newClient = await base44.asServiceRole.entities.Client.create({
            full_name: clientData.full_name || clientData.name || 'Novo Cliente',
            first_name: (clientData.full_name || clientData.name || '').split(' ')[0],
            email: clientData.email || null,
            phone: clientData.phone || null,
            clinic_name: clientData.clinic_name || clientData.company || null,
            city: clientData.city || null,
            cnpj: clientData.cnpj || null,
            cep: clientData.cep || null,
            address: clientData.address || null,
            instagram_handle: clientData.instagram || null,
            facebook_url: clientData.facebook || null,
            website: clientData.website || null,
            current_equipment: clientData.current_equipment || null,
            equipment_interest: clientData.equipment_interest || null,
            lead_source: 'importacao_planilha',
            pipeline_stage: clientData.pipeline_stage || 'lead',
            status: clientData.status || 'morno',
            purchase_score: clientData.purchase_score || 50,
            representante: clientData.representante || 'Nathan',
            notes: clientData.notes || 'Importado via bulk upload'
          });

          createdClients.push({
            id: newClient.id,
            name: newClient.full_name,
            status: 'criado'
          });
        } else {
          createdClients.push({
            name: clientData.full_name || clientData.name,
            status: 'duplicado'
          });
        }
      } catch (e) {
        errors.push(`Erro ao criar cliente ${clientData.full_name}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      total_created: createdClients.filter(c => c.status === 'criado').length,
      total_duplicates: createdClients.filter(c => c.status === 'duplicado').length,
      leads_converted: highScoreLeads?.length || 0,
      created_clients: createdClients,
      errors: errors.length > 0 ? errors : null,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('bulkClientImportAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});