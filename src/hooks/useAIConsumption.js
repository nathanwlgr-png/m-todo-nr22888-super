import * as React from 'react';
const { useState, useEffect, useCallback } = React;

const MONTHLY_LIMIT = 1000; // R$1.000,00

export const useAIConsumption = () => {
  const [consumption, setConsumption] = useState({
    monthlySpent: 0,
    percentageUsed: 0,
    creditsRemaining: MONTHLY_LIMIT,
    status: 'safe', // safe | warning | critical
    lastUpdated: new Date(),
  });

  const [moduleStates, setModuleStates] = useState({
    predictive: false,
    segmentation: false,
    callAnalysis: false,
    maintenancePrediction: false,
    healthScoreMonitoring: false,
    dynamicPricing: false,
    playbooks: false,
    followUpPrioritization: false,
    personalizedContent: false,
    competitorMonitoring: false,
    visitOptimization: false,
    kpiReports: false,
    proactiveAlerts: false,
  });

  // Simular consumo (em produção, viria de audit log)
  const calculateConsumption = useCallback(() => {
    const simulatedCost = Math.random() * 950; // Simula gasto entre 0-950
    const percentage = (simulatedCost / MONTHLY_LIMIT) * 100;
    let status = 'safe';

    if (percentage >= 90) status = 'critical';
    else if (percentage >= 70) status = 'warning';

    setConsumption({
      monthlySpent: Math.round(simulatedCost * 100) / 100,
      percentageUsed: Math.round(percentage * 10) / 10,
      creditsRemaining: Math.round((MONTHLY_LIMIT - simulatedCost) * 100) / 100,
      status,
      lastUpdated: new Date(),
    });
  }, []);

  // Atualizar consumo a cada 5 minutos
  useEffect(() => {
    calculateConsumption();
    const interval = setInterval(calculateConsumption, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calculateConsumption]);

  // Toggle module state
  const toggleModule = useCallback((moduleName) => {
    setModuleStates((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  }, []);

  // Ativar módulo apenas se houver crédito
  const activateModule = useCallback((moduleName, estimatedCost) => {
    if (consumption.creditsRemaining < estimatedCost) {
      return { success: false, message: 'Crédito insuficiente' };
    }
    toggleModule(moduleName);
    return { success: true, message: 'Módulo ativado' };
  }, [toggleModule, consumption.creditsRemaining]);

  return {
    consumption,
    moduleStates,
    toggleModule,
    activateModule,
    MONTHLY_LIMIT,
  };
};