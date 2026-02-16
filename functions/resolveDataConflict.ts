import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conflict_id, resolution, local_data, server_data } = await req.json();

    let resolvedData;

    switch (resolution) {
      case 'keep_local':
        // Manter versão local (sobrescrever servidor)
        resolvedData = local_data;
        break;

      case 'keep_server':
        // Manter versão servidor (descartar local)
        resolvedData = server_data;
        break;

      case 'merge':
        // Estratégia de merge inteligente
        resolvedData = {
          ...server_data,
          ...local_data,
          // Campos que sempre vêm do servidor
          id: server_data.id,
          created_date: server_data.created_date,
          created_by: server_data.created_by,
          // Mesclar notas
          notes: `${server_data.notes || ''}\n---OFFLINE---\n${local_data.notes || ''}`.trim(),
          // Timestamp de merge
          merged_at: new Date().toISOString(),
          conflict_resolved: true
        };
        break;

      default:
        return Response.json({ error: 'Estratégia de resolução inválida' }, { status: 400 });
    }

    // Aplicar resolução
    await base44.asServiceRole.entities.OfflineDataEntry.update(conflict_id, {
      ...resolvedData,
      synced: true,
      sync_date: new Date().toISOString(),
      conflict_resolution: resolution
    });

    return Response.json({
      success: true,
      resolution_applied: resolution,
      message: 'Conflito resolvido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao resolver conflito:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});