/**
 * AICache — Cache de 30 dias para resultados de IA
 * Nunca recalcula se cache válido. Zero custo automático.
 */

const CACHE_PREFIX = 'ai_cache_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export const AICache = {
  /**
   * Gera chave de cache normalizada
   */
  key(type, params = {}) {
    const normalized = JSON.stringify({ type, ...params });
    // hash simples para chave curta
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
      hash |= 0;
    }
    return CACHE_PREFIX + type + '_' + Math.abs(hash);
  },

  /**
    * Salva resultado de IA no localStorage
    */
  set(type, params, result) {
    const k = this.key(type, params);
    const entry = {
      result,
      cached_at: Date.now(),
      expires_at: Date.now() + CACHE_TTL_MS,
      type,
      params_preview: JSON.stringify(params).slice(0, 100),
    };
    
    try {
      localStorage.setItem(k, JSON.stringify(entry));
      return true;
    } catch (e) {
      // Se localStorage cheio, limpar expirados e tentar novamente
      if (e.name === 'QuotaExceededError') {
        const removed = this.purgeExpired();
        if (removed > 0) {
          try {
            localStorage.setItem(k, JSON.stringify(entry));
            return true;
          } catch (e2) {
            console.warn('[AICache] Storage cheio mesmo após cleanup:', e2);
          }
        } else {
          // Se não há expirados, remover os 10 mais antigos
          const all = this.listAll();
          if (all.length > 0) {
            const sorted = all.sort((a, b) => new Date(a.cached_at) - new Date(b.cached_at));
            for (let i = 0; i < Math.min(10, sorted.length); i++) {
              localStorage.removeItem(sorted[i].key);
            }
            try {
              localStorage.setItem(k, JSON.stringify(entry));
              return true;
            } catch (e3) {
              console.warn('[AICache] Falha mesmo após remoção manual:', e3);
            }
          }
        }
      } else {
        console.warn('[AICache] Falha ao salvar cache:', e);
      }
      return false;
    }
  },

  /**
   * Lê cache se válido. Retorna null se expirado ou ausente.
   */
  get(type, params) {
    try {
      const k = this.key(type, params);
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.expires_at) {
        localStorage.removeItem(k);
        return null;
      }
      return entry.result;
    } catch {
      return null;
    }
  },

  /**
   * Verifica se existe cache válido (sem ler o conteúdo)
   */
  has(type, params) {
    return this.get(type, params) !== null;
  },

  /**
   * Retorna dias restantes do cache
   */
  daysLeft(type, params) {
    try {
      const k = this.key(type, params);
      const raw = localStorage.getItem(k);
      if (!raw) return 0;
      const entry = JSON.parse(raw);
      const ms = entry.expires_at - Date.now();
      return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    } catch {
      return 0;
    }
  },

  /**
   * Limpa cache expirado
   */
  purgeExpired() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      let removed = 0;
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const entry = JSON.parse(raw);
          if (Date.now() > entry.expires_at) {
            localStorage.removeItem(k);
            removed++;
          }
        }
      }
      return removed;
    } catch {
      return 0;
    }
  },

  /**
   * Lista todos os caches ativos
   */
  listAll() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      return keys.map(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        return {
          key: k,
          type: entry.type,
          cached_at: new Date(entry.cached_at).toLocaleDateString('pt-BR'),
          days_left: Math.max(0, Math.ceil((entry.expires_at - Date.now()) / 86400000)),
          valid: Date.now() < entry.expires_at,
        };
      }).filter(Boolean);
    } catch {
      return [];
    }
  },

  /**
   * Limpa TUDO
   */
  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  }
};

/**
 * Hook-like wrapper para uso em componentes React
 * Retorna: { cached, run, daysLeft }
 */
export function withAICache(type, params, apiFn) {
  return {
    cached: AICache.has(type, params),
    daysLeft: AICache.daysLeft(type, params),
    async run() {
      const cached = AICache.get(type, params);
      if (cached) return { result: cached, fromCache: true };
      const result = await apiFn();
      AICache.set(type, params, result);
      return { result, fromCache: false };
    }
  };
}