import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todos os produtos de Fabia (adaptar nome se necessário)
    let fabiaProducts = [];
    try {
      fabiaProducts = await base44.asServiceRole.entities.Fabia?.list() || 
                     await base44.asServiceRole.entities.FabiaProduct?.list() || 
                     [];
    } catch (err) {
      console.log('Fabia entity not found, trying alternative names');
    }

    if (fabiaProducts.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Nenhum produto encontrado em Fabia' 
      });
    }

    let importedCount = 0;
    const errors = [];

    for (const fabiaProduct of fabiaProducts) {
      try {
        // Mapear dados de Fabia para Product
        const productData = {
          fabia_id: fabiaProduct.id,
          name: fabiaProduct.name || fabiaProduct.product_name || 'Sem nome',
          description: fabiaProduct.description || '',
          category: fabiaProduct.category || 'geral',
          sku: fabiaProduct.sku || fabiaProduct.code || '',
          price: fabiaProduct.price || 0,
          stock: fabiaProduct.stock || 0,
          supplier: fabiaProduct.supplier || '',
          specifications: fabiaProduct.specifications || {},
          status: fabiaProduct.status || 'ativo',
          is_active: fabiaProduct.is_active !== false
        };

        // Verificar se produto já existe
        const existing = await base44.asServiceRole.entities.Product?.filter({
          fabia_id: fabiaProduct.id
        });

        if (existing && existing.length > 0) {
          // Atualizar
          await base44.asServiceRole.entities.Product.update(existing[0].id, productData);
        } else {
          // Criar novo
          await base44.asServiceRole.entities.Product.create(productData);
        }

        importedCount++;
      } catch (err) {
        errors.push({ product: fabiaProduct.name, error: err.message });
      }
    }

    return Response.json({
      success: true,
      imported: importedCount,
      total: fabiaProducts.length,
      errors: errors.length > 0 ? errors : null,
      message: `${importedCount} produtos importados de Fabia`
    });

  } catch (error) {
    console.error('Erro na importação:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});