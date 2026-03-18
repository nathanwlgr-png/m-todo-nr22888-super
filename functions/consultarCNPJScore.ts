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

    // 1. Buscar dados na BrasilAPI com timeout de 12s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ALGORITMO DE SCORE — CALIBRADO v2
    // Escala: 0–1000 (alinhado ao Serasa Experian)
    // Base: 300 (empresa existe = ponto de partida neutro)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let score = 300;
    const detalhes = [];

    // ── 1. SITUAÇÃO CADASTRAL (peso alto — 300 pts max) ──
    const situacao = rfData.descricao_situacao_cadastral || '';
    if (situacao === 'ATIVA') {
      score += 300;
      detalhes.push('✅ Situação ATIVA: +300');
    } else if (situacao === 'SUSPENSA') {
      score -= 150;
      detalhes.push('⚠️ Situação SUSPENSA: -150');
    } else if (situacao === 'INAPTA') {
      score -= 300;
      detalhes.push('🔴 Situação INAPTA: -300');
    } else if (situacao === 'BAIXADA' || situacao === 'CANCELADA') {
      score -= 400;
      detalhes.push('🔴 Situação BAIXADA/CANCELADA: -400');
    }

    // ── 2. TEMPO DE MERCADO (peso alto — 200 pts max) ──
    let anosNaMercado = 0;
    if (rfData.data_inicio_atividade) {
      const inicio = new Date(rfData.data_inicio_atividade);
      anosNaMercado = (new Date() - inicio) / (1000 * 60 * 60 * 24 * 365.25);
      if (anosNaMercado >= 15) { score += 200; detalhes.push(`⏳ ${Math.floor(anosNaMercado)} anos (≥15): +200`); }
      else if (anosNaMercado >= 10) { score += 170; detalhes.push(`⏳ ${Math.floor(anosNaMercado)} anos (≥10): +170`); }
      else if (anosNaMercado >= 5) { score += 130; detalhes.push(`⏳ ${Math.floor(anosNaMercado)} anos (≥5): +130`); }
      else if (anosNaMercado >= 3) { score += 90; detalhes.push(`⏳ ${Math.floor(anosNaMercado)} anos (≥3): +90`); }
      else if (anosNaMercado >= 1) { score += 50; detalhes.push(`⏳ ${Math.floor(anosNaMercado)} anos (≥1): +50`); }
      else { score -= 30; detalhes.push(`⏳ Menos de 1 ano: -30`); }
    }

    // ── 3. CAPITAL SOCIAL (peso médio — 150 pts max) ──
    const capital = rfData.capital_social || 0;
    if (capital >= 1000000) { score += 150; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥1M): +150`); }
    else if (capital >= 500000) { score += 120; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥500k): +120`); }
    else if (capital >= 200000) { score += 90; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥200k): +90`); }
    else if (capital >= 100000) { score += 70; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥100k): +70`); }
    else if (capital >= 50000) { score += 50; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥50k): +50`); }
    else if (capital >= 20000) { score += 30; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥20k): +30`); }
    else if (capital >= 5000) { score += 10; detalhes.push(`💰 Capital R$${capital.toLocaleString('pt-BR')} (≥5k): +10`); }
    else { score -= 40; detalhes.push(`💰 Capital muito baixo (<5k): -40`); }

    // ── 4. PORTE DA EMPRESA (peso médio — 80 pts max) ──
    const porte = (rfData.porte || '').toUpperCase();
    if (porte.includes('GRANDE')) { score += 80; detalhes.push('🏭 Porte GRANDE: +80'); }
    else if (porte.includes('MÉDIA') || porte.includes('MEDIA')) { score += 55; detalhes.push('🏭 Porte MÉDIA: +55'); }
    else if (porte.includes('PEQUENA') || porte.includes('PEQUENO')) { score += 30; detalhes.push('🏭 Porte PEQUENA: +30'); }
    else if (porte.includes('MICRO')) { score += 10; detalhes.push('🏭 Porte MICRO: +10'); }
    // MEI penaliza levemente
    if (porte.includes('MEI')) { score -= 20; detalhes.push('🏭 MEI: -20'); }

    // ── 5. SÓCIOS (mais sócios = maior estrutura) ──
    const socios = rfData.qsa || [];
    if (socios.length >= 3) { score += 30; detalhes.push(`👥 ${socios.length} sócios: +30`); }
    else if (socios.length === 2) { score += 15; detalhes.push(`👥 2 sócios: +15`); }
    else if (socios.length === 1) { score += 5; detalhes.push(`👥 1 sócio: +5`); }

    // ── 6. REGIME TRIBUTÁRIO ──
    // Simples Nacional é neutro (maioria das PMEs saudáveis usam)
    // Lucro Presumido/Real = empresa maior = bônus
    if (rfData.opcao_pelo_simples === false && rfData.opcao_pelo_mei === false) {
      score += 25;
      detalhes.push('📊 Lucro Presumido/Real (não Simples): +25');
    }
    if (rfData.opcao_pelo_mei) {
      score -= 10;
      detalhes.push('📊 MEI (regime): -10');
    }

    // ── 7. NATUREZA JURÍDICA (LTDA/SA = mais sólida) ──
    const natureza = (rfData.descricao_natureza_juridica || '').toUpperCase();
    if (natureza.includes('SOCIEDADE AN') || natureza.includes('S/A')) { score += 40; detalhes.push('⚖️ S/A: +40'); }
    else if (natureza.includes('LIMITADA') || natureza.includes('LTDA')) { score += 20; detalhes.push('⚖️ LTDA: +20'); }
    else if (natureza.includes('EIRELI') || natureza.includes('SLU')) { score += 10; detalhes.push('⚖️ EIRELI/SLU: +10'); }

    // ── 8. VERIFICAÇÃO ESPECIAL: Matriz vs Filial ──
    if (rfData.identificador_matriz_filial === 1) { score += 10; detalhes.push('🏢 Matriz: +10'); }

    // ── 9. CLAMP FINAL: 0–1000 ──
    score = Math.max(0, Math.min(1000, Math.round(score)));

    // ── CLASSIFICAÇÃO ──
    const passa700 = score >= 700 ? 'Sim ✅' : score >= 650 ? 'Borderline ⚠️' : 'Não ❌';
    const nivelRisco = score >= 700 ? 'BAIXO' : score >= 500 ? 'MÉDIO' : 'ALTO';
    const scoreEmoji = score >= 700 ? '🟢' : score >= 500 ? '🟡' : '🔴';

    // Recomendação de crédito / boleto
    let recomendacaoCredito;
    let recomendacaoBoleto;
    if (score >= 700) {
      recomendacaoCredito = '✅ Perfil favorável. Pode oferecer BOLETO BANCÁRIO e parcelamento com segurança.';
      recomendacaoBoleto = '✅ LIBERAR BOLETO';
    } else if (score >= 650) {
      recomendacaoCredito = '⚠️ Score borderline (650-699). Ofereça boleto com prazo máximo de 30 dias ou 50% de entrada.';
      recomendacaoBoleto = '⚠️ BOLETO COM RESTRIÇÃO (entrada ou prazo curto)';
    } else if (score >= 500) {
      recomendacaoCredito = '⚠️ Perfil moderado. Sugira parcelas menores ou entrada expressiva. Evite boleto longo prazo.';
      recomendacaoBoleto = '🚫 NÃO OFERECER BOLETO — prefira cartão ou PIX antecipado';
    } else {
      recomendacaoCredito = '🚨 Risco elevado. Exija pagamento à vista (PIX/cartão). Não ofereça boleto bancário.';
      recomendacaoBoleto = '🚫 BLOQUEAR BOLETO — pagamento à vista obrigatório';
    }

    const tempoMercadoStr = anosNaMercado > 0 ? `${Math.floor(anosNaMercado)} anos` : 'não informado';
    const cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

    const resumo = `━━━━━━━━━━━━━━━━━━━━
🔍 *CONSULTA CNPJ + SCORE v2*
━━━━━━━━━━━━━━━━━━━━
🏢 *${rfData.razao_social}*
📋 CNPJ: ${cnpjFormatado}
📍 ${rfData.municipio} / ${rfData.uf}

✅ Situação: *${situacao}*
🏭 Porte: ${rfData.porte || 'Não informado'}
💰 Capital: R$ ${capital.toLocaleString('pt-BR')}
📅 Fundação: ${rfData.data_inicio_atividade} (${tempoMercadoStr})
📊 Regime: ${rfData.opcao_pelo_simples ? 'Simples Nacional' : rfData.opcao_pelo_mei ? 'MEI' : 'Lucro Presumido/Real'}
👥 Sócios: ${socios.length}
🔬 Atividade: ${rfData.cnae_fiscal_descricao}

━━━━━━━━━━━━━━━━━━━━
${scoreEmoji} *SCORE ESTIMADO: ${score}/1000*
📈 Passa de 700: *${passa700}*
⚠️ Risco: *${nivelRisco}*

💳 *BOLETO BANCÁRIO:*
${recomendacaoBoleto}

🎯 ${recomendacaoCredito}
━━━━━━━━━━━━━━━━━━━━
📊 Fatores analisados:
${detalhes.join('\n')}
━━━━━━━━━━━━━━━━━━━━
⚠️ _Score estimado com dados públicos (Receita Federal). Score oficial: serasaempreendedor.com.br_`;

    return Response.json({
      success: true,
      cnpj: cnpjLimpo,
      razao_social: rfData.razao_social,
      situacao,
      porte: rfData.porte,
      capital_social: capital,
      municipio: rfData.municipio,
      uf: rfData.uf,
      data_inicio: rfData.data_inicio_atividade,
      tempo_mercado: tempoMercadoStr,
      atividade: rfData.cnae_fiscal_descricao,
      simples_nacional: rfData.opcao_pelo_simples,
      mei: rfData.opcao_pelo_mei,
      socios,
      score_estimado: score,
      passa_700: passa700,
      nivel_risco: nivelRisco,
      recomendacao_credito: recomendacaoCredito,
      recomendacao_boleto: recomendacaoBoleto,
      detalhes_score: detalhes,
      resumo_whatsapp: resumo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});