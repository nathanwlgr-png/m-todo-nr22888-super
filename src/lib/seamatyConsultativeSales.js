export const getClientDisplayName = (client = {}) =>
  client.clinic_name || client.full_name || client.first_name || client.client_name || client.recipient_name || client.destinatario_nome || 'cliente';

const normalize = (value) => String(value || '').toLowerCase();
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const hasAny = (...values) => values.some(hasValue);

export function buildConsultativeApproach(client = {}) {
  const numerologyNumber = client.numerology_number || client.life_path_number || null;
  const numberAsText = numerologyNumber ? String(numerologyNumber) : '';
  const profileText = [
    client.decision_style,
    client.behavioral_profile,
    client.client_tone,
    client.recommended_communication,
    client.approach_tips,
  ].filter(Boolean).join(' ').toLowerCase();
  const pipeline = client.pipeline_stage || 'lead';
  const status = client.status || 'morno';
  const score = Number(client.purchase_score || client.elite_score || 0);
  const hasRealDeadline = hasAny(client.decision_deadline, client.contract_signature_date, client.next_contact_date);

  let technique = 'Abordagem consultiva padrão com SPIN Selling';
  let techniqueReason = 'dados comerciais insuficientes para escolher uma técnica mais específica';

  if (profileText.includes('anal') || numberAsText === '7') {
    technique = 'SPIN Selling + prova técnica + comparativo';
    techniqueReason = 'perfil analítico ou numerologia 7 pede diagnóstico, evidência e comparação técnica';
  } else if (profileText.includes('lider') || profileText.includes('assert') || numberAsText === '1') {
    technique = 'Challenger Sale + autoridade + diferenciação regional';
    techniqueReason = 'perfil de liderança ou numerologia 1 responde melhor a visão forte e diferenciação';
  } else if (profileText.includes('relacion') || profileText.includes('recept') || ['2', '6'].includes(numberAsText)) {
    technique = 'Prova social + segurança + suporte';
    techniqueReason = 'perfil de relacionamento ou numerologia 2/6 precisa confiança, segurança e suporte';
  } else if (score >= 70 || ['proposta', 'negociacao'].includes(pipeline)) {
    technique = 'Compromisso e coerência + custo da inação';
    techniqueReason = 'score alto ou proposta em andamento pede avanço claro para decisão';
  }

  let ethicalTrigger = 'autoridade científica';
  if (['proposta', 'negociacao'].includes(pipeline) || score >= 70) ethicalTrigger = 'custo da inação';
  else if (['2', '6'].includes(numberAsText) || profileText.includes('relacion')) ethicalTrigger = 'prova social real';
  else if (profileText.includes('cautel') || status === 'frio') ethicalTrigger = 'redução de risco';
  if (hasRealDeadline) ethicalTrigger = 'urgência real baseada no prazo registrado';

  let likelyObjection = 'ainda não percebeu urgência';
  if (pipeline === 'fechado') likelyObjection = 'foco em pós-venda e recorrência';
  else if (['proposta', 'negociacao'].includes(pipeline) || status === 'quente') likelyObjection = 'pode estar adiando decisão por risco financeiro ou validação técnica';
  else if (pipeline === 'qualificado' || status === 'morno') likelyObjection = 'precisa comparar custo, suporte ou prioridade';

  const equipment = client.equipment_interest || client.equipment_sold || client.current_equipment || 'solução SEAMATY adequada ao perfil da clínica';
  const openingPhrase = `Olá, ${getClientDisplayName(client)}. Pelo que já levantamos, faz sentido revisar juntos se ${equipment} reduz atraso, risco operacional ou dependência externa na rotina da clínica?`;
  const priorityReason = [
    score ? `score ${score}` : null,
    pipeline ? `pipeline ${pipeline}` : null,
    status ? `status ${status}` : null,
    client.equipment_interest ? `interesse em ${client.equipment_interest}` : null,
    client.next_action ? `próxima ação registrada: ${client.next_action}` : null,
  ].filter(Boolean).join(' • ') || 'prioridade baseada nos dados já existentes do cliente';

  return {
    numerologyNumber,
    numerologyText: numerologyNumber ? String(numerologyNumber) : 'numerologia pendente — peça data de nascimento ou nome completo do decisor',
    numerologyTip: client.numerology_tip || 'base ainda não alimentada',
    decisionStyle: client.decision_style || 'base ainda não alimentada',
    bestDays: Array.isArray(client.melhores_dias_venda) && client.melhores_dias_venda.length > 0
      ? client.melhores_dias_venda
      : null,
    bestDaysText: Array.isArray(client.melhores_dias_venda) && client.melhores_dias_venda.length > 0
      ? client.melhores_dias_venda.join(', ')
      : 'melhor dia pendente — dado insuficiente para cálculo',
    status,
    pipeline,
    score,
    equipmentInterest: client.equipment_interest || 'base ainda não alimentada',
    nextAction: client.next_action || 'base ainda não alimentada',
    technique,
    techniqueReason,
    ethicalTrigger,
    likelyObjection,
    openingPhrase,
    priorityReason,
    hasRealDeadline,
  };
}