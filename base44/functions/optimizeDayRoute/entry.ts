import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { date, start_location, notify_phone, mode = 'optimize' } = await req.json();

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Buscar visitas do dia
    const allVisits = await base44.entities.Visit.list('-scheduled_date', 500);
    const dayVisits = allVisits.filter(v => {
      const vDate = new Date(v.scheduled_date).toISOString().split('T')[0];
      return vDate === targetDate && v.status === 'agendada';
    });

    if (dayVisits.length === 0) {
      // Buscar tarefas do dia como fallback
      const allTasks = await base44.entities.Task.list('-due_date', 500);
      const dayTasks = allTasks.filter(t => t.due_date === targetDate && t.status === 'pendente' && t.type === 'visita');

      if (dayTasks.length === 0) {
        return Response.json({ success: true, visits: [], message: 'Nenhuma visita agendada para este dia', optimized_route: [] });
      }

      // Converter tarefas em formato de visita
      const taskVisits = dayTasks.map(t => ({
        id: t.id,
        client_id: t.client_id,
        client_name: t.client_name,
        location: t.description?.match(/Endereço: (.+)/)?.[1] || '',
        status: 'pendente',
        type: 'task',
        priority: t.priority === 'alta' ? 3 : t.priority === 'media' ? 2 : 1,
      }));

      return Response.json({ success: true, visits: taskVisits, optimized_route: taskVisits, from_tasks: true });
    }

    // Buscar dados dos clientes para endereços
    const clientIds = [...new Set(dayVisits.map(v => v.client_id).filter(Boolean))];
    const allClients = await base44.asServiceRole.entities.Client.list('-updated_date', 10000);
    const clientMap = {};
    allClients.forEach(c => { clientMap[c.id] = c; });

    // Enriquecer visitas com dados de clientes
    const enrichedVisits = dayVisits.map(v => {
      const client = clientMap[v.client_id] || {};
      return {
        id: v.id,
        client_id: v.client_id,
        client_name: v.client_name,
        clinic_name: client.clinic_name || '',
        location: v.location || client.address || '',
        city: client.city || '',
        phone: client.phone || '',
        scheduled_time: new Date(v.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        visit_type: v.visit_type || 'followup',
        status: v.status,
        notes: v.notes || '',
        purchase_score: client.purchase_score || 50,
        client_status: client.status || 'morno',
        lat: null,
        lng: null,
      };
    });

    // Usar IA para otimizar a ordem da rota
    const prompt = `Você é um especialista em otimização de rotas comerciais para vendedores veterinários no Brasil.

Contexto:
- Data: ${targetDate}
- Ponto de partida: ${start_location || 'Marília, SP'}
- Visitas do dia: ${JSON.stringify(enrichedVisits.map(v => ({ nome: v.client_name, clinica: v.clinic_name, cidade: v.city, endereco: v.location, score: v.purchase_score, status_cliente: v.client_status })))}

Tarefas:
1. Ordene as visitas para minimizar deslocamento (agrupe por região/bairro quando possível)
2. Considere a prioridade de cada cliente (score alto = visitar mais cedo)
3. Estime tempo entre cada visita
4. Sugira horário ideal para cada visita (começar às 8h, almoço 12h-13h, terminar até 18h)
5. Calcule economia estimada de km vs ordem aleatória

Retorne JSON com:
{
  "optimized_order": [índices 0-based na ordem otimizada],
  "visit_times": ["08:00", "09:30", ...],
  "estimated_km": número,
  "estimated_km_saved": número,
  "estimated_fuel_saved_liters": número,
  "total_drive_minutes": número,
  "route_summary": "resumo em 1 linha",
  "whatsapp_message": "mensagem completa para WhatsApp com a rota otimizada (use emojis, formatação WhatsApp com *negrito*)"
}`;

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          optimized_order: { type: 'array', items: { type: 'number' } },
          visit_times: { type: 'array', items: { type: 'string' } },
          estimated_km: { type: 'number' },
          estimated_km_saved: { type: 'number' },
          estimated_fuel_saved_liters: { type: 'number' },
          total_drive_minutes: { type: 'number' },
          route_summary: { type: 'string' },
          whatsapp_message: { type: 'string' },
        }
      }
    });

    // Montar rota otimizada
    const order = aiResult.optimized_order || enrichedVisits.map((_, i) => i);
    const times = aiResult.visit_times || [];

    const optimizedRoute = order.map((idx, pos) => ({
      ...enrichedVisits[idx],
      optimized_position: pos + 1,
      suggested_time: times[pos] || '',
    }));

    // Enviar notificação WhatsApp se solicitado
    let whatsappSent = false;
    if (notify_phone && aiResult.whatsapp_message) {
      try {
        await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `placeholder — não usado`
        });
        // Enviar via função existente
        const waRes = await fetch(`${req.url.split('/functions/')[0]}/functions/sendWhatsAppMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
          body: JSON.stringify({ phone: notify_phone, message: aiResult.whatsapp_message })
        });
        whatsappSent = waRes.ok;
      } catch (e) {
        console.error('Erro ao enviar WhatsApp:', e.message);
      }
    }

    return Response.json({
      success: true,
      date: targetDate,
      total_visits: enrichedVisits.length,
      optimized_route: optimizedRoute,
      stats: {
        estimated_km: aiResult.estimated_km || 0,
        estimated_km_saved: aiResult.estimated_km_saved || 0,
        estimated_fuel_saved_liters: aiResult.estimated_fuel_saved_liters || 0,
        total_drive_minutes: aiResult.total_drive_minutes || 0,
        route_summary: aiResult.route_summary || '',
      },
      whatsapp_message: aiResult.whatsapp_message || '',
      whatsapp_sent: whatsappSent,
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});