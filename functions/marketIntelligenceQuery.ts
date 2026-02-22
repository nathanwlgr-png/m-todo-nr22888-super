import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, type = 'query', region, product } = await req.json();

    // Buscar dados salvos de inteligência de mercado
    const savedReports = await base44.asServiceRole.entities.MarketIntelligenceReport.list('-created_date', 5).catch(() => []);
    const recentContext = savedReports.map(r => `[${r.report_date}] ${r.summary}`).join('\n\n');

    let prompt = '';

    if (type === 'weekly_report') {
      prompt = `Você é um analista de mercado especializado no setor veterinário brasileiro.
Gere um relatório semanal COMPLETO e DETALHADO de inteligência de mercado para uma empresa que vende equipamentos de diagnóstico veterinário (analisadores hematológicos, bioquímicos, gasometria, PCR, imunofluorescência).

CONTEXTO DA EMPRESA (NR22):
- Produtos: VG1/VG2 (Gasometria), VBC-50A (Hematologia com 26 parâmetros), QT3/SMT-120VP (Bioquímica), VI1 (Imunofluorescência), VQ1 (PCR)
- Região principal: São Paulo interior (Marília, Bauru, Botucatu, Lins, Ourinhos)
- Diferenciais: 25 meses garantia, manutenção vitalícia, bonificação em insumos

RELATÓRIOS ANTERIORES:
${recentContext || 'Nenhum relatório anterior disponível'}

Gere relatório com:
1. 📰 NOTÍCIAS E TENDÊNCIAS (últimas semanas no mercado vet brasileiro)
2. 🏆 ANÁLISE DA CONCORRÊNCIA (IDEXX, Mindray, Heska, Horiba, Bioanalítica, Vet+i)
3. 🚀 LANÇAMENTOS DE PRODUTOS (novidades no setor)
4. 💰 ANÁLISE DE PREÇOS (benchmarks do mercado)
5. 🎯 OPORTUNIDADES EMERGENTES (para NR22 explorar)
6. ⚠️ AMEAÇAS E RISCOS
7. 📊 INSIGHTS ESTRATÉGICOS (recomendações acionáveis)

Data: ${new Date().toLocaleDateString('pt-BR')}
Responda em português. Seja específico, com dados reais do mercado.`;

    } else if (type === 'competitor_analysis') {
      prompt = `Analise detalhadamente a concorrência no mercado de equipamentos de diagnóstico veterinário brasileiro.

Empresa analisada: ${product || 'IDEXX, Mindray, Heska, Horiba, Bioanalítica'}
${region ? `Região de foco: ${region}` : ''}

Forneça:
1. Portfólio de produtos e preços estimados
2. Estratégias de vendas conhecidas
3. Pontos fortes e fracos
4. Como NR22 pode se diferenciar
5. Argumentos de venda contra este concorrente

Seja específico e prático para um vendedor de campo.`;

    } else if (type === 'price_benchmark') {
      prompt = `Forneça benchmark de preços para equipamentos de diagnóstico veterinário no Brasil.

${product ? `Produto específico: ${product}` : 'Todos os principais equipamentos'}
${region ? `Região: ${region}` : 'Brasil'}

Inclua:
1. Faixas de preço por categoria (hematologia, bioquímica, gasometria, PCR)
2. Comparação com NR22 (VBC-50A ~R$15k, VG2 ~R$25k, QT3 ~R$18k, VQ1 ~R$35k)
3. Condições de pagamento praticadas no mercado
4. ROI típico para clínicas veterinárias
5. Fatores que justificam preço premium`;

    } else {
      // Query livre
      prompt = `Você é um analista de mercado especializado no setor veterinário brasileiro, com foco em equipamentos de diagnóstico (hematologia, bioquímica, gasometria, PCR, imunofluorescência).

CONTEXTO DA EMPRESA (NR22):
- Produtos: VG1/VG2 (Gasometria), VBC-50A (Hematologia), QT3/SMT-120VP (Bioquímica), VI1 (Imunofluorescência), VQ1 (PCR)
- Mercado: Clínicas e hospitais veterinários no interior de São Paulo

INTELIGÊNCIA ACUMULADA:
${recentContext || 'Sem dados históricos'}

PERGUNTA DO USUÁRIO: ${query}
${region ? `REGIÃO: ${region}` : ''}
${product ? `PRODUTO: ${product}` : ''}

Responda de forma objetiva, com dados reais do mercado, insights acionáveis e recomendações práticas para o vendedor.
Use markdown com emojis. Máximo 5 parágrafos focados.`;
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: type === 'weekly_report' ? {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          news_trends: { type: 'string' },
          competitor_analysis: { type: 'string' },
          product_launches: { type: 'string' },
          price_analysis: { type: 'string' },
          opportunities: { type: 'string' },
          threats: { type: 'string' },
          strategic_insights: { type: 'string' },
          key_actions: { type: 'array', items: { type: 'string' } }
        }
      } : null
    });

    // Salvar relatório semanal
    if (type === 'weekly_report' && result) {
      await base44.asServiceRole.entities.MarketIntelligenceReport.create({
        title: result.title || `Relatório Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
        report_date: new Date().toISOString().split('T')[0],
        summary: result.summary || '',
        full_content: JSON.stringify(result),
        report_type: 'weekly',
        generated_by: user.email
      }).catch(() => {});
    }

    return Response.json({ success: true, result, type });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});