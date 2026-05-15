// ─── MODO ECONÔMICO GLOBAL ───
// Controla consumo de IA em toda a aplicação

const ECONOMIC_MODE_KEY = 'SEAMATY_ECONOMIC_MODE';
const CACHE_KEY = 'SEAMATY_AI_CACHE';
const CREDIT_COUNTER_KEY = 'SEAMATY_CREDIT_COUNTER';

export class EconomicMode {
  static isEnabled() {
    const val = localStorage.getItem(ECONOMIC_MODE_KEY);
    return val !== 'false'; // true por padrão
  }

  static enable() {
    localStorage.setItem(ECONOMIC_MODE_KEY, 'true');
  }

  static disable() {
    localStorage.setItem(ECONOMIC_MODE_KEY, 'false');
  }

  static toggle() {
    const current = this.isEnabled();
    if (current) this.disable();
    else this.enable();
  }

  // ─── CACHE DE RESPOSTAS ───
  static getCachedResponse(key) {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = cache[key];
    
    if (!entry) return null;
    
    // Valida se ainda está dentro de 24h
    const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
    if (ageHours > 24) {
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return entry.response;
  }

  static setCachedResponse(key, response) {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = {
      response,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }

  static clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  // ─── CONTADOR DE CRÉDITOS ───
  static addCreditUsage(amount = 1) {
    const counter = JSON.parse(localStorage.getItem(CREDIT_COUNTER_KEY) || '{"calls": 0, "date": ""}');
    const today = new Date().toISOString().split('T')[0];
    
    // Reset se mudou de dia
    if (counter.date !== today) {
      counter.calls = 0;
      counter.date = today;
    }
    
    counter.calls += amount;
    localStorage.setItem(CREDIT_COUNTER_KEY, JSON.stringify(counter));
    
    return counter.calls;
  }

  static getCreditsUsedToday() {
    const counter = JSON.parse(localStorage.getItem(CREDIT_COUNTER_KEY) || '{"calls": 0, "date": ""}');
    const today = new Date().toISOString().split('T')[0];
    
    if (counter.date !== today) {
      return 0;
    }
    
    return counter.calls;
  }

  static resetDailyCounter() {
    const counter = {
      calls: 0,
      date: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(CREDIT_COUNTER_KEY, JSON.stringify(counter));
  }

  // ─── VALIDAÇÃO DE CHAMADA IA ───
  // Retorna true se pode fazer chamada IA
  static canMakeAICall(denyReason = null) {
    if (!this.isEnabled()) {
      denyReason && (denyReason.current = 'Modo Econômico Ativo');
      return false;
    }
    
    const creditsToday = this.getCreditsUsedToday();
    const dailyLimit = 50; // limite padrão
    
    if (creditsToday >= dailyLimit) {
      denyReason && (denyReason.current = `Limite diário atingido (${dailyLimit} chamadas)`);
      return false;
    }
    
    return true;
  }

  // ─── WRAPPER PARA FUNÇÕES IA ───
  // Envolve uma função para respeitar modo econômico
  static async withEconomicWrap(key, fn, options = {}) {
    const {
      useCacheFirst = true,
      saveToCache = true,
      maxTokens = 300,
    } = options;

    // Tenta cache primeiro
    if (useCacheFirst) {
      const cached = this.getCachedResponse(key);
      if (cached) {
        return { cached: true, data: cached };
      }
    }

    // Verifica se pode fazer chamada
    if (!this.canMakeAICall()) {
      return {
        error: 'IA temporariamente indisponível',
        hint: 'Desative Modo Econômico para usar IA',
        code: 'ECONOMIC_MODE_ACTIVE',
      };
    }

    try {
      // Executa função
      const result = await fn();
      
      // Registra uso
      this.addCreditUsage(1);
      
      // Salva em cache
      if (saveToCache && result?.data) {
        this.setCachedResponse(key, result.data);
      }
      
      return {
        cached: false,
        data: result?.data || result,
      };
    } catch (error) {
      return {
        error: error.message,
        code: 'AI_CALL_FAILED',
      };
    }
  }

  // ─── STATUS DO SISTEMA ───
  static getStatus() {
    return {
      enabled: this.isEnabled(),
      callsToday: this.getCreditsUsedToday(),
      dailyLimit: 50,
      remainingCalls: Math.max(0, 50 - this.getCreditsUsedToday()),
      cacheEnabled: true,
    };
  }
}

export default EconomicMode;