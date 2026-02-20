// FUNÇÃO EXTRA: Envio direto de mensagem WhatsApp com link clicável - sem depender de API externa
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone, message, action } = await req.json();
    const targetPhone = (phone || '5514991676428').replace(/\D/g, '');

    let finalMessage = message || '';

    // Se não tem mensagem mas tem action, gerar conteúdo
    if (!finalMessage && action) {
      const [clients, tasks, sales] = await Promise.all([
        base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []),
        base44.asServiceRole.entities.Task.filter({ status: 'pendente' }).catch(() => []),
        base44.asServiceRole.entities.Sale.list('-sale_date', 30).catch(() => []),
      ]);

      const hot = clients.filter(c => c.status === 'quente').length;
      const thisMonth = sales.filter(s => s.sale_date?.startsWith(new Date().toISOString().slice(0, 7)));
      const revenue = thisMonth.reduce((s, v) => s + (v.sale_value || 0), 0);

      finalMessage = `🤖 *CRM NR22 - ${action.toUpperCase()}*\n\n`;
      finalMessage += `📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
      finalMessage += `━━━━━━━━━━━━━━━━━━━\n`;
      finalMessage += `👥 *Total Clientes:* ${clients.length}\n`;
      finalMessage += `🔥 *Clientes Quentes:* ${hot}\n`;
      finalMessage += `✅ *Tarefas Pendentes:* ${tasks.length}\n`;
      finalMessage += `💰 *Receita Mensal:* R$ ${revenue.toLocaleString('pt-BR')}\n`;
      finalMessage += `━━━━━━━━━━━━━━━━━━━\n\n`;
      finalMessage += `_CRM NR22 - Sistema Primori Ativo ✅_`;
    }

    if (!finalMessage) {
      finalMessage = `✅ *CRM NR22 - TESTE DE CONEXÃO*\n\nSistema funcionando perfeitamente!\n\n🤖 Assistente Primori: ONLINE\n📊 CRM: CONECTADO\n💬 WhatsApp: INTEGRADO\n\n_${new Date().toLocaleString('pt-BR')}_`;
    }

    // Gerar link WhatsApp
    const encodedMsg = encodeURIComponent(finalMessage);
    const whatsappLink = `https://wa.me/${targetPhone}?text=${encodedMsg}`;

    // Salvar log
    await base44.asServiceRole.entities.WhatsAppMessage.create({
      contact_id: 'system',
      contact_name: 'Nathan - NR22',
      contact_phone: targetPhone,
      direction: 'sent',
      message: finalMessage,
      status: 'sent',
      sent_by: user.email,
      sent_by_name: user.full_name || 'Sistema',
      automated: true,
    }).catch(() => {});

    return Response.json({
      success: true,
      whatsapp_link: whatsappLink,
      message_text: finalMessage,
      phone: targetPhone,
      instruction: 'Clique no whatsapp_link para abrir e enviar a mensagem',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});