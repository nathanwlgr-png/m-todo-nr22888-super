import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MARILIA = { lat: -22.2171, lng: -49.9501 };
const toRad = (value) => value * Math.PI / 180;
const distanceKm = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(value));
};
const hasCoords = (item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)) && Number(item.latitude) !== 0 && Number(item.longitude) !== 0;
const normalizeCity = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { date, start_location, notify_phone, mode = 'optimize', max_stops = 8, radius_km = 120 } = await req.json();

    const targetDate = date || new Date().toISOString().split('T')[0];

    if (mode === 'suggest_nearby') {
      const [clients, leads] = await Promise.all([
        base44.asServiceRole.entities.Client.list('-purchase_score', 500),
        base44.asServiceRole.entities.Lead.list('-predictive_score', 500)
      ]);
      const origin = MARILIA;
      const candidates = [
        ...clients.map(item => ({ ...item, source_type: 'client', source_id: item.id, route_name: item.clinic_name || item.full_name || item.first_name || 'Cliente', commercial_score: Number(item.purchase_score || item.health_score || 0) })),
        ...leads.map(item => ({ ...item, source_type: 'lead', source_id: item.id, route_name: item.company || item.full_name || 'Lead', commercial_score: Number(item.predictive_score || item.conversion_probability || 0) }))
      ].filter(item => (hasCoords(item) || normalizeCity(item.city) === 'marilia') && (item.address || item.city));

      const ranked = candidates.map(item => {
        const distance = hasCoords(item) ? distanceKm(origin, { lat: Number(item.latitude), lng: Number(item.longitude) }) : 0;
        return { ...item, distance_from_marilia_km: distance, route_priority: item.commercial_score - distance * 0.15 };
      }).filter(item => item.distance_from_marilia_km <= Number(radius_km))
        .sort((a, b) => b.route_priority - a.route_priority)
        .slice(0, Math.max(2, Math.min(Number(max_stops), 12)));

      const ordered = [];
      const remaining = [...ranked];
      let current = origin;
      while (remaining.length) {
        remaining.sort((a, b) => {
          const distanceA = hasCoords(a) ? distanceKm(current, { lat: Number(a.latitude), lng: Number(a.longitude) }) : 0;
          const distanceB = hasCoords(b) ? distanceKm(current, { lat: Number(b.latitude), lng: Number(b.longitude) }) : 0;
          return distanceA - distanceB || b.commercial_score - a.commercial_score;
        });
        const next = remaining.shift();
        ordered.push(next);
        if (hasCoords(next)) current = { lat: Number(next.latitude), lng: Number(next.longitude) };
      }

      let totalDistance = 0;
      current = origin;
      ordered.forEach(item => {
        if (hasCoords(item)) {
          const point = { lat: Number(item.latitude), lng: Number(item.longitude) };
          totalDistance += distanceKm(current, point);
          current = point;
        }
      });
      if (ordered.length && hasCoords(ordered[ordered.length - 1])) totalDistance += distanceKm(current, origin);

      const optimizedRoute = ordered.map((item, index) => ({
        id: item.source_id,
        client_id: item.source_id,
        client_name: item.route_name,
        full_name: item.full_name || '',
        clinic_name: item.clinic_name || item.company || '',
        location: [item.address, item.city].filter(Boolean).join(', '),
        city: item.city || '',
        phone: item.phone || '',
        client_status: item.status || item.stage || 'morno',
        purchase_score: item.commercial_score,
        source_type: item.source_type,
        visit_type: item.source_type === 'lead' ? 'Lead' : 'Cliente',
        optimized_position: index + 1,
        suggested_time: `${String(8 + Math.floor(index * 90 / 60)).padStart(2, '0')}:${String((index * 90) % 60).padStart(2, '0')}`,
        distance_from_marilia_km: Number(item.distance_from_marilia_km.toFixed(1))
      }));
      const routePoints = ordered.map(item => hasCoords(item) ? `${item.latitude},${item.longitude}` : [item.address, item.city].filter(Boolean).join(', '));
      const destination = encodeURIComponent(routePoints[routePoints.length - 1] || 'Marília, SP');
      const waypoints = routePoints.slice(0, -1).map(encodeURIComponent).join('|');
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent('Marília, SP')}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

      return Response.json({
        success: true,
        date: targetDate,
        total_visits: optimizedRoute.length,
        optimized_route: optimizedRoute,
        stats: {
          estimated_km: Number(totalDistance.toFixed(1)),
          estimated_km_saved: 0,
          estimated_fuel_saved_liters: Number((totalDistance / 10).toFixed(1)),
          total_drive_minutes: Math.round(totalDistance / 60 * 60),
          route_summary: `Rota sugerida partindo de Marília com ${optimizedRoute.length} clientes e leads em até ${radius_km} km.`
        },
        google_maps_url: googleMapsUrl,
        message: optimizedRoute.length ? 'Melhor rota sugerida com clientes e leads próximos.' : 'Nenhum cliente ou lead com localização válida foi encontrado próximo de Marília.'
      });
    }

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

    // Notificação solicitada vira rascunho pendente; nenhum envio é realizado.
    let pendingMessageId = null;
    if (notify_phone && aiResult.whatsapp_message) {
      const draft = await base44.entities.PendingMessage.create({
        canal: 'whatsapp', channel: 'whatsapp', destinatario_nome: 'Rota do dia',
        destinatario_contato: String(notify_phone).replace(/\D/g, ''),
        contexto: `rota_${targetDate}`, mensagem: aiResult.whatsapp_message,
        message_content: aiResult.whatsapp_message, status: 'aguardando_aprovacao',
        criado_por_agente: 'optimizeDayRoute', aprovado_por_nathan: false,
        data_criacao: new Date().toISOString(), priority: 'media'
      });
      pendingMessageId = draft.id;
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
      whatsapp_sent: false,
      pending_message_id: pendingMessageId,
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});