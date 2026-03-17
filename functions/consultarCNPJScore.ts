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

    // 1. Buscar dados na Receita Federal via BrasilAPI
    const rfResp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    const rfData = await rfResp.json();

    if (!rfResp.ok || rfData.message) {
      return Response.json({ error: `CNPJ não encontrado: ${rfData.message || 'Erro Receita Federal'}` }, { status: 404 });
    }

    // 2. Estimar score com IA
    const aiScore = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de crédito empresarial. Com base nos dados da Receita Federal, estime o score de crédito empresarial (Serasa Experian escala 0-1000).

DADOS:
- Razão Social: ${rfData.razao_social}
- Situação: ${rfData.descricao_situacao_cadastral}
- Porte: ${rfData.porte}
- Capital Social: R$ ${rfData.capital_social?.toLocaleString('pt-BR')}
- Data Início: ${rfData.data_inicio_atividade}
- Regime: ${rfData.opcao_pelo_simples ? 'Simples Nacional' : 'Regime Geral'}
- Atividade Principal: ${rfData.cnae_fiscal_descricao}
- Número de Sócios: ${rfData.qsa?.length || 0}
- Município: ${rfData.municipio} / ${rfData.uf}

Retorne JSON com: { score_estimado: number, passa_700: "Sim"|"Provável"|"Não", nivel_risco: "BAIXO"|"MÉDIO"|"ALTO", justificativa: string (2 linhas), recomendacao_credito: string }`,
      response_json_schema: {
        type: "object",
        properties: {
          score_estimado: { type: "number" },
          passa_700: { type: "string" },
          nivel_risco: { type: "string" },
          justificativa: { type: "string" },
          recomendacao_credito: { type: "string" }
        }
      }
    });

    // 3. Formatar resposta completa
    const score = aiScore.score_estimado;
    const scoreEmoji = score >= 700 ? '🟢' : score >= 500 ? '🟡' : '🔴';

    const resumo = `
━━━━━━━━━━━━━━━━━━━━
🔍 *CONSULTA CNPJ + SCORE*
━━━━━━━━━━━━━━━━━━━━
🏢 *${rfData.razao_social}*
📋 CNPJ: ${cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
📍 ${rfData.municipio} / ${rfData.uf}

✅ Situação: *${rfData.descricao_situacao_cadastral}*
🏭 Porte: ${rfData.porte}
💰 Capital: R$ ${rfData.capital_social?.toLocaleString('pt-BR')}
📅 Fundação: ${rfData.data_inicio_atividade}
📊 Regime: ${rfData.opcao_pelo_simples ? 'Simples Nacional' : 'Regime Geral'}
🔬 Atividade: ${rfData.cnae_fiscal_descricao}

━━━━━━━━━━━━━━━━━━━━
${scoreEmoji} *SCORE ESTIMADO: ${score}/1000*
📈 Passa de 700: *${aiScore.passa_700}*
⚠️ Risco: *${aiScore.nivel_risco}*
💡 ${aiScore.justificativa}
🎯 ${aiScore.recomendacao_credito}
━━━━━━━━━━━━━━━━━━━━
⚠️ _Score estimado por IA com dados Receita Federal. Para score oficial: serasaempreendedor.com.br_`.trim();

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
      atividade: rfData.cnae_fiscal_descricao,
      simples_nacional: rfData.opcao_pelo_simples,
      socios: rfData.qsa || [],
      score_estimado: aiScore.score_estimado,
      passa_700: aiScore.passa_700,
      nivel_risco: aiScore.nivel_risco,
      justificativa: aiScore.justificativa,
      recomendacao_credito: aiScore.recomendacao_credito,
      resumo_whatsapp: resumo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});