import { base44 } from '@/api/base44Client';

export const ELITE_OPERATION_MODE = 'PLANO_ELITE';

export const ELITE_MODELS = {
  commercial: 'gpt_5_5',
  audit: 'claude_opus_4_8',
  document: 'gemini_3_1_pro',
  routine: 'claude_sonnet_4_6',
  automatic: 'automatic',
};

const CATEGORY_MAP = {
  venda: 'commercial',
  crm: 'commercial',
  funil: 'commercial',
  score: 'commercial',
  proposta: 'commercial',
  decisao_comercial: 'commercial',
  priorizacao: 'commercial',
  fechamento: 'commercial',
  auditoria: 'audit',
  bug_dificil: 'audit',
  backend: 'audit',
  arquitetura: 'audit',
  erro_recorrente: 'audit',
  pdf: 'document',
  imagem: 'document',
  print: 'document',
  planilha: 'document',
  arquivo: 'document',
  extracao: 'document',
  mensagem_simples: 'routine',
  follow_up: 'routine',
  texto_comercial: 'routine',
  rotina: 'routine',
  simples: 'automatic',
};

export function chooseEliteModel(category = 'simples') {
  const normalized = String(category).toLowerCase().trim();
  const modelKey = CATEGORY_MAP[normalized] || 'automatic';
  return ELITE_MODELS[modelKey];
}

export function explainEliteModel(category = 'simples') {
  const model = chooseEliteModel(category);
  if (model === ELITE_MODELS.commercial) return 'Decisão com impacto direto em venda, funil, score, proposta ou fechamento.';
  if (model === ELITE_MODELS.audit) return 'Tarefa de auditoria, arquitetura, backend ou erro recorrente difícil.';
  if (model === ELITE_MODELS.document) return 'Análise de PDF, imagem, print, planilha, arquivo ou extração visual.';
  if (model === ELITE_MODELS.routine) return 'Mensagem simples, follow-up, texto comercial rápido ou rotina diária.';
  return 'Tarefa simples e sem impacto comercial relevante.';
}

export async function invokeEliteLLM({ category, prompt, response_json_schema, file_urls, add_context_from_internet = false }) {
  const model = chooseEliteModel(category);
  const payload = {
    prompt,
    model,
    add_context_from_internet,
  };
  if (response_json_schema) payload.response_json_schema = response_json_schema;
  if (file_urls) payload.file_urls = file_urls;
  return base44.integrations.Core.InvokeLLM(payload);
}

export async function logEliteRecommendation(data = {}) {
  return base44.entities.EliteAIRecommendationLog.create({
    data_hora: new Date().toISOString(),
    modo_operacional: ELITE_OPERATION_MODE,
    ...data,
  });
}