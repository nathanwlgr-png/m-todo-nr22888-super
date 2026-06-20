import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * geocodeLoteSafe — Gera sugestões de coordenada para um lote de clientes SEM coordenada.
 * MODO SAFE: nunca aplica no Client. Cada sugestão vira item em CRMUpdateQueue para aprovação.
 * Processa um pequeno lote por vez (default 10) para economizar API e tempo.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const limite = Math.min(Number(body.limite) || 10, 20);

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey || !apiKey.trim()) {
      return Response.json({ success: false, status: 'sem_api_key', message: 'GOOGLE_MAPS_API_KEY não configurada.' });
    }

    // Busca clientes sem coordenada
    const todos = await sr.entities.Client.list('-created_date', 500).catch(() => []);
    const semCoord = todos.filter(c => (!c.latitude || !c.longitude) && (c.address || c.city)).slice(0, limite);

    if (semCoord.length === 0) {
      return Response.json({ success: true, status: 'nada_pendente', processados: 0, sugestoes: 0, restantes: 0, message: 'Nenhum cliente sem coordenada para processar.' });
    }

    let sugestoes = 0;
    const detalhes = [];

    for (const c of semCoord) {
      const candidates = [
        { parts: [c.address, c.city, 'SP'], source: 'endereco_completo', precision: 'alta_confianca', score: 95 },
        { parts: [c.clinic_name, c.city, 'SP'], source: 'clinica_cidade', precision: 'media_confianca', score: 75 },
        { parts: [c.city, 'SP'], source: 'city_only', precision: 'baixa_confianca', score: 50 },
      ]
        .map(x => ({ ...x, text: x.parts.filter(p => p && String(p).trim()).join(', ') }))
        // precisa ter mais que apenas "SP" para valer a busca
        .filter(x => x.text && x.text.replace(/[,\s]/gi, '').toUpperCase() !== 'SP');

      let suggestion = null;
      let googleStatus = null;
      let googleError = null;
      for (const candidate of candidates) {
        try {
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(candidate.text)}&key=${apiKey}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            googleStatus = geoData.status;
            googleError = geoData.error_message || null;
            if (geoData.results && geoData.results.length > 0) {
              const loc = geoData.results[0].geometry.location;
              suggestion = { latitude: loc.lat, longitude: loc.lng, source: candidate.source, precision: candidate.precision, score: candidate.score, endereco: candidate.text };
              break;
            }
          }
        } catch (_) { /* tenta próximo */ }
      }

      // Se o Google rejeitou a chave/API, retorna o motivo real imediatamente
      if (!suggestion && (googleStatus === 'REQUEST_DENIED' || googleStatus === 'OVER_QUERY_LIMIT' || googleStatus === 'API_KEY_INVALID')) {
        return Response.json({
          success: false,
          status: 'google_api_bloqueada',
          google_status: googleStatus,
          google_error: googleError,
          message: `A Geocoding API do Google retornou "${googleStatus}". ${googleError || 'Habilite a Geocoding API no Google Cloud e libere a chave para uso server-side.'}`,
        });
      }

      if (!suggestion) {
        detalhes.push({ cliente: c.first_name, status: 'sem_resultado', tentou: candidates.map(x => x.text) });
        continue;
      }

      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${suggestion.latitude},${suggestion.longitude}`;
      await sr.entities.CRMUpdateQueue.create({
        origem: 'sistema',
        texto_original: `Geocodificação em lote para ${c.first_name || c.id}`,
        comando_interpretado: 'geocodificacao',
        cliente_id: c.id,
        tipo_atualizacao: 'geocodificacao',
        campo_alvo: 'latitude_longitude',
        valor_novo: `${suggestion.latitude},${suggestion.longitude}`,
        status: 'pendente',
        risco: 'alto',
        exige_aprovacao: true,
        agente_origem: 'geocodeLoteSafe',
        data_criacao: new Date().toISOString(),
        observacao: `Endereço: ${suggestion.endereco} | Fonte: ${suggestion.source} | Precisão: ${suggestion.precision} (${suggestion.score}%) | Sugerido: ${suggestion.latitude},${suggestion.longitude} | ${mapsLink}`,
      });
      sugestoes++;
      detalhes.push({ cliente: c.first_name, status: 'sugestao_criada', precisao: suggestion.precision });
    }

    const restantes = todos.filter(c => (!c.latitude || !c.longitude) && (c.address || c.city)).length - sugestoes;

    return Response.json({
      success: true,
      status: 'ok',
      processados: semCoord.length,
      sugestoes,
      restantes: Math.max(0, restantes),
      detalhes,
      message: `${sugestoes} sugestões criadas na fila de aprovação. Nada foi aplicado automaticamente.`,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});