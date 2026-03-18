import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active integrations
    const integrations = await base44.entities.Integration.list();
    const mailchimpActive = integrations.find(i => 
      i.provider === 'mailchimp' && i.status === 'active'
    );
    const sendinblueActive = integrations.find(i => 
      i.provider === 'sendinblue' && i.status === 'active'
    );

    if (!mailchimpActive && !sendinblueActive) {
      return Response.json({ 
        success: false, 
        message: 'Nenhuma integração de email ativa' 
      });
    }

    const leads = await base44.entities.Lead.list();
    let updated = 0;

    for (const lead of leads) {
      if (!lead.email) continue;

      let emailEngagement = {
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        open_rate: 0,
        click_rate: 0,
        replied: false
      };

      // Sync with Mailchimp if active
      if (mailchimpActive) {
        try {
          const mcData = await base44.functions.invoke('mailchimpSync', {
            action: 'get_member_stats',
            email: lead.email
          });
          
          if (mcData.data?.success) {
            emailEngagement.emails_sent = mcData.data.stats.emails_sent || 0;
            emailEngagement.emails_opened = mcData.data.stats.emails_opened || 0;
            emailEngagement.emails_clicked = mcData.data.stats.clicks || 0;
            emailEngagement.open_rate = mcData.data.stats.open_rate || 0;
            emailEngagement.click_rate = mcData.data.stats.click_rate || 0;
            emailEngagement.last_opened = mcData.data.stats.last_opened;
          }
        } catch (e) {
          console.error('Mailchimp sync error:', e);
        }
      }

      // Update lead
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        email_engagement: emailEngagement
      });
      updated++;
    }

    return Response.json({
      success: true,
      updated,
      message: `${updated} leads atualizados com dados de email`
    });

  } catch (error) {
    console.error('Email engagement sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});