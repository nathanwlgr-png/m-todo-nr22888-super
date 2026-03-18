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
    let clientInteractions = [];
    let clientSales = [];
    let clientVisits = [];
    let clientTasks = [];
    
    if (client_id) {
      const clients = await base44.entities.Client.list();
      client = clients.find(c => c.id === client_id);
      
      // Buscar histórico completo do cliente
      if (client) {
        const [interactions, sales, visits, tasks] = await Promise.all([
          base44.entities.Interaction.filter({ client_id }, '-created_date', 10),
          base44.entities.Sale.filter({ client_id }),
          base44.entities.Visit.filter({ client_id }, '-scheduled_date', 5),
          base44.entities.Task.filter({ client_id, status: 'pendente' }, '-created_date', 5)
        ]);
        
        clientInteractions = interactions;
        clientSales = sales;
        clientVisits = visits;
        clientTasks = tasks;
      }
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
═══════════════════════════════════════
📋 PERFIL COMPLETO DO CLIENTE
═══════════════════════════════════════
NOME: ${client.first_name} ${client.full_name || ''}
CLÍNICA: ${client.clinic_name || 'N/A'}
STATUS: ${client.status} | Score de Compra: ${client.purchase_score || 0}%
Estágio Pipeline: ${client.pipeline_stage || 'lead'}

🧠 PERFIL PSICOLÓGICO:
- Número Numerológico: ${client.numerology_number || 'Não calculado'}
- Perfil Comportamental: ${client.behavioral_profile || 'Não definido'}
- Estilo de Decisão: ${client.decision_style || 'Não mapeado'}
- Tom de Comunicação Ideal: ${client.recommended_communication || client.client_tone || 'Profissional'}

💰 HISTÓRICO DE VENDAS (${clientSales.length} vendas):
${clientSales.length > 0 ? clientSales.map(s => `- ${s.equipment_name || 'Equipamento'}: R$ ${s.sale_value} (${s.status})`).join('\n') : 'Nenhuma venda ainda'}

📞 INTERAÇÕES RECENTES (Últimas ${clientInteractions.length}):
${clientInteractions.length > 0 ? clientInteractions.map(i => `- [${i.type}] ${i.subject}: ${i.outcome || 'N/A'} - ${i.notes?.substring(0, 100) || ''}`).join('\n') : 'Sem interações registradas'}

🏢 VISITAS REALIZADAS (${clientVisits.length} visitas):
${clientVisits.length > 0 ? clientVisits.map(v => `- ${new Date(v.scheduled_date).toLocaleDateString()}: ${v.visit_type} - ${v.status}`).join('\n') : 'Nenhuma visita agendada'}

✅ TAREFAS PENDENTES (${clientTasks.length}):
${clientTasks.length > 0 ? clientTasks.map(t => `- ${t.title} (${t.priority}) - ${t.type}`).join('\n') : 'Nenhuma tarefa pendente'}

🎯 MOTIVADORES DE COMPRA IDENTIFICADOS:
${client.purchase_motivators?.length > 0 ? client.purchase_motivators.join(', ') : 'Não identificados'}

⚠️ OBJEÇÕES REAIS LEVANTADAS:
${client.real_objections?.length > 0 ? client.real_objections.join(', ') : 'Nenhuma objeção registrada'}

💡 DORES PRINCIPAIS:
${client.main_pains?.length > 0 ? client.main_pains.join(', ') : 'Não identificadas'}

🔥 GATILHOS JÁ UTILIZADOS:
${client.triggers_used?.length > 0 ? client.triggers_used.join(', ') : 'Nenhum gatilho usado ainda'}

📊 EQUIPAMENTO ATUAL: ${client.current_equipment || 'Não informado'}
🎯 INTERESSE: ${client.equipment_interest || 'Não definido'}
💵 ORÇAMENTO: ${client.available_budget ? `R$ ${client.available_budget}` : 'Não informado'}
` : 'Cliente: Não identificado - Análise genérica'}

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
- Usou linguagem apropriada ao estilo de decisão (${client.decision_style})?` : '- Demonstrou flexibilidade?'}

**Cialdini (0-10):**
- Usou reciprocidade, prova social, autoridade, escassez, apreço, compromisso?
${client?.triggers_used?.length > 0 ? `- Já usou antes: ${client.triggers_used.join(', ')}` : ''}

**Inteligência Emocional (0-10):**
- Demonstrou empatia?
- Autorregulação emocional?
- Leitura do estado emocional do cliente?

**Objeções (0-10):**
${client?.real_objections?.length > 0 ? `- Objeções conhecidas do cliente: ${client.real_objections.join(', ')}` : ''}
- Validou antes de rebater?
- Usou perguntas de aprofundamento?
- Manteve controle emocional?

**CONTEXTO HISTÓRICO DO CLIENTE:**
${clientInteractions.length > 0 ? `- Baseado em ${clientInteractions.length} interações anteriores, como esta conversa se compara?` : ''}
${clientSales.length > 0 ? `- Cliente já comprou ${clientSales.length}x - usou essa prova social?` : '- Cliente nunca comprou - explorou bem os benefícios?'}
${clientVisits.length > 0 ? `- ${clientVisits.length} visitas realizadas - referenciou alguma?` : ''}

**OPORTUNIDADES BASEADAS NO CRM:**
${client?.purchase_motivators?.length > 0 ? `- Motivadores conhecidos (${client.purchase_motivators.join(', ')}) foram explorados?` : ''}
${client?.main_pains?.length > 0 ? `- Dores identificadas (${client.main_pains.join(', ')}) foram abordadas?` : ''}
${client?.available_budget ? `- Cliente tem orçamento de R$ ${client.available_budget} - mencionou investimento nessa faixa?` : ''}

Seja DIRETO, HONESTO e CONSTRUTIVO. Use exemplos da transcrição E do histórico CRM.`,
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