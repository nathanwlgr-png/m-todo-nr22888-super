import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entries } = await req.json();

    if (!entries || entries.length === 0) {
      return Response.json({ success: true, synced: 0, conflicts: [] });
    }

    let syncedCount = 0;
    const conflicts = [];

    for (const entry of entries) {
      try {
        // Verificar se já existe registro no servidor com mesmo timestamp
        const existingData = await base44.asServiceRole.entities.OfflineDataEntry.filter({
          user_email: entry.user_email,
          entry_date: entry.entry_date,
          clinic_name: entry.clinic_name,
          synced: true
        });

        // Conflito detectado
        if (existingData.length > 0) {
          const serverEntry = existingData[0];
          
          // Estratégia: Last-Write-Wins (comparar updated_date)
          const localTime = new Date(entry.updated_date || entry.created_date);
          const serverTime = new Date(serverEntry.updated_date);

          if (localTime > serverTime) {
            // Local mais recente - atualizar servidor
            await base44.asServiceRole.entities.OfflineDataEntry.update(serverEntry.id, {
              ...entry,
              synced: true,
              sync_date: new Date().toISOString()
            });
            syncedCount++;
          } else {
            // Servidor mais recente - registrar conflito
            conflicts.push({
              id: entry.id,
              entity_type: 'OfflineDataEntry',
              local_data: entry,
              server_data: serverEntry,
              resolution_strategy: 'server_newer'
            });
          }
        } else {
          // Não há conflito - criar novo registro
          await base44.asServiceRole.entities.OfflineDataEntry.create({
            ...entry,
            synced: true,
            sync_date: new Date().toISOString()
          });

          // Marcar original como sincronizado
          await base44.asServiceRole.entities.OfflineDataEntry.update(entry.id, {
            synced: true,
            sync_date: new Date().toISOString()
          });

          syncedCount++;
        }

        // Sincronizar com entidades principais
        if (entry.entry_type === 'visita') {
          // Criar/atualizar visita
          const visitData = {
            city: entry.city,
            clinic_name: entry.clinic_name,
            client_name: entry.client_name,
            contact_phone: entry.contact_phone,
            visit_result: entry.visit_result,
            notes: entry.notes,
            visit_date: entry.entry_date
          };

          await base44.asServiceRole.entities.Visit.create(visitData);
        } else if (entry.entry_type === 'venda') {
          // Criar/atualizar venda
          const saleData = {
            city: entry.city,
            clinic_name: entry.clinic_name,
            client_name: entry.client_name,
            equipment_sold: entry.equipment_sold,
            sale_value: entry.sale_value,
            notes: entry.notes,
            sale_date: entry.entry_date
          };

          await base44.asServiceRole.entities.Sale.create(saleData);
        }

      } catch (error) {
        console.error(`Erro ao sincronizar entrada ${entry.id}:`, error);
        conflicts.push({
          id: entry.id,
          entity_type: 'OfflineDataEntry',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      synced: syncedCount,
      conflicts: conflicts,
      total_processed: entries.length
    });

  } catch (error) {
    console.error('Erro na sincronização offline:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});