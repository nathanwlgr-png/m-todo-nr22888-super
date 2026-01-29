import React, { createContext, useContext, useState, useEffect } from 'react';

// Sistema de cache para reduzir chamadas de IA
const AICacheContext = createContext();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function AICacheProvider({ children }) {
  const [cache, setCache] = useState(() => {
    const stored = localStorage.getItem('ai_cache');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('ai_cache', JSON.stringify(cache));
  }, [cache]);

  const getCached = (key) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      // Cache expirado
      const newCache = { ...cache };
      delete newCache[key];
      setCache(newCache);
      return null;
    }
    
    return cached.data;
  };

  const setCached = (key, data) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  };

  const clearCache = () => {
    setCache({});
    localStorage.removeItem('ai_cache');
  };

  return (
    <AICacheContext.Provider value={{ getCached, setCached, clearCache }}>
      {children}
    </AICacheContext.Provider>
  );
}

export const useAICache = () => useContext(AICacheContext);