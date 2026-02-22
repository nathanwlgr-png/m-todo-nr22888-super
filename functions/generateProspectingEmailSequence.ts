import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id } = body;

    // Fetch lead data
    const lead = await base44.entities.Lead.filter({ id: lead_id }).then(r => r[0]);
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em email marketing de prospecção B2B para equipamentos veterinários.

LEAD:
- Nome: ${lead.full_name}
- Empresa: ${lead.company}
- Email: ${lead.email}
- Tamanho: ${lead.company_size}
- Orçamento: ${lead.budget_range}
- Urgência: ${lead.urgency}
- Interesse: ${lead.interest}

Gere uma sequência de 5 emails de prospecção personalizados:

EMAIL 1 (Dia 0): Abertura - apresentação problema/solução
EMAIL 2 (Dia 3): Prova social - case similar + social proof
EMAIL 3 (Dia 7): Urgência - limite de oferta/benefício time-sensitive
EMAIL 4 (Dia 14): Objeção comum - endereçar dúvida principal
EMAIL 5 (Dia 21): CTA final - call-to-action direto

Para cada email:
- subject: Assunto atrativo (máx 60 caracteres)
- body: Corpo personalizado (com {{nome}}, etc)
- type: "abertura", "prova_social", "urgencia", "objecao", "cta"
- day: Dia de envio
- tips: 1 dica de otimização

Retorne JSON:
{
  "emails": [
    {"day": NUMBER, "type": "string", "subject": "string", "body": "string", "tips": "string"}
  ],
  "summary": "resumo da estratégia"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                type: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                tips: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error in generateProspectingEmailSequence:', error);
    return Response.json({
      emails: [],
      summary: 'Erro ao gerar sequência',
      error: error.message
    }, { status: 500 });
  }
});