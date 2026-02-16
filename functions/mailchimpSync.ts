import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, segment, client_ids } = await req.json();
    
    // Get Mailchimp config
    const integrations = await base44.entities.Integration.filter({ provider: 'mailchimp' });
    const mailchimpConfig = integrations[0];

    if (!mailchimpConfig || mailchimpConfig.status !== 'active') {
      return Response.json({ error: 'Mailchimp não configurado' }, { status: 400 });
    }

    const apiKey = mailchimpConfig.config.api_key;
    const listId = mailchimpConfig.config.list_id;
    const dc = apiKey.split('-')[1];

    if (action === 'sync_contacts') {
      // Sync clients to Mailchimp
      const clients = client_ids 
        ? await Promise.all(client_ids.map(id => base44.entities.Client.get(id)))
        : await base44.entities.Client.list();

      const members = clients.map(client => ({
        email_address: client.email || client.contract_signature_email,
        status: 'subscribed',
        merge_fields: {
          FNAME: client.first_name,
          LNAME: client.full_name?.split(' ').slice(1).join(' ') || '',
          CLINIC: client.clinic_name || '',
          CITY: client.city || '',
          PHONE: client.phone || ''
        },
        tags: [
          client.status,
          client.client_type,
          segment || 'crm_sync'
        ].filter(Boolean)
      }));

      // Batch update to Mailchimp
      const response = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            members,
            update_existing: true
          })
        }
      );

      const result = await response.json();

      // Update integration stats
      await base44.asServiceRole.entities.Integration.update(mailchimpConfig.id, {
        last_sync: new Date().toISOString(),
        sync_stats: {
          total_syncs: (mailchimpConfig.sync_stats?.total_syncs || 0) + 1,
          last_success: new Date().toISOString(),
          records_synced: members.length
        }
      });

      return Response.json({
        success: true,
        synced: members.length,
        result
      });
    }

    if (action === 'create_campaign') {
      const { campaign_name, subject, content, segment_id } = await req.json();

      const campaignResponse = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'regular',
            recipients: {
              list_id: listId,
              segment_opts: segment_id ? { saved_segment_id: segment_id } : undefined
            },
            settings: {
              subject_line: subject,
              title: campaign_name,
              from_name: 'NR22 Vendas',
              reply_to: user.email
            }
          })
        }
      );

      const campaign = await campaignResponse.json();

      // Set content
      await fetch(
        `https://${dc}.api.mailchimp.com/3.0/campaigns/${campaign.id}/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ html: content })
        }
      );

      return Response.json({
        success: true,
        campaign_id: campaign.id,
        campaign
      });
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('Mailchimp sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});