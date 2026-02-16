import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    // Buscar cliente
    const client = await base44.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar histórico de interações
    const interactions = await base44.entities.Interaction?.filter({ client_id }).catch(() => []);
    const visits = await base44.entities.Visit?.filter({ client_id }).catch(() => []);
    const sales = await base44.entities.Sale?.filter({ client_id }).catch(() => []);
    
    // Buscar produtos disponíveis
    const allEquipment = await base44.entities.Equipment?.list().catch(() => []);
    const allConsumables = await base44.entities.Consumable?.list().catch(() => []);

    // ===== ANÁLISE DE CHURN PREDITIVA =====
    const churnPrompt = `Analise o risco de CHURN (perda do cliente) baseado nos dados:

**CLIENTE:**
- Nome: ${client.first_name}
- Empresa: ${client.clinic_name || 'N/A'}
- Status atual: ${client.status}
- Equipamento atual: ${client.current_equipment || 'Nenhum'}
- Último contato: ${client.last_contact_date || 'Desconhecido'}
- Health Score: ${client.health_score || 'N/A'}

**HISTÓRICO:**
- Total de interações: ${interactions.length}
- Total de visitas: ${visits.length}
- Total de vendas: ${sales.length}
- Última interação: ${interactions[0]?.created_date || 'Nenhuma'}

**ANÁLISE NECESSÁRIA:**
1. Churn Risk Score (0-100) - quanto maior, maior o risco
2. Principais fatores de risco (lista de strings)
3. Sinais de alerta detectados
4. Ações imediatas recomendadas para retenção
5. Prazo estimado para ação (dias)

Retorne JSON estruturado.`;

    const churnAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: churnPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          churn_risk_score: { type: "number" },
          risk_factors: { type: "array", items: { type: "string" } },
          warning_signals: { type: "array", items: { type: "string" } },
          retention_actions: { type: "array", items: { type: "string" } },
          action_deadline_days: { type: "number" }
        }
      }
    });

    // ===== OPORTUNIDADES DE UPSELL =====
    const upsellPrompt = `Identifique oportunidades de UPSELL (upgrade de produto) para este cliente:

**CLIENTE:**
- Equipamento atual: ${client.current_equipment || 'Nenhum'}
- Volume mensal: ${client.current_volume || 'Desconhecido'}
- Orçamento: ${client.available_budget || 'N/A'}
- Necessidades laboratoriais: ${client.lab_needs?.join(', ') || 'N/A'}

**EQUIPAMENTOS DISPONÍVEIS:**
${allEquipment.slice(0, 10).map(e => `- ${e.name} (${e.category}) - R$ ${e.price}`).join('\n')}

**ANÁLISE:**
Identifique TOP 3 oportunidades de upsell. Para cada uma:
1. Produto recomendado
2. Probabilidade de aceitação (0-100)
3. Valor estimado da venda
4. Timing ideal (imediato, 1-3 meses, 3-6 meses, 6+ meses)
5. Razão da recomendação (por que é um bom fit)
6. Pitch sugerido (1-2 frases)

Retorne apenas oportunidades com probabilidade >= 40%.`;

    const upsellAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: upsellPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" },
                pitch: { type: "string" }
              }
            }
          }
        }
      }
    });

    // ===== OPORTUNIDADES DE CROSS-SELL =====
    const crossSellPrompt = `Identifique oportunidades de CROSS-SELL (produtos complementares) para este cliente:

**CLIENTE:**
- Equipamento atual: ${client.current_equipment || 'Nenhum'}
- Histórico de compras: ${sales.map(s => s.equipment_sold).join(', ') || 'Nenhum'}
- Necessidades: ${client.lab_needs?.join(', ') || 'N/A'}

**CONSUMÍVEIS E COMPLEMENTOS DISPONÍVEIS:**
${allConsumables.slice(0, 15).map(c => `- ${c.name} (${c.category}) - R$ ${c.price}`).join('\n')}

**EQUIPAMENTOS COMPLEMENTARES:**
${allEquipment.filter(e => e.category !== client.current_equipment).slice(0, 5).map(e => `- ${e.name}`).join('\n')}

**ANÁLISE:**
Identifique TOP 3 produtos complementares. Para cada um:
1. Produto
2. Probabilidade (0-100)
3. Valor estimado
4. Timing
5. Razão (por que complementa o que já tem)
6. Pitch

Apenas oportunidades com probabilidade >= 40%.`;

    const crossSellAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: crossSellPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" },
                timing: { type: "string" },
                reason: { type: "string" },
                pitch: { type: "string" }
              }
            }
          }
        }
      }
    });

    // ===== PREVISÃO DE PRÓXIMA COMPRA =====
    const nextPurchasePrompt = `Baseado no histórico, preveja a PRÓXIMA COMPRA deste cliente:

**HISTÓRICO DE VENDAS:**
${sales.map(s => `- ${s.equipment_sold} em ${s.created_date}`).join('\n') || 'Nenhuma venda registrada'}

**PADRÕES:**
- Frequência de compras: ${sales.length} vendas
- Ticket médio: R$ ${sales.length > 0 ? (sales.reduce((sum, s) => sum + (s.value || 0), 0) / sales.length).toFixed(2) : '0'}
- Última compra: ${sales[0]?.created_date || 'Nunca'}

Preveja:
1. Categoria do produto (equipamento, consumível, serviço)
2. Data estimada da próxima compra
3. Probabilidade (0-100)
4. Valor estimado`;

    const nextPurchase = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: nextPurchasePrompt,
      response_json_schema: {
        type: "object",
        properties: {
          product_category: { type: "string" },
          estimated_date: { type: "string" },
          probability: { type: "number" },
          estimated_value: { type: "number" }
        }
      }
    });

    // ===== LIFETIME VALUE PREDICTION =====
    const totalRevenue = sales.reduce((sum, s) => sum + (s.value || 0), 0);
    const avgSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;
    
    // LTV simples: valor médio × frequência estimada × tempo
    const ltv_12_months = avgSaleValue * (sales.length > 0 ? Math.min(sales.length * 2, 4) : 1);
    const ltv_24_months = ltv_12_months * 1.8;
    const ltv_36_months = ltv_12_months * 2.5;

    // ===== ATUALIZAR CLIENTE COM ANÁLISE IA =====
    const updatedClient = await base44.asServiceRole.entities.Client.update(client_id, {
      ai_sales_intelligence: {
        conversion_probability: 100 - churnAnalysis.churn_risk_score,
        churn_risk: churnAnalysis.churn_risk_score,
        best_approach: churnAnalysis.retention_actions[0] || 'Manter contato regular',
        optimal_contact_time: 'manhã',
        key_triggers: churnAnalysis.warning_signals || [],
        predicted_objections: churnAnalysis.risk_factors || [],
        recommended_content: [],
        last_ai_analysis: new Date().toISOString(),
        product_adoption_rate: Math.max(0, 100 - churnAnalysis.churn_risk_score),
        ltv_12_months,
        ltv_24_months,
        ltv_36_months,
        cross_sell_opportunities: crossSellAnalysis.opportunities || [],
        upsell_opportunities: upsellAnalysis.opportunities || [],
        next_purchase_prediction: nextPurchase
      }
    });

    return Response.json({
      success: true,
      churn_analysis: churnAnalysis,
      upsell_opportunities: upsellAnalysis.opportunities || [],
      cross_sell_opportunities: crossSellAnalysis.opportunities || [],
      next_purchase_prediction: nextPurchase,
      lifetime_value: {
        ltv_12_months,
        ltv_24_months,
        ltv_36_months
      },
      client_updated: true
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});