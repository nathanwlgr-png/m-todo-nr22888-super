import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import {
  Sparkles, Loader2, Brain, TrendingUp, AlertTriangle,
  Star, Calendar, MessageSquare, FileText, Copy, Send,
  RefreshCw, ChevronDown, ChevronUp, Zap, Target
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
function ScoreRing({ value, label, color }) {
  const r = 28, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span className="text-lg font-bold -mt-12" style={{ color }}>{value}</span>
      <span className="text-[10px] text-slate-500 mt-6 text-center leading-tight">{label}</span>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded hover:bg-slate-100 transition">
      {copied ? <span className="text-xs text-green-600">✓</span> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ClientAIFieldsPanel({ client, interactions = [], visits = [], sales = [] }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [scriptType, setScriptType] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [expanded, setExpanded] = useState(true);

  // Build rich context string
  const buildContext = () => `
CLIENTE: ${client.first_name} | ${client.clinic_name || ''} | ${client.city || ''}
STATUS: ${client.status} | Score: ${client.purchase_score || 50}%
PERFIL: ${client.behavioral_profile || 'N/A'} | Numerologia: ${client.numerology_number || 'N/A'}
CAMINHO DE VIDA: ${client.life_path_number || 'N/A'} | Estilo: ${client.decision_style || 'N/A'}
TOM: ${client.client_tone || 'N/A'} | Tipo Clínica: ${client.client_type || 'N/A'}
EQUIPAMENTO ATUAL: ${client.current_equipment || 'Nenhum'} | INTERESSE: ${client.equipment_interest || 'N/A'}
DORES: ${client.main_pains?.join(', ') || 'N/A'}
OBJEÇÕES: ${client.real_objections?.join(', ') || 'Nenhuma'}
MOTIVADORES: ${client.purchase_motivators?.join(', ') || 'N/A'}
ORÇAMENTO: ${client.available_budget ? `R$ ${Number(client.available_budget).toLocaleString('pt-BR')}` : 'N/A'}
PIPELINE: ${client.pipeline_stage || 'N/A'}
VISITAS: ${visits.filter(v => v.status === 'realizada').length} realizadas
VENDAS FECHADAS: ${sales.filter(s => s.status === 'fechada').length}
INTERAÇÕES: ${interactions.length} registradas
ÚLTIMA VISITA: ${client.last_visit_date || 'Nenhuma'}
PRÓXIMA AÇÃO ATUAL: ${client.next_action || 'N/A'}
NOTAS: ${client.notes?.slice(0, 300) || 'Sem notas'}
`.trim();

  // ── Análise IA completa dos campos ────────────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um estrategista sênior de vendas consultivas de equipamentos diagnósticos veterinários.

${buildContext()}

Com base nesses dados, gere uma análise completa e salve os campos do CRM. Retorne JSON:
{
  "next_best_action": "Próxima melhor ação (1 frase concreta e específica)",
  "predictive_score": 82,
  "churn_risk": 15,
  "behavioral_profile_summary": "Resumo do perfil comportamental (numerologia + tom observado, 2 frases)",
  "best_contact_days": ["Segunda-feira", "Quarta-feira"],
  "best_contact_time": "Manhã (9h-11h)",
  "ai_segment": "VIP",
  "conversion_probability": 72,
  "ltv_estimate": 95000,
  "approach_strategy": "Estratégia de abordagem recomendada em 2-3 frases",
  "key_triggers": ["Gatilho 1", "Gatilho 2", "Gatilho 3"],
  "predicted_objections": ["Objeção 1", "Objeção 2"],
  "recommended_content": ["Conteúdo 1", "Conteúdo 2"],
  "sales_intelligence_summary": "Resumo executivo de inteligência de vendas (3-4 frases acionáveis)"
}

REGRAS:
- predictive_score: 0-100 (propensão de compra)
- churn_risk: 0-100 (risco de perda)
- conversion_probability: 0-100 (probabilidade de fechar esta venda)
- ai_segment: VIP | Champions | Potential | Nurture | At Risk | Cold | Dormant
- Seja ESPECÍFICO e ACIONÁVEL. Nunca genérico.`,
        response_json_schema: {
          type: "object",
          properties: {
            next_best_action: { type: "string" },
            predictive_score: { type: "number" },
            churn_risk: { type: "number" },
            behavioral_profile_summary: { type: "string" },
            best_contact_days: { type: "array", items: { type: "string" } },
            best_contact_time: { type: "string" },
            ai_segment: { type: "string" },
            conversion_probability: { type: "number" },
            ltv_estimate: { type: "number" },
            approach_strategy: { type: "string" },
            key_triggers: { type: "array", items: { type: "string" } },
            predicted_objections: { type: "array", items: { type: "string" } },
            recommended_content: { type: "array", items: { type: "string" } },
            sales_intelligence_summary: { type: "string" }
          }
        }
      });

      setAiData(result);

      // Save key fields back to the client entity
      await base44.entities.Client.update(client.id, {
        ai_next_best_action: result.next_best_action,
        purchase_score: result.predictive_score,
        ai_segment: result.ai_segment,
        attention_priority: result.churn_risk > 60 ? 1 : result.churn_risk > 30 ? 3 : 5,
        ltv_estimate: result.ltv_estimate,
        ai_sales_intelligence: {
          conversion_probability: result.conversion_probability,
          churn_risk: result.churn_risk,
          best_approach: result.approach_strategy,
          key_triggers: result.key_triggers,
          predicted_objections: result.predicted_objections,
          recommended_content: result.recommended_content,
          last_ai_analysis: new Date().toISOString()
        },
        melhores_dias_venda: result.best_contact_days
      });

      queryClient.invalidateQueries(['client', client.id]);
      toast.success('✅ Campos IA atualizados na ficha!');
    } catch (e) {
      toast.error('Erro na análise: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Chat com IA sobre o cliente ───────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const question = chatInput;
    setChatInput('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o Assistente Master de Vendas da NR22. Responda em português, de forma direta e acionável.

CONTEXTO DO CLIENTE:
${buildContext()}

PERGUNTA DO VENDEDOR: ${question}

Responda com foco total em ajudar a fechar a venda. Seja prático e específico.`
      });
      setChatResponse(res);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Gerador de Scripts e Propostas ────────────────────────────────────────
  const generateScript = async (type) => {
    setScriptType(type);
    setScriptLoading(true);
    setGeneratedScript('');
    try {
      const prompts = {
        script_ligacao: `Gere um script de ligação telefônica completo para o vendedor usar AGORA com ${client.first_name}. Inclua: abertura, qualificação, apresentação de valor, tratamento de objeções e fechamento. Use o perfil numerológico (${client.numerology_number}) e o tom (${client.client_tone || 'neutro'}). Equipamento: ${client.equipment_interest || 'a definir'}.`,
        script_whatsapp: `Gere uma mensagem de WhatsApp poderosa para enviar AGORA para ${client.first_name} (${client.clinic_name || 'clínica'}). Status: ${client.status}. Equipamento: ${client.equipment_interest || 'a definir'}. Perfil: ${client.behavioral_profile || 'N/A'}. Máximo 4 parágrafos, tom conversacional, personalize ao máximo.`,
        proposta_executiva: `Gere uma proposta comercial executiva completa em texto rico para ${client.first_name} / ${client.clinic_name || 'clínica'}. Inclua: apresentação, diagnóstico das necessidades (baseado nas dores identificadas), solução proposta (${client.equipment_interest || 'equipamento Seamaty'}), ROI e payback, condições e próximos passos. Use dados reais do perfil.`,
        email_followup: `Gere um email de follow-up profissional e personalizado para ${client.first_name}. Assunto e corpo completo. Status: ${client.status}. Use referencias ao perfil do cliente e ao equipamento de interesse (${client.equipment_interest || 'N/A'}). Tom: ${client.client_tone || 'profissional'}.`,
        roteiro_visita: `Monte um roteiro completo de visita para o vendedor visitar ${client.first_name} em ${client.clinic_name || 'sua clínica'}. Inclua: objetivos da visita, perguntas SPIN para fazer, argumentos de valor para o equipamento ${client.equipment_interest || 'Seamaty'}, como lidar com as objeções previstas (${client.real_objections?.join(', ') || 'N/A'}) e critérios de sucesso.`
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o melhor copywriter e estrategista de vendas consultivas do Brasil.

CONTEXTO COMPLETO DO CLIENTE:
${buildContext()}

TAREFA: ${prompts[type]}

Seja COMPLETO, ESPECÍFICO e PODEROSO. Use técnicas de Cialdini, SPIN Selling, programação neurolinguística e inteligência emocional. Adapte completamente ao perfil do cliente.`
      });

      setGeneratedScript(res);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setScriptLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Header Card */}
      <Card className="overflow-hidden border-2 border-indigo-300 shadow-lg">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">IA Integrada ao CRM</h3>
                <p className="text-indigo-200 text-xs">Análise automática + Scripts + Propostas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={runAnalysis} disabled={loading} size="sm"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold shadow-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span className="ml-1">{loading ? 'Analisando...' : 'Analisar Agora'}</span>
              </Button>
              <button onClick={() => setExpanded(!expanded)} className="text-white/70 hover:text-white">
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-4">
            {/* Scores Ring — usa dados salvos OU dados da análise recente */}
            {(() => {
              const score = aiData?.predictive_score ?? client.purchase_score ?? 50;
              const churn = aiData?.churn_risk ?? client.ai_sales_intelligence?.churn_risk ?? 0;
              const conv = aiData?.conversion_probability ?? client.ai_sales_intelligence?.conversion_probability ?? 0;
              return (
                <div className="flex justify-around py-2">
                  <ScoreRing value={score} label="Score Preditivo" color="#6366f1" />
                  <ScoreRing value={churn} label="Risco Perda" color={churn > 60 ? '#ef4444' : churn > 30 ? '#f59e0b' : '#22c55e'} />
                  <ScoreRing value={conv} label="Conv. Prevista" color="#8b5cf6" />
                </div>
              );
            })()}

            {/* Dados IA */}
            {(aiData || client.ai_next_best_action) && (
              <div className="space-y-3">
                {/* Próxima Melhor Ação */}
                {(aiData?.next_best_action || client.ai_next_best_action) && (
                  <div className="bg-green-50 border border-green-300 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-green-700 flex items-center gap-1">
                        <Target className="w-3 h-3" /> PRÓXIMA MELHOR AÇÃO
                      </p>
                      <CopyBtn text={aiData?.next_best_action || client.ai_next_best_action} />
                    </div>
                    <p className="text-sm text-green-900 font-medium">{aiData?.next_best_action || client.ai_next_best_action}</p>
                  </div>
                )}

                {/* Perfil Comportamental */}
                {(aiData?.behavioral_profile_summary || client.behavioral_profile) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
                      <Brain className="w-3 h-3" /> PERFIL COMPORTAMENTAL (NUMEROLOGIA)
                    </p>
                    <p className="text-xs text-purple-800">{aiData?.behavioral_profile_summary || client.behavioral_profile}</p>
                  </div>
                )}

                {/* Melhores Dias */}
                {(aiData?.best_contact_days || client.melhores_dias_venda) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> MELHORES DIAS PARA CONTATO
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(aiData?.best_contact_days || client.melhores_dias_venda || []).map((d, i) => (
                        <Badge key={i} className="bg-blue-600 text-white text-xs">{d}</Badge>
                      ))}
                      {aiData?.best_contact_time && (
                        <Badge className="bg-blue-100 text-blue-700 border border-blue-300 text-xs">
                          ⏰ {aiData.best_contact_time}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Gatilhos */}
                {(aiData?.key_triggers || client.ai_sales_intelligence?.key_triggers)?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-amber-700 mb-2">⚡ GATILHOS MAIS EFETIVOS</p>
                    <div className="space-y-1">
                      {(aiData?.key_triggers || client.ai_sales_intelligence?.key_triggers).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-amber-800">
                          <span className="w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</span>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objeções Previstas */}
                {(aiData?.predicted_objections || client.ai_sales_intelligence?.predicted_objections)?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> OBJEÇÕES PREVISTAS
                    </p>
                    <div className="space-y-1">
                      {(aiData?.predicted_objections || client.ai_sales_intelligence?.predicted_objections).map((o, i) => (
                        <p key={i} className="text-xs text-red-700">• {o}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo Executivo IA */}
                {aiData?.sales_intelligence_summary && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> INTELIGÊNCIA DE VENDAS
                      </p>
                      <CopyBtn text={aiData.sales_intelligence_summary} />
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{aiData.sales_intelligence_summary}</p>
                  </div>
                )}
              </div>
            )}

            {!aiData && !client.ai_next_best_action && (
              <div className="text-center py-4 text-slate-400 text-sm">
                Clique em <strong className="text-indigo-600">Analisar Agora</strong> para preencher automaticamente todos os campos de IA
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Gerador de Scripts e Propostas ────────────────────────────────── */}
      <Card className="border-2 border-purple-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-white" />
          <h3 className="text-white font-bold text-sm">Scripts & Propostas Personalizadas</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'script_ligacao', icon: '📞', label: 'Script Ligação' },
              { id: 'script_whatsapp', icon: '💬', label: 'Script WhatsApp' },
              { id: 'proposta_executiva', icon: '📄', label: 'Proposta Executiva' },
              { id: 'email_followup', icon: '✉️', label: 'Email Follow-up' },
              { id: 'roteiro_visita', icon: '🗓️', label: 'Roteiro de Visita' },
            ].map(({ id, icon, label }) => (
              <Button key={id} size="sm" variant="outline"
                onClick={() => generateScript(id)}
                disabled={scriptLoading && scriptType === id}
                className="h-auto py-2 text-xs justify-start gap-2 border-purple-200 hover:bg-purple-50">
                {scriptLoading && scriptType === id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <span>{icon}</span>}
                {label}
              </Button>
            ))}
          </div>

          {scriptLoading && (
            <div className="flex items-center gap-2 py-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-xs text-purple-600">Gerando conteúdo personalizado...</span>
            </div>
          )}

          {generatedScript && !scriptLoading && (
            <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-700 uppercase">{scriptType.replace(/_/g, ' ')}</p>
                <div className="flex gap-1">
                  <CopyBtn text={generatedScript} />
                  {client.phone && (
                    <button
                      onClick={() => window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(generatedScript.slice(0, 1800))}`, '_blank')}
                      className="p-1.5 rounded hover:bg-green-50 transition">
                      <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                    </button>
                  )}
                  <button onClick={() => setGeneratedScript('')} className="p-1.5 rounded hover:bg-slate-100 transition">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{generatedScript}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Chat com IA sobre o cliente ────────────────────────────────────── */}
      <Card className="border-2 border-green-200 overflow-hidden">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white" />
            <h3 className="text-white font-bold text-sm">Pergunte à IA sobre este cliente</h3>
          </div>
          {showChat ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </button>

        {showChat && (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                'Como abordar esse cliente hoje?',
                'Qual argumento usar para o equipamento?',
                'Como superar a objeção de preço?',
                'Quando é o melhor momento para fechar?',
                'Que conteúdo enviar agora?'
              ].map((q) => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="text-[10px] bg-green-50 border border-green-200 text-green-700 rounded-full px-2 py-0.5 hover:bg-green-100 transition">
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Pergunte qualquer coisa sobre esse cliente..."
                rows={2}
                className="flex-1 text-sm resize-none"
              />
              <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                className="bg-green-600 hover:bg-green-700 self-end">
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Loader2 className="w-3 h-3 animate-spin" /> Consultando IA Master de Vendas...
              </div>
            )}

            {chatResponse && !chatLoading && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-green-700">🤖 Assistente Master</p>
                  <CopyBtn text={chatResponse} />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{chatResponse}</p>
                <button onClick={() => { setChatResponse(''); setChatInput(''); }}
                  className="text-[10px] text-slate-400 mt-2 hover:text-slate-600">Nova pergunta</button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}