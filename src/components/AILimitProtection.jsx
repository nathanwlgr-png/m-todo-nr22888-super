import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AILimitContext = createContext();

export function AILimitProtection({ children }) {
  const [limitReached, setLimitReached] = useState(false);
  const [cache, setCache] = useState(() => {
    const stored = localStorage.getItem('ai_responses_cache');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('ai_responses_cache', JSON.stringify(cache));
  }, [cache]);

  const getCachedResponse = (key) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) return null; // 7 dias
    
    return cached.data;
  };

  const setCachedResponse = (key, data) => {
    setCache(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now() }
    }));
  };

  const handleLimitError = (error) => {
    const isLimitError = 
      error.message?.includes('limit') || 
      error.message?.includes('reached') ||
      error.message?.toLowerCase().includes('upgrade your plan');
    
    if (isLimitError) {
      setLimitReached(true);
      toast.error('⚠️ Limite de IA atingido. Usando cache e templates locais.', { duration: 5000 });
      return true;
    }
    return false;
  };

  const resetLimit = () => {
    setLimitReached(false);
    toast.success('Limite resetado. Tentando novamente...');
  };

  return (
    <AILimitContext.Provider value={{ 
      limitReached, 
      getCachedResponse, 
      setCachedResponse, 
      handleLimitError,
      resetLimit
    }}>
      {limitReached && (
        <Card className="m-4 p-4 bg-orange-50 border-orange-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div className="flex-1">
              <p className="font-bold text-orange-900">Limite de IA Atingido</p>
              <p className="text-sm text-orange-700">Usando respostas em cache. Recursos limitados temporariamente.</p>
            </div>
            <Button size="sm" onClick={resetLimit} variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}
      {children}
    </AILimitContext.Provider>
  );
}

export const useAILimit = () => useContext(AILimitContext);