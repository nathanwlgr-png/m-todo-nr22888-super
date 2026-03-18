import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id } = await req.json();

    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === client_id);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('salesforce');

    // Buscar instance URL do Salesforce
    const instanceUrl = 'https://login.salesforce.com';

    // Criar Account primeiro (se não existir)
    const accountData = {
      Name: client.clinic_name || client.first_name,
      Phone: client.phone,
      BillingCity: client.city,
      BillingStreet: client.address,
      Website: client.website
    };

    const accountResponse = await fetch(`${instanceUrl}/services/data/v59.0/sobjects/Account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData)
    });

    const account = await accountResponse.json();
    const accountId = account.id;

    // Criar Opportunity
    const opportunityData = {
      Name: `${client.first_name} - ${client.equipment_interest || 'VG2'}`,
      AccountId: accountId,
      StageName: client.pipeline_stage === 'lead' ? 'Prospecting' :
                 client.pipeline_stage === 'qualificado' ? 'Qualification' :
                 client.pipeline_stage === 'proposta' ? 'Proposal/Price Quote' :
                 client.pipeline_stage === 'negociacao' ? 'Negotiation/Review' :
                 client.pipeline_stage === 'fechado' ? 'Closed Won' : 'Prospecting',
      CloseDate: client.decision_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Amount: client.projected_revenue || client.available_budget,
      Probability: client.purchase_score || 50,
      Description: `Status: ${client.status}\nScore: ${client.purchase_score}%\nDores: ${client.main_pains?.join(', ')}\nObjeções: ${client.real_objections?.join(', ')}`,
      LeadSource: client.lead_source || 'Web'
    };

    const opportunityResponse = await fetch(`${instanceUrl}/services/data/v59.0/sobjects/Opportunity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(opportunityData)
    });

    const opportunity = await opportunityResponse.json();

    return Response.json({
      success: true,
      account_id: accountId,
      opportunity_id: opportunity.id,
      salesforce_url: `${instanceUrl}/${opportunity.id}`
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});