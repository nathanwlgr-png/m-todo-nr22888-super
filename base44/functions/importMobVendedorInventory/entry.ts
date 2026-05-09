import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { file_url, file_name } = body;

    if (!file_url) throw new Error('URL do arquivo é obrigatória');

    // Usar LLM para extrair dados do arquivo
    const extractResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em análise de arquivos de inventário.
      
Analise este arquivo de inventário do Mob Vendedor e extraia os dados em formato JSON.

Estrutura esperada:
- sku: string (identificador único)
- product_name: string (nome do produto)
- category: string (analisador_hematologico, analisador_bioquimico, etc)
- model: string (VG2, SMT-120VP, etc)
- price_sku: number (preço)
- quantity_available: number (quantidade)
- location: string (localização)
- supplier: string (fornecedor, opcional)
- validity: string (data de validade se houver, formato YYYY-MM-DD)

Retorne um JSON com array "products" contendo todos os itens extraídos.
Se um campo não existir no arquivo, omita-o (não use null).`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string' },
                product_name: { type: 'string' },
                category: { type: 'string' },
                model: { type: 'string' },
                price_sku: { type: 'number' },
                quantity_available: { type: 'number' },
                location: { type: 'string' },
                supplier: { type: 'string' },
                validity: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const products = extractResult.products || [];
    const imported = [];
    const errors = [];

    // Validar e criar registros
    for (const prod of products) {
      const validationErrors = [];

      // Validações
      if (!prod.sku) validationErrors.push('SKU obrigatório');
      if (!prod.product_name) validationErrors.push('Nome do produto obrigatório');
      if (!prod.category) validationErrors.push('Categoria obrigatória');
      if (prod.price_sku && prod.price_sku < 0) validationErrors.push('Preço não pode ser negativo');
      if (prod.quantity_available && prod.quantity_available < 0) validationErrors.push('Quantidade não pode ser negativa');

      // Se validade existe, validar formato
      if (prod.validity) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(prod.validity)) {
          validationErrors.push('Data de validade inválida (use YYYY-MM-DD)');
        } else {
          const expiryDate = new Date(prod.validity);
          if (expiryDate < new Date()) {
            validationErrors.push('Produto vencido');
          }
        }
      }

      if (validationErrors.length > 0) {
        errors.push(`${prod.sku || prod.product_name}: ${validationErrors.join('; ')}`);
        continue;
      }

      // Mapear categoria
      const categoryMap = {
        'analisador hematológico': 'analisador_hematologico',
        'hematológico': 'analisador_hematologico',
        'analisador bioquímico': 'analisador_bioquimico',
        'bioquímico': 'analisador_bioquimico',
        'contador': 'contador_celulas',
        'gasometro': 'gasometro',
        'ultrassom': 'ultrassom',
        'acessório': 'acessorio',
        'reagente': 'reagente'
      };

      const mappedCategory = categoryMap[prod.category.toLowerCase()] || prod.category;

      try {
        await base44.asServiceRole.entities.SeamatyInventory?.create({
          sku: prod.sku,
          product_name: prod.product_name,
          category: mappedCategory,
          model: prod.model,
          price_sku: prod.price_sku || 0,
          quantity_available: prod.quantity_available || 0,
          location: prod.location,
          supplier: prod.supplier,
          validity: prod.validity,
          import_source: 'mob_vendedor',
          validated: validationErrors.length === 0,
          validation_errors: validationErrors,
          notes: `Importado de ${file_name} em ${new Date().toLocaleDateString('pt-BR')}`
        });

        imported.push(prod);
      } catch (e) {
        errors.push(`Erro ao salvar ${prod.sku}: ${e.message}`);
      }
    }

    // Auditoria
    await base44.asServiceRole.entities.AuditLog?.create({
      action: 'lead_investigation',
      module: 'Mob Vendedor Import',
      user_email: user.email,
      duration_ms: 3000,
      cost_credits: 2,
      success: imported.length > 0
    }).catch(() => {});

    return Response.json({
      imported_count: imported.length,
      validated_count: imported.filter(p => !p.validation_errors?.length).length,
      error_count: errors.length,
      errors,
      imported_products: imported
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});