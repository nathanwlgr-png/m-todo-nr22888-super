import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id } = await req.json();
    if (!client_id) return Response.json({ error: 'client_id obrigatório' }, { status: 400 });

    // Fetch all relevant data in parallel
    const [clients, equipments, consumables, sales] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Equipment.list(),
      base44.asServiceRole.entities.Consumable.list(),
      base44.asServiceRole.entities.Sale.filter({ client_id }),
    ]);

    const client = clients.find(c => c.id === client_id);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const purchasedEquipments = sales.map(s => s.equipment_name).filter(Boolean);
    const activeEquipments = equipments.filter(e => e.is_active);
    const activeConsumables = consumables.filter(c => c.is_active);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas de equipamentos veterinários da SEAMATY/CMAT Brasil, usando o Método NR22.

DADOS DO CLIENTE:
Nome: ${client.first_name} | Clínica: ${client.clinic_name || 'N/A'} | Cidade: ${client.city || 'N/A'}
Tipo: ${client.client_type || 'N/A'} | Porte: ${client.company_size || 'N/A'}
Volume Exames: ${client.current_volume || 'N/A'}
Equip Atual: ${client.current_equipment || 'N/A'}
Equip Comprados: ${purchasedEquipments.join(', ') || 'Nenhum ainda'}
Interesse Declarado: ${client.equipment_interest || 'N/A'}
Necessidades Lab: ${client.lab_needs?.join(', ') || 'N/A'}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Status: ${client.status} | Score: ${client.purchase_score || 0}%
Orçamento: R$${client.available_budget || 'N/A'}
Numerologia: ${client.numerology_number || 'N/A'} | Perfil: ${client.behavioral_profile || 'N/A'}

EQUIPAMENTOS DISPONÍVEIS:
${activeEquipments.map(e => `- ${e.name}: R$${e.price} | ${e.category} | ROI: ${e.roi_months || 'N/A'}m | Benefícios: ${e.key_benefits || 'N/A'}`).join('\n')}

CONSUMÍVEIS DISPONÍVEIS:
${activeConsumables.slice(0, 20).map(c => `- ${c.name}: R$${c.unit_price}/${c.unit_type} | ${c.category}`).join('\n')}

MISSÃO:
1. Analise o perfil completo do cliente
2. Recomende os 3 MELHORES equipamentos em ordem de prioridade
3. Para cada equipamento: explique o porquê adaptado ao perfil, calcule o ROI específico para o volume deste cliente, e dê o script de abordagem ideal (adaptado ao numerológico ${client.numerology_number})
4. Recomende 3-5 consumíveis complementares
5. Sugira a melhor sequência/estratégia de venda (o que oferecer primeiro, depois)
6. Identifique o gatilho Cialdini mais efetivo para este perfil`,
      response_json_schema: {
        type: "object",
        properties: {
          equipment_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                equipment_name: { type: "string" },
                priority: { type: "number" },
                why_ideal: { type: "string" },
                roi_calculation: { type: "string" },
                approach_script: { type: "string" },
                best_trigger: { type: "string" },
                probability_of_sale: { type: "number" }
              }
            }
          },
          consumable_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                consumable_name: { type: "string" },
                reason: { type: "string" },
                monthly_value: { type: "number" }
              }
            }
          },
          sales_sequence: { type: "string" },
          main_trigger: { type: "string" },
          summary_insight: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, recommendations: result, client_name: client.first_name });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});