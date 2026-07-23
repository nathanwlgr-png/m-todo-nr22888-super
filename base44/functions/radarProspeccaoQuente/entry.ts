import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── RADAR DE PROSPECÇÃO QUENTE — NR22888 ──
// Varre clínicas/hospitais/laboratórios de uma região e PRIORIZA quem ainda usa
// concorrente ou análise terceirizada (maior chance de conversão SEAMATY).
// Gera battlecard (argumento de ataque) pronto e injeta como LeadHunterSEAMATY quente.
// SAFE: usa apenas dados públicos. Nada é enviado. Tudo aguarda aprovação do Nathan.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let isAutomated = false;
    try { if (!(await base44.auth.me())) isAutomated = true; } catch (_e) { isAutomated = true; }

    const body = await req.json().catch(() => ({}));
    const { city = 'Marília', state = 'SP', radius_km = 150, dry_run = false } = body;

    // Evitar duplicatas: nomes já capturados + clientes existentes
    const [leadsExistentes, clientesExistentes] = await Promise.all([
      base44.asServiceRole.entities.LeadHunterSEAMATY.list('-created_date', 2000).catch(() => []),
      base44.asServiceRole.entities.Client.list('-created_date', 2000).catch(() => []),
    ]);
    const nomesConhecidos = new Set([
      ...leadsExistentes.map(l => (l.nome_clinica || '').toLowerCase().trim()),
      ...clientesExistentes.map(c => (c.clinic_name || c.full_name || '').toLowerCase().trim()),
    ]);

    // Busca pública + análise de fit, priorizando uso de concorrente/terceirizado
    const pesquisa = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um caçador de oportunidades comerciais do mercado veterinário brasileiro para a SEAMATY (analisadores hematológicos e bioquímicos in-house).

Analise ${city}/${state} e arredores (raio ~${radius_km}km) em 2026 e identifique clínicas, hospitais e laboratórios veterinários.

PRIORIZE QUEM TEM MAIOR CHANCE DE COMPRAR AGORA:
1. Clínicas que enviam exames para LABORATÓRIO TERCEIRIZADO (dor de demora e custo recorrente).
2. Clínicas que usam EQUIPAMENTO CONCORRENTE antigo (Idexx, Heska, Zoetis, Mindray, Wiener, Labtest) — chance de upgrade.
3. Hospitais/clínicas de médio-grande porte com 40-230+ exames de sangue/mês.

Para CADA clínica, classifique a "temperatura" de oportunidade e gere um ARGUMENTO DE ATAQUE SEAMATY específico (battlecard curto e direto que o vendedor pode usar na abordagem).

Use somente dados públicos (Google Maps, Instagram, sites, notícias).`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          clinicas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome_clinica: { type: 'string' },
                tipo: { type: 'string' },
                cidade: { type: 'string' },
                uf: { type: 'string' },
                endereco: { type: 'string' },
                telefone_publico: { type: 'string' },
                instagram: { type: 'string' },
                site: { type: 'string' },
                usa_terceirizado: { type: 'boolean' },
                concorrente_detectado: { type: 'string' },
                exames_mes_estimado: { type: 'string' },
                temperatura: { type: 'string', enum: ['quente', 'morno', 'frio'] },
                score_potencial: { type: 'number' },
                motivo_score: { type: 'string' },
                equipamento_indicado: { type: 'string' },
                oportunidade: { type: 'string' },
                battlecard: { type: 'string' },
                fonte: { type: 'string' },
              },
            },
          },
          resumo_mercado: { type: 'string' },
        },
      },
    });

    const clinicas = (pesquisa?.clinicas || [])
      .filter(c => c.nome_clinica && !nomesConhecidos.has(c.nome_clinica.toLowerCase().trim()))
      .map(c => {
        // Normalizar score para escala 0-100 (a IA às vezes devolve 0-10)
        let s = Number(c.score_potencial) || 0;
        if (s > 0 && s <= 10) s = Math.round(s * 10);
        return { ...c, score_potencial: s };
      });

    // Priorização: quente primeiro, depois maior score
    const ordem = { quente: 3, morno: 2, frio: 1 };
    clinicas.sort((a, b) =>
      (ordem[b.temperatura] || 0) - (ordem[a.temperatura] || 0) ||
      (b.score_potencial || 0) - (a.score_potencial || 0)
    );

    const topQuentes = clinicas.filter(c => c.temperatura === 'quente' || (c.score_potencial || 0) >= 60);

    if (dry_run) {
      return Response.json({
        success: true, dry_run: true,
        total_encontradas: clinicas.length,
        quentes: topQuentes.length,
        amostra: topQuentes.slice(0, 5).map(c => ({
          nome: c.nome_clinica, temp: c.temperatura, score: c.score_potencial, battlecard: c.battlecard,
        })),
      });
    }

    const TIPO_MAP = {
      clinica: 'clinica_veterinaria', clinica_veterinaria: 'clinica_veterinaria',
      hospital: 'hospital_veterinario', hospital_veterinario: 'hospital_veterinario',
      laboratorio: 'laboratorio_veterinario', laboratorio_veterinario: 'laboratorio_veterinario',
      pet_shop: 'pet_shop_com_vet', universidade: 'universidade', especializada: 'clinica_especializada',
    };

    let criados = 0;
    for (const c of topQuentes.slice(0, 25)) {
      const abordagem = c.battlecard
        || (c.usa_terceirizado
          ? `${c.nome_clinica} ainda terceiriza exames — atacar custo recorrente e demora. SEAMATY entrega resultado in-house em minutos.`
          : `Oportunidade de upgrade de ${c.concorrente_detectado || 'equipamento atual'} para SEAMATY.`);

      const criado = await base44.asServiceRole.entities.LeadHunterSEAMATY.create({
        nome_clinica: c.nome_clinica,
        tipo: TIPO_MAP[(c.tipo || '').toLowerCase()] || 'clinica_veterinaria',
        cidade: c.cidade || city,
        uf: c.uf || state,
        endereco: c.endereco || '',
        telefone_publico: c.telefone_publico || '',
        instagram: c.instagram || '',
        site: c.site || '',
        fonte: c.fonte || 'Radar de Prospecção (IA)',
        status_validacao: 'novo',
        score_potencial: c.score_potencial || 70,
        motivo_score: c.motivo_score || '',
        equipamento_indicado: c.equipamento_indicado || 'SMT-120VP',
        oportunidade: c.oportunidade || '',
        risco_erro: 'medio',
        data_captura: new Date().toISOString(),
        precisa_aprovacao_nathan: true,
        abordagem_sugerida: abordagem,
      }).catch(() => null);
      if (criado) criados++;
    }

    if (criados > 0) {
      await base44.asServiceRole.entities.Alert.create({
        title: `🎯 ${criados} oportunidade(s) quente(s) em ${city}`,
        type: 'prospeccao_quente',
        message: `Radar identificou ${criados} clínica(s) com alta chance de conversão (terceirizado/concorrente) em ${city}/${state}. Battlecard pronto.`,
        priority: 'alta',
        status: 'pendente',
        created_date: new Date().toISOString(),
      }).catch(() => null);

    }

    return Response.json({
      success: true,
      regiao: `${city}/${state}`,
      total_encontradas: clinicas.length,
      quentes_capturadas: criados,
      modo: isAutomated ? 'automatico' : 'manual',
      resumo_mercado: pesquisa?.resumo_mercado || '',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});