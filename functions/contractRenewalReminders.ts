import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const clients = await base44.asServiceRole.entities.Client.list();
    const now = new Date();

    // Remind 30 days and 7 days before renewal
    const remindDaysThresholds = [30, 7];
    let remindersCreated = 0;

    for (const client of clients) {
      if (!client.contract_renewal_date) continue;

      const renewalDate = new Date(client.contract_renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilRenewal < 0) continue; // Already expired

      for (const threshold of remindDaysThresholds) {
        if (daysUntilRenewal <= threshold && daysUntilRenewal > threshold - 1) {
          // Create alert in the system
          await base44.asServiceRole.entities.Alert.create({
            user_email: client.created_by || 'nathan.wlgr@gmail.com',
            title: `📅 Renovação de Contrato em ${daysUntilRenewal} dias`,
            message: `Contrato de ${client.clinic_name || client.first_name} vence em ${renewalDate.toLocaleDateString('pt-BR')}. Tome ação!`,
            type: 'task_overdue',
            priority: daysUntilRenewal <= 7 ? 'alta' : 'media',
            link_to: `ClientProfile?id=${client.id}`,
            read: false,
            dismissed: false
          });

          // Also send email if available
          if (client.email) {
            const firstName = client.first_name || client.full_name || 'Cliente';
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: client.email,
              subject: `🔔 Seu contrato vence em ${daysUntilRenewal} dias – Seamaty Brasil`,
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4f46e5;">Olá, ${firstName}! 👋</h2>
                  <p>Este é um lembrete amigável: seu contrato com a <strong>Seamaty Brasil</strong> vence em <strong>${daysUntilRenewal} dias</strong> (${renewalDate.toLocaleDateString('pt-BR')}).</p>
                  <p>Para garantir a continuidade dos seus serviços sem interrupção, entre em contato conosco para renovar:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://wa.me/5514991676428" style="background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      💬 Renovar pelo WhatsApp
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Atenciosamente,<br><strong>Equipe Seamaty Brasil</strong></p>
                </div>
              `,
              from_name: 'Seamaty Brasil'
            });
          }

          remindersCreated++;
          break; // Only one reminder per threshold per client per day
        }
      }
    }

    return Response.json({
      success: true,
      reminders_created: remindersCreated,
      clients_checked: clients.length
    });

  } catch (error) {
    console.error('Error in contractRenewalReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});