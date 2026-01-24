import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Buscar dados do cliente
    const clients = await base44.entities.Client.filter({ id: client_id });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar histórico de vendas, interações e equipamentos
    const sales = await base44.entities.Sale.filter({ client_id });
    const interactions = await base44.entities.Interaction.filter({ client_id });
    const equipments = await base44.entities.Equipment.list();
    const consumables = await base44.entities.Consumable.list();

    // Preparar contexto para IA
    const context = `
DADOS DO CLIENTE:
- Nome: ${client.first_name} ${client.full_name || ''}
- Clínica: ${client.clinic_name || 'N/A'}
- Tipo: ${client.client_type || 'N/A'}
- Volume Mensal: ${client.current_volume || 'N/A'}
- Equipamento Atual: ${client.current_equipment || 'N/A'}
- Equipamento de Interesse: ${client.equipment_interest || 'N/A'}
- Orçamento Disponível: R$ ${client.available_budget || 0}
- Pipeline Stage: ${client.pipeline_stage || 'N/A'}
- Status: ${client.status || 'N/A'}

HISTÓRICO DE COMPRAS:
${sales.length > 0 ? sales.map(s => `- ${s.equipment_name}: R$ ${s.sale_value} (${s.sale_date})`).join('\n') : 'Nenhuma compra anterior'}

HISTÓRICO DE INTERAÇÕES:
- Total de Interações: ${interactions.length}
- Última Interação: ${interactions[0]?.created_date || 'N/A'}
- Tipos: ${interactions.slice(0, 5).map(i => i.type).join(', ')}

EQUIPAMENTOS DISPONÍVEIS:
${equipments.slice(0, 10).map(e => `- ${e.name} (${e.category}): R$ ${e.price}`).join('\n')}

INSUMOS DISPONÍVEIS:
${consumables.slice(0, 10).map(c => `- ${c.name} (${c.category}): R$ ${c.unit_price}`).join('\n')}

NECESSIDADES DE LABORATÓRIO:
${client.lab_needs?.join(', ') || 'N/A'}
`;

    // Chamar IA para gerar análise avançada
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é PRIMORI, especialista em inteligência de vendas veterinárias.

${context}

Analise profundamente este cliente e gere:

1. TAXA DE ADOÇÃO DE PRODUTOS (0-100): Probabilidade de adotar novos produtos baseado em perfil e comportamento
2. LIFETIME VALUE (LTV):
   - LTV 12 meses: Receita estimada em 1 ano
   - LTV 24 meses: Receita estimada em 2 anos
   - LTV 36 meses: Receita estimada em 3 anos
3. OPORTUNIDADES DE CROSS-SELL (até 5): Produtos complementares que o cliente pode comprar
4. OPORTUNIDADES DE UPSELL (até 5): Upgrades ou produtos de maior valor
5. PREVISÃO DE PRÓXIMA COMPRA: Categoria, data estimada, probabilidade e valor

Para cada oportunidade, inclua:
- Produto específico
- Probabilidade (0-100)
- Valor esperado (R$)
- Timing ideal (imediato, 1-3 meses, 3-6 meses, 6-12 meses)
- Razão detalhada

Seja preciso, baseado em dados e comportamento real do cliente.`,
      response_json_schema: {
        type: "object",
        properties: {
          product_adoption_rate: { type: "number" },
          adoption_reasoning: { type: "string" },
          ltv_12_months: { type: "number" },
          ltv_24_months: { type: "number" },
          ltv_36_months: { type: "number" },
          ltv_breakdown: { type: "string" },
          cross_sell_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          upsell_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          next_purchase_prediction: {
            type: "object",
            properties: {
              product_category: { type: "string" },
              estimated_date: { type: "string" },
              probability: { type: "number" },
              estimated_value: { type: "number" }
            }
          }
        }
      }
    });

    // Atualizar cliente com nova inteligência
    const updatedIntelligence = {
      ...(client.ai_sales_intelligence || {}),
      product_adoption_rate: aiAnalysis.product_adoption_rate,
      ltv_12_months: aiAnalysis.ltv_12_months,
      ltv_24_months: aiAnalysis.ltv_24_months,
      ltv_36_months: aiAnalysis.ltv_36_months,
      cross_sell_opportunities: aiAnalysis.cross_sell_opportunities,
      upsell_opportunities: aiAnalysis.upsell_opportunities,
      next_purchase_prediction: aiAnalysis.next_purchase_prediction,
      last_ai_analysis: new Date().toISOString()
    };

    await base44.entities.Client.update(client_id, {
      ai_sales_intelligence: updatedIntelligence,
      ltv_estimate: aiAnalysis.ltv_24_months
    });

    return Response.json({
      success: true,
      intelligence: updatedIntelligence,
      summary: {
        adoption_rate: aiAnalysis.product_adoption_rate,
        ltv_24m: aiAnalysis.ltv_24_months,
        cross_sell_count: aiAnalysis.cross_sell_opportunities.length,
        upsell_count: aiAnalysis.upsell_opportunities.length
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});