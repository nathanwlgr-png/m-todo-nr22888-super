// Sistema global de controle de uso de IA
// Importar e usar antes de cada call IA para economizar créditos

export function trackAIUsage(operationType = 'general') {
  const currentCount = parseInt(localStorage.getItem('nr22_ai_usage_count') || '0');
  const newCount = currentCount + 1;
  
  localStorage.setItem('nr22_ai_usage_count', newCount.toString());
  localStorage.setItem('nr22_last_ai_call', new Date().toISOString());
  
  // Registrar tipo de operação
  const usageLog = JSON.parse(localStorage.getItem('nr22_ai_usage_log') || '[]');
  usageLog.push({
    type: operationType,
    timestamp: new Date().toISOString(),
    count: newCount
  });
  
  // Manter apenas últimos 100 registros
  if (usageLog.length > 100) {
    usageLog.shift();
  }
  
  localStorage.setItem('nr22_ai_usage_log', JSON.stringify(usageLog));
  
  return newCount;
}

export function getAIUsageStats() {
  const count = parseInt(localStorage.getItem('nr22_ai_usage_count') || '0');
  const limit = 200; // Limite mensal
  const percentage = Math.round((count / limit) * 100);
  const remaining = limit - count;
  
  return {
    used: count,
    limit,
    percentage,
    remaining,
    isNearLimit: percentage >= 80,
    isOverLimit: percentage >= 100
  };
}

export function canUseAI(forceCheck = false) {
  const mode = localStorage.getItem('nr22_ai_mode') || 'manual';
  
  // Modo OFF = nunca usar
  if (mode === 'off') {
    return { allowed: false, reason: 'IA desligada' };
  }
  
  // Verificar limite
  const stats = getAIUsageStats();
  if (stats.isOverLimit) {
    return { allowed: false, reason: `Limite mensal atingido (${stats.used}/${stats.limit})` };
  }
  
  // Modo Manual = só quando forçado
  if (mode === 'manual' && !forceCheck) {
    return { allowed: false, reason: 'Modo manual - clique para usar IA' };
  }
  
  // Economy e Performance = permitir
  return { allowed: true, stats };
}

export function resetMonthlyUsage() {
  localStorage.setItem('nr22_ai_usage_count', '0');
  localStorage.setItem('nr22_ai_usage_log', '[]');
  return true;
}