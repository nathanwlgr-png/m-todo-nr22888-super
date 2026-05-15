/**
 * MODO ECONOMIA NR22888
 * Sistema rigoroso de controle de consumo OpenAI
 * Prioridade: Estabilidade > Economia > IA avançada
 */

class EconomicModeV2 {
  constructor() {
    // Orçamento mensal em USD
    this.MONTHLY_BUDGET = 20;
    this.DAILY_LIMIT = this.MONTHLY_BUDGET / 30; // ~0.67/dia
    this.TOKEN_PRICE = 0.00002; // preço estimado por token (modelo mini)
    
    // Estado
    this.state = {
      enabled: true,
      monthStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      monthlySpent: 0,
      dailySpent: 0,
      dailyResetTime: new Date(),
      callsUsedToday: 0,
      maxCallsPerDay: 50,
      alertsSent: {
        fifty: false,
        seventyFive: false,
        ninety: false
      }
    };

    // Cache inteligente (24h)
    this.cache = new Map();
    this.CACHE_TTL = 24 * 60 * 60 * 1000;

    // Limites por função
    this.functionLimits = {
      generateSpinSellingMessages: { maxCalls: 3, tokensPerCall: 800 },
      generateWhatsAppProposal: { maxCalls: 2, tokensPerCall: 600 },
      investigacaoCampoReal: { maxCalls: 1, tokensPerCall: 2000 },
      marketIntelligenceQuery: { maxCalls: 2, tokensPerCall: 1000 },
      predictiveLeadScoring: { maxCalls: 5, tokensPerCall: 500 }
    };

    // Log de consumo
    this.consumptionLog = [];

    // Carregar do localStorage
    this.load();
  }

  /**
   * Verifica se pode fazer chamada IA
   */
  canMakeAICall(functionName = null) {
    // Reset diário
    this.resetDailyIfNeeded();

    // Verificar se modo está habilitado
    if (!this.enabled) return false;

    // Limite diário atingido?
    if (this.dailySpent >= this.DAILY_LIMIT) {
      this.checkAndSendAlerts();
      return false;
    }

    // Limite de calls hoje?
    if (this.callsUsedToday >= this.maxCallsPerDay) {
      return false;
    }

    // Limite específico da função?
    if (functionName && this.functionLimits[functionName]) {
      const limit = this.functionLimits[functionName];
      const todayUsage = this.consumptionLog.filter(
        log => log.function === functionName && this.isToday(log.timestamp)
      ).length;
      
      if (todayUsage >= limit.maxCalls) {
        return false;
      }
    }

    return true;
  }

  /**
   * Registra uso de tokens
   */
  registerTokenUsage(functionName, tokensUsed, costEstimate = null) {
    const cost = costEstimate || (tokensUsed * this.TOKEN_PRICE);
    
    this.monthlySpent += cost;
    this.dailySpent += cost;
    this.callsUsedToday++;

    this.consumptionLog.push({
      function: functionName,
      tokensUsed,
      costEstimate: cost,
      timestamp: new Date(),
      username: 'user' // será preenchido em runtime
    });

    // Manter apenas últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.consumptionLog = this.consumptionLog.filter(
      log => new Date(log.timestamp) > thirtyDaysAgo
    );

    // Verificar alertas
    this.checkAndSendAlerts();

    // Salvar
    this.save();

