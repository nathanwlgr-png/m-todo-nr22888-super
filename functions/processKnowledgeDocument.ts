import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, title, document_type } = await req.json();

    // Buscar o arquivo
    const fileResponse = await fetch(file_url);
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);
    
    // Detectar formato
    const fileExt = file_url.split('.').pop().toLowerCase();
    
    // Schema para extração estruturada baseado no tipo
    let extractionSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        detailed_summary: { type: "string" },
        executive_summary: { type: "string" },
        tags: { 
          type: "array",
          items: { type: "string" }
        },
        auto_category: { type: "string" },
        industry_relevance: {
          type: "array",
          items: { type: "string" }
        },
        kpis_detected: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kpi_name: { type: "string" },
              value: { type: "string" },
              unit: { type: "string" },
              category: { type: "string" }
            }
          }
        },
        key_insights: {
          type: "array",
          items: { type: "string" }
        },
        action_items: {
          type: "array",
          items: { type: "string" }
        }
      }
    };

    // Schemas específicos por tipo de documento
    if (document_type === 'catalogo_produtos' || document_type === 'manual_tecnico') {
      extractionSchema.properties = {
        ...extractionSchema.properties,
        produtos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              modelo: { type: "string" },
              tempo_processamento: { type: "string" },
              volume_amostra: { type: "string" },
              parametros_medidos: { type: "string" },
              tecnologia: { type: "string" },
              componentes: {
                type: "array",
                items: { type: "string" }
              },
              rotor: { type: "string" },
              enzimas_reagentes: {
                type: "array",
                items: { type: "string" }
              },
              especificacoes_tecnicas: {
                type: "object",
                properties: {
                  precisao: { type: "string" },
                  linearidade: { type: "string" },
                  capacidade: { type: "string" },
                  interface: { type: "string" }
                }
              },
              diferenciais: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        }
      };
    }

    if (document_type === 'tabela_precos') {
      extractionSchema.properties = {
        ...extractionSchema.properties,
        precos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              produto: { type: "string" },
              preco_vista: { type: "number" },
              preco_parcelado: { type: "string" },
              condicoes: { type: "string" },
              bonificacao: { type: "string" },
              garantia: { type: "string" }
            }
          }
        }
      };
    }

    if (document_type === 'modelo_proposta') {
      extractionSchema.properties = {
        ...extractionSchema.properties,
        estrutura_proposta: {
          type: "object",
          properties: {
            introducao: { type: "string" },
            secoes: {
              type: "array",
              items: { type: "string" }
            },
            termos_padrao: { type: "string" },
            assinatura: { type: "string" }
          }
        }
      };
    }

    // Extrair dados do documento
    const extractedData = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: extractionSchema
    });

    if (extractedData.status !== 'success') {
      return Response.json({ 
        error: 'Erro ao extrair dados',
        details: extractedData.details 
      }, { status: 400 });
    }

    // Extrair texto completo e análise profunda
    const deepAnalysisPrompt = `Analise este documento em profundidade e extraia:

1. RESUMO EXECUTIVO (2-3 linhas) - O essencial do documento
2. RESUMO DETALHADO (1 parágrafo) - Visão geral completa
3. KPIs IDENTIFICADOS - Todos os indicadores de performance mencionados:
   - Nome do KPI
   - Valor
   - Unidade (%, R$, unidades, dias, etc)
   - Categoria (vendas, operações, financeiro, etc)
4. CATEGORIA AUTOMÁTICA - Classifique o documento
5. RELEVÂNCIA PARA INDÚSTRIAS - Quais setores podem usar
6. INSIGHTS CHAVE - 3-5 insights principais
7. ITENS DE AÇÃO - O que fazer com essas informações
8. TEXTO COMPLETO EXTRAÍDO - Todo o conteúdo do documento

Seja extremamente detalhado na extração de KPIs.`;

    const textResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: deepAnalysisPrompt,
      file_urls: [file_url]
    });

    // Gerar categorias e tags inteligentes se não existirem
    let finalTags = extractedData.output.tags || [];
    let finalCategory = extractedData.output.auto_category || document_type;
    
    if (finalTags.length === 0 || !extractedData.output.auto_category) {
      const categorizationPrompt = `Baseado no conteúdo extraído, gere:
1. 5-10 tags relevantes (palavras-chave para busca)
2. Categoria mais apropriada dentre: ${Object.keys({
  catalogo_produtos: true,
  tabela_precos: true,
  manual_tecnico: true,
  relatorio_financeiro: true,
  analise_mercado: true,
  case_sucesso: true,
  documento_operacional: true
}).join(', ')}

Retorne apenas a categoria e as tags.`;

      const categorizationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: categorizationPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
            category: { type: "string" }
          }
        }
      });

      finalTags = categorizationResult.tags || finalTags;
      finalCategory = categorizationResult.category || finalCategory;
    }

    const document = {
      title: title,
      document_type: finalCategory,
      file_format: fileExt,
      file_url: file_url,
      file_size_kb: Math.round(fileBlob.size / 1024),
      extracted_text: textResult,
      summary: extractedData.output.executive_summary || extractedData.output.summary || '',
      detailed_summary: extractedData.output.detailed_summary || '',
      key_data: {
        ...extractedData.output,
        kpis: extractedData.output.kpis_detected || [],
        insights: extractedData.output.key_insights || [],
        action_items: extractedData.output.action_items || [],
        industry_relevance: extractedData.output.industry_relevance || []
      },
      tags: finalTags,
      is_active: true,
      upload_date: new Date().toISOString(),
      usage_count: 0
    };

    return Response.json(document);

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});