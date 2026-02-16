import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, table_type = 'products' } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    // Definir schemas baseado no tipo de tabela
    const schemas = {
      products: {
        type: "object",
        properties: {
          product_code: { type: "string" },
          product_name: { type: "string" },
          description: { type: "string" },
          price_cash: { type: "number" },
          price_5x_card: { type: "number" },
          category: { type: "string" },
          compatible_equipment: { type: "array", items: { type: "string" } }
        }
      },
      clients: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          clinic_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          city: { type: "string" },
          address: { type: "string" },
          cnpj: { type: "string" }
        }
      },
      prices: {
        type: "object",
        properties: {
          product_code: { type: "string" },
          product_name: { type: "string" },
          price_tier1: { type: "number" },
          price_tier2: { type: "number" },
          price_tier3: { type: "number" },
          price_tier4: { type: "number" }
        }
      }
    };

    const selectedSchema = schemas[table_type] || schemas.products;

    // Extrair dados do arquivo
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: selectedSchema
    });

    if (extractResult.status !== 'success') {
      return Response.json({
        success: false,
        error: extractResult.details || 'Erro ao extrair dados do arquivo'
      }, { status: 400 });
    }

    const extractedData = Array.isArray(extractResult.output) 
      ? extractResult.output 
      : [extractResult.output];

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    // Processar baseado no tipo
    if (table_type === 'products') {
      for (const item of extractedData) {
        try {
          // Buscar se já existe
          const existing = await base44.asServiceRole.entities.SeamatyPriceTable.filter({
            product_code: item.product_code
          }).catch(() => []);

          if (existing && existing.length > 0) {
            await base44.asServiceRole.entities.SeamatyPriceTable.update(existing[0].id, item);
            updatedCount++;
          } else {
            await base44.asServiceRole.entities.SeamatyPriceTable.create(item);
            createdCount++;
          }
        } catch (error) {
          errors.push(`${item.product_code}: ${error.message}`);
        }
      }
    } else if (table_type === 'clients') {
      for (const item of extractedData) {
        try {
          const existing = await base44.asServiceRole.entities.Client.filter({
            email: item.email
          }).catch(() => []);

          if (existing && existing.length > 0) {
            await base44.asServiceRole.entities.Client.update(existing[0].id, item);
            updatedCount++;
          } else {
            await base44.asServiceRole.entities.Client.create(item);
            createdCount++;
          }
        } catch (error) {
          errors.push(`${item.full_name}: ${error.message}`);
        }
      }
    }

    // Salvar documento de referência
    await base44.asServiceRole.entities.AIKnowledgeDocument.create({
      title: `Tabela Importada - ${table_type} (${new Date().toLocaleDateString('pt-BR')})`,
      document_type: 'planilha_excel',
      file_url,
      extracted_text: JSON.stringify(extractedData),
      summary: `${createdCount} novos registros, ${updatedCount} atualizados`,
      is_active: true
    }).catch(() => null);

    return Response.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      total_processed: extractedData.length,
      errors: errors.length > 0 ? errors : null,
      message: `✅ Tabela processada! ${createdCount} novos + ${updatedCount} atualizados`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});