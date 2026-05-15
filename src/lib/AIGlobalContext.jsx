import React from 'react';

const AIGlobalContext = React.createContext(null);

export { AIGlobalContext };

export const AIGlobalProvider = ({ children }) => {
  const [aiEnabled, setAiEnabled] = React.useState(true);
  const [powerMode, setPowerMode] = React.useState('profissional');
  const [creditsEstimate, setCreditsEstimate] = React.useState({ daily: 0, monthly: 0, remaining: 0 });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('seamty_ai_enabled');
      if (stored !== null) setAiEnabled(JSON.parse(stored));
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('seamty_power_mode');
      if (stored) setPowerMode(stored);
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('seamty_credits_estimate');
      if (stored) setCreditsEstimate(JSON.parse(stored));
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem('seamty_ai_enabled', JSON.stringify(aiEnabled));
  }, [aiEnabled]);

  React.useEffect(() => {
    localStorage.setItem('seamty_power_mode', powerMode);
  }, [powerMode]);

  React.useEffect(() => {
    localStorage.setItem('seamty_credits_estimate', JSON.stringify(creditsEstimate));
  }, [creditsEstimate]);

  const value = {
    aiEnabled,
    toggleAI: (enabled) => setAiEnabled(enabled),
    powerMode,
    setPowerMode: (mode) => setPowerMode(mode),
    creditsEstimate,
    updateCreditsEstimate: (daily, monthly, remaining) => setCreditsEstimate({ daily, monthly, remaining }),
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
};

export const useAIGlobal = () => {
  const context = React.useContext(AIGlobalContext);
  if (!context) {
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
};