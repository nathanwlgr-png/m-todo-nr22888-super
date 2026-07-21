import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getAutomationEmail, getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getOptionalUser(base44);
    if (isForbiddenManualUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { dry_run = false } = await req.json().catch(() => ({}));
    const notificationEmail = await getAutomationEmail(base44, user);

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
          if (!dry_run) {
            await base44.asServiceRole.entities.Alert.create({
              user_email: notificationEmail,
              title: `📅 Renovação de Contrato em ${daysUntilRenewal} dias`,
              message: `Contrato de ${client.clinic_name || client.first_name} vence em ${renewalDate.toLocaleDateString('pt-BR')}. Revise o rascunho antes de qualquer contato.`,
              type: 'task_overdue',
              priority: daysUntilRenewal <= 7 ? 'alta' : 'media',
              link_to: `ClientProfile?id=${client.id}`,
              read: false,
              dismissed: false
            });

            if (client.email) {
              const firstName = client.first_name || client.full_name || 'Cliente';
              const subject = `Renovação de contrato em ${daysUntilRenewal} dias — SEAMATY Brasil`;
              const message = `Olá, ${firstName}. Seu contrato com a SEAMATY Brasil vence em ${daysUntilRenewal} dias (${renewalDate.toLocaleDateString('pt-BR')}). Podemos conversar para revisar a continuidade e as condições vigentes?`;
              await base44.asServiceRole.entities.PendingMessage.create({
                canal: 'email',
                channel: 'email',
                destinatario_nome: firstName,
                destinatario_contato: client.email,
                cliente_id: client.id,
                contexto: 'renovacao_contrato',
                context: 'Renovação de contrato — revisão humana obrigatória',
                mensagem: message,
                message_content: message,
                email_subject: subject,
                status: 'aguardando_aprovacao',
                criado_por_agente: 'contractRenewalReminders',
                aprovado_por_nathan: false,
                data_criacao: now.toISOString(),
                priority: daysUntilRenewal <= 7 ? 'alta' : 'media',
                recipient_id: client.id,
                recipient_name: firstName
              });
            }
          }

          remindersCreated++;
          break; // Only one reminder per threshold per client per day
        }
      }
    }

    return Response.json({
      success: true,
      reminders_created: remindersCreated,
      clients_checked: clients.length,
      dry_run,
      external_messages_sent: 0
    });

  } catch (error) {
    console.error('Error in contractRenewalReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});