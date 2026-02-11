import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMIT_DELAY = 2000; // 2 segundos entre requisições

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, credentials } = body;

    if (action === 'test_connection') {
      try {
        const authResponse = await fetch('https://api.mobvendedor.com.br/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: credentials?.username, 
            password: credentials?.password 
          })
        }).catch(() => null);

        if (!authResponse?.ok) {
          return Response.json({ 
            success: false, 
            error: 'Falha na autenticação' 
          }, { status: 401 });
        }

        return Response.json({ 
          success: true, 
          message: 'Conexão estabelecida'
        });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }
    }

    if (action === 'sync_clients') {
      const cnpj = credentials?.cnpj || '13693877000157';
      const mobvendedor_id = credentials?.mobvendedor_id || '53';

      try {
        // Busca clientes do MobVendedor
        const clientsResponse = await fetch(`https://api.targetsis.com.br/mobvendedor/clientes?cnpj=${cnpj}&distribuidor=${mobvendedor_id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => null);

        if (!clientsResponse?.ok) {
          return Response.json({ success: false, error: 'Erro ao buscar clientes do MobVendedor', synced: 0 });
        }

        const clientsData = await clientsResponse.json();
        const clients = clientsData.clientes || [];

        let syncedCount = 0;
        const batchSize = 5;

        for (let i = 0; i < clients.length; i += batchSize) {
          const batch = clients.slice(i, i + batchSize);
          
          for (const client of batch) {
            try {
              const existing = await base44.entities.Client.filter({
                external_code: client.codigo_cliente
              }).catch(() => []);

              const clientData = {
                external_code: client.codigo_cliente,
                first_name: client.nome?.split(' ')[0] || client.razao_social?.split(' ')[0] || 'Cliente',
                full_name: client.nome || client.razao_social,
                cnpj: client.cnpj,
                razao_social: client.razao_social,
                email: client.email,
                phone: client.telefone,
                address: client.endereco,
                cep: client.cep,
                city: client.cidade,
                clinic_name: client.razao_social || client.nome,
                status: 'morno',
                lead_source: 'importacao_planilha',
                purchase_score: 50
              };

              if (existing?.length > 0) {
                await base44.asServiceRole.entities.Client.update(existing[0].id, clientData);
              } else {
                await base44.asServiceRole.entities.Client.create(clientData);
              }
              syncedCount++;
            } catch (e) {
              console.error(`Erro ao sincronizar cliente ${client.codigo_cliente}:`, e);
            }
          }

          if (i + batchSize < clients.length) {
            await delay(RATE_LIMIT_DELAY);
          }
        }

        return Response.json({ success: true, synced: syncedCount, total: clients.length });
      } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    if (action === 'sync_equipment') {
      const token = credentials?.token;
      const distributor_id = credentials?.distributor_id;

      try {
        const stockResponse = await fetch('https://api.mobvendedor.com.br/inventory/stock', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Distributor-ID': distributor_id || ''
          }
        }).catch(() => null);

        if (!stockResponse?.ok) {
          return Response.json({ success: false, error: 'Erro ao buscar estoque', synced: 0 });
        }

        const stockData = await stockResponse.json();
        const items = stockData.items || [];

        // Processar em lotes menores
        const batchSize = 10;
        let syncedCount = 0;

        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          
          for (const item of batch) {
            try {
              const existing = await base44.entities.MobVendedorSync.filter({
                equipment_id: item.id
              }).catch(() => []);

              const syncData = {
                equipment_id: item.id,
                equipment_name: item.name,
                category: item.category,
                stock_quantity: item.quantity,
                price: item.price,
                supplier: item.supplier,
                last_sync: new Date().toISOString(),
                sync_status: 'success'
              };

              if (existing?.length > 0) {
                await base44.entities.MobVendedorSync.update(existing[0].id, syncData);
              } else {
                await base44.entities.MobVendedorSync.create(syncData);
              }
              syncedCount++;
            } catch (e) {
              console.error(`Erro ao sincronizar ${item.id}:`, e);
            }
          }

          // Rate limiting entre lotes
          if (i + batchSize < items.length) {
            await delay(RATE_LIMIT_DELAY);
          }
        }

        return Response.json({ success: true, synced: syncedCount });
      } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});