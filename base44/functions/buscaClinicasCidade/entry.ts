// buscaClinicasCidade — v2.1 com cache via SeamHunt + filtro de cidade otimizado
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE_DAYS = 30;

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { city, state = 'SP', auto_create_leads = false, limit = 20 } = await req.json();
    if (!city) return Response.json({ error: 'city obrigatório' }, { status: 400 });

    const normalizeCity = (s) => s.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cityNorm = normalizeCity(city);
    const stateNorm = state.trim().toUpperCase();

    // ── 1. VERIFICAR CACHE no SeamHunt ──────────────────────────────────────
    const cached = await base44.asServiceRole.entities.SeamHunt.filter({
      city: cityNorm,
    }).catch(() => []);

    const validCache = cached.find(c => {
      if (c.search_status !== 'completed') return false;
      if (!c.cached_until) return false;
      return new Date(c.cached_until) > new Date();
    });

    if (validCache) {
      console.log(`[CACHE HIT] ${city}/${state} — retornando cache (expira ${validCache.cached_until})`);

      // Marcar clínicas já no CRM sem carregar todos — filtrar só por cidade
      const cityClients = await base44.asServiceRole.entities.Client.filter({ city: cityNorm }).catch(() => []);

      // Reconstruir clínicas a partir do schema do SeamHunt
      const cachedClinics = (validCache.search_results || []).map(sr => {
        let extra = {};
        try { extra = JSON.parse(sr.potential_supplies?.[0] || '{}'); } catch {}
        const nome = sr.name || '';
        return {
          nome,
          responsavel: extra.responsavel || 'Não especificado',
          telefone: sr.phone || '',
          whatsapp: sr.phone || '',
          endereco: extra.endereco || '',
          site: sr.website || '',
          instagram: sr.instagram || '',
          especialidades: extra.especialidades || [],
          avaliacao_google: extra.avaliacao_google || null,
          num_avaliacoes: extra.num_avaliacoes || null,
          porte: extra.porte || '',
          volume_mensal_estimado: extra.volume_mensal_estimado || '',
          tem_lab_proprio: extra.tem_lab_proprio || false,
          equipamento_atual: extra.equipamento_atual || '',
          score_oportunidade: sr.seamaty_score || 0,
          equipamento_recomendado: sr.potential_product || '',
          abordagem_sugerida: sr.next_action || '',
          prioridade: sr.seamaty_priority || '',
          ja_no_crm: cityClients.some(existing =>
            existing.clinic_name?.toLowerCase().includes(nome.toLowerCase()) ||
            existing.first_name?.toLowerCase().includes(nome.toLowerCase())
          ),
        };
      });

      return Response.json({
        success: true,
        city,
        from_cache: true,
        cache_expires: validCache.cached_until,
        existing_in_crm: cityClients.length,
        search_results: {
          clinicas: cachedClinics,
          city_summary: null,
          top_oportunidades: [],
          estrategia_cidade: '',
        },
        auto_created_leads: 0,
        leads_created: [],
      });
    }

    // ── 2. SEM CACHE — buscar clientes da cidade (FILTRADO, não list completo) ─
    const cityClients = await base44.asServiceRole.entities.Client.filter({
      city: cityNorm
    }).catch(() => []);

    // ── 3. INVOCAR IA COM INTERNET ─────────────────────────────────────────
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

    // ── 4. MARCAR QUAIS JÁ ESTÃO NO CRM ────────────────────────────────────
    const clinicas = (searchResult?.clinicas || []).map(c => ({
      ...c,
      ja_no_crm: cityClients.some(existing =>
        existing.clinic_name?.toLowerCase().includes(c.nome?.toLowerCase()) ||
        existing.first_name?.toLowerCase().includes(c.responsavel?.toLowerCase())
      )
    }));

    // ── 5. SALVAR NO CACHE (SeamHunt) — dados como search_results com nome no campo name ───
    const cachedUntil = new Date(Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    // Mapear clinicas para o schema do SeamHunt.search_results
    // E guardar o payload completo serializado no primeiro item via seamaty_score=-1 como marcador
    const cachePayload = clinicas.map(c => ({
      name: c.nome || '',
      phone: c.telefone || c.whatsapp || '',
      website: c.site || '',
      instagram: c.instagram || '',
      city: cityNorm,
      segment: 'clinica',
      seamaty_score: c.score_oportunidade || 0,
      seamaty_priority: c.prioridade || '',
      potential_product: c.equipamento_recomendado || '',
      maps_url: '',
      data_source: ['IA'],
      confirmed_in_crm: c.ja_no_crm || false,
      next_action: c.abordagem_sugerida || '',
      // campos extras serializados no potential_supplies (array de string)
      potential_supplies: [
        JSON.stringify({
          responsavel: c.responsavel,
          endereco: c.endereco,
          especialidades: c.especialidades,
          porte: c.porte,
          volume_mensal_estimado: c.volume_mensal_estimado,
          tem_lab_proprio: c.tem_lab_proprio,
          equipamento_atual: c.equipamento_atual,
          avaliacao_google: c.avaliacao_google,
          num_avaliacoes: c.num_avaliacoes,
        })
      ],
    }));

    // Só salvar cache se tiver resultados válidos
    if (clinicas.length > 0) {
      await base44.asServiceRole.entities.SeamHunt.create({
        city: cityNorm,
        radius_km: 50,
        depth: 'completa',
        segment: ['clinica', 'hospital', 'laboratorio'],
        results_count: clinicas.length,
        execution_time_ms: Date.now() - startTime,
        credits_spent: 1,
        search_results: cachePayload,
        cached_until: cachedUntil,
        search_status: 'completed',
      }).catch(e => console.warn('Falha ao salvar cache:', e.message));
    }

    // ── 6. REGISTRAR NO AUDIT LOG ───────────────────────────────────────────
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'ia_analysis',
      module: 'buscaClinicasCidade',
      user_email: user.email,
      duration_ms: Date.now() - startTime,
      credits_spent: 1,
      success: true,
      output_size: JSON.stringify(clinicas).length,
    }).catch(() => null);

    // ── 7. AUTO-CRIAR LEADS SE SOLICITADO ──────────────────────────────────
    const createdLeads = [];
    if (auto_create_leads && clinicas.length > 0) {
      const newClinics = clinicas.filter(c => !c.ja_no_crm && c.score_oportunidade > 50);
      for (const clinic of newClinics.slice(0, limit)) {
        const lead = await base44.asServiceRole.entities.Client.create({
          first_name: clinic.responsavel || 'Responsável',
          clinic_name: clinic.nome,
          city: cityNorm,
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
        }).catch(() => null);
        if (lead) createdLeads.push(lead);
      }
    }

    return Response.json({
      success: true,
      city,
      from_cache: false,
      existing_in_crm: cityClients.length,
      search_results: {
        clinicas,
        city_summary: searchResult?.city_summary,
        top_oportunidades: searchResult?.top_oportunidades || [],
        estrategia_cidade: searchResult?.estrategia_cidade || '',
      },
      auto_created_leads: createdLeads.length,
      leads_created: createdLeads.map(l => ({ id: l.id, name: l.first_name, clinic: l.clinic_name })),
    });

  } catch (error) {
    console.error('Erro buscaClinicasCidade:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});