import { createContext, useState, useEffect, useContext } from 'react';

export const AIGlobalContext = createContext(null);

export function AIGlobalProvider({ children }) {
  const [aiEnabled, setAiEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('seamty_ai_enabled') ?? 'true');
    } catch {
      return true;
    }
  });

  const [powerMode, setPowerMode] = useState(() => {
    try {
      return localStorage.getItem('seamty_power_mode') ?? 'profissional';
    } catch {
      return 'profissional';
    }
  });

  const [creditsEstimate, setCreditsEstimate] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('seamty_credits_estimate') ?? '{"daily":0,"monthly":0,"remaining":0}');
    } catch {
      return { daily: 0, monthly: 0, remaining: 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem('seamty_ai_enabled', JSON.stringify(aiEnabled));
  }, [aiEnabled]);

  useEffect(() => {
    localStorage.setItem('seamty_power_mode', powerMode);
  }, [powerMode]);

  useEffect(() => {
    localStorage.setItem('seamty_credits_estimate', JSON.stringify(creditsEstimate));
  }, [creditsEstimate]);

  const toggleAI = (enabled) => {
    setAiEnabled(enabled);
  };

  const setPowerModeValue = (mode) => {
    setPowerMode(mode);
  };

  const updateCreditsEstimate = (daily, monthly, remaining) => {
    setCreditsEstimate({ daily, monthly, remaining });
  };

  const value = {
    aiEnabled,
    toggleAI,
    powerMode,
    setPowerMode: setPowerModeValue,
    creditsEstimate,
    updateCreditsEstimate,
    shouldUseAI: (requiredMode = 'profissional') => {
      if (!aiEnabled) return false;
      const modePriority = { economico: 0, profissional: 1, supremo: 2, absoluto: 3 };
      return (modePriority[powerMode] ?? 1) >= (modePriority[requiredMode] ?? 1);
    }
  };

  return (
    <AIGlobalContext.Provider value={value}>
      {children}
    </AIGlobalContext.Provider>
  );
}

export function useAIGlobal() {
  const context = useContext(AIGlobalContext);
  if (!context) {
    // Retorna valores padrão em vez de lançar erro para evitar crashes
    return {
      aiEnabled: true,
      toggleAI: () => {},
      powerMode: 'profissional',
      setPowerMode: () => {},
      creditsEstimate: { daily: 0, monthly: 0, remaining: 0 },
      updateCreditsEstimate: () => {},
      shouldUseAI: () => true,
    };
  }
  return context;
}