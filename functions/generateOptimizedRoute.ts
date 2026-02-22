import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_ids, start_location, max_visits_per_day = 6, date } = await req.json();

    // Buscar dados
    const clients = await base44.entities.Client.list();
    const visits = await base44.entities.Visit.list();
    const tasks = await base44.entities.Task.list();

    // Filtrar clientes selecionados ou usar critérios
    let targetClients = client_ids && client_ids.length > 0
      ? clients.filter(c => client_ids.includes(c.id))
      : clients.filter(c => 
          c.status === 'quente' || 
          (c.status === 'morno' && (c.purchase_score || 0) >= 60)
        );

    // Filtrar apenas clientes com cidade (endereço OU cep são opcionais)
    targetClients = targetClients.filter(c => c.city);

    if (targetClients.length === 0) {
      // Fallback: retorna clientes por score mesmo sem endereço completo
      const fallbackClients = clients.filter(c => c.city).slice(0, max_visits_per_day);
      if (fallbackClients.length === 0) {
        return Response.json({
          success: false,
          error: 'Nenhum cliente com cidade cadastrada encontrado. Preencha o campo "Cidade" nos clientes.',
          route: { daily_routes: [], optimization_summary: 'Sem clientes com localização', key_recommendations: ['Cadastre a cidade dos clientes no CRM'], alternative_route: '' }
        }, { status: 200 });
      }
      targetClients = fallbackClients;
    }

    // Verificar visitas já agendadas
    const scheduledVisits = visits.filter(v => 
      v.status === 'agendada' && 
      v.scheduled_date?.startsWith(date)
    );

    // Gerar rota otimizada com IA
    const routeData = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em otimização de rotas e logística de vendas.

PONTO DE PARTIDA: ${start_location || 'Não especificado'}
DATA: ${date}
MÁXIMO DE VISITAS: ${max_visits_per_day}

CLIENTES DISPONÍVEIS (${targetClients.length}):
${targetClients.map((c, idx) => `
${idx + 1}. ${c.first_name} - ${c.clinic_name || 'N/A'}
   Endereço: ${c.address || c.city}
   Cidade: ${c.city}
   CEP: ${c.cep || 'N/A'}
   Status: ${c.status} | Score: ${c.purchase_score}%
   Pipeline: ${c.pipeline_stage}
   Última visita: ${c.last_visit_date || 'Nunca'}
   Prioridade: ${c.priority_level || 5}/10
`).join('\n')}

VISITAS JÁ AGENDADAS HOJE:
${scheduledVisits.length > 0 ? scheduledVisits.map(v => `- ${v.client_name} às ${v.scheduled_date?.split('T')[1]?.substring(0,5)}`).join('\n') : 'Nenhuma'}

TAREFA:
Crie uma rota otimizada considerando:

1. **PRIORIZAÇÃO INTELIGENTE:**
   - Clientes quentes têm prioridade sobre mornos
   - Scores mais altos = maior prioridade
   - Clientes sem visita recente = aumentar prioridade
   - Pipeline avançado (negociação/proposta) = maior prioridade

2. **OTIMIZAÇÃO GEOGRÁFICA:**
   - Agrupar clientes próximos geograficamente
   - Minimizar tempo de deslocamento total
   - Considerar cidades próximas
   - Criar rota lógica (não zigue-zague)

3. **TIMING ESTRATÉGICO:**
   - Considerar visitas já agendadas
   - Horários ideais para cada tipo de cliente
   - Evitar sobrecarga em um único dia
   - Distribuir clientes críticos ao longo da semana

4. **EFICIÊNCIA OPERACIONAL:**
   - Tempo estimado por visita: 45-90 min
   - Tempo de deslocamento entre pontos
   - Janela de trabalho: 8h-18h
   - Pausas necessárias

Retorne JSON:
{
  "daily_routes": [
    {
      "day": "2026-01-24",
      "total_visits": número,
      "estimated_total_time_hours": horas estimadas,
      "estimated_distance_km": distância total,
      "visits": [
        {
          "order": 1,
          "client_id": "id",
          "client_name": "nome",
          "clinic_name": "clínica",
          "address": "endereço completo",
          "city": "cidade",
          "priority_score": 0-100,
          "suggested_time": "HH:MM",
          "duration_minutes": 60,
          "visit_objective": "objetivo sugerido",
          "preparation_notes": "notas de preparação",
          "distance_from_previous_km": distância do anterior,
          "travel_time_minutes": tempo de viagem
        }
      ]
    }
  ],
  "optimization_summary": "resumo da otimização (2-3 linhas)",
  "key_recommendations": ["recomendação 1", "recomendação 2"],
  "alternative_route": "sugestão de rota alternativa se aplicável"
}

Seja ESTRATÉGICO e PRÁTICO. Use lógica de otimização real.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          daily_routes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                total_visits: { type: "number" },
                estimated_total_time_hours: { type: "number" },
                estimated_distance_km: { type: "number" },
                visits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      order: { type: "number" },
                      client_id: { type: "string" },
                      client_name: { type: "string" },
                      clinic_name: { type: "string" },
                      address: { type: "string" },
                      city: { type: "string" },
                      priority_score: { type: "number" },
                      suggested_time: { type: "string" },
                      duration_minutes: { type: "number" },
                      visit_objective: { type: "string" },
                      preparation_notes: { type: "string" },
                      distance_from_previous_km: { type: "number" },
                      travel_time_minutes: { type: "number" }
                    }
                  }
                }
              }
            }
          },
          optimization_summary: { type: "string" },
          key_recommendations: { type: "array", items: { type: "string" } },
          alternative_route: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      route: routeData
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});