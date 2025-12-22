// Sistema de pontuação automática de leads
export function calculateLeadScore(lead) {
  let score = 0;

  // Fonte (0-15 pontos)
  const sourceScores = {
    indicacao: 15,
    evento: 12,
    linkedin: 10,
    formulario_web: 8,
    google: 6,
    importacao_manual: 5,
    outro: 3
  };
  score += sourceScores[lead.source] || 0;

  // Tamanho da empresa (0-20 pontos)
  const sizeScores = {
    '200+': 20,
    '51-200': 15,
    '11-50': 10,
    '1-10': 5
  };
  score += sizeScores[lead.company_size] || 0;

  // Orçamento (0-25 pontos)
  const budgetScores = {
    '200k+': 25,
    '100k_200k': 20,
    '50k_100k': 15,
    'ate_50k': 10
  };
  score += budgetScores[lead.budget_range] || 0;

  // Urgência (0-20 pontos)
  const urgencyScores = {
    'imediata': 20,
    '1_3_meses': 15,
    '3_6_meses': 10,
    '6_meses+': 5
  };
  score += urgencyScores[lead.urgency] || 0;

  // Dados completos (0-20 pontos)
  let completeness = 0;
  if (lead.email) completeness += 5;
  if (lead.phone) completeness += 5;
  if (lead.company) completeness += 5;
  if (lead.city) completeness += 5;
  score += completeness;

  return Math.min(score, 100);
}

export function getLeadQuality(score) {
  if (score >= 70) return { label: 'Quente', color: 'bg-red-500', textColor: 'text-red-700' };
  if (score >= 40) return { label: 'Morno', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
  return { label: 'Frio', color: 'bg-blue-400', textColor: 'text-blue-700' };
}