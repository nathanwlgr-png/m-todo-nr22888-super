import EconomicMode from './EconomicMode';

/**
 * Wrapper seguro para chamadas IA
 * Respeita Modo Econômico, cache, e limites
 */
export class SafeAICall {
  
  static async generateSpinMessages(clientId, clientData) {
    const cacheKey = `spin_${clientId}`;
    
    return EconomicMode.withEconomicWrap(
      cacheKey,
      async () => {
        const response = await fetch('/api/generateSpinSellingMessages', {
          method: 'POST',
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao gerar mensagens SPIN');
        }
        
        return response.json();
      },
      { maxTokens: 300 }
    );
  }

  static async generateBriefing(clientId, clientData) {
    const cacheKey = `briefing_${clientId}`;
    
    return EconomicMode.withEconomicWrap(
      cacheKey,
      async () => {
        const response = await fetch('/api/generateVisitBriefing', {
          method: 'POST',
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao gerar briefing');
        }
        
        return response.json();
      },
      { maxTokens: 400 }
    );
  }

  static async generateMarketingContent(prompt) {
    const cacheKey = `marketing_${prompt.slice(0, 50)}`;
    
    return EconomicMode.withEconomicWrap(
      cacheKey,
      async () => {
        const response = await fetch('/api/generateMarketingContent', {
          method: 'POST',
          body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao gerar conteúdo marketing');
        }
        
        return response.json();
      },
      { maxTokens: 250 }
    );
  }

  static async fieldInvestigation(city, radius) {
    const cacheKey = `investigation_${city}_${radius}`;
    
    return EconomicMode.withEconomicWrap(
      cacheKey,
      async () => {
        const response = await fetch('/api/investigacaoCampoReal', {
          method: 'POST',
          body: JSON.stringify({ city, radius }),
        });
        
        if (!response.ok) {
          throw new Error('Erro na investigação');
        }
        
        return response.json();
      },
      { maxTokens: 500, useCacheFirst: true }
    );
  }

  // Chamadas que NUNCA devem ser automáticas
  static async shouldBlockAutomaticCall(context) {
    // Bloqueia se:
    // 1. Modo econômico está ativo
    // 2. É uma chamada automática (não foi clicada)
    // 3. É durante page load, componente render, etc
    
    if (!EconomicMode.isEnabled()) {
      return false; // Modo normal, permite
    }

    const blockedContexts = [
      'page_mount',
      'component_render',
      'background_polling',
      'auto_refresh',
      'on_focus',
      'on_scroll',
    ];

    return blockedContexts.includes(context);
  }

  // Status da IA para UI
  static getAIStatus() {
    const status = EconomicMode.getStatus();
    
    return {
      available: !EconomicMode.isEnabled() || status.remainingCalls > 0,
      economicMode: EconomicMode.isEnabled(),
      creditsRemaining: status.remainingCalls,
      message: status.remainingCalls <= 0
        ? '❌ Sem créditos IA disponíveis'
        : EconomicMode.isEnabled()
        ? `💚 Modo Econômico (${status.remainingCalls} chamadas)`
        : `⚡ Modo Normal (${status.callsToday}/${status.dailyLimit})`,
    };
  }
}

export default SafeAICall;