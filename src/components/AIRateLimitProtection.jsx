import { useEffect } from 'react';

/**
 * Sistema de proteção contra rate limit de IA
 * Controla chamadas para evitar exceder limites
 */

const rateLimitTracker = {
  calls: [],
  maxCallsPerMinute: 10,
  cooldownUntil: null
};

export function useAIRateLimit() {
  const checkRateLimit = () => {
    const now = Date.now();
    
    // Limpar chamadas antigas (>1 minuto)
    rateLimitTracker.calls = rateLimitTracker.calls.filter(
      time => now - time < 60000
    );

    // Verificar cooldown
    if (rateLimitTracker.cooldownUntil && now < rateLimitTracker.cooldownUntil) {
      const waitSeconds = Math.ceil((rateLimitTracker.cooldownUntil - now) / 1000);
      throw new Error(`Aguarde ${waitSeconds}s antes de usar IA novamente`);
    }

    // Verificar limite
    if (rateLimitTracker.calls.length >= rateLimitTracker.maxCallsPerMinute) {
      rateLimitTracker.cooldownUntil = now + 30000; // 30s cooldown
      throw new Error('Limite de IA atingido. Aguarde 30 segundos.');
    }

    return true;
  };

  const recordCall = () => {
    rateLimitTracker.calls.push(Date.now());
  };

  return { checkRateLimit, recordCall };
}

/**
 * Wrapper para chamadas de IA com proteção de rate limit
 */
export async function safeAICall(aiFunction, ...args) {
  const { checkRateLimit, recordCall } = useAIRateLimit();
  
  checkRateLimit();
  recordCall();
  
  try {
    return await aiFunction(...args);
  } catch (error) {
    if (error.message?.includes('Rate limit')) {
      rateLimitTracker.cooldownUntil = Date.now() + 60000; // 1 min cooldown em erro real
    }
    throw error;
  }
}

export default function AIRateLimitProtection() {
  useEffect(() => {
    // Limpar tracker a cada 5 minutos
    const interval = setInterval(() => {
      const now = Date.now();
      rateLimitTracker.calls = rateLimitTracker.calls.filter(
        time => now - time < 60000
      );
      
      if (rateLimitTracker.cooldownUntil && now >= rateLimitTracker.cooldownUntil) {
        rateLimitTracker.cooldownUntil = null;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
}