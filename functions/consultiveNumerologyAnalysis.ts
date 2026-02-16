import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const numerologyProfiles = {
  1: {
    name: "Líder Independente",
    traits: ["inovador", "determinado", "ambicioso", "direto"],
    decision_style: "Rápida e autoritária",
    communication_style: "Direto e objetivo",
    best_approach: "Foco em resultados, independência e liderança",
    triggers: ["exclusividade", "poder", "resultado", "eficiência"],
    objection_handling: "Direto, sem rodeios",
    best_time: "manhã cedo",
    methodology: "SPIN_Selling com foco em qualificação rápida",
    scripts_type: "Assertivo"
  },
  2: {
    name: "Diplomata Colaborativo",
    traits: ["empático", "cooperativo", "sensível", "pacífico"],
    decision_style: "Baseada em relacionamentos e consenso",
    communication_style: "Gentil e consultivo",
    best_approach: "Foco em relacionamento, harmonia e apoio",
    triggers: ["afinidade", "reciprocidade", "confiança", "paz"],
    objection_handling: "Compreensivo e apoiador",
    best_time: "tarde",
    methodology: "Vendas Consultivas puras",
    scripts_type: "Empático"
  },
  3: {
    name: "Comunicador Criativo",
    traits: ["expressivo", "otimista", "criativo", "social"],
    decision_style: "Emocional e intuitiva",
    communication_style: "Entusiasmado e narrativo",
    best_approach: "Foco em visão, criatividade e possibilidades",
    triggers: ["prova_social", "urgência", "novidade", "emoção"],
    objection_handling: "Com histórias e entusiasmo",
    best_time: "meio da tarde",
    methodology: "Neuromarketing + Gatilhos mentais",
    scripts_type: "Inspirador"
  },
  4: {
    name: "Construtor Sistemático",
    traits: ["prático", "estável", "organizado", "confiável"],
    decision_style: "Baseada em dados e processos",
    communication_style: "Formal e estruturado",
    best_approach: "Foco em estabilidade, segurança e processos",
    triggers: ["autoridade", "prova_social", "liking", "coerência"],
    objection_handling: "Com dados e evidências",
    best_time: "manhã",
    methodology: "SPIN_Selling + Cialdini",
    scripts_type: "Técnico"
  },
  5: {
    name: "Investigador Analítico",
    traits: ["curioso", "analítico", "independente", "investigativo"],
    decision_style: "Baseada em análise profunda",
    communication_style: "Detalhado e técnico",
    best_approach: "Foco em análise, conhecimento e detalhes",
    triggers: ["escassez", "autoridade", "conhecimento"],
    objection_handling: "Com dados detalhados",
    best_time: "qualquer hora",
    methodology: "Gap_Selling + SPIN",
    scripts_type: "Analítico"
  },
  6: {
    name: "Cuidador Responsável",
    traits: ["responsável", "leal", "cuidadoso", "comprometido"],
    decision_style: "Consultiva e baseada em responsabilidade",
    communication_style: "Cuidadoso e atencioso",
    best_approach: "Foco em responsabilidade, segurança e lealdade",
    triggers: ["afinidade", "reciprocidade", "autoridade", "confiança"],
    objection_handling: "Mostrando preocupação",
    best_time: "tarde",
    methodology: "Vendas Consultivas + Gatilhos Cialdini",
    scripts_type: "Cuidador"
  },
  7: {
    name: "Filósofo Reflexivo",
    traits: ["reflexivo", "espiritual", "introspectivo", "idealista"],
    decision_style: "Lenta e profunda",
    communication_style: "Profundo e significativo",
    best_approach: "Foco em significado, crescimento e verdade",
    triggers: ["autoridade", "conhecimento", "significado"],
    objection_handling: "Respondendo profundamente",
    best_time: "fim da tarde/noite",
    methodology: "Consultiva pura + Storytelling",
    scripts_type: "Filosófico"
  },
  8: {
    name: "Realizador Executivo",
    traits: ["ambicioso", "executivo", "poderoso", "materialista"],
    decision_style: "Rápida e focada em retorno",
    communication_style: "Poder e resultados",
    best_approach: "Foco em poder, sucesso e resultado financeiro",
    triggers: ["autoridade", "escassez", "urgência", "poder"],
    objection_handling: "Com dados de ROI",
    best_time: "manhã",
    methodology: "SPIN_Selling assertivo",
    scripts_type: "Executivo"
  },
  9: {
    name: "Humanitário Compreensivo",
    traits: ["compassivo", "humanitário", "compreensivo", "universal"],
    decision_style: "Considerando impacto geral",
    communication_style: "Inclusivo e empático",
    best_approach: "Foco em impacto humano, comunidade e bem comum",
    triggers: ["prova_social", "afinidade", "impacto", "comunidade"],
    objection_handling: "Com foco em benefício coletivo",
    best_time: "tarde",
    methodology: "Vendas Consultivas + Neuromarketing",
    scripts_type: "Humanitário"
  }
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

    const { client_id, use_first_name = true } = await req.json();

    if (!client_id) {
      return Response.json({ 
        error: 'client_id obrigatório' 
      }, { status: 400 });
    }

    // Buscar cliente
    const client = await base44.asServiceRole.entities.Client
      .filter({ id: client_id })
      .then(r => r[0]);
    
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular numerologia
    const nameToUse = use_first_name ? client.first_name : client.full_name;
    const numerologyNumber = calculateNumerologyNumber(nameToUse);

    if (!numerologyNumber) {
      return Response.json({ 
        error: 'Não foi possível calcular numerologia (nome inválido)' 
      }, { status: 400 });
    }

    const profile = numerologyProfiles[numerologyNumber];

    // Salvar análise no cliente
    await base44.asServiceRole.entities.Client.update(client_id, {
      numerology_number: numerologyNumber,
      behavioral_profile: profile.name,
      decision_style: profile.decision_style,
      approach_tips: JSON.stringify(profile),
      recommended_communication: profile.communication_style,
      client_tone: profile.name.split(' ')[0].toLowerCase()
    });

    return Response.json({
      success: true,
      client_name: client.first_name,
      numerology_number: numerologyNumber,
      profile: profile,
      analysis: {
        name: profile.name,
        traits: profile.traits,
        decision_style: profile.decision_style,
        communication_style: profile.communication_style,
        best_approach: profile.best_approach,
        primary_triggers: profile.triggers,
        best_contact_time: profile.best_time,
        recommended_methodology: profile.methodology,
        script_type: profile.scripts_type,
        objection_handling_style: profile.objection_handling
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});