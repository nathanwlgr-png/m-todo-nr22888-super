import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { transcript, client_id, conversation_type = 'chat' } = await req.json();

    if (!transcript) {
      return Response.json({ error: 'transcript obrigatório' }, { status: 400 });
    }

    let client = null;
    if (client_id) {
      const clients = await base44.entities.Client.list();
      client = clients.find(c => c.id === client_id);
    }

    // Buscar sessões anteriores do vendedor para benchmark
    const previousSessions = await base44.entities.CoachingSession.filter({
      created_by: user.email
    });

    const avgPreviousScore = previousSessions.length > 0
      ? previousSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previousSessions.length
      : 70;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um coach de vendas consultivas especializado em análise de conversas.

VENDEDOR: ${user.full_name}
Score médio histórico: ${avgPreviousScore.toFixed(0)}/100

${client ? `
CLIENTE DA CONVERSA: ${client.first_name}
Perfil Numerológico: ${client.numerology_number} - ${client.behavioral_profile}
Estilo de Decisão: ${client.decision_style}
Tom Ideal: ${client.recommended_communication || client.client_tone || 'Profissional'}
Status: ${client.status} | Score: ${client.purchase_score}%
` : 'Cliente: Não identificado'}

TRANSCRIÇÃO DA CONVERSA:
${transcript}

═══════════════════════════════════════
ANÁLISE COMPLETA DE COACHING
═══════════════════════════════════════

Analise esta conversa e forneça feedback ESPECÍFICO, CONSTRUTIVO e ACIONÁVEL.

Retorne JSON estruturado:
{
  "overall_score": 0-100 (score geral da performance),
  "technique_scores": {
    "spin_selling": 0-10 (usou Situation/Problem/Implication/Need-Payoff?),
    "numerology_adaptation": 0-10 (adaptou ao perfil do cliente?),
    "cialdini_triggers": 0-10 (reciprocidade, prova social, escassez, etc),
    "emotional_intelligence": 0-10 (empatia, leitura emocional, autorregulação),
    "objection_handling": 0-10 (como lidou com objeções?)
  },
  "strengths": [
    "Ponto forte 1 ESPECÍFICO com exemplo da conversa",
    "Ponto forte 2 ESPECÍFICO com exemplo"
  ],
  "weaknesses": [
    "Área de melhoria 1 ESPECÍFICA com exemplo",
    "Área de melhoria 2 ESPECÍFICA com exemplo"
  ],
  "tone_analysis": {
    "detected_tone": "tom que o vendedor usou",
    "ideal_tone": "tom ideal para este cliente",
    "tone_match_score": 0-10,
    "adjustments_needed": ["ajuste específico 1", "ajuste 2"]
  },
  "moments_analysis": [
    {
      "timestamp": "início|meio|final ou minuto específico",
      "what_happened": "o que aconteceu neste momento",
      "rating": "excellent|good|needs_improvement|critical_error",
      "feedback": "feedback específico",
      "better_approach": "o que deveria ter feito"
    }
  ],
  "missed_opportunities": [
    "Oportunidade perdida 1 com momento específico",
    "Oportunidade perdida 2"
  ],
  "next_conversation_tips": [
    "Dica acionável 1 para próxima conversa",
    "Dica 2",
    "Dica 3"
  ],
  "outcome": "venda_fechada|agendou_proxima|enviou_proposta|perdeu_venda|neutro",
  "ai_detailed_feedback": "Feedback narrativo detalhado (3-4 parágrafos) explicando a performance geral, frameworks usados corretamente/incorretamente, e plano de melhoria"
}

CRITÉRIOS DE AVALIAÇÃO:

**SPIN Selling (0-10):**
- Fez perguntas de Situação?
- Explorou Problemas?
- Aprofundou Implicações?
- Conectou com Need-Payoff?

**Numerologia (0-10):**
${client ? `- Adaptou ao perfil ${client.numerology_number}?
- Tom compatível com ${client.behavioral_profile}?
- Usou linguagem apropriada ao estilo de decisão?` : '- Demonstrou flexibilidade?'}

**Cialdini (0-10):**
- Usou reciprocidade, prova social, autoridade, escassez, apreço, compromisso?

**Inteligência Emocional (0-10):**
- Demonstrou empatia?
- Autorregulação emocional?
- Leitura do estado emocional do cliente?

**Objeções (0-10):**
- Validou antes de rebater?
- Usou perguntas de aprofundamento?
- Manteve controle emocional?

Seja DIRETO, HONESTO e CONSTRUTIVO. Use exemplos da transcrição.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          technique_scores: {
            type: "object",
            properties: {
              spin_selling: { type: "number" },
              numerology_adaptation: { type: "number" },
              cialdini_triggers: { type: "number" },
              emotional_intelligence: { type: "number" },
              objection_handling: { type: "number" }
            }
          },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          tone_analysis: {
            type: "object",
            properties: {
              detected_tone: { type: "string" },
              ideal_tone: { type: "string" },
              tone_match_score: { type: "number" },
              adjustments_needed: { type: "array", items: { type: "string" } }
            }
          },
          moments_analysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string" },
                what_happened: { type: "string" },
                rating: { type: "string" },
                feedback: { type: "string" },
                better_approach: { type: "string" }
              }
            }
          },
          missed_opportunities: { type: "array", items: { type: "string" } },
          next_conversation_tips: { type: "array", items: { type: "string" } },
          outcome: { type: "string" },
          ai_detailed_feedback: { type: "string" }
        }
      }
    });

    // Salvar sessão
    const session = await base44.entities.CoachingSession.create({
      client_id,
      client_name: client?.first_name,
      conversation_type,
      transcript,
      overall_score: analysis.overall_score,
      technique_scores: analysis.technique_scores,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      tone_analysis: analysis.tone_analysis,
      moments_analysis: analysis.moments_analysis,
      missed_opportunities: analysis.missed_opportunities,
      next_conversation_tips: analysis.next_conversation_tips,
      outcome: analysis.outcome,
      ai_detailed_feedback: analysis.ai_detailed_feedback
    });

    return Response.json({
      success: true,
      session_id: session.id,
      analysis
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});