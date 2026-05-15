/**
 * WRAPPERS DE FUNÇÕES IA COM MODO ECONOMIA
 * Cada função responde às regras:
 * - Exigir aprovação manual
 * - Usar cache 24h
 * - Registrar consumo
 * - Bloquear execução automática
 */

import { base44 } from '@/api/base44Client';
import { economicModeV2 } from './EconomicModeV2';

/**
 * SPIN SELLING MESSAGES
 * Regra: SOMENTE ao clicar "Gerar Mensagem"
 */
export async function generateSpinWithEconomy(clientId, userApproval = false) {
  // Exigir aprovação
  if (!userApproval) {
    return {
      requiresApproval: true,
      message: 'Exigir confirmação do usuário'
    };
  }

  // Cache 24h
  const cacheKey = `spin_${clientId}`;
  const cached = economicModeV2.getCache(cacheKey);
  if (cached) {
    return { data: cached, source: 'cache' };
  }

  // Modo economia?
  if (!economicModeV2.canMakeAICall('generateSpinSellingMessages')) {
    return {
      error: 'ECONOMY_MODE',
      status: economicModeV2.getStatus()
    };
  }

  try {
    const res = await base44.functions.invoke('generateSpinSellingMessages', {
      clientId,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 300
    });

    // Registrar consumo
    economicModeV2.registerTokenUsage(
      'generateSpinSellingMessages',
      res.data?.tokensUsed || 300,
      res.data?.costEstimate
    );

    // Cache resultado
    economicModeV2.setCache(cacheKey, res.data);

    return res;
  } catch (err) {
    if (err.response?.status === 429) {
      return { error: 'RATE_LIMIT', retryAfter: 60 };
    }
    throw err;
  }
}

/**
 * WHATSAPP PROPOSAL
 * Regra: SOMENTE ao clicar "Gerar Proposta"
 */
export async function generateWhatsAppProposalWithEconomy(clientId, userApproval = false) {
  if (!userApproval) {
    return { requiresApproval: true };
  }

  const cacheKey = `proposal_${clientId}`;
  const cached = economicModeV2.getCache(cacheKey);
  if (cached) return { data: cached, source: 'cache' };

  if (!economicModeV2.canMakeAICall('generateWhatsAppProposal')) {
    return { error: 'ECONOMY_MODE', status: economicModeV2.getStatus() };
  }

  try {
    const res = await base44.functions.invoke('generateWhatsAppProposal', {
      clientId,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 500
    });

    economicModeV2.registerTokenUsage(
      'generateWhatsAppProposal',
      res.data?.tokensUsed || 500,
      res.data?.costEstimate
    );

    economicModeV2.setCache(cacheKey, res.data);

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * INVESTIGAÇÃO DE CAMPO
 * Regra: SOMENTE sob confirmação manual com modal
 */
export async function investigateClinicWithEconomy(clinicData, userApproval = false) {
  if (!userApproval) {
    return { requiresApproval: true };
  }

  if (!economicModeV2.canMakeAICall('investigacaoCampoReal')) {
    return { error: 'ECONOMY_MODE', status: economicModeV2.getStatus() };
  }

  try {
    const res = await base44.functions.invoke('investigacaoCampoReal', {
      ...clinicData,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 800
    });

    economicModeV2.registerTokenUsage(
      'investigacaoCampoReal',
      res.data?.tokensUsed || 800,
      res.data?.costEstimate
    );

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * MARKETING IA
 * Regra: Usar cache agressivo (24h)
 */
export async function generateMarketingWithEconomy(clientId, contentType) {
  const cacheKey = `marketing_${clientId}_${contentType}`;
  const cached = economicModeV2.getCache(cacheKey);
  if (cached) return { data: cached, source: 'cache' };

  if (!economicModeV2.canMakeAICall('generateMarketingContent')) {
    return { error: 'ECONOMY_MODE', status: economicModeV2.getStatus() };
  }

  try {
    const res = await base44.functions.invoke('generateMarketingContent', {
      clientId,
      contentType,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 400
    });

    economicModeV2.registerTokenUsage(
      'generateMarketingContent',
      res.data?.tokensUsed || 400,
      res.data?.costEstimate
    );

    economicModeV2.setCache(cacheKey, res.data, 24 * 60 * 60 * 1000);

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * ANÁLISE COMERCIAL
 * Regra: Execução sob comando do usuário
 */
export async function analyzeClientWithEconomy(clientData, analysisType) {
  const cacheKey = `analysis_${clientData.id}_${analysisType}`;
  const cached = economicModeV2.getCache(cacheKey);
  if (cached) return { data: cached, source: 'cache' };

  if (!economicModeV2.canMakeAICall(`analyze${analysisType}`)) {
    return { error: 'ECONOMY_MODE', status: economicModeV2.getStatus() };
  }

  try {
    const res = await base44.functions.invoke(`analyze${analysisType}`, {
      ...clientData,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 600
    });

    economicModeV2.registerTokenUsage(
      `analyze${analysisType}`,
      res.data?.tokensUsed || 600,
      res.data?.costEstimate
    );

    economicModeV2.setCache(cacheKey, res.data);

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * NUMEROLOGIA COMERCIAL
 * Regra: Cache 24h, sem aprovação (info)
 */
export async function numerologyAnalysisWithEconomy(clientData) {
  const cacheKey = `numerology_${clientData.id}`;
  const cached = economicModeV2.getCache(cacheKey);
  if (cached) return { data: cached, source: 'cache' };

  // Numerologia é informativa, permite mesmo com modo econômico ativo
  try {
    const res = await base44.functions.invoke('consultiveNumerologyAnalysis', {
      ...clientData,
      model: economicModeV2.selectOptimalModel(),
      maxTokens: 400
    });

    economicModeV2.registerTokenUsage(
      'consultiveNumerologyAnalysis',
      res.data?.tokensUsed || 400,
      res.data?.costEstimate
    );

    economicModeV2.setCache(cacheKey, res.data, 24 * 60 * 60 * 1000);

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * DEBOUNCE PARA EVITAR LOOPS
 * Previne múltiplas chamadas em sequência rápida
 */
export function createDebouncedAICall(fn, delay = 500) {
  let timeout;
  let lastCallTime = 0;

  return function debounced(...args) {
    const now = Date.now();
    
    // Evitar chamadas muito frequentes
    if (now - lastCallTime < delay) {
      return;
    }

    lastCallTime = now;
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * VALIDADOR DE APROVAÇÃO
 */
export function requiresApproval(functionName) {
  const functions = [
    'generateSpinSellingMessages',
    'generateWhatsAppProposal',
    'investigacaoCampoReal'
  ];
  return functions.includes(functionName);
}

/**
 * FUNÇÃO AUXILIAR: PODE CHAMAR IA?
 */
export function canCallAI(functionName = null) {
  return economicModeV2.canMakeAICall(functionName);
}

/**
 * FUNÇÃO AUXILIAR: RETORNA STATUS
 */
export function getAIStatus() {
  return economicModeV2.getStatus();
}

/**
 * FUNÇÃO AUXILIAR: RETORNA RELATÓRIO
 */
export function getAIReport() {
  return economicModeV2.getConsumptionReport();
}