import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interaction_id } = await req.json();

    // Buscar interação com sentimento
    const interaction = await base44.entities.Interaction.get(interaction_id);
    
    // Buscar histórico do vendedor
    const vendedorInteractions = await base44.entities.Interaction.filter({
      created_by: interaction.created_by
    });

    // Análise IA de coaching em tempo real
    const coachingAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um coach de vendas expert. Analise esta interação e forneça feedback IMEDIATO.

INTERAÇÃO:
${interaction.notes}

SENTIMENTO DETECTADO: ${interaction.sentiment}
EMOÇÃO: ${interaction.emotion_detected}
SCORE: ${interaction.sentiment_score}

HISTÓRICO DO VENDEDOR:
- Total interações: ${vendedorInteractions.length}
- Positivas: ${vendedorInteractions.filter(i => i.sentiment === 'positive').length}
- Negativas: ${vendedorInteractions.filter(i => i.sentiment === 'negative').length}

FORNEÇA:
1. Avaliação desta interação (0-100)
2. O que foi feito BEM
3. O que precisa MELHORAR
4. Técnicas de vendas aplicadas corretamente
5. Técnicas que faltaram
6. Como tratar melhor o sentimento detectado
7. Próximos passos recomendados
8. Script sugerido para próxima abordagem

SEJA ESPECÍFICO, PRÁTICO E CONSTRUTIVO.`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          techniques_used: { type: "array", items: { type: "string" } },
          techniques_missing: { type: "array", items: { type: "string" } },
          sentiment_handling: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } },
          suggested_script: { type: "string" }
        }
      }
    });

    // Registrar coaching
    await base44.entities.SalesCoaching.create({
      user_email: interaction.created_by,
      user_name: user.full_name,
      analysis_date: new Date().toISOString(),
      period_analyzed: 'Interação única em tempo real',
      interactions_analyzed: 1,
      performance_score: coachingAnalysis.score,
      strengths: coachingAnalysis.strengths.map(s => ({ 
        area: 'Comunicação', 
        description: s 
      })),
      areas_for_improvement: coachingAnalysis.improvements.map((imp, i) => ({
        area: 'Técnica de vendas',
        description: imp,
        priority: i === 0 ? 'alta' : 'media',
        actionable_tips: [coachingAnalysis.suggested_script]
      })),
      successful_patterns: coachingAnalysis.techniques_used.map(t => ({
        pattern: t,
        success_rate: 75,
        recommendation: 'Continue usando'
      })),
      training_suggestions: coachingAnalysis.techniques_missing.map(t => ({
        topic: t,
        reason: 'Técnica não aplicada nesta interação',
        resources: ['Base de Conhecimento NR22']
      }))
    });

    return Response.json({
      success: true,
      coaching: coachingAnalysis
    });

  } catch (error) {
    console.error('Coaching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});