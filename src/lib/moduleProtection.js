/**
 * Sistema de proteção de módulos — impede execução se switch OFF
 * Integra com useAIConsumption hook
 */

export const MODULE_MAPPING = {
  // Função → ID do módulo
  'predictiveSalesAnalysis': 'predictive',
  'calculateRankingDoDia': 'predictive',
  'calculatePredictiveAnalytics': 'predictive',
  'predictiveLeadScoring': 'predictive',

  'aiClientSegmentation': 'segmentation',
  'clientSegmentation': 'segmentation',

  'analyzeSalesInteraction': 'callAnalysis',
  'analyzeSalesCall': 'callAnalysis',
  'salesCoachingAI': 'callAnalysis',

  'optimizeVisitRoute': 'visitOptimization',
  'optimizeRoute': 'visitOptimization',

  'healthScoreMonitoring': 'healthScoreMonitoring',
  'calculateClientScore': 'healthScoreMonitoring',

  'generateProposalSlides': 'personalizedContent',
  'generateMarketingContent': 'personalizedContent',

  'competitorMarketMonitor': 'competitorMonitoring',
  'deepHunterAnalysis': 'competitorMonitoring',
};

/**
 * Verifica se um módulo está ativo antes de executar
 * @param {string} functionName - Nome da função a executar
 * @param {object} moduleStates - Estado dos módulos do hook
 * @returns {object} { allowed: boolean, message: string }
 */
export function checkModuleAccess(functionName, moduleStates) {
  const moduleId = MODULE_MAPPING[functionName];

  if (!moduleId) {
    // Função sem restrição de módulo
    return { allowed: true, message: '' };
  }

  if (!moduleStates || !moduleStates[moduleId]) {
    return {
      allowed: false,
      message: `❌ Este módulo está desativado. Ative em Configurações de Consumo para usar.`,
    };
  }

  return { allowed: true, message: '' };
}

/**
 * Wrapper para invocar função com proteção
 * @param {function} invokeFunction - base44.functions.invoke
 * @param {string} functionName - Nome da função
 * @param {object} params - Parâmetros
 * @param {object} moduleStates - Estado dos módulos
 * @returns {Promise}
 */
export async function protectedInvoke(invokeFunction, functionName, params, moduleStates) {
  const check = checkModuleAccess(functionName, moduleStates);

  if (!check.allowed) {
    throw new Error(check.message);
  }

  return invokeFunction(functionName, params);
}