import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, CheckCircle2, MessageSquare, Calendar, FileText, Copy, Send, Phone } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PipelineAIAssistant({ client, interactions = [], visits = [], sales = [] }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedAction, setExpandedAction] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [messageTemplates, setMessageTemplates] = useState({});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => queryClient.invalidateQueries(['client'])
  });

  // Removido: geração automática para evitar rate limit
  // Agora é acionado apenas manualmente

  const generateSuggestion = async () => {
    setLoading(true);
    try {
      const lastInteractionDate = interactions.length > 0 
        ? new Date(interactions[0].created_date) 
        : null;
      const daysSinceContact = lastInteractionDate 
        ? Math.floor((new Date() - lastInteractionDate) / (1000*60*60*24)) 
        : 999;

      const visitHistory = visits.map(v => ({
        type: v.visit_type,
        date: v.scheduled_date,
        status: v.status,
        notes: v.result_notes || v.notes
      }));

      const interactionSummary = interactions.slice(0, 5).map(i => ({
        type: i.interaction_type,
        date: i.interaction_date,
        outcome: i.outcome,
        notes: i.notes
      }));

      const prompt = `Você é um consultor de vendas B2B veterinário especializado em pipeline e estratégia.

CLIENTE: ${client.first_name}
ETAPA ATUAL: ${client.visit_objective || 'diagnosticar_necessidades'}
PERFIL NUMEROLÓGICO: ${client.numerology_number} - ${client.behavioral_profile}
CAMINHO DE VIDA: ${client.life_path_number || 'N/A'}
ESTILO DECISÃO: ${client.decision_style}
STATUS: ${client.status} | SCORE: ${client.purchase_score}%
TIPO: ${client.client_type}
EQUIPAMENTO ATUAL: ${client.current_equipment || 'Nenhum'}
ORÇAMENTO: ${client.available_budget ? `R$ ${client.available_budget.toLocaleString('pt-BR')}` : 'Não informado'}
PRAZO DECISÃO: ${client.decision_deadline || 'Não definido'}
DORES: ${client.main_pains?.join(', ') || 'Não identificadas'}
MOTIVADORES: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
OBJEÇÕES: ${client.real_objections?.join(', ') || 'Nenhuma'}

HISTÓRICO DETALHADO:
- Total Interações: ${interactions.length} (${interactions.filter(i => i.outcome === 'positive').length} positivas, ${interactions.filter(i => i.outcome === 'negative').length} negativas)
- Total Visitas: ${visits.length} (${visits.filter(v => v.status === 'realizada').length} realizadas)
- Vendas Anteriores: ${sales.length}
- Dias Sem Contato: ${daysSinceContact}
- Última Visita: ${client.last_visit_date || 'Nenhuma'}

ÚLTIMAS 5 INTERAÇÕES:
${JSON.stringify(interactionSummary, null, 2)}

HISTÓRICO DE VISITAS:
${JSON.stringify(visitHistory, null, 2)}

ETAPAS DO FUNIL:
1. diagnosticar_necessidades - Diagnóstico inicial
2. apresentar_equipamento - Apresentação de soluções
3. demonstracao_tecnica - Demo técnica
4. negociar_proposta - Negociação comercial
5. fechar_venda - Fechamento

TAREFA:
Analise PROFUNDAMENTE o histórico e retorne JSON com estratégia completa:

{
  "next_stage": "etapa_recomendada",
  "confidence": 0-100,
  "reasoning": "Por que essa etapa agora (2-3 linhas)",
  "detailed_action_plan": [
    {
      "action_type": "whatsapp|email|call|visit|send_proposal",
      "title": "Título da ação",
      "description": "Descrição detalhada",
      "priority": "alta|media|baixa",
      "timing": "quando executar (ex: hoje 10h, amanhã, 3 dias)"
    }
  ],
  "estimated_days_to_close": número_dias,
  "risk_factors": ["risco 1 detalhado", "risco 2 detalhado"],
  "success_probability": 0-100,
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "numerology_tip": "Dica baseada no perfil numerológico",
  "next_3_steps": ["passo 1", "passo 2", "passo 3"]
}

Use SPIN Selling, Cialdini, e análise comportamental profunda.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            next_stage: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            detailed_action_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action_type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  timing: { type: "string" }
                }
              }
            },
            estimated_days_to_close: { type: "number" },
            risk_factors: { type: "array", items: { type: "string" } },
            success_probability: { type: "number" },
            key_insights: { type: "array", items: { type: "string" } },
            numerology_tip: { type: "string" },
            next_3_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestion(response);
    } catch (error) {
      console.error('Erro ao gerar sugestão:', error);
      toast.error('Erro ao analisar pipeline. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateMessageTemplate = async (action) => {
    setGeneratingMessage(true);
    try {
      const prompt = `Crie uma mensagem PERFEITA para a seguinte ação de vendas:

AÇÃO: ${action.title}
DESCRIÇÃO: ${action.description}
TIPO: ${action.action_type}

CLIENTE:
- Nome: ${client.first_name}
- Perfil: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo: ${client.decision_style}
- Status: ${client.status}
- Tom observado: ${client.client_tone || 'Não observado'}

CONTEXTO:
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

Retorne JSON:
{
  "subject": "Assunto (se email)",
  "message": "Mensagem completa pronta para enviar",
  "call_to_action": "Call-to-action específico",
  "framework": "Framework usado"
}

Adapte o tom ao perfil numerológico. Use SPIN + Cialdini.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" },
            call_to_action: { type: "string" },
            framework: { type: "string" }
          }
        }
      });

      setMessageTemplates({
        ...messageTemplates,
        [action.title]: result
      });
      setExpandedAction(action.title);
      toast.success('Mensagem gerada!');
    } catch (error) {
      console.error('Erro ao gerar mensagem:', error);
      toast.error('Erro ao gerar mensagem');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const applyStage = () => {
    updateMutation.mutate({ visit_objective: suggestion.next_stage });
  };

  const actionTypeIcons = {
    whatsapp: MessageSquare,
    email: FileText,
    call: Phone,
    visit: Calendar,
    send_proposal: FileText
  };

  const actionTypeColors = {
    whatsapp: 'bg-green-50 border-green-300',
    email: 'bg-blue-50 border-blue-300',
    call: 'bg-purple-50 border-purple-300',
    visit: 'bg-orange-50 border-orange-300',
    send_proposal: 'bg-indigo-50 border-indigo-300'
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensagem copiada!');
  };

  const sendViaWhatsApp = (message) => {
    if (client.phone) {
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast.error('Cliente sem WhatsApp cadastrado');
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <p className="text-sm text-purple-700">Analisando pipeline com IA...</p>
        </div>
      </Card>
    );
  }

  if (!suggestion) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Assistente de Pipeline IA</h3>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Analise o histórico completo e obtenha sugestões estratégicas personalizadas.
        </p>
        <Button
          onClick={generateSuggestion}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analisar Pipeline
        </Button>
      </Card>
    );
  }

  const stageLabels = {
    diagnosticar_necessidades: 'Diagnóstico',
    apresentar_equipamento: 'Apresentação',
    demonstracao_tecnica: 'Demo Técnica',
    negociar_proposta: 'Negociação',
    fechar_venda: 'Fechamento'
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900">Pipeline IA Avançado</h3>
        <Badge className="ml-auto bg-purple-600 text-white">{suggestion.confidence}%</Badge>
      </div>

      <div className="space-y-3">
        {/* Próxima Etapa Recomendada */}
        <div className="p-4 bg-white rounded-xl border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-600 font-bold">PRÓXIMA ETAPA</span>
            <Badge className="bg-green-500 text-white">
              {suggestion.success_probability}% sucesso
            </Badge>
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">
            {stageLabels[suggestion.next_stage]}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">{suggestion.reasoning}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-lg border border-purple-200 text-center">
            <p className="text-xs text-slate-500">Fechar em</p>
            <p className="text-2xl font-bold text-purple-600">
              {suggestion.estimated_days_to_close}
            </p>
            <p className="text-xs text-slate-500">dias</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-green-200 text-center">
            <p className="text-xs text-slate-500">Probabilidade</p>
            <p className="text-2xl font-bold text-green-600">
              {suggestion.success_probability}%
            </p>
          </div>
        </div>

        {/* Key Insights */}
        {suggestion.key_insights?.length > 0 && (
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">💡 INSIGHTS-CHAVE</p>
            <ul className="space-y-1">
              {suggestion.key_insights.map((insight, i) => (
                <li key={i} className="text-xs text-indigo-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">✓</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Numerology Tip */}
        {suggestion.numerology_tip && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1">🔮 DICA NUMEROLÓGICA</p>
            <p className="text-xs text-purple-600">{suggestion.numerology_tip}</p>
          </div>
        )}

        {/* Próximos 3 Passos */}
        {suggestion.next_3_steps?.length > 0 && (
          <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">📋 PRÓXIMOS 3 PASSOS</p>
            <ol className="space-y-1">
              {suggestion.next_3_steps.map((step, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-purple-600">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Plano de Ação Detalhado */}
        {suggestion.detailed_action_plan?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-purple-700 mb-2">🎯 PLANO DE AÇÃO DETALHADO</p>
            {suggestion.detailed_action_plan.map((action, i) => {
              const Icon = actionTypeIcons[action.action_type] || MessageSquare;
              const isExpanded = expandedAction === action.title;
              const hasTemplate = messageTemplates[action.title];
              
              return (
                <div key={i} className={`p-3 rounded-lg border-2 ${actionTypeColors[action.action_type] || 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-800 text-sm">{action.title}</p>
                        <Badge className={
                          action.priority === 'alta' ? 'bg-red-500 text-white' :
                          action.priority === 'media' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{action.description}</p>
                      <p className="text-xs text-slate-500">⏱️ {action.timing}</p>
                      
                      {/* Botão Gerar Mensagem */}
                      {!hasTemplate && (
                        <Button
                          onClick={() => generateMessageTemplate(action)}
                          disabled={generatingMessage}
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                        >
                          {generatingMessage ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                          )}
                          Gerar Mensagem IA
                        </Button>
                      )}

                      {/* Template de Mensagem Gerado */}
                      {hasTemplate && (
                        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-purple-200 space-y-2">
                          {messageTemplates[action.title].subject && (
                            <div>
                              <p className="text-xs font-semibold text-purple-600 mb-1">ASSUNTO:</p>
                              <p className="text-sm text-slate-700 font-medium">
                                {messageTemplates[action.title].subject}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">MENSAGEM:</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {messageTemplates[action.title].message}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">CALL-TO-ACTION:</p>
                            <p className="text-sm font-medium text-purple-700">
                              {messageTemplates[action.title].call_to_action}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-purple-100">
                            <p className="text-xs text-purple-500">
                              Framework: {messageTemplates[action.title].framework}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button
                              onClick={() => copyMessage(messageTemplates[action.title].message)}
                              size="sm"
                              variant="outline"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                            {action.action_type === 'whatsapp' && client.phone && (
                              <Button
                                onClick={() => sendViaWhatsApp(messageTemplates[action.title].message)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Riscos */}
        {suggestion.risk_factors?.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border-2 border-amber-300">
            <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ RISCOS IDENTIFICADOS</p>
            <ul className="space-y-1">
              {suggestion.risk_factors.map((risk, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                  <span className="mt-0.5 font-bold">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            onClick={applyStage}
            disabled={updateMutation.isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aplicar Etapa
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={generateSuggestion}
            disabled={loading}
            className="border-purple-300 text-purple-700"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}