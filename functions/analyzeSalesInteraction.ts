import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transcript, client_context, interaction_type } = await req.json();

        if (!transcript) {
            return Response.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const prompt = `Você é um coach de vendas especializado em equipamentos veterinários (especialmente VG2, analisadores hematológicos e bioquímicos) no mercado brasileiro.

Analise a seguinte interação de vendas e forneça coaching detalhado:

**CONTEXTO DO CLIENTE:**
${client_context || 'Não fornecido'}

**TIPO DE INTERAÇÃO:**
${interaction_type || 'Não especificado'}

**TRANSCRIÇÃO/NOTAS DA INTERAÇÃO:**
${transcript}

Forneça uma análise completa no seguinte formato JSON:

{
  "overall_score": número de 0-100,
  "strengths": ["pontos fortes identificados"],
  "areas_for_improvement": ["áreas que precisam melhorar"],
  "objections_identified": [
    {
      "objection": "objeção mencionada",
      "how_handled": "como foi tratada",
      "suggested_approach": "abordagem sugerida melhor"
    }
  ],
  "sales_techniques_used": [
    {
      "technique": "técnica identificada",
      "effectiveness": "baixa/média/alta",
      "comment": "comentário sobre o uso"
    }
  ],
  "missed_opportunities": ["oportunidades perdidas"],
  "specific_recommendations": [
    {
      "category": "categoria (rapport/descoberta/apresentação/fechamento)",
      "recommendation": "recomendação específica",
      "priority": "alta/média/baixa"
    }
  ],
  "suggested_next_steps": ["próximos passos recomendados"],
  "script_suggestions": [
    {
      "moment": "momento da conversa",
      "suggested_phrase": "frase sugerida contextualizada para veterinária"
    }
  ],
  "numerology_alignment": "se contexto disponível, avaliar alinhamento com perfil numerológico",
  "closing_strategy": "estratégia de fechamento recomendada para este caso",
  "key_insights": "insights-chave sobre esta interação"
}`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    overall_score: { type: "number" },
                    strengths: { type: "array", items: { type: "string" } },
                    areas_for_improvement: { type: "array", items: { type: "string" } },
                    objections_identified: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                objection: { type: "string" },
                                how_handled: { type: "string" },
                                suggested_approach: { type: "string" }
                            }
                        }
                    },
                    sales_techniques_used: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                technique: { type: "string" },
                                effectiveness: { type: "string" },
                                comment: { type: "string" }
                            }
                        }
                    },
                    missed_opportunities: { type: "array", items: { type: "string" } },
                    specific_recommendations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                category: { type: "string" },
                                recommendation: { type: "string" },
                                priority: { type: "string" }
                            }
                        }
                    },
                    suggested_next_steps: { type: "array", items: { type: "string" } },
                    script_suggestions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                moment: { type: "string" },
                                suggested_phrase: { type: "string" }
                            }
                        }
                    },
                    numerology_alignment: { type: "string" },
                    closing_strategy: { type: "string" },
                    key_insights: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            analysis: response,
            analyzed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing sales interaction:', error);
        return Response.json({ 
            error: error.message || 'Failed to analyze interaction' 
        }, { status: 500 });
    }
});