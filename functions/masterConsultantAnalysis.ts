import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const numerologyMasters = {
  11: {
    name: "Mestre Iluminado",
    traits: ["visionário", "intuitivo", "inspirador", "sensitivo"],
    decision_style: "Baseada em intuição e visão maior",
    communication_style: "Profundo e inspirador",
    best_approach: "Foco em transformação e visão compartilhada",
    triggers: ["propósito", "transformação", "evolução", "inovação"],
    best_time: "qualquer hora (intuitivo)",
    methodology: "Consultiva Transcendente",
    scripts_type: "Visionário",
    power: "Illuminação e transformação"
  },
  22: {
    name: "Mestre Construtor",
    traits: ["realizador", "prático", "estruturado", "poderoso"],
    decision_style: "Baseada em resultados concretos",
    communication_style: "Direto e executivo",
    best_approach: "Foco em construção de impacto e realização",
    triggers: ["poder", "realização", "estrutura", "legado"],
    best_time: "manhã cedo",
    methodology: "SPIN + Execução Imediata",
    scripts_type: "Construtor",
    power: "Manifestação de ideias em realidade"
  }
};

const numerologyProfiles = {
  1: { name: "Líder", num: 1 },
  2: { name: "Diplomata", num: 2 },
  3: { name: "Comunicador", num: 3 },
  4: { name: "Construtor", num: 4 },
  5: { name: "Investigador", num: 5 },
  6: { name: "Cuidador", num: 6 },
  7: { name: "Filósofo", num: 7 },
  8: { name: "Realizador", num: 8 },
  9: { name: "Humanitário", num: 9 },
  11: numerologyMasters[11],
  22: numerologyMasters[22]
};

function calculateNumerologyNumber(name) {
  if (!name) return null;
  
  const nameUpper = name.toUpperCase().replace(/[^A-Z]/g, '');
  const map = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  };
  
  let sum = 0;
  for (let char of nameUpper) {
    sum += map[char] || 0;
  }
  
  // Verificar mestres 11 e 22 antes de reduzir
  if (sum === 11 || sum === 22) {
    return sum;
  }
  
  while (sum > 9) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return sum || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, message_context = "" } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    // Buscar cliente
    const client = await base44.asServiceRole.entities.Client
      .filter({ id: client_id })
      .then(r => r[0]);
    
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular numerologia com mestres
    const nameToUse = client.first_name || client.full_name;
    const numerologyNumber = calculateNumerologyNumber(nameToUse);
    const profile = numerologyProfiles[numerologyNumber];

    // Buscar histórico de interações
    const interactions = await base44.asServiceRole.entities.WhatsAppMessage
      ?.filter({ client_id: client_id })
      .then(r => r || [])
      .catch(() => []);

    // Análise IA para próxima abordagem
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um consultor técnico master de equipamentos laboratoriais.

CLIENTE:
- Nome: ${client.first_name}
- Empresa: ${client.clinic_name}
- Cidade: ${client.city}
- Numerologia: ${numerologyNumber} (${profile?.name})
- Status: ${client.status}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Orçamento: R$ ${client.available_budget || '0'}

HISTÓRICO DE MENSAGENS (últimas 5):
${interactions?.slice(-5).map(i => `${i.sender}: ${i.content}`).join('\n') || 'Sem histórico'}

CONTEXTO ATUAL:
${message_context}

ANALISE:
1. Qual é o SENTIMENTO atual do cliente? (quente/morno/frio)
2. Qual é a PRÓXIMA MELHOR ABORDAGEM? (baseado em numerologia e histórico)
3. Que GATILHO usar? (escolha 1 entre: urgência, autoridade, prova_social, afinidade, escassez)
4. Qual PERGUNTA SPIN fazer agora?
5. Como se apresentar mantendo AUTENTICIDADE?

Responda em JSON estruturado.`,
      add_context_from_internet: true
    });

    // Classificar lead baseado em dados
    let leadScore = 0;
    if (client.status === 'quente') leadScore += 40;
    if (client.status === 'morno') leadScore += 20;
    if (client.available_budget && client.available_budget > 20000) leadScore += 30;
    if (interactions?.length > 5) leadScore += 10;
    
    const leadClassification = 
      leadScore >= 70 ? "🔥 HOT - Pronto para fechar" :
      leadScore >= 40 ? "🔆 WARM - Trabalho consultivo" :
      "❄️ COLD - Qualificação necessária";

    return Response.json({
      success: true,
      client_name: client.first_name,
      numerology: {
        number: numerologyNumber,
        profile: profile?.name,
        is_master: [11, 22].includes(numerologyNumber),
        characteristics: profile?.traits || []
      },
      lead_classification: {
        score: leadScore,
        level: leadClassification,
        recommendation: aiAnalysis
      },
      interaction_history_count: interactions?.length || 0,
      presentation: `Nathan - Consultor Técnico da CMAT Brasil`,
      next_steps: {
        methodology: profile?.methodology,
        best_time: profile?.best_time,
        trigger_to_use: profile?.triggers?.[0],
        script_type: profile?.scripts_type
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});