import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * smartClientMatcher — Identifica cliente no CRM por nome parcial, apelido, cidade ou descrição.
 * Retorna 0, 1 ou múltiplos candidatos com score de similaridade.
 * Usado pelo agente WhatsApp para identificação automática.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, city, limit = 5 } = await req.json();

    if (!query || query.trim().length < 2) {
      return Response.json({ error: 'Query muito curta' }, { status: 400 });
    }

    const queryLower = query.toLowerCase().trim();

    // Buscar todos os clientes e leads em paralelo
    const [clients, leads] = await Promise.all([
      base44.entities.Client.list('-purchase_score', 500),
      base44.entities.Lead.list('-created_date', 200)
    ]);

    // Função de pontuação de similaridade
    const scoreMatch = (record, isLead = false) => {
      let score = 0;
      const fields = [
        record.first_name,
        record.full_name,
        record.clinic_name,
        record.city,
        record.phone,
        record.email,
        record.cnpj,
        record.company
      ].map(f => (f || '').toLowerCase());

      // Match exato no primeiro nome = 100
      if (fields[0] === queryLower) score += 100;
      // Match parcial no nome = 60
      else if (fields[0].includes(queryLower) || queryLower.includes(fields[0])) score += 60;

      // Match em nome completo/clínica
      if (fields[1].includes(queryLower)) score += 40;
      if (fields[2].includes(queryLower)) score += 40;

      // Bonus se cidade bate
      if (city && fields[3].includes(city.toLowerCase())) score += 20;

      // Match em telefone ou email (busca direta)
      if (fields[4].includes(queryLower) || fields[5].includes(queryLower)) score += 80;

      // Match em CNPJ (sem formatação)
      const cnpjClean = queryLower.replace(/\D/g, '');
      if (cnpjClean.length >= 8 && (record.cnpj || '').replace(/\D/g, '').includes(cnpjClean)) score += 90;

      return score;
    };

    // Pontuar e filtrar
    const clientMatches = clients
      .map(c => ({ ...c, _score: scoreMatch(c), _type: 'client' }))
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    const leadMatches = leads
      .map(l => ({ ...l, _score: scoreMatch(l, true), _type: 'lead' }))
      .filter(l => l._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.floor(limit / 2));

    const allMatches = [...clientMatches, ...leadMatches]
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    const result = {
      query,
      total_found: allMatches.length,
      matches: allMatches.map(m => ({
        id: m.id,
        type: m._type,
        score_match: m._score,
        name: m.first_name || m.full_name,
        clinic: m.clinic_name || m.company,
        city: m.city,
        phone: m.phone,
        status: m.status,
        purchase_score: m.purchase_score,
        pipeline_stage: m.pipeline_stage || m.stage
      })),
      recommendation: allMatches.length === 0
        ? 'not_found'
        : allMatches.length === 1 && allMatches[0]._score >= 60
        ? 'use_directly'
        : 'ask_user'
    };

    return Response.json({ success: true, ...result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});