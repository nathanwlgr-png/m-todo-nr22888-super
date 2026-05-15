import * as React from 'react';
const { useState, useEffect, useCallback } = React;
import { base44 } from '@/api/base44Client';

const MONTHLY_LIMIT = 1000; // R$1.000,00 referência

export const useAIConsumption = () => {
  const [consumption, setConsumption] = useState({
    monthlySpent: null,       // null = ainda carregando
    percentageUsed: null,
    creditsRemaining: null,
    status: 'unknown',        // unknown | safe | warning | critical
    callsToday: null,
    callsThisWeek: null,
    lastUpdated: null,
    dataAvailable: false,     // false = fonte real não disponível
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

  const fetchRealConsumption = useCallback(async () => {
    try {
      // Tentar ler AuditLog para consumo real
      const logs = await base44.entities.AuditLog?.list('-created_date', 200).catch(() => null);

      if (!logs || logs.length === 0) {
        // Sem dados reais disponíveis — não inventar número
        setConsumption(prev => ({
          ...prev,
          dataAvailable: false,
          status: 'unknown',
          lastUpdated: new Date(),
        }));
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthLogs = logs.filter(l => new Date(l.created_date) >= startOfMonth);
      const weekLogs  = logs.filter(l => new Date(l.created_date) >= startOfWeek);
      const dayLogs   = logs.filter(l => new Date(l.created_date) >= startOfDay);

      // Somar créditos reais quando disponíveis
      const monthlySpent = monthLogs.reduce((acc, l) => acc + (l.cost_credits || 0), 0);
      const percentage = MONTHLY_LIMIT > 0 ? (monthlySpent / MONTHLY_LIMIT) * 100 : 0;

      let status = 'safe';
      if (percentage >= 90) status = 'critical';
      else if (percentage >= 70) status = 'warning';

      setConsumption({
        monthlySpent: Math.round(monthlySpent * 100) / 100,
        percentageUsed: Math.round(percentage * 10) / 10,
        creditsRemaining: Math.round((MONTHLY_LIMIT - monthlySpent) * 100) / 100,
        status,
        callsToday: dayLogs.length,
        callsThisWeek: weekLogs.length,
        lastUpdated: new Date(),
        dataAvailable: true,
      });
    } catch {
      // Falha silenciosa — não quebrar a UI
      setConsumption(prev => ({
        ...prev,
        dataAvailable: false,
        status: 'unknown',
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Carregar consumo real ao montar e atualizar a cada 10 minutos
  useEffect(() => {
    fetchRealConsumption();
    const interval = setInterval(fetchRealConsumption, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRealConsumption]);

  const toggleModule = useCallback((moduleName) => {
    setModuleStates(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
  }, []);

  const activateModule = useCallback((moduleName, estimatedCost) => {
    // Se não há dados reais, permitir ativação mas avisar
    if (consumption.dataAvailable && consumption.creditsRemaining !== null && consumption.creditsRemaining < estimatedCost) {
      return { success: false, message: 'Crédito insuficiente' };
    }
    toggleModule(moduleName);
    return { success: true, message: 'Módulo ativado' };
  }, [toggleModule, consumption.creditsRemaining, consumption.dataAvailable]);

  return {
    consumption,
    moduleStates,
    toggleModule,
    activateModule,
    MONTHLY_LIMIT,
    refresh: fetchRealConsumption,
  };
};