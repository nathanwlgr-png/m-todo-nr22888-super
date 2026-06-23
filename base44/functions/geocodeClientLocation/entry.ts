import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * geocodeClientLocation — MODO SAFE
 * NÃO atualiza Client diretamente. Gera sugestão de coordenada em CRMUpdateQueue
 * para aprovação humana. Nunca usa coordenada simulada/mock como valor real.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const payload = await req.json().catch(() => ({}));
    const record = payload.data || payload.client || {};
    const client_id = payload.client_id || record.id || payload?.event?.entity_id;
    const address = payload.address || record.address || record.location || '';
    const clinic_name = payload.clinic_name || record.clinic_name || record.first_name || record.full_name || '';
    const city = payload.city || record.city || '';
    const state = payload.state || record.state || record.uf || 'SP';

    if (!client_id) {
      return Response.json({
        success: false,
        queued: false,
        geocoded: false,
        error: 'client_id obrigatório',
        status: 'payload_incompleto',
      }, { status: 400 });
    }

    // Buscar cliente atual. Se não existir, retornar 404 SEM criar fila.
    let current = null;
    try {
      const found = await sr.entities.Client.filter({ id: client_id });
      current = found && found.length ? found[0] : null;
    } catch (_) { current = null; }

    if (!current) {
      return Response.json({
        success: false,
        applied: false,
        queued: false,
        geocoded: false,
        error: 'Cliente não encontrado',
        status: 'cliente_inexistente',
        message: 'client_id não existe em Client. Nenhuma fila foi criada.',
      }, { status: 404 });
    }

    const candidates = [
      { text: `${address}, ${city}, ${state}`, source: 'endereco_completo', precision: 'alta_confianca', score: 95 },
      { text: `${clinic_name}, ${city}, ${state}`, source: 'clinica_cidade', precision: 'media_confianca', score: 75 },
      { text: `${city}, ${state}`, source: 'city_only', precision: 'baixa_confianca', score: 50 },
    ].filter(c => c.text && c.text.replace(/[,\s]/g, '') !== '');

    let suggestion = null;
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    for (const candidate of candidates) {
      if (!apiKey || !apiKey.trim()) break;
      try {
        const query = encodeURIComponent(candidate.text);
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const loc = geoData.results[0].geometry.location;
            suggestion = {
              latitude: loc.lat,
              longitude: loc.lng,
              geocode_source: candidate.source,
              precision_status: candidate.precision,
              location_confidence_score: candidate.score,
              endereco_usado: candidate.text,
            };
            break;
          }
        }
      } catch (_) { /* tenta próximo candidato */ }
    }

    // Geocode falhou ou sem API: NÃO inventar coordenada
    if (!suggestion) {
      return Response.json({
        success: false,
        geocoded: false,
        message: 'Sem coordenada validada. Nenhuma coordenada simulada foi gerada nem aplicada.',
        status: 'sem_coordenada_validada',
      });
    }

    const jaTinha = !!(current?.latitude && current?.longitude);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${suggestion.latitude},${suggestion.longitude}`;
    const obs = [
      `Endereço usado: ${suggestion.endereco_usado}`,
      `Fonte: ${suggestion.geocode_source}`,
      `Precisão: ${suggestion.precision_status} (${suggestion.location_confidence_score}%)`,
      `Cidade/UF: ${city || ''}/${state || ''}`,
      jaTinha ? `Cliente já tinha: ${current.latitude},${current.longitude}` : 'Cliente sem coordenada anterior',
      `Sugerido: ${suggestion.latitude},${suggestion.longitude}`,
      `Link: ${mapsLink}`,
    ].join(' | ');

    // Criar item na fila de aprovação — NÃO altera o Client
    const queueItem = await sr.entities.CRMUpdateQueue.create({
      origem: 'sistema',
      texto_original: `Geocodificação sugerida para cliente ${current?.first_name || client_id}`,
      comando_interpretado: 'geocodificacao',
      cliente_id: client_id,
      tipo_atualizacao: 'geocodificacao',
      campo_alvo: 'latitude_longitude',
      valor_novo: `${suggestion.latitude},${suggestion.longitude}`,
      status: 'pendente',
      risco: 'alto',
      exige_aprovacao: true,
      agente_origem: 'geocodeClientLocation',
      data_criacao: new Date().toISOString(),
      observacao: obs,
    });

    return Response.json({
      success: true,
      geocoded: true,
      applied: false,
      pending_approval: true,
      crm_update_queue_id: queueItem.id,
      suggestion,
      maps_link: mapsLink,
      message: 'Coordenada sugerida enviada para aprovação (CRMUpdateQueue). Nada foi aplicado no cliente.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});