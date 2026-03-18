import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, data } = await req.json();

    // Get ERP config (SAP or Oracle NetSuite)
    const integrations = await base44.entities.Integration.filter({ 
      type: 'erp',
      status: 'active'
    });
    
    if (integrations.length === 0) {
      return Response.json({ error: 'ERP não configurado' }, { status: 400 });
    }

    const erpConfig = integrations[0];

    if (action === 'sync_clients') {
      const clients = await base44.entities.Client.list();
      const synced = [];

      for (const client of clients) {
        // Map CRM client to ERP customer format
        const erpCustomer = {
          external_code: client.external_code || client.id,
          name: client.full_name,
          company_name: client.clinic_name || client.razao_social,
          cnpj: client.cnpj,
          cpf: client.cpf,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          cep: client.cep,
          customer_type: client.client_type,
          status: client.status === 'quente' ? 'active' : 'prospect'
        };

        // Send to ERP (mock - replace with actual ERP API)
        if (erpConfig.provider === 'sap') {
          // SAP Business One API call
          const sapResponse = await fetch(
            `${erpConfig.config.api_url}/b1s/v1/BusinessPartners`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': erpConfig.config.session_id
              },
              body: JSON.stringify({
                CardCode: erpCustomer.external_code,
                CardName: erpCustomer.company_name,
                CardType: 'cCustomer',
                EmailAddress: erpCustomer.email,
                Phone1: erpCustomer.phone,
                Address: erpCustomer.address,
                ZipCode: erpCustomer.cep
              })
            }
          );
          
          if (sapResponse.ok) {
            synced.push(client.id);
          }
        } else if (erpConfig.provider === 'oracle_netsuite') {
          // NetSuite SuiteScript RESTlet call
          const nsResponse = await fetch(
            erpConfig.config.restlet_url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `OAuth ${erpConfig.config.oauth_token}`
              },
              body: JSON.stringify({
                action: 'createCustomer',
                data: erpCustomer
              })
            }
          );
          
          if (nsResponse.ok) {
            synced.push(client.id);
          }
        }
      }

      return Response.json({
        success: true,
        synced_count: synced.length,
        synced_ids: synced
      });
    }

    if (action === 'sync_sales') {
      const sales = await base44.entities.Sale.filter({ status: 'fechada' });
      const synced = [];

      for (const sale of sales) {
        // Map CRM sale to ERP order
        const erpOrder = {
          customer_code: sale.client_id,
          items: [{
            item_code: sale.equipment_id,
            description: sale.equipment_name,
            quantity: 1,
            price: sale.sale_value
          }],
          total: sale.sale_value,
          payment_terms: sale.payment_terms,
          order_date: sale.sale_date,
          salesperson: sale.salesperson
        };

        // Send to ERP
        if (erpConfig.provider === 'sap') {
          const sapResponse = await fetch(
            `${erpConfig.config.api_url}/b1s/v1/Orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': erpConfig.config.session_id
              },
              body: JSON.stringify({
                CardCode: erpOrder.customer_code,
                DocDate: erpOrder.order_date,
                DocumentLines: erpOrder.items.map(item => ({
                  ItemCode: item.item_code,
                  Quantity: item.quantity,
                  Price: item.price
                }))
              })
            }
          );
          
          if (sapResponse.ok) {
            synced.push(sale.id);
          }
        }
      }

      return Response.json({
        success: true,
        synced_count: synced.length
      });
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('ERP sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});