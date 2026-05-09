import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lead_id } = await req.json();
    if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

    // Buscar lead
    const lead = await base44.asServiceRole.entities.LeadHunter.get(lead_id);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Log auditoria
    const startTime = Date.now();

    // IA Analysis via LLM
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas B2B para equipamentos veterinários (hematologia, bioquímica, hemogasometria).

EMPRESA: ${lead.company_name}
Segmento: ${lead.segment}
Cidade: ${lead.city}/${lead.state}
Website: ${lead.website || 'N/A'}
Instagram: ${lead.instagram || 'N/A'}
Rating Google: ${lead.google_rating}/5 (${lead.google_reviews_count} reviews)

SINAIS DETECTADOS:
${lead.signals?.map(s => `- ${s.type}: ${s.evidence}`).join('\n') || 'Nenhum'}

SCORES ATUAIS:
- Expansão: ${lead.score_expansion}%
- Pressão Financeira: ${lead.score_financial_pressure}%
- Digital: ${lead.score_digital}%

TAREFA: Análise estratégica para abordagem de venda de equipamento veterinário.

Responda em JSON com:
{
  "summary": "Resumo executivo de 2-3 frases",
  "buying_potential": "Potencial de compra e capacidade de pagamento",
  "pressures": "Pressões financeiras ou comerciais identificadas",
  "approach": "Como abordar (tom, canal, horário)",
  "objections": "Objeções prováveis e como contorná-las",
  "call_script": "Roteiro de ligação (3-4 parágrafos)",
  "next_actions": ["Ação 1", "Ação 2", "Ação 3"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          buying_potential: { type: "string" },
          pressures: { type: "string" },
          approach: { type: "string" },
          objections: { type: "string" },
          call_script: { type: "string" },
          next_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    const duration = Date.now() - startTime;

    // Log auditoria (fire-and-forget)
    base44.asServiceRole.entities.AuditLog.create({
      action: 'ia_analysis',
      module: 'DeepHunter',
      user_email: user.email,
      duration_ms: duration,
      cost_credits: 1, // simplificado
      success: true,
      input_size: JSON.stringify(lead).length,
      output_size: JSON.stringify(analysis).length
    }).catch(() => {});

    return Response.json({
      success: true,
      analysis,
      cached_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});