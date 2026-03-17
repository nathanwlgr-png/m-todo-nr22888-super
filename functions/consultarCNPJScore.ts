import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cnpj } = await req.json();
    if (!cnpj) return Response.json({ error: 'CNPJ obrigatório' }, { status: 400 });

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return Response.json({ error: 'CNPJ inválido — deve ter 14 dígitos' }, { status: 400 });

    // 1. Buscar dados na BrasilAPI com timeout de 10s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let rfData;
    try {
      const rfResp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
        signal: controller.signal
      });
      rfData = await rfResp.json();
      if (!rfResp.ok || rfData.message) {
        return Response.json({ error: `CNPJ não encontrado: ${rfData.message || 'Erro Receita Federal'}` }, { status: 404 });
      }
    } finally {
      clearTimeout(timeout);
    }

    // 2. Calcular score localmente com base nos dados disponíveis (sem IA externa = sem timeout)
    let score = 500; // base

    // Situação cadastral
    if (rfData.descricao_situacao_cadastral === 'ATIVA') score += 150;
    else if (rfData.descricao_situacao_cadastral === 'SUSPENSA') score -= 100;
    else if (rfData.descricao_situacao_cadastral === 'INAPTA' || rfData.descricao_situacao_cadastral === 'BAIXADA') score -= 250;

    // Tempo de mercado
    if (rfData.data_inicio_atividade) {
      const inicio = new Date(rfData.data_inicio_atividade);
      const anos = (new Date() - inicio) / (1000 * 60 * 60 * 24 * 365);
      if (anos >= 10) score += 150;
      else if (anos >= 5) score += 100;
      else if (anos >= 2) score += 50;
      else if (anos < 1) score -= 50;
    }

    // Capital social
    const capital = rfData.capital_social || 0;
    if (capital >= 500000) score += 100;
    else if (capital >= 100000) score += 60;
    else if (capital >= 50000) score += 30;
    else if (capital < 5000) score -= 30;

    // Porte
    if (rfData.porte === 'GRANDE') score += 80;
    else if (rfData.porte === 'MÉDIA') score += 40;
    else if (rfData.porte === 'PEQUENA') score += 10;

    // Simples Nacional (geralmente menor estrutura)
    if (rfData.opcao_pelo_simples) score -= 20;

    // Limitar entre 0 e 1000
    score = Math.max(0, Math.min(1000, score));

    const passa700 = score >= 700 ? 'Sim' : score >= 600 ? 'Provável' : 'Não';
    const nivelRisco = score >= 700 ? 'BAIXO' : score >= 500 ? 'MÉDIO' : 'ALTO';
    const scoreEmoji = score >= 700 ? '🟢' : score >= 500 ? '🟡' : '🔴';

    // Formatação do CNPJ
    const cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

    // Anos de mercado para exibir
    let tempoMercado = '';
    if (rfData.data_inicio_atividade) {
      const anos = Math.floor((new Date() - new Date(rfData.data_inicio_atividade)) / (1000 * 60 * 60 * 24 * 365));
      tempoMercado = `${anos} anos`;
    }

    const justificativa = `Empresa ${rfData.descricao_situacao_cadastral?.toLowerCase()}, ${tempoMercado} de mercado, capital social de R$ ${(rfData.capital_social || 0).toLocaleString('pt-BR')}, porte ${rfData.porte || 'não informado'}.`;
    const recomendacao = score >= 700
      ? '✅ Perfil favorável para parcelamento e crédito. Pode negociar com segurança.'
      : score >= 500
      ? '⚠️ Perfil moderado. Sugira parcelas menores ou entrada mais expressiva.'
      : '🚨 Risco elevado. Recomende pagamento à vista ou análise criteriosa antes de parcelar.';

    const resumo = `━━━━━━━━━━━━━━━━━━━━
🔍 *CONSULTA CNPJ + SCORE*
━━━━━━━━━━━━━━━━━━━━
🏢 *${rfData.razao_social}*
📋 CNPJ: ${cnpjFormatado}
📍 ${rfData.municipio} / ${rfData.uf}

✅ Situação: *${rfData.descricao_situacao_cadastral}*
🏭 Porte: ${rfData.porte || 'Não informado'}
💰 Capital: R$ ${(rfData.capital_social || 0).toLocaleString('pt-BR')}
📅 Fundação: ${rfData.data_inicio_atividade} (${tempoMercado})
📊 Regime: ${rfData.opcao_pelo_simples ? 'Simples Nacional' : 'Regime Geral'}
🔬 Atividade: ${rfData.cnae_fiscal_descricao}

━━━━━━━━━━━━━━━━━━━━
${scoreEmoji} *SCORE ESTIMADO: ${score}/1000*
📈 Passa de 700: *${passa700}*
⚠️ Risco: *${nivelRisco}*
💡 ${justificativa}
🎯 ${recomendacao}
━━━━━━━━━━━━━━━━━━━━
⚠️ _Score calculado com base em dados públicos. Para score oficial: serasaempreendedor.com.br_`;

    return Response.json({
      success: true,
      cnpj: cnpjLimpo,
      razao_social: rfData.razao_social,
      situacao: rfData.descricao_situacao_cadastral,
      porte: rfData.porte,
      capital_social: rfData.capital_social,
      municipio: rfData.municipio,
      uf: rfData.uf,
      data_inicio: rfData.data_inicio_atividade,
      tempo_mercado: tempoMercado,
      atividade: rfData.cnae_fiscal_descricao,
      simples_nacional: rfData.opcao_pelo_simples,
      socios: rfData.qsa || [],
      score_estimado: score,
      passa_700: passa700,
      nivel_risco: nivelRisco,
      justificativa,
      recomendacao_credito: recomendacao,
      resumo_whatsapp: resumo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});