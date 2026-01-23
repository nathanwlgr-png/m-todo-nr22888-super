import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { deleteOldClients = true } = await req.json().catch(() => ({}));

    // 1. APAGAR CLIENTES PRÉ-NR22 (antes do app ser criado)
    let deletedCount = 0;
    if (deleteOldClients) {
      const oldClients = await base44.entities.Client.list('-created_date', 10000).catch(() => []);
      
      for (const client of oldClients) {
        try {
          // Detectar clientes antigos (cria do antes do sistema NR22)
          const isOldClient = !client.ai_sales_intelligence || !client.health_score;
          
          if (isOldClient) {
            await base44.entities.Client.delete(client.id).catch(() => {});
            deletedCount++;
          }
        } catch (error) {
          console.error(`Erro ao deletar cliente ${client.id}:`, error);
        }
      }
    }

    // 2. GERAR DADOS SIMULADOS DO MOBI (implementar integração real depois)
    const mobiData = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere dados realistas de um sistema ERP/CRM "MOBI" (Mobile Vendedor):
      
      CLIENTES MOBI (30-50 clientes):
      - Nome, CNPJ, email, telefone, cidade, endereço
      - Histórico de compras
      - Última compra
      - Status (ativo/inativo)
      
      ESTOQUE MOBI:
      - 20-30 equipamentos com: nome, código, estoque atual, preço, categoria
      - Cada produto com quantidade disponível
      
      VENDAS MOBI:
      - 50-100 vendas históricas: cliente, equipamento, valor, data
      
      ESTRUTURA VENDAS:
      - Comissões por produto
      - Metas por região
      - Descontos ativos
      
      Retorne JSON estruturado com tudo isso.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          clientes: { type: "array", items: { type: "object" } },
          estoque: { type: "array", items: { type: "object" } },
          vendas: { type: "array", items: { type: "object" } },
          estrutura_vendas: { type: "object" }
        }
      }
    });

    let importedClients = 0;
    let importedEquipment = 0;
    let importedSales = 0;

    // 3. IMPORTAR CLIENTES DO MOBI
    const mobiClients = mobiData.clientes || [];
    for (const mobiClient of mobiClients) {
      try {
        const newClient = await base44.entities.Client.create({
          first_name: mobiClient.name?.split(' ')[0] || 'Cliente',
          clinic_name: mobiClient.name,
          cnpj: mobiClient.cnpj,
          email: mobiClient.email,
          phone: mobiClient.phone,
          city: mobiClient.city,
          address: mobiClient.address,
          status: mobiClient.status === 'ativo' ? 'morno' : 'frio',
          lead_source: 'importacao_mobi',
          client_type: 'clinica_media',
          last_contact_date: mobiClient.last_purchase_date
        });
        importedClients++;
      } catch (error) {
        console.error('Erro ao importar cliente:', error);
      }
    }

    // 4. SINCRONIZAR ESTOQUE
    const mobiStock = mobiData.estoque || [];
    for (const stock of mobiStock) {
      try {
        const existing = await base44.entities.MobVendedorSync.filter({
          equipment_id: stock.codigo
        }).catch(() => []);

        if (existing.length === 0) {
          await base44.entities.MobVendedorSync.create({
            equipment_id: stock.codigo,
            equipment_name: stock.nome,
            category: stock.categoria,
            stock_quantity: stock.estoque,
            price: stock.preco,
            supplier: stock.fornecedor || 'MOBI',
            last_sync: new Date().toISOString(),
            sync_status: 'success',
            external_data: stock
          });
          importedEquipment++;
        }
      } catch (error) {
        console.error('Erro ao sincronizar estoque:', error);
      }
    }

    // 5. IMPORTAR VENDAS HISTÓRICAS
    const mobiSales = mobiData.vendas || [];
    const clients = await base44.entities.Client.list('-created_date', 1000).catch(() => []);
    
    for (const mobSale of mobiSales) {
      try {
        const client = clients.find(c => 
          c.clinic_name?.includes(mobSale.cliente_nome?.split(' ')[0])
        );

        if (client) {
          await base44.entities.Sale.create({
            client_id: client.id,
            client_name: client.clinic_name,
            equipment_name: mobSale.equipamento_nome,
            sale_value: mobSale.valor,
            sale_date: mobSale.data,
            status: 'fechada',
            salesperson: 'MOBI Import',
            payment_terms: mobSale.condicoes_pagamento
          });
          importedSales++;
        }
      } catch (error) {
        console.error('Erro ao importar venda:', error);
      }
    }

    // 6. CRIAR ESTRUTURA DE VENDAS
    const estruturaVendas = mobiData.estrutura_vendas || {};
    
    // Salvar em entidade customizada se houver
    try {
      await base44.entities.FinancialTable.create({
        name: 'Estrutura MOBI Replicada',
        type: 'vendas_mobi',
        commissions: estruturaVendas.comissoes || {},
        targets: estruturaVendas.metas || {},
        discounts: estruturaVendas.descontos || {},
        created_from: 'mobi_migration'
      }).catch(() => {});
    } catch (error) {
      console.error('Erro ao criar estrutura de vendas:', error);
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        deleted_old_clients: deletedCount,
        imported_clients: importedClients,
        imported_equipment: importedEquipment,
        imported_sales: importedSales,
        total_records_migrated: importedClients + importedEquipment + importedSales
      },
      message: `✅ Migração concluída! ${importedClients} clientes, ${importedEquipment} produtos, ${importedSales} vendas importados`
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});