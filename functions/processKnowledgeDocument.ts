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
        tags: { 
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

    // Extrair texto completo para pesquisa
    const textPrompt = `Extraia TODO o texto deste documento de forma organizada e legível.`;
    const textResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: textPrompt,
      file_urls: [file_url]
    });

    const document = {
      title: title,
      document_type: document_type,
      file_format: fileExt,
      file_url: file_url,
      file_size_kb: Math.round(fileBlob.size / 1024),
      extracted_text: textResult,
      summary: extractedData.output.summary || '',
      key_data: extractedData.output,
      tags: extractedData.output.tags || [],
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