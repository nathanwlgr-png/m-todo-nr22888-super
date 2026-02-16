import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todos os clientes e dados relacionados
    const clients = await base44.entities.Client.list();
    const sales = await base44.entities.Sale.list();
    const interactions = await base44.entities.Interaction.list();
    const documents = await base44.entities.DocumentEngagement?.list().catch(() => []);

    // Preparar dados para análise IA
    const clientsData = clients.map(client => {
      const clientSales = sales.filter(s => s.client_id === client.id);
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      const clientDocs = documents.filter(d => d.client_id === client.id);

      return {
        id: client.id,
        name: client.full_name,
        status: client.status,
        pipeline_stage: client.pipeline_stage,
        
        // Histórico de compras
        total_purchases: clientSales.length,
        total_revenue: clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        last_purchase: clientSales[0]?.sale_date,
        avg_ticket: clientSales.length > 0 ? clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / clientSales.length : 0,
        
        // Engajamento
        total_interactions: clientInteractions.length,
        last_interaction: clientInteractions[0]?.created_date,
        engagement_score: client.engagement_score || 0,
        documents_viewed: clientDocs.reduce((sum, d) => sum + (d.views_count || 0), 0),
        
        // Comportamental
        numerology: client.numerology_number,
        behavioral_profile: client.behavioral_profile,
        response_time: calculateAvgResponseTime(clientInteractions),
        
        // Valor
        ltv: client.ltv_estimate || client.ai_sales_intelligence?.ltv_12_months || 0,
        churn_risk: client.ai_sales_intelligence?.churn_risk || 0,
        health_score: client.health_score || 0
      };
    });

    // Análise IA para segmentação
    const segmentationPrompt = `
Analise estes ${clientsData.length} clientes e segmente-os em grupos estratégicos.

DADOS DOS CLIENTES:
${JSON.stringify(clientsData.slice(0, 50), null, 2)}

CRITÉRIOS DE SEGMENTAÇÃO:
1. Histórico de Compras (frequência, valor, recência)
2. Nível de Engajamento (interações, documentos visualizados)
3. Padrões Comportamentais (perfil, responsividade)
4. Valor do Cliente (LTV, ticket médio)
5. Risco de Churn

CRIE 5-7 SEGMENTOS com:
- Nome descritivo
- Critérios específicos
- IDs dos clientes que se encaixam
- LTV médio do segmento
- Score médio de engajamento
- Nível de prioridade (vip/high/medium/low/at_risk)
- Ações recomendadas específicas

RETORNE EM JSON VÁLIDO.
    `;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: segmentationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                segment_name: { type: "string" },
                description: { type: "string" },
                criteria: { type: "object" },
                client_ids: { type: "array", items: { type: "string" } },
                avg_ltv: { type: "number" },
                avg_engagement_score: { type: "number" },
                priority_level: { type: "string" },
                recommended_actions: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Criar/atualizar segmentos
    const createdSegments = [];
    for (const segment of aiResponse.segments) {
      const created = await base44.entities.ClientSegment.create({
        segment_name: segment.segment_name,
        description: segment.description,
        criteria: segment.criteria,
        client_ids: segment.client_ids,
        client_count: segment.client_ids.length,
        avg_ltv: segment.avg_ltv,
        avg_engagement_score: segment.avg_engagement_score,
        priority_level: segment.priority_level,
        recommended_actions: segment.recommended_actions,
        last_ai_analysis: new Date().toISOString()
      });
      createdSegments.push(created);
    }

    return Response.json({
      success: true,
      segments_created: createdSegments.length,
      segments: createdSegments
    });

  } catch (error) {
    console.error('Segmentation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateAvgResponseTime(interactions) {
  const responses = interactions.filter(i => i.direction === 'outbound');
  if (responses.length === 0) return 0;
  
  let totalTime = 0;
  for (let i = 1; i < interactions.length; i++) {
    if (interactions[i].direction === 'outbound') {
      const timeDiff = new Date(interactions[i].created_date) - new Date(interactions[i-1].created_date);
      totalTime += timeDiff;
    }
  }
  
  return totalTime / responses.length / (1000 * 60 * 60); // horas
}