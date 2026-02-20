import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, competitor, query } = body;

    // MONITORAMENTO DE MERCADO EM TEMPO REAL
    if (action === 'market_scan') {
      const scan = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de mercado de equipamentos diagnósticos veterinários. Pesquise e analise:

1. Notícias recentes do setor de diagnóstico veterinário no Brasil
2. Lançamentos de novos equipamentos hematológicos/bioquímicos/PCR veterinários
3. Tendências de mercado (crédito para MEI, custo dos insumos, volume de animais)
4. Atividade dos principais concorrentes: IDEXX, Mindray, Heska, Mobivet, Primori, Hemograma.net
5. Precificação média de mercado para analisadores hematológicos e bioquímicos

Contexto: CMAT Brasil distribui equipamentos Seamaty (SMT-120VP, VG1, VG2, VBC50A, Vi1, VQ1 PCR)
Foco em São Paulo e região.

Gere um relatório executivo com insights acionáveis para vendas.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            scan_date: { type: 'string' },
            market_sentiment: { type: 'string' },
            top_news: { type: 'array', items: { type: 'string' } },
            competitor_activity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  competitor: { type: 'string' },
                  news: { type: 'string' },
                  threat_level: { type: 'string' },
                  counter_argument: { type: 'string' }
                }
              }
            },
            opportunities: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } },
            price_benchmarks: {
              type: 'object',
              properties: {
                hematology_avg: { type: 'number' },
                biochemistry_avg: { type: 'number' },
                pcr_avg: { type: 'number' }
              }
            },
            sales_recommendation: { type: 'string' }
          }
        }
      });

      return Response.json({ scan, success: true });
    }

    // ANÁLISE COMPETITIVA DETALHADA
    if (action === 'competitor_deep_dive') {
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Realize uma análise competitiva APROFUNDADA do concorrente: ${competitor || 'IDEXX'}

Pesquise e analise:
1. Portfólio completo de produtos/equipamentos
2. Faixa de preço praticada no Brasil
3. Termos de garantia e suporte técnico
4. Presença online (site, redes sociais, avaliações)
5. Pontos fortes e fracos vs Seamaty (CMAT Brasil)
6. Depoimentos e reclamações de clientes (Reclame Aqui, Google)
7. Argumentos específicos para superar esse concorrente em vendas

Contexto: Nossa solução (Seamaty) oferece:
- VQ1 PCR veterinário com 13+ painéis a partir de R$ 443,23
- SMT-120VP hematológico 5 partes completo
- VG1/VG2 analisadores de gases e eletrólitos
- Vi1/VBC50A imunofluorescência veterinária
- Suporte técnico presencial em SP
- Financiamento facilitado`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            competitor_name: { type: 'string' },
            products: { type: 'array', items: { type: 'string' } },
            price_range: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            our_advantages: { type: 'array', items: { type: 'string' } },
            objection_scripts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objection: { type: 'string' },
                  response: { type: 'string' }
                }
              }
            },
            market_position: { type: 'string' },
            online_sentiment: { type: 'string' },
            recommendations: { type: 'string' }
          }
        }
      });

      return Response.json({ analysis, success: true });
    }

    // BUSCA INTELIGENTE DE MERCADO
    if (action === 'market_search') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Pesquise sobre: ${query || 'tendências mercado veterinário Brasil 2026'}
Contexto: consultor de equipamentos diagnósticos veterinários Seamaty, São Paulo.
Extraia insights acionáveis para vendas e prospecção.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            key_findings: { type: 'array', items: { type: 'string' } },
            sales_implications: { type: 'array', items: { type: 'string' } },
            action_items: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return Response.json({ result, success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});