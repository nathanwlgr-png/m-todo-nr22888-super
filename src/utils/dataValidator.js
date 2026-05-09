/**
 * Validação de dados — Modo Verdade Absoluta
 * Nunca inventa, nunca assume, sempre marca status de confiança
 */

export const CONFIDENCE_LEVELS = {
  CONFIRMADO: 'confirmado', // Dados verificados no CRM ou público confirmado
  PROVAVEL: 'provavel', // Dados investigados mas não 100% confirmados
  HIPOTESE: 'hipotese', // Suposição baseada em lógica
  NAO_ENCONTRADO: 'nao_encontrado' // Não foi possível encontrar
};

/**
 * Validar antes de criar novo lead
 */
export async function validateBeforeCreatingLead(newLead, existingClients = []) {
  const errors = [];
  const warnings = [];

  // Check duplicidade por nome
  if (existingClients.some(c => 
    c.clinic_name?.toLowerCase() === newLead.company_name?.toLowerCase()
  )) {
    errors.push('Cliente com este nome já existe no CRM');
  }

  // Check duplicidade por telefone
  if (newLead.phone && existingClients.some(c => 
    c.phone?.replace(/\D/g, '') === newLead.phone.replace(/\D/g, '')
  )) {
    errors.push('Telefone já cadastrado em outro cliente');
  }

  // Check duplicidade por CNPJ
  if (newLead.cnpj && existingClients.some(c => 
    c.cnpj === newLead.cnpj
  )) {
    errors.push('CNPJ já existe no banco de dados');
  }

  // Avisos para dados incompletos
  if (!newLead.company_name) warnings.push('Nome não confirmado');
  if (!newLead.city) warnings.push('Cidade não confirmada');
  if (!newLead.phone) warnings.push('Telefone não confirmado');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canProceed: errors.length === 0,
    requiresValidation: warnings.length > 0
  };
}

/**
 * Classificar nível de confiança de um dado
 */
export function getConfidenceLevel(fieldName, fieldValue, source, isPublic = false) {
  if (!fieldValue || fieldValue === '') return CONFIDENCE_LEVELS.NAO_ENCONTRADO;
  
  // CRM é sempre confirmado
  if (source === 'CRM' || source === 'crm') return CONFIDENCE_LEVELS.CONFIRMADO;
  
  // Público confirmado é confirmado
  if (isPublic && source) return CONFIDENCE_LEVELS.CONFIRMADO;
  
  // Google/Instagram/Facebook é provável
  if (['google', 'instagram', 'facebook', 'site'].includes(source?.toLowerCase())) {
    return CONFIDENCE_LEVELS.PROVAVEL;
  }
  
  // API externa sem validação é hipótese
  return CONFIDENCE_LEVELS.HIPOTESE;
}

/**
 * Validar equipamento antes de sugerir insumo
 */
export function canSuggestConsumable(clientData) {
  if (!clientData.equipamento_confirmado) {
    return {
      canSuggest: false,
      reason: 'Equipamento não confirmado',
      action: 'Validar em visita ou ligação antes de oferecer insumo'
    };
  }
  
  if (!clientData.equipamento) {
    return {
      canSuggest: false,
      reason: 'Equipamento desconhecido',
      action: 'Confirmar qual equipamento cliente usa'
    };
  }

  return { canSuggest: true };
}

/**
 * Validar dados antes de rankear cliente
 */
export function validateBeforeRanking(clientData) {
  const issues = [];

  if (!clientData.id) issues.push('ID do cliente não encontrado');
  if (!clientData.clinic_name) issues.push('Nome não confirmado');
  if (!clientData.city) issues.push('Cidade não confirmada');
  if (!clientData.equipment_interest && !clientData.equipment_sold) {
    issues.push('Falta interesse/histórico de equipamento');
  }

  return {
    canRank: issues.length === 0,
    issues,
    requiresValidation: issues.length > 0,
    alertMessage: issues.length > 0 ? `Atenção: ${issues.join(', ')}` : null
  };
}

/**
 * Criar selo de confiança visual
 */
export function getConfidenceSeal(level) {
  const seals = {
    [CONFIDENCE_LEVELS.CONFIRMADO]: { icon: '🟢', label: 'Confirmado', color: 'bg-green-100' },
    [CONFIDENCE_LEVELS.PROVAVEL]: { icon: '🟡', label: 'Provável', color: 'bg-yellow-100' },
    [CONFIDENCE_LEVELS.HIPOTESE]: { icon: '🔴', label: 'Hipótese', color: 'bg-red-100' },
    [CONFIDENCE_LEVELS.NAO_ENCONTRADO]: { icon: '⚫', label: 'Não confirmado', color: 'bg-slate-100' }
  };
  
  return seals[level] || seals[CONFIDENCE_LEVELS.NAO_ENCONTRADO];
}

/**
 * Compilar fontes de um dado
 */
export function compileDataSource(fieldName, sources = []) {
  if (!sources || sources.length === 0) return 'Não informado';
  
  const uniqueSources = [...new Set(sources)];
  return uniqueSources.join(' • ');
}

/**
 * Validação pré-visita
 */
export function generatePreVisitChecklist(clientData) {
  const checklist = {
    nome_confirmado: !!clientData.clinic_name,
    cidade_confirmada: !!clientData.city,
    telefone_confirmado: !!clientData.phone,
    endereco_confirmado: !!clientData.address,
    responsavel_confirmado: !!clientData.first_name,
    equipamento_confirmado: !!clientData.equipment_sold,
    ultima_compra_confirmada: !!clientData.last_purchase_date,
    potencial_insumo_confirmado: clientData.current_equipment ? true : false,
    fonte_registrada: !!clientData.data_sources
  };

  const confirmados = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;
  const percentual = Math.round((confirmados / total) * 100);

  return {
    checklist,
    confirmados,
    total,
    percentual,
    prontoParaVisita: percentual >= 70,
    requisiçõesValidacao: Object.entries(checklist)
      .filter(([_, v]) => !v)
      .map(([k]) => k.replace(/_/g, ' '))
  };
}

export default {
  CONFIDENCE_LEVELS,
  validateBeforeCreatingLead,
  getConfidenceLevel,
  canSuggestConsumable,
  validateBeforeRanking,
  getConfidenceSeal,
  compileDataSource,
  generatePreVisitChecklist
};