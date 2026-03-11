import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { entity_type, ids_to_delete } = await req.json();

    if (!entity_type || !['Client', 'Lead'].includes(entity_type)) {
      return Response.json({ error: 'Tipo de entidade inválido' }, { status: 400 });
    }

    if (!Array.isArray(ids_to_delete) || ids_to_delete.length === 0) {
      return Response.json({ error: 'IDs para deletar não fornecidos' }, { status: 400 });
    }

    const results = {
      success: [],
      failed: []
    };

    // Deletar cada registro
    for (const id of ids_to_delete) {
      try {
        await base44.asServiceRole.entities[entity_type].delete(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      entity_type,
      deleted_count: results.success.length,
      failed_count: results.failed.length,
      results
    });

  } catch (error) {
    console.error('Erro ao remover duplicatas:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});