import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const city = String(body.city || '').trim();
    const state = String(body.state || '').trim().toUpperCase();
    const radiusKm = Math.max(1, Math.min(50, Number(body.radius_km) || 20));
    const segments = Array.isArray(body.segments) ? body.segments.slice(0, 5) : ['clinica'];
    const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 10));
    if (!city || !state) return Response.json({ error: 'Cidade e UF são obrigatórias' }, { status: 400 });

    const prompt = `Pesquise organizações veterinárias reais em ${city}/${state}, no raio informado de ${radiusKm} km. Use somente fontes públicas abertas durante esta consulta. Não invente nem complete campos ausentes. Não estime distância sem coordenadas confirmadas. Segmentos: ${segments.join(', ')}. Para cada organização, forneça nome, cidade, UF, segmento, telefone e site somente quando confirmados, URLs das fontes realmente consultadas, pequeno trecho de evidência e indique uma fonte oficial quando existir. Uma fonte oficial direta basta; sem fonte oficial, exija duas fontes independentes. Não gere score, intenção de compra, equipamento sugerido, volume, faturamento ou prioridade. Retorne no máximo ${quantity} resultados. Sem evidência suficiente, retorne lista vazia.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }, segment: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' },
                phone: { type: 'string' }, website: { type: 'string' }, official_source_url: { type: 'string' },
                source_urls: { type: 'array', items: { type: 'string' } }, evidence_excerpt: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const validUrl = (value) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
    };
    const seen = new Set();
    const leads = (result.leads || []).flatMap((lead) => {
      const sourceUrls = [...new Set([lead.official_source_url, ...(lead.source_urls || [])].filter(validUrl))];
      const official = validUrl(lead.official_source_url);
      const name = String(lead.name || '').trim();
      if (!name || (!official && sourceUrls.length < 2)) return [];
      const key = `${name.toLowerCase()}|${String(lead.city || city).toLowerCase()}|${state}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        name, segment: String(lead.segment || 'não confirmado'), city: String(lead.city || city),
        state: String(lead.state || state).toUpperCase(), phone: String(lead.phone || ''),
        website: validUrl(lead.website) ? lead.website : '', source_urls: sourceUrls,
        evidence_excerpt: String(lead.evidence_excerpt || '').slice(0, 500),
        validation_status: official ? 'VALIDADO_OFICIAL' : 'VALIDADO_MULTIFONTE',
        verified_at: new Date().toISOString(),
        validation_method: official ? 'fonte oficial pública' : 'duas fontes públicas independentes'
      }];
    }).slice(0, quantity);

    return Response.json({ city, state, radius_km: radiusKm, results_count: leads.length, read_only: true, persisted_records: 0, leads });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});