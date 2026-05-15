/**
 * SAFE AI CALL V2
 * Wrapper seguro para todas as chamadas IA
 * Aplica Modo Economia, Cache e Tratamento de Erros
 */

import { economicModeV2 } from './EconomicModeV2';

export class SafeAICallV2 {
  /**
   * Executa função IA com proteções
   */
  static async execute(functionName, payload, options = {}) {
    const {
      cacheKey = null,
      cacheTTL = 24 * 60 * 60 * 1000,
      model = null,
      maxTokens = 300,
      requiresApproval = false
    } = options;

    try {
      // 1. VERIFICAR CACHE
      if (cacheKey) {
        const cached = economicModeV2.getCache(cacheKey);
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date()
          };
        }
      }

      // 2. VERIFICAR MODO ECONOMIA
      if (!economicModeV2.canMakeAICall(functionName)) {
        return {
          error: 'ECONOMY_MODE_ACTIVE',
          message: 'Modo Economia ativo. IA desativada.',
          status: economicModeV2.getStatus(),
          data: null
        };
      }

      // 3. EXIGIR APROVAÇÃO SE NECESSÁRIO
      if (requiresApproval && !payload.__approved) {
        return {
          error: 'APPROVAL_REQUIRED',
          message: 'Requerer aprovação manual do usuário',
          requiresApproval: true
        };
      }

      // 4. SELECIONAR MODELO
      const selectedModel = model || economicModeV2.selectOptimalModel();

      // 5. EXECUTAR FUNÇÃO
      const response = await this.callBackend(functionName, {
        ...payload,
        model: selectedModel,
        maxTokens: maxTokens
      });

      // 6. REGISTRAR CONSUMO
      const tokensUsed = response.tokensUsed || 0;
      const costEstimate = response.costEstimate || (tokensUsed * 0.00002);
      
      economicModeV2.registerTokenUsage(
        functionName,
        tokensUsed,
        costEstimate
      );

      // 7. CACHE RESULTADO
      if (cacheKey) {
        economicModeV2.setCache(cacheKey, response.data, cacheTTL);
      }

      return {
        data: response.data,
        source: 'api',
        tokensUsed,
        costEstimate,
        timestamp: new Date(),
        modelUsed: selectedModel
      };

    } catch (error) {
      // TRATAMENTO DE ERROS
      if (error.status === 429) {
        return {
          error: 'RATE_LIMIT',
          message: 'OpenAI rate limit excedido. Tente em alguns minutos.',
          retryAfter: error.retryAfter || 60
        };
      }

      if (error.status === 401 || error.status === 403) {
        return {
          error: 'AUTH_FAILED',
          message: 'Falha de autenticação OpenAI'
        };
      }

      if (error.code === 'QUOTA_EXCEEDED') {
        economicModeV2.state.enabled = true;
        return {
          error: 'QUOTA_EXCEEDED',
          message: 'Cota de créditos atingida',
          status: economicModeV2.getStatus()
        };
      }

      return {
        error: 'AI_CALL_FAILED',
        message: error.message,
        originalError: error
      };
    }
  }

  /**
   * Chama backend com timeout
   */
  static async callBackend(functionName, payload) {
    // TODO: Integrar com base44.functions.invoke
    // Por enquanto, mock para validação
    return {
      data: null,
      tokensUsed: 0,
      costEstimate: 0
    };
  }

  /**
   * Validador de aprovação
   */
  static requireApproval(functionName) {
    const requiredApproval = [
      'investigacaoCampoReal',
      'generateWhatsAppProposal',
      'generateSpinSellingMessages'
    ];
    return requiredApproval.includes(functionName);
  }

  /**
   * Bloqueia chamadas paralelas
   */
  static createDebounce(fn, delay = 500) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        fn(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
    };
  }

  /**
   * Bloqueia retries infinitos
   */
  static async withRetry(fn, maxRetries = 2, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
}

// Pré-configure funções comuns
export const aiCalls = {
  generateSPIN: (clientId) =>
    SafeAICallV2.execute('generateSpinSellingMessages', { clientId }, {
      cacheKey: `spin_${clientId}`,
      requiresApproval: true,
      maxTokens: 300
    }),

  generateWhatsAppProposal: (clientId) =>
    SafeAICallV2.execute('generateWhatsAppProposal', { clientId }, {
      cacheKey: `proposal_${clientId}`,
      requiresApproval: true,
      maxTokens: 500
    }),

  investigateClinic: (clinicData) =>
    SafeAICallV2.execute('investigacaoCampoReal', clinicData, {
      requiresApproval: true,
      maxTokens: 800
    }),

  marketIntelligence: (city, keywords) =>
    SafeAICallV2.execute('marketIntelligenceQuery', { city, keywords }, {
      cacheKey: `market_${city}_${keywords}`,
      maxTokens: 500
    }),

  predictiveScoring: (clientData) =>
    SafeAICallV2.execute('predictiveLeadScoring', clientData, {
      cacheKey: `score_${clientData.id}`,
      maxTokens: 300
    })
};