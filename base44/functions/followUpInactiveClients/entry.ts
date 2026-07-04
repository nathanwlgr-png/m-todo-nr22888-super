import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — use service role
    const clients = await base44.asServiceRole.entities.Client.list();
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);

    let emailsSent = 0;
    const errors = [];

    for (const client of clients) {
      if (!client.email) continue;

      const lastContact = client.last_contact_follow_up_date
        ? new Date(client.last_contact_follow_up_date)
        : client.last_contact_date
        ? new Date(client.last_contact_date)
        : null;

      // Skip if contacted recently
      if (lastContact && lastContact >= cutoff) continue;

      // Skip if pipeline is closed/lost
      if (client.pipeline_stage === 'fechado' || client.pipeline_stage === 'perdido') continue;

      const firstName = client.first_name || client.full_name || 'Cliente';
      const clinicName = client.clinic_name || '';
      const daysSinceContact = lastContact
        ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24))
        : 'muitos';

      const subject = `Olá ${firstName}, temos novidades para você! 🐾`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Olá, ${firstName}! 👋</h2>
          ${clinicName ? `<p>Esperamos que tudo esteja ótimo na <strong>${clinicName}</strong>!</p>` : ''}
          <p>Já faz um tempo que não nos falamos e gostaríamos de saber como você está e se podemos ajudar em algo.</p>
          <p>Na <strong>SEAMATY Brasil</strong>, temos novidades e soluções que podem agregar muito valor ao seu laboratório veterinário:</p>
          <ul>
            <li>🔬 Novos rotores bioquímicos com maior precisão</li>
            <li>💡 Cassetes de imunofluorescência atualizados</li>
            <li>📊 Analisadores com melhor custo-benefício</li>
          </ul>
          <p>Podemos marcar uma conversa rápida para atualizar você sobre as melhores opções para o seu perfil?</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://wa.me/5514991676428" style="background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              💬 Falar no WhatsApp
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Até breve!<br><strong>Equipe SEAMATY Brasil</strong></p>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject,
        body,
        from_name: 'SEAMATY Brasil'
      });

      // Update last_contact_follow_up_date
      await base44.asServiceRole.entities.Client.update(client.id, {
        last_contact_follow_up_date: now.toISOString().split('T')[0]
      });

      emailsSent++;
    }

    return Response.json({
      success: true,
      emails_sent: emailsSent,
      errors
    });

  } catch (error) {
    console.error('Error in followUpInactiveClients:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});