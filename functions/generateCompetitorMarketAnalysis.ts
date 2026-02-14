import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brand_name, brand_website } = await req.json();

    console.log(`Iniciando análise de mercado para: ${brand_name}`);

    // ETAPA 1: Pesquisar produtos da marca
    const productsPrompt = `Pesquise e liste TODOS os produtos que a marca "${brand_name}" vende. 
Website: ${brand_website || 'Buscar na internet'}

Retorne em JSON:
{
  "brand_info": {
    "name": "Nome da marca",
    "location": "Localização",
    "segment": "Segmento",
    "description": "Descrição da empresa"
  },
  "product_categories": [
    {
      "category": "Categoria",
      "products": ["produto1", "produto2"],
      "price_range": "Faixa de preço",
      "target_audience": "Público-alvo"
    }
  ]
}`;

    const productsData = await base44.integrations.Core.InvokeLLM({
      prompt: productsPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          brand_info: {
            type: "object",
            properties: {
              name: { type: "string" },
              location: { type: "string" },
              segment: { type: "string" },
              description: { type: "string" }
            }
          },
          product_categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                products: { type: "array", items: { type: "string" } },
                price_range: { type: "string" },
                target_audience: { type: "string" }
              }
            }
          }
        }
      }
    });

    console.log('Produtos identificados:', productsData);

    // ETAPA 2: Buscar lojas potenciais no Brasil
    const storesPrompt = `Com base nos produtos da marca "${brand_name}" (${productsData.product_categories.map(c => c.category).join(', ')}),
identifique as 15 principais lojas/redes varejistas no Brasil que poderiam vender esses produtos.

Para cada loja, forneça:
- Nome da loja/rede
- CNPJ (se encontrar)
- Nome do proprietário/CEO (se encontrar)
- Cidade/Estado
- Segmento
- Porte estimado (pequeno/médio/grande)
- Por que seria um bom parceiro

Retorne em JSON:
{
  "potential_stores": [
    {
      "store_name": "Nome",
      "cnpj": "CNPJ ou null",
      "owner_name": "Nome ou null",
      "city": "Cidade",
      "state": "Estado",
      "segment": "Segmento",
      "size": "pequeno/médio/grande",
      "why_good_fit": "Explicação",
      "estimated_annual_revenue": "Faturamento estimado"
    }
  ]
}`;

    const storesData = await base44.integrations.Core.InvokeLLM({
      prompt: storesPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          potential_stores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                store_name: { type: "string" },
                cnpj: { type: "string" },
                owner_name: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                segment: { type: "string" },
                size: { type: "string" },
                why_good_fit: { type: "string" },
                estimated_annual_revenue: { type: "string" }
              }
            }
          }
        }
      }
    });

    console.log('Lojas identificadas:', storesData.potential_stores.length);

    // ETAPA 3: Análise detalhada de cada loja
    const detailedAnalysis = [];

    for (const store of storesData.potential_stores) {
      // Calcular numerologia se tiver nome do proprietário
      let numerologyNumber = null;
      let numerologyProfile = null;
      
      if (store.owner_name && store.owner_name !== 'null') {
        const name = store.owner_name.toUpperCase();
        let sum = 0;
        for (let i = 0; i < name.length; i++) {
          const char = name[i];
          if (char >= 'A' && char <= 'Z') {
            sum += ((char.charCodeAt(0) - 65) % 9) + 1;
          }
        }
        while (sum > 9 && sum !== 11 && sum !== 22) {
          sum = sum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        }
        numerologyNumber = sum;

        // Buscar perfil na base de conhecimento
        const knowledgeBase = await base44.asServiceRole.entities.KnowledgeBase.filter({
          numerology_numbers: numerologyNumber
        });

        if (knowledgeBase && knowledgeBase.length > 0) {
          numerologyProfile = knowledgeBase[0];
        }
      }

      // Análise de produtos ideais para esta loja
      const productAnalysisPrompt = `Analise qual mix de produtos da ${brand_name} seria ideal para a loja "${store.store_name}" (${store.segment}, porte ${store.size}, ${store.city}/${store.state}).

Produtos disponíveis:
${productsData.product_categories.map(cat => `- ${cat.category}: ${cat.products.join(', ')}`).join('\n')}

Considere:
- Perfil da loja
- Localização e poder aquisitivo da região
- Concorrência local
- Sazonalidade

Retorne em JSON:
{
  "recommended_products": [
    {
      "product": "Nome do produto/categoria",
      "priority": "alta/média/baixa",
      "estimated_monthly_volume": "Volume estimado",
      "reason": "Por que este produto funcionaria bem"
    }
  ],
  "market_analysis": {
    "regional_gdp": "PIB regional estimado",
    "competition_level": "baixo/médio/alto",
    "growth_potential": "baixo/médio/alto",
    "economic_context": "Contexto econômico da região"
  },
  "sales_approach": {
    "key_message": "Mensagem principal",
    "pain_points": ["dor 1", "dor 2"],
    "value_proposition": "Proposta de valor",
    "best_contact_method": "Melhor método de contato"
  }
}`;

      const productAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: productAnalysisPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  priority: { type: "string" },
                  estimated_monthly_volume: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            market_analysis: {
              type: "object",
              properties: {
                regional_gdp: { type: "string" },
                competition_level: { type: "string" },
                growth_potential: { type: "string" },
                economic_context: { type: "string" }
              }
            },
            sales_approach: {
              type: "object",
              properties: {
                key_message: { type: "string" },
                pain_points: { type: "array", items: { type: "string" } },
                value_proposition: { type: "string" },
                best_contact_method: { type: "string" }
              }
            }
          }
        }
      });

      detailedAnalysis.push({
        store: store,
        numerology: {
          number: numerologyNumber,
          profile: numerologyProfile ? {
            title: numerologyProfile.title,
            approach_tips: numerologyProfile.approach_tips,
            sales_technique: numerologyProfile.sales_technique,
            example_scripts: numerologyProfile.example_scripts
          } : null
        },
        product_analysis: productAnalysis
      });
    }

    console.log('Análise detalhada concluída');

    // ETAPA 4: Gerar relatório final em formato para PDF
    const finalReportPrompt = `Crie um relatório executivo profissional de análise de mercado para expansão da ${brand_name}.

DADOS COLETADOS:
- Marca: ${JSON.stringify(productsData.brand_info)}
- Produtos: ${productsData.product_categories.length} categorias
- Lojas analisadas: ${detailedAnalysis.length}

Estrutura do relatório:
1. SUMÁRIO EXECUTIVO
2. ANÁLISE DA MARCA ${brand_name}
3. PORTFÓLIO DE PRODUTOS
4. ANÁLISE DE MERCADO
5. PROSPECTS QUALIFICADOS (TOP 15)
   - Para cada loja: perfil, produtos recomendados, abordagem, numerologia
6. ESTRATÉGIA DE EXPANSÃO
7. PRÓXIMOS PASSOS

Seja detalhado, profissional e acionável. Use dados concretos.`;

    const finalReport = await base44.integrations.Core.InvokeLLM({
      prompt: finalReportPrompt + '\n\nDADOS COMPLETOS:\n' + JSON.stringify({
        brand: productsData,
        analysis: detailedAnalysis
      }, null, 2),
      add_context_from_internet: false
    });

    console.log('Relatório final gerado');

    // ETAPA 5: Salvar em ExportedDocument
    const exportDoc = await base44.asServiceRole.entities.ExportedDocument.create({
      title: `Análise de Mercado - ${brand_name}`,
      document_type: 'pdf',
      category: 'analise',
      description: `Análise mercadológica completa com ${detailedAnalysis.length} prospects qualificados`,
      metadata: {
        brand: brand_name,
        prospects_count: detailedAnalysis.length,
        categories: productsData.product_categories.length,
        generated_at: new Date().toISOString()
      },
      whatsapp_ready: true,
      file_url: 'pending_generation' // Será atualizado quando gerar o PDF real
    });

    return Response.json({
      success: true,
      report_id: exportDoc.id,
      brand_info: productsData.brand_info,
      products_analyzed: productsData.product_categories.length,
      prospects_found: detailedAnalysis.length,
      report_preview: finalReport,
      detailed_analysis: detailedAnalysis,
      message: 'Análise completa gerada! Use a função generatePDFReport para criar o PDF.'
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao gerar análise de mercado'
    }, { status: 500 });
  }
});