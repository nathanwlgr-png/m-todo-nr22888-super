import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AILimitContext = createContext();

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias
const DAILY_QUOTA = 80; // Quota diária
const QUOTA_STORAGE_KEY = 'ai_daily_quota';

export function AILimitProtection({ children }) {
  const [limitReached, setLimitReached] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const [cache, setCache] = useState(() => {
    const stored = localStorage.getItem('ai_responses_cache');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('ai_responses_cache', JSON.stringify(cache));
  }, [cache]);

  // Verificar quota diária
  useEffect(() => {
    checkDailyQuota();
  }, []);

  const checkDailyQuota = () => {
    try {
      const quotaData = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (!quotaData) {
        resetDailyQuota();
        return;
      }
      
      const { count, date } = JSON.parse(quotaData);
      const today = new Date().toDateString();
      
      if (date !== today) {
        resetDailyQuota();
      } else {
        setDailyUsage(count);
        setQuotaExceeded(count >= DAILY_QUOTA);
      }
    } catch {
      resetDailyQuota();
    }
  };

  const resetDailyQuota = () => {
    const today = new Date().toDateString();
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({ count: 0, date: today }));
    setDailyUsage(0);
    setQuotaExceeded(false);
  };

  const trackAICall = () => {
    try {
      const quotaData = localStorage.getItem(QUOTA_STORAGE_KEY);
      const parsed = quotaData ? JSON.parse(quotaData) : null;
      const today = new Date().toDateString();
      
      if (!parsed || parsed.date !== today) {
        resetDailyQuota();
        return;
      }
      
      const newCount = parsed.count + 1;
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({ count: newCount, date: today }));
      setDailyUsage(newCount);
      
      if (newCount >= DAILY_QUOTA) {
        setQuotaExceeded(true);
      }
    } catch {}
  };

  const checkQuotaBeforeCall = () => {
    if (quotaExceeded) {
      return false;
    }
    return true;
  };

  const getCachedResponse = (key) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) return null;
    
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
      resetLimit,
      checkQuotaBeforeCall,
      trackAICall,
      dailyUsage,
      quotaExceeded,
      dailyQuota: DAILY_QUOTA
    }}>
      {quotaExceeded && (
        <Card className="m-4 p-3 bg-amber-50 border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              ⏱️
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-sm">Quota Diária Atingida</p>
              <p className="text-xs text-amber-700">{dailyUsage}/{DAILY_QUOTA} hoje. Reset automático amanhã.</p>
            </div>
          </div>
        </Card>
      )}
      {limitReached && !quotaExceeded && (
        <Card className="m-4 p-4 bg-orange-50 border-orange-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div className="flex-1">
              <p className="font-bold text-orange-900">Limite Mensal de IA</p>
              <p className="text-sm text-orange-700">Usando cache (30 dias) e templates locais.</p>
            </div>
            <Button size="sm" onClick={resetLimit} variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Tentar
            </Button>
          </div>
        </Card>
      )}
      {children}
    </AILimitContext.Provider>
  );
}

export const useAILimit = () => useContext(AILimitContext);