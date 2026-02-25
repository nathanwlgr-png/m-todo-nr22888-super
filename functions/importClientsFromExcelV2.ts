import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Normaliza telefone para comparação
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-11); // últimos 11 dígitos
}

// Normaliza nome para comparação
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Normaliza CNPJ para comparação
function normalizeCNPJ(cnpj) {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

// Cria lotes de array
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, clientsJson } = await req.json();

    let rawClients = [];

    if (clientsJson && Array.isArray(clientsJson)) {
      // Dados já extraídos enviados pelo frontend
      rawClients = clientsJson;
    } else if (fileUrl) {
      // Extrai do arquivo via LLM
      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia TODOS os registros deste arquivo de clientes. Retorne CADA linha como um cliente separado.
Campos: first_name (nome responsável), clinic_name (clínica), city, phone (fomato 55DDD...), email, address, cnpj, external_code.
Não filtre nada. Não pule linhas.`,
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
                  full_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  cnpj: { type: "string" },
                  external_code: { type: "string" }
                }
              }
            }
          }
        }
      });
      rawClients = response.clients || [];
    } else {
      return Response.json({ error: 'fileUrl ou clientsJson obrigatório' }, { status: 400 });
    }

    if (rawClients.length === 0) {
      return Response.json({ success: false, error: 'Nenhum cliente encontrado nos dados' });
    }

    // Busca TODOS os clientes existentes (sem limite)
    const existingClients = await base44.asServiceRole.entities.Client.list('-updated_date', 99999);

    // Monta índices de busca para performance O(1)
    const phoneIndex = new Map();
    const nameIndex = new Map();
    const cnpjIndex = new Map();
    const emailIndex = new Map();

    for (const c of existingClients) {
      if (c.phone) phoneIndex.set(normalizePhone(c.phone), c.id);
      if (c.first_name) nameIndex.set(`${normalizeName(c.first_name)}|${normalizeName(c.city)}`, c.id);
      if (c.cnpj) cnpjIndex.set(normalizeCNPJ(c.cnpj), c.id);
      if (c.email) emailIndex.set(c.email.toLowerCase().trim(), c.id);
    }

    const results = {
      created: [],
      duplicates: [],
      errors: [],
      totalProcessed: rawClients.length
    };

    // Processa em lotes de 20 em paralelo (sem limite de quantidade total)
    const BATCH_SIZE = 20;
    const batches = chunk(rawClients, BATCH_SIZE);

    for (const batch of batches) {
      await Promise.all(batch.map(async (clientData) => {
        if (!clientData.first_name?.trim()) {
          results.errors.push({ name: clientData.clinic_name || '?', reason: 'Sem nome' });
          return;
        }

        // Verifica duplicidade por phone, CNPJ, email ou nome+cidade
        const phoneKey = normalizePhone(clientData.phone);
        const nameKey = `${normalizeName(clientData.first_name)}|${normalizeName(clientData.city)}`;
        const cnpjKey = normalizeCNPJ(clientData.cnpj);
        const emailKey = clientData.email?.toLowerCase().trim();

        const dupId =
          (phoneKey && phoneIndex.get(phoneKey)) ||
          nameIndex.get(nameKey) ||
          (cnpjKey && cnpjKey.length === 14 && cnpjIndex.get(cnpjKey)) ||
          (emailKey && emailIndex.get(emailKey));

        if (dupId) {
          results.duplicates.push({
            name: clientData.first_name,
            clinic: clientData.clinic_name,
            city: clientData.city,
            reason: phoneKey && phoneIndex.get(phoneKey) ? 'Telefone já existe' :
                    nameIndex.get(nameKey) ? 'Nome+cidade já existe' :
                    cnpjKey && cnpjIndex.get(cnpjKey) ? 'CNPJ já existe' : 'Email já existe',
            existingId: dupId
          });
          return;
        }

        try {
          const created = await base44.asServiceRole.entities.Client.create({
            first_name: clientData.first_name.trim(),
            full_name: clientData.full_name?.trim() || undefined,
            clinic_name: clientData.clinic_name?.trim() || undefined,
            city: clientData.city?.trim() || undefined,
            phone: clientData.phone?.trim() || undefined,
            email: clientData.email?.trim() || undefined,
            address: clientData.address?.trim() || undefined,
            cnpj: clientData.cnpj?.trim() || undefined,
            external_code: clientData.external_code?.trim() || undefined,
            status: 'morno',
            purchase_score: 50,
            lead_source: 'importacao_planilha',
            decision_role: 'proprietario'
          });

          results.created.push({ id: created.id, name: clientData.first_name, city: clientData.city });

          // Atualiza índices para evitar duplicidade dentro do mesmo lote
          if (phoneKey) phoneIndex.set(phoneKey, created.id);
          nameIndex.set(nameKey, created.id);
          if (cnpjKey && cnpjKey.length === 14) cnpjIndex.set(cnpjKey, created.id);
          if (emailKey) emailIndex.set(emailKey, created.id);

        } catch (error) {
          results.errors.push({ name: clientData.first_name, city: clientData.city, reason: error.message });
        }
      }));
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
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});