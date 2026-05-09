/**
 * Adapta mensagens conforme intensidade comercial
 * Nunca altera fatos, apenas tom e urgência
 */

const TONE_ADAPTATIONS = {
  tecnico: {
    urgency: 'baixa',
    focus: ['exames', 'precisão', 'tempo_diagnóstico', 'ROI'],
    cta: 'consultivo',
    emocional: 0,
    tamanho: 'compacto',
    keywords: ['exame', 'diagnóstico', 'precisão', 'resultado'],
  },
  consultivo: {
    urgency: 'media',
    focus: ['dor_cliente', 'oportunidade', 'crescimento'],
    cta: 'sugestão',
    emocional: 2,
    tamanho: 'normal',
    keywords: ['cliente', 'oportunidade', 'crescimento', 'melhoria'],
  },
  equilibrado: {
    urgency: 'media',
    focus: ['técnico', 'comercial'],
    cta: 'direto',
    emocional: 5,
    tamanho: 'normal',
    keywords: ['benefício', 'vantagem', 'resultado'],
  },
  persuasivo: {
    urgency: 'alta',
    focus: ['competitividade', 'diferencial', 'retenção'],
    cta: 'urgente',
    emocional: 7,
    tamanho: 'expandido',
    keywords: ['concorrência', 'oportunidade', 'agora', 'vantagem'],
  },
  agressivo: {
    urgency: 'muito_alta',
    focus: ['escassez', 'velocidade', 'perdas'],
    cta: 'ação_imediata',
    emocional: 9,
    tamanho: 'expandido',
    keywords: ['urgente', 'agora', 'risco', 'ouro', 'perdendo'],
  }
};

export function getCommercialIntensity() {
  if (typeof window !== 'undefined') {
    return parseInt(localStorage.getItem('commercial_intensity') || '3');
  }
  return 3;
}

export function getToneConfig(intensity) {
  const tones = ['tecnico', 'consultivo', 'equilibrado', 'persuasivo', 'agressivo'];
  return TONE_ADAPTATIONS[tones[intensity - 1]] || TONE_ADAPTATIONS.equilibrado;
}

export function adaptMessage(baseMessage, intensity = null) {
  const int = intensity || getCommercialIntensity();
  const tone = getToneConfig(int);

  let adapted = baseMessage;

  // Aplicar ajustes conforme intensidade
  if (int === 1) {
    // Técnico: remover emojis, ser direto
    adapted = adapted.replace(/[🔥⚡💰🚀🎯]/g, '');
    adapted = adapted.replace(/!/g, '.');
  } else if (int === 5) {
    // Agressivo: adicionar urgência
    adapted = adapted
      .replace(/pode/, 'PRECISA')
      .replace(/talvez/, 'CERTAMENTE')
      .replace(/ideal/, 'ESSENCIAL')
      .replace(/\./g, '! 🔥');
  }

  return adapted;
}

export function generateCTA(intensity = null) {
  const int = intensity || getCommercialIntensity();

  const ctas = {
    1: 'Solicitar demonstração técnica',
    2: 'Agendar conversa sobre oportunidades',
    3: 'Marcar visita',
    4: 'Agendar visita HOJE',
    5: 'LIGAR AGORA — Ouro saindo de suas mãos!',
  };

  return ctas[int] || ctas[3];
}

export function generateUrgencyLevel(intensity = null) {
  const int = intensity || getCommercialIntensity();
  const levels = ['baixa', 'média', 'média-alta', 'alta', 'crítica'];
  return levels[int - 1];
}

export function shouldHighlightROI(intensity = null) {
  const int = intensity || getCommercialIntensity();
  return int >= 2; // Realça ROI a partir do consultivo
}

export function shouldHighlightLoss(intensity = null) {
  const int = intensity || getCommercialIntensity();
  return int >= 4; // Alerta de perda a partir do persuasivo
}

export function getSalesScriptTemplate(intensity = null) {
  const int = intensity || getCommercialIntensity();

  const scripts = {
    1: `Olá, tudo bem? Tenho uma proposta técnica que pode interessar sua clínica. 
        Realiza 26 parâmetros em 3-5 minutos. Quer conhecer?`,
    
    2: `Oi! Identificamos uma oportunidade em sua clínica. 
        Seu cliente espera resultado rápido. Posso mostrar como melhorar isso?`,
    
    3: `Bom dia! Temos uma solução que acelerava seus diagnósticos e economiza até R$50/exame. 
        Você tem 5 minutos para conversar?`,
    
    4: `OI! Olha, enquanto falamos, cada exame enviado para fora é uma oportunidade perdida. 
        PRECISA conversar hoje. Pode ser agora?`,
    
    5: `ALERTA: Seus concorrentes já têm! Cada exame é ouro saindo de suas mãos. 
        LIGAR AGORA é a única opção. Qual melhor horário?`
  };

  return scripts[int] || scripts[3];
}

export default {
  getCommercialIntensity,
  getToneConfig,
  adaptMessage,
  generateCTA,
  generateUrgencyLevel,
  shouldHighlightROI,
  shouldHighlightLoss,
  getSalesScriptTemplate
};