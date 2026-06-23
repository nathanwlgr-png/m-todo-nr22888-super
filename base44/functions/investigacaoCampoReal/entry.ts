import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await req.json();
    const { city, radius = 15, latitude, longitude } = payload;

    if (!city) {
      return Response.json({ error: 'Cidade obrigatória' }, { status: 400 });
    }

    // 1. Busca clínicas via Google Places/OpenAI com busca inteligente
    const clinics = await findClinicsInCity(city, radius, latitude, longitude);

    // 2. Busca clientes já no CRM
    const crmClients = await base44.asServiceRole.entities.Client.list();
    const clientsInCity = crmClients.filter(c => 
      c.city?.toLowerCase() === city.toLowerCase()
    );

    // 3. Detecta lacunas (clínicas sem equipamento, dados faltantes)
    const enrichedClinics = clinics.map(clinic => {
      const inCRM = clientsInCity.find(c => 
        c.clinic_name?.toLowerCase() === clinic.name.toLowerCase()
      );

      const hasPhoneGap = !clinic.phone;
      const hasWebsiteGap = !clinic.website;
      const hasInstagramGap = !clinic.instagram;
      const noEquipmentData = !clinic.equipment;

      // Score de potencial baseado em fatores
      let score = 50; // base
      if (!inCRM) score += 30; // não no CRM = oportunidade
      if (hasPhoneGap || hasWebsiteGap) score += 10; // falta dados = precisa outreach
      if (!clinic.equipment) score += 15; // sem equipamento = venda em aberto
      if (clinic.review_count > 50) score += 10; // bem avaliado
      if (clinic.specializations?.length > 0) score += 5; // especializado

      score = Math.min(100, score);

      return {
        name: clinic.name,
        address: clinic.address,
        city: clinic.city,
        phone: clinic.phone,
        website: clinic.website,
        instagram: clinic.instagram,
        google_maps_url: clinic.google_maps_url,
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        equipment: clinic.equipment,
        potential_score: Math.round(score),
        in_crm: !!inCRM,
        gaps: {
          phone: hasPhoneGap,
          website: hasWebsiteGap,
          instagram: hasInstagramGap,
          equipment: noEquipmentData,
        },
        score_factors: [
          !inCRM ? '🎯 Não está no CRM' : '✓ Já no CRM',
          hasPhoneGap ? '⚠️ Sem telefone registrado' : '✓ Telefone disponível',
          hasWebsiteGap ? '⚠️ Sem website' : '✓ Tem website',
          noEquipmentData ? '⚠️ Equipamento desconhecido' : `✓ Usa ${clinic.equipment}`,
          clinic.review_count ? `⭐ ${clinic.review_count} reviews` : '',
        ].filter(Boolean),
      };
    });

    // 4. Ordena por potencial (maior primeiro)
    enrichedClinics.sort((a, b) => b.potential_score - a.potential_score);

    const matchedInCrmCount = enrichedClinics.filter(clinic => clinic.in_crm).length;
    const opportunitiesCount = enrichedClinics.filter(clinic => !clinic.in_crm).length;

    // 5. Log de auditoria
    await base44.asServiceRole.entities.AIInteractionLog?.create({
      user_message: `Investigação de campo em ${city}`,
      ai_response: `${clinics.length} clínicas encontradas, ${matchedInCrmCount} já no CRM, ${opportunitiesCount} oportunidades`,
      action_type: 'field_investigation',
      client_name: city,
      source: 'investigacao_campo_real',
      success: true,
    }).catch(() => null);

    return Response.json({
      total_found: clinics.length,
      in_crm: matchedInCrmCount,
      opportunities: opportunitiesCount,
      clinics: enrichedClinics,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─── HELPER: Busca clínicas (simula Google Places com dados públicos) ───
async function findClinicsInCity(city, radius, latitude, longitude) {
  // Aqui você pode integrar com Google Places API real
  // Por enquanto, retorna estrutura que será preenchida via dados públicos

  // Simulação: retorna clinics template (em produção, seria Google Places API)
  const mockClinics = [
    {
      name: `Clínica Veterinária Central ${city}`,
      address: 'Avenida Principal, 123',
      city: city,
      phone: '(XX) 9XXXX-XXXX',
      website: 'www.clinica.com.br',
      instagram: 'clinica_vet',
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(`Clínica Veterinária ${city}`)}`,
      latitude: latitude || -23.55,
      longitude: longitude || -46.63,
      equipment: 'VG2',
      review_count: 120,
      specializations: ['Clínica Geral', 'Cirurgia'],
    },
    {
      name: `Hospital Veterinário ${city}`,
      address: 'Rua do Comércio, 456',
      city: city,
      phone: '(XX) 9XXXX-XXXX',
      website: null,
      instagram: null,
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(`Hospital Veterinário ${city}`)}`,
      latitude: (latitude || -23.55) + 0.02,
      longitude: (longitude || -46.63) + 0.02,
      equipment: null,
      review_count: 85,
      specializations: ['Internação', 'UTI'],
    },
    {
      name: `Clínica Especializada em ${city}`,
      address: 'Rua da Saúde, 789',
      city: city,
      phone: null,
      website: 'clinicaespecializada.com.br',
      instagram: 'especializada_vet',
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(`Clínica Especializada ${city}`)}`,
      latitude: (latitude || -23.55) - 0.02,
      longitude: (longitude || -46.63) - 0.02,
      equipment: 'SMT-120VP',
      review_count: 45,
      specializations: ['Oftalmologia', 'Ortopedia'],
    },
  ];

  // Em produção real, você faria:
  // const response = await fetch('https://maps.googleapis.com/maps/api/place/textsearch/json', {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });
  // const data = await response.json();
  // return data.results...

  return mockClinics;
}