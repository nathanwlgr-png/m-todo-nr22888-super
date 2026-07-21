import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getAutomationEmail, getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getOptionalUser(base44);
    if (isForbiddenManualUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action = 'analyze', focus_competitors = [], focus_markets = [] } = body;
    const dryRun = body.dry_run === true || !user;
    const notificationEmail = await getAutomationEmail(base44, user);
    if (body.smoke_test === true) {
      return Response.json({ success: true, smoke_test: true, dry_run: true, reports_created: 0, alerts_created: 0 });
    }

    // ─── 1. BUSCAR DADOS DO CRM ─────────────────────────────────────────────
    const [allClients, allSales, allCompetitorReports] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Sale.list(),
      base44.asServiceRole.entities.MarketIntelligenceReport?.list?.() || Promise.resolve([])
    ]);

    // ─── 2. ANÁLISE PROFUNDA DE MERCADO VIA IA ─────────────────────────────
    const marketAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em inteligência de mercado do setor veterinário. Analise PROFUNDAMENTE o mercado de diagnósticos veterinários no Brasil em 2026.

FOQUE EM:
1. CONCORRENTES PRINCIPAIS:
   - IDEXX (USA) — market leader global
   - Mindray (China) — crescimento agressivo
   - Seamaty (Brasil/China) — inovação em ROI
   - Biosys (Brasil) — local established
   - Roche Diagnostics (Deutschland) — premium
   - Outras marcas regionais

2. PREÇO E CONDIÇÕES:
   - Faixa de preço para hematológico: R$80k-250k
   - Faixa para bioquímico: R$120k-350k
   - Tendência: competição em insumos (bonificação vs desconto)
   - Prazos: qual está oferecendo melhores condições?

3. TENDÊNCIAS DE MERCADO:
   - Adoção de equipamentos in-house cresce ~15% a.a.
   - Volume de exames de sangue em clínicas small/médias
   - Preferência por portabilidade vs bancada
   - Integração com software de gestão
   - Sustentabilidade e resíduos de reagentes

4. OPORTUNIDADES PARA SEAMATY:
   - Diferencial: garantia 25 meses vs 12 (concorrência)
   - Bonificação em insumos = custo real zero
   - Manutenção vitalícia
   - Quando entra em cada segmento?
   - Como aumentar share em clínicas <40 exames/mês?

5. AMEAÇAS:
   - Preço agressivo de concorrente X
   - Lançamento de novo produto Y
   - Movimentação de distribuidor Z
   - Regulamentações novas

6. AÇÕES IMEDIATAS (TOP 5):
   - Ação 1
   - Ação 2
   - Ação 3
   - Ação 4
   - Ação 5

Retorne em JSON estruturado.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          market_size_estimate: { type: "string" },
          market_growth_rate: { type: "string" },
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                market_share_estimate: { type: "string" },
                main_products: { type: "array", items: { type: "string" } },
                price_range: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                recent_moves: { type: "array", items: { type: "string" } }
              }
            }
          },
          market_trends: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          threats: { type: "array", items: { type: "string" } },
          seamaty_positioning: { type: "string" },
          immediate_actions: { type: "array", items: { type: "string" } },
          forecast_6_months: { type: "string" }
        }
      }
    });

    // ─── 3. ANÁLISE DE PREÇOS ───────────────────────────────────────────────
    const pricingAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Pesquise e analise PREÇOS ATUAIS de equipamentos de diagnóstico veterinário em 2026:
- Hematológico (analisador de sangue 5-parte)
- Bioquímico automatizado
- Gasometria
- PCR/Imunofluorescência

RETORNE:
- Marca | Modelo | Preço | Garantia | Características
- Tendência de preço (subindo/caindo?)
- Ofertas especiais/promoções em andamento
- Condições de pagamento ofertadas
- Acessibilidade por porte de clínica

Use dados reais e atualizados.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          price_benchmarks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                brand: { type: "string" },
                model: { type: "string" },
                price_brl: { type: "string" },
                warranty_months: { type: "number" },
                special_offers: { type: "string" }
              }
            }
          },
          price_trends: { type: "string" },
          seamaty_positioning: { type: "string" },
          pricing_recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    // ─── 4. ANÁLISE DE SENTIMENTO DE MERCADO ────────────────────────────────
    const sentimentAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analise o SENTIMENTO e REPUTAÇÃO das marcas de diagnóstico veterinário online em 2026:

Busque em: Google Reviews, Trustpilot, redes sociais, fóruns veterinários

PARA CADA MARCA:
- Avaliação média
- Principais reclamações
- Principais elogios
- Tendência (melhorando/piorando)
- Retenção de clientes estimada

FOQUE EM:
- IDEXX, Mindray, Seamaty, Biosys, Roche

Retorne em JSON.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          brand_sentiment: {
            type: "array",
            items: {
              type: "object",
              properties: {
                brand: { type: "string" },
                overall_rating: { type: "string" },
                review_count: { type: "string" },
                main_complaints: { type: "array", items: { type: "string" } },
                main_praise: { type: "array", items: { type: "string" } },
                trend: { type: "string" }
              }
            }
          }
        }
      }
    });

    // ─── 5. GERAR RELATÓRIO CONSOLIDADO ────────────────────────────────────
    const reportId = `MIR-${Date.now()}`;
    const report = {
      title: `Market Intelligence Report — ${new Date().toLocaleDateString('pt-BR')}`,
      report_date: new Date().toISOString().split('T')[0],
      report_type: 'competitor',
      summary: `Análise abrangente do mercado veterinário de diagnósticos. ${marketAnalysis.forecast_6_months || 'Cenário competitivo ativo.'}`,
      full_content: JSON.stringify({
        market_overview: marketAnalysis,
        pricing_analysis: pricingAnalysis,
        sentiment_analysis: sentimentAnalysis,
        generated_at: new Date().toISOString()
      }),
      key_actions: marketAnalysis.immediate_actions || [
        'Revisar estratégia de precificação',
        'Aumentar foco em retenção de clientes',
        'Monitorar lançamentos de concorrentes',
        'Fortalecer relacionamento com distribuidores'
      ],
      competitors_mentioned: marketAnalysis.competitors?.map(c => c.name) || ['IDEXX', 'Mindray', 'Biosys', 'Roche'],
      opportunities_count: (marketAnalysis.opportunities || []).length,
      generated_by: user?.email || 'automacao_safe',
      is_pinned: false
    };

    // ─── 6. SALVAR NO CRM ──────────────────────────────────────────────────
    if (!dryRun) {
      try {
        await base44.asServiceRole.entities.MarketIntelligenceReport?.create?.(report);
      } catch (e) {
        console.log('MarketIntelligenceReport criar: optional', e.message);
      }
    }

    // ─── 7. CRIAR ALERTAS PARA O TIME ──────────────────────────────────────
    const threats = (marketAnalysis.threats || []).slice(0, 3);
    const alertPromises = dryRun ? [] : threats.map(threat =>
      base44.asServiceRole.entities.Alert?.create?.({
        user_email: notificationEmail,
        title: `🚨 Ameaça de Mercado Detectada`,
        message: threat,
        type: 'high_score_lead',
        priority: 'alta',
        link_to: 'MarketIntelligence',
        read: false,
        dismissed: false
      }).catch(() => null)
    );

    await Promise.allSettled(alertPromises);

    return Response.json({
      success: true,
      report_id: reportId,
      market_analysis: marketAnalysis,
      pricing_analysis: pricingAnalysis,
      sentiment_analysis: sentimentAnalysis,
      report_summary: {
        opportunities: (marketAnalysis.opportunities || []).length,
        threats: (marketAnalysis.threats || []).length,
        immediate_actions: marketAnalysis.immediate_actions?.length || 0,
        top_competitors: marketAnalysis.competitors?.slice(0, 3).map(c => c.name) || []
      },
      alerts_created: threats.length,
      generated_at: new Date().toISOString(),
      dry_run: dryRun
    });

  } catch (error) {
    console.error('competitorMarketMonitor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});