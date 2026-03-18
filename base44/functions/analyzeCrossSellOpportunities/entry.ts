import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { client_data, sales } = body;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas consultivas para equipamentos veterinários (Seamaty).

CLIENTE:
${JSON.stringify(client_data, null, 2)}

HISTÓRICO DE VENDAS:
${JSON.stringify(sales, null, 2)}

PRODUTOS SEAMATY:
- VBC-50A: Hematológico (>40 hemogramas/mês)
- SMT-120VP: Bioquímico automático (>30 bioquímicos/mês)
- QT3: Bioquímico individual/portátil (entry point)
- VG1: Gasometria portátil (UTI/cirurgia)
- VG2: Gasometria + Imunofluorescência
- Vi1: Imunofluorescência
- VQ1: PCR quantitativo

Analise e sugira:

1. **UPSELL** (expansão do equipamento atual):
   - Qual é o próximo equipamento lógico a vender?
   - Por que faria sentido para este cliente?
   - Qual é a probabilidade de sucesso (0-100%)?
   - Valor esperado estimado

2. **CROSS-SELL** (produtos complementares):
   - Quais produtos complementam o que já possui?
   - Qual é a necessidade específica?
   - Probabilidade de sucesso
   - Valor esperado

3. **RESUMO**: Uma frase sobre a estratégia ideal

Retorne JSON:
{
  "upsell": [
    {"product": "string", "reason": "string", "probability": NUMBER, "expected_value": NUMBER}
  ],
  "crosssell": [
    {"product": "string", "reason": "string", "probability": NUMBER, "expected_value": NUMBER}
  ],
  "summary": "string"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          upsell: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                reason: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" }
              }
            }
          },
          crosssell: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                reason: { type: "string" },
                probability: { type: "number" },
                expected_value: { type: "number" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error in analyzeCrossSellOpportunities:', error);
    return Response.json({
      upsell: [],
      crosssell: [],
      summary: 'Análise não disponível',
      error: error.message
    }, { status: 500 });
  }
});