    return {
      monthlySpent: this.monthlySpent,
      percentageUsed: (this.monthlySpent / this.MONTHLY_BUDGET) * 100,
      remainingBudget: this.MONTHLY_BUDGET - this.monthlySpent
    };
  }

  /**
   * Ativa cache para evitar chamadas duplicadas
   */
  setCache(key, value, ttl = this.CACHE_TTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Recupera do cache
   */
  getCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Expirou?
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Retorna status do modo
   */
  getStatus() {
    this.resetDailyIfNeeded();
    
    const percentageUsed = (this.monthlySpent / this.MONTHLY_BUDGET) * 100;
    const modeLevel = percentageUsed >= 80 ? 'ECONOMICO' : 'NORMAL';
    const gptMode = percentageUsed >= 95 ? 'gpt-4.1-mini' : 'gpt-4o-mini';

    return {
      enabled: this.enabled,
      monthlyBudget: this.MONTHLY_BUDGET,
      monthlySpent: parseFloat(this.monthlySpent.toFixed(2)),
      dailySpent: parseFloat(this.dailySpent.toFixed(2)),
      dailyLimit: this.DAILY_LIMIT,
      remainingMonthly: parseFloat((this.MONTHLY_BUDGET - this.monthlySpent).toFixed(2)),
      percentageUsed: Math.round(percentageUsed),
      callsUsedToday: this.callsUsedToday,
      maxCallsPerDay: this.maxCallsPerDay,
      modeLevel,
      gptModel: gptMode,
      daysRemaining: this.getDaysRemainingInMonth(),
      canMakeAICall: this.canMakeAICall()
    };
  }

  /**
   * Seleciona modelo conforme budget
   */
  selectOptimalModel() {
    const status = this.getStatus();
    const percentageUsed = status.percentageUsed;

    if (percentageUsed >= 95) {
      return 'gpt-4.1-mini'; // mais econômico
    } else if (percentageUsed >= 80) {
      return 'gpt-4o-mini'; // balanço
    } else {
      return 'gpt-4o'; // premium
    }
  }

  /**
   * Verifica e envia alertas
   */
  async checkAndSendAlerts() {
    const percentageUsed = (this.monthlySpent / this.MONTHLY_BUDGET) * 100;

    // 50%
    if (percentageUsed >= 50 && !this.state.alertsSent.fifty) {
      await this.sendAlert('50% do orçamento IA atingido', percentageUsed);
      this.state.alertsSent.fifty = true;
    }

    // 75%
    if (percentageUsed >= 75 && !this.state.alertsSent.seventyFive) {
      await this.sendAlert('75% do orçamento IA atingido', percentageUsed);
      this.state.alertsSent.seventyFive = true;
    }

    // 90%
    if (percentageUsed >= 90 && !this.state.alertsSent.ninety) {
      await this.sendAlert('90% do orçamento IA atingido - CRÍTICO', percentageUsed);
      this.state.alertsSent.ninety = true;
    }

    this.save();
  }

  /**
   * Envia alerta para Nathan via WhatsApp
   */
  async sendAlert(message, percentageUsed) {
    // TODO: Integrar com WhatsApp ou notificação
    console.warn(`[ALERTA ECONOMIA] ${message} - ${percentageUsed.toFixed(1)}%`);
  }

  /**
   * Reset diário
   */
  resetDailyIfNeeded() {
    const today = new Date();
    const reset = new Date(this.state.dailyResetTime);
    
    if (today.toDateString() !== reset.toDateString()) {
      this.state.dailySpent = 0;
      this.state.callsUsedToday = 0;
      this.state.dailyResetTime = new Date();
      this.state.alertsSent = {
        fifty: false,
        seventyFive: false,
        ninety: false
      };
      this.save();
    }
  }

  /**
   * Verifica se é hoje
   */
  isToday(date) {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  /**
   * Retorna dias faltantes do mês
   */
  getDaysRemainingInMonth() {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24));
  }

  /**
   * Retorna relatório de consumo
   */
  getConsumptionReport() {
    const thisMonth = this.consumptionLog.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= this.state.monthStartDate;
    });

    const grouped = {};
    thisMonth.forEach(log => {
      if (!grouped[log.function]) {
        grouped[log.function] = {
          calls: 0,
          tokensTotal: 0,
          costTotal: 0
        };
      }
      grouped[log.function].calls++;
      grouped[log.function].tokensTotal += log.tokensUsed;
      grouped[log.function].costTotal += log.costEstimate;
    });

    return {
      period: `${this.state.monthStartDate.toLocaleDateString()} - hoje`,
      totalCalls: thisMonth.length,
      totalTokens: thisMonth.reduce((sum, log) => sum + log.tokensUsed, 0),
      totalCost: parseFloat(this.monthlySpent.toFixed(2)),
      byFunction: grouped
    };
  }

  /**
   * Salva estado no localStorage
   */
  save() {
    const data = {
      state: this.state,
      consumptionLog: this.consumptionLog
    };
    localStorage.setItem('economicMode_v2', JSON.stringify(data));
  }

  /**
   * Carrega estado do localStorage
   */
  load() {
    const data = localStorage.getItem('economicMode_v2');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.state = { ...this.state, ...parsed.state };
        this.consumptionLog = parsed.consumptionLog || [];
        
        // Verifica se é novo mês
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (new Date(this.state.monthStartDate) < monthStart) {
          this.resetMonth();
        }
      } catch (e) {
        console.error('Erro ao carregar Economic Mode:', e);
      }
    }
  }

  /**
   * Reset mensal
   */
  resetMonth() {
    this.state.monthStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.state.monthlySpent = 0;
    this.state.alertsSent = {
      fifty: false,
      seventyFive: false,
      ninety: false
    };
    this.save();
  }

  /**
   * Limpar logs (admin)
   */
  clearLogs() {
    this.consumptionLog = [];
    this.state.monthlySpent = 0;
    this.state.dailySpent = 0;
    this.state.callsUsedToday = 0;
    this.save();
  }
}

// Singleton global
export const economicModeV2 = new EconomicModeV2();