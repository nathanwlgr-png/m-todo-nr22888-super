// FUNÇÃO 2: Busca TODAS as clínicas veterinárias de uma cidade + perfil completo + lead geração automática
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { city, state = 'SP', auto_create_leads = false, limit = 20 } = await req.json();
    if (!city) return Response.json({ error: 'city obrigatório' }, { status: 400 });

    // Buscar clínicas existentes no CRM desta cidade
    const existingClients = await base44.asServiceRole.entities.Client.list().catch(() => []);
    const cityClients = existingClients.filter(c =>
      c.city?.toLowerCase().includes(city.toLowerCase())
    );

    // Busca na internet por TODAS as clínicas da cidade
    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Pesquise e liste TODAS as clínicas veterinárias em ${city}, ${state}, Brasil.

Para cada clínica encontre:
1. Nome completo da clínica
2. Endereço completo
3. Telefone e WhatsApp
4. Site e Instagram
5. Especialidades (pequenos animais, grandes animais, exóticos, etc)
6. Avaliação Google (nota e número de avaliações)
7. Porte estimado (pequena/média/grande)
8. Volume estimado de atendimentos/mês
9. Se possui equipamentos de laboratório próprio
10. Nome do veterinário responsável/proprietário
11. Potencial para aquisição de analisadores hematológicos/bioquímicos
12. Score de oportunidade (0-100) para venda de equipamentos Seamaty

Busque no Google Maps, sites de clínicas, Instagram, Facebook.
Retorne o MÁXIMO de clínicas que encontrar (mínimo 10).

Contexto: Somos a CMAT Brasil, distribuidores Seamaty (SMT-120VP, VG1, VG2, Vi1, VBC50A, VQ1 PCR).
Clínicas que terceirizam hemogramas ou têm volume >40/mês são nossos clientes ideais.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          city_summary: {
            type: 'object',
            properties: {
              cidade: { type: 'string' },
              total_clinicas_encontradas: { type: 'number' },
              mercado_estimado: { type: 'string' },
              oportunidade_geral: { type: 'string' },
            }
          },
          clinicas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome: { type: 'string' },
                responsavel: { type: 'string' },
                telefone: { type: 'string' },
                whatsapp: { type: 'string' },
                endereco: { type: 'string' },
                site: { type: 'string' },
                instagram: { type: 'string' },
                especialidades: { type: 'array', items: { type: 'string' } },
                avaliacao_google: { type: 'number' },
                num_avaliacoes: { type: 'number' },
                porte: { type: 'string' },
                volume_mensal_estimado: { type: 'string' },
                tem_lab_proprio: { type: 'boolean' },
                equipamento_atual: { type: 'string' },
                score_oportunidade: { type: 'number' },
                equipamento_recomendado: { type: 'string' },
                ja_no_crm: { type: 'boolean' },
                abordagem_sugerida: { type: 'string' },
                prioridade: { type: 'string' },
              }
            }
          },
          top_oportunidades: { type: 'array', items: { type: 'string' } },
          estrategia_cidade: { type: 'string' },
        }
      }
    });

    // Marcar quais já estão no CRM
    if (searchResult?.clinicas) {
      searchResult.clinicas = searchResult.clinicas.map(c => ({
        ...c,
        ja_no_crm: cityClients.some(existing =>
          existing.clinic_name?.toLowerCase().includes(c.nome?.toLowerCase()) ||
          existing.first_name?.toLowerCase().includes(c.responsavel?.toLowerCase())
        )
      }));
    }

    // Auto-criar leads se solicitado
    const createdLeads = [];
    if (auto_create_leads && searchResult?.clinicas) {
      const newClinics = searchResult.clinicas.filter(c => !c.ja_no_crm && c.score_oportunidade > 50);

      for (const clinic of newClinics.slice(0, limit)) {
        const lead = await base44.asServiceRole.entities.Client.create({
          first_name: clinic.responsavel || 'Responsável',
          clinic_name: clinic.nome,
          city: city,
          phone: clinic.whatsapp || clinic.telefone,
          address: clinic.endereco,
          website: clinic.site,
          instagram_handle: clinic.instagram,
          status: 'frio',
          pipeline_stage: 'lead',
          lead_source: 'analise_mercado_ia',
          equipment_interest: clinic.equipamento_recomendado,
          purchase_score: clinic.score_oportunidade || 30,
          notes: `[IA] Clínica encontrada via busca de mercado em ${city}. Especialidades: ${clinic.especialidades?.join(', ')}. Porte: ${clinic.porte}.`,
        }).catch(e => null);

        if (lead) createdLeads.push(lead);
      }
    }

    return Response.json({
      success: true,
      city,
      existing_in_crm: cityClients.length,
      search_results: searchResult,
      auto_created_leads: createdLeads.length,
      leads_created: createdLeads.map(l => ({ id: l.id, name: l.first_name, clinic: l.clinic_name })),
    });

  } catch (error) {
    console.error('Erro buscaClinicasCidade:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});