import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { stage_counts, total_leads } = body;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de vendas especializado em otimização de funil.

FUNIL ATUAL:
- Novo: ${stage_counts.novo}
- Em Contato: ${stage_counts.em_contato}
- Qualificado: ${stage_counts.qualificado}
- Negociação: ${stage_counts.negociacao}
- Convertido: ${stage_counts.convertido}
- Perdido: ${stage_counts.perdido}

Total: ${total_leads}

Analise este funil e:

1. **MÉTRICAS**:
   - Taxa de conversão geral (%)
   - Ciclo médio estimado em dias

2. **GARGALOS**: Identifique 2-3 pontos críticos:
   - Qual estágio tem maior abandono?
   - Por que os leads ficam presos?
   - Qual é a ação recomendada?

3. **OPORTUNIDADES**: Como acelerar o funil:
   - Quais estágios têm potencial de melhora?
   - Qual seria o impacto?

4. **CHART_DATA**: Estrutura para gráfico com count por stage

Retorne JSON:
{
  "conversion_rate": NUMBER,
  "avg_cycle_days": NUMBER,
  "bottlenecks": [
    {"stage": "string", "issue": "string", "action": "string"}
  ],
  "opportunities": [
    {"opportunity": "string", "impact": "string"}
  ],
  "chart_data": [
    {"stage": "string", "count": NUMBER}
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          conversion_rate: { type: "number" },
          avg_cycle_days: { type: "number" },
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stage: { type: "string" },
                issue: { type: "string" },
                action: { type: "string" }
              }
            }
          },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opportunity: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          chart_data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stage: { type: "string" },
                count: { type: "number" }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error in analyzeSalesFunnel:', error);
    return Response.json({
      conversion_rate: 0,
      avg_cycle_days: 0,
      bottlenecks: [],
      opportunities: [],
      chart_data: [],
      error: error.message
    }, { status: 500 });
  }
});