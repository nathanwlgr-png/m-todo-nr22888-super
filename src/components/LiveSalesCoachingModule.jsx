import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Zap,
  BookOpen,
  MessageSquare,
  Brain,
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Live Sales Coaching Module
 * Fornece coaching em tempo real durante chamadas/role-play
 */
export default function LiveSalesCoachingModule({ client, visits = [], interactions = [] }) {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [playbook, setPlaybook] = useState(null);
  const [microAdjustments, setMicroAdjustments] = useState([]);
  const [frameworkScores, setFrameworkScores] = useState(null);
  const transcriptTimeoutRef = useRef(null);

  // Auto-análise quando transcript atualiza (debounced)
  useEffect(() => {
    if (isLiveMode && liveTranscript.length > 100) {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      
      transcriptTimeoutRef.current = setTimeout(() => {
        analyzeRealtimeConversation();
      }, 2000); // Analisa 2s após parar de digitar
    }
  }, [liveTranscript, isLiveMode]);

  const analyzeRealtimeConversation = async () => {
    if (!client || analyzing) return;
    
    setAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `PRIMORI LIVE COACHING - ANÁLISE INSTANTÂNEA

═══════════════════════════════════════
📊 PERFIL DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Estilo de Decisão: ${client.decision_style}
Tom Ideal: ${client.recommended_communication || 'Profissional'}
Status: ${client.status} | Score: ${client.purchase_score}%

═══════════════════════════════════════
💬 TRANSCRIÇÃO DA CONVERSA (ÚLTIMAS FALAS)
═══════════════════════════════════════
${liveTranscript.slice(-800)}

═══════════════════════════════════════
🎯 SUA MISSÃO - COACHING EM TEMPO REAL
═══════════════════════════════════════

Analise a conversa AGORA e forneça:

**1. ADERÊNCIA AOS FRAMEWORKS (0-10 cada)**
- SPIN Selling: [score/10] - comentário breve
- Numerologia: [score/10] - está adaptado ao perfil ${client.numerology_number}?
- Cialdini (Persuasão): [score/10] - gatilhos usados?
- Inteligência Emocional: [score/10] - empatia e tom
- Neurovendas: [score/10] - storytelling, ancoragem

**2. MICRO-AJUSTES IMEDIATOS (3-5 sugestões)**
Liste AÇÕES ESPECÍFICAS que o vendedor deve fazer NOS PRÓXIMOS 30 SEGUNDOS:
- [Ajuste 1]: O que fazer agora
- [Ajuste 2]: Frase exata para usar
- [Ajuste 3]: Tom de voz a ajustar
- [Ajuste 4]: Pergunta SPIN a fazer
- [Ajuste 5]: Gatilho Cialdini a explorar

**3. ALERTAS CRÍTICOS**
- 🔴 ERRO FATAL: [se houver - algo que pode perder a venda]
- 🟡 ATENÇÃO: [oportunidade sendo perdida]
- 🟢 ACERTO: [o que está funcionando bem]

**4. PRÓXIMA FRASE SUGERIDA**
Com base no perfil numerológico ${client.numerology_number}, sugira a PRÓXIMA FRASE EXATA que o vendedor deve dizer.

Seja INSTANTÂNEO, DIRETO e ACIONÁVEL. Foco em micro-mudanças imediatas.`,
        response_json_schema: {
          type: "object",
          properties: {
            framework_scores: {
              type: "object",
              properties: {
                spin: { type: "number" },
                spin_feedback: { type: "string" },
                numerologia: { type: "number" },
                numerologia_feedback: { type: "string" },
                cialdini: { type: "number" },
                cialdini_feedback: { type: "string" },
                inteligencia_emocional: { type: "number" },
                ie_feedback: { type: "string" },
                neurovendas: { type: "number" },
                neurovendas_feedback: { type: "string" }
              }
            },
            micro_ajustes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  prioridade: { type: "string" }
                }
              }
            },
            alertas: {
              type: "object",
              properties: {
                critico: { type: "string" },
                atencao: { type: "string" },
                acerto: { type: "string" }
              }
            },
            proxima_frase_sugerida: { type: "string" }
          }
        }
      });

      setFrameworkScores(analysis.framework_scores);
      setMicroAdjustments(analysis.micro_ajustes);
      setRealtimeFeedback(analysis);
      
      // Notificar se houver alerta crítico
      if (analysis.alertas.critico) {
        toast.error(`⚠️ ALERTA: ${analysis.alertas.critico}`, { duration: 5000 });
      }
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateDynamicPlaybook = async () => {
    if (!client) return;
    
    setAnalyzing(true);
    try {
      const playbookData = await base44.integrations.Core.InvokeLLM({
        prompt: `GERAÇÃO DE PLAYBOOK DINÂMICO

═══════════════════════════════════════
📊 CONTEXTO DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Tipo: ${client.client_type}
Decisor: ${client.decision_role}
Status Atual: ${client.status}
Score: ${client.purchase_score}%
Pipeline: ${client.pipeline_stage || 'lead'}
Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
Objeções Previstas: ${client.real_objections?.join(', ') || 'Nenhuma'}

═══════════════════════════════════════
📚 MISSÃO: PLAYBOOK PERSONALIZADO
═══════════════════════════════════════

Crie um playbook COMPLETO e ACIONÁVEL para vender para ${client.first_name}:

**1. ABERTURA PERFEITA (3 variações)**
Variação A: [Abordagem emocional]
Variação B: [Abordagem técnica]
Variação C: [Abordagem ROI]
Recomendada para perfil ${client.numerology_number}: [A/B/C]

**2. PERGUNTAS SPIN SEQUENCIAIS (6-8 perguntas)**
Liste perguntas na ordem exata, indicando tipo SPIN:
1. [S] Pergunta Situação: ...
2. [P] Pergunta Problema: ...
3. [I] Pergunta Implicação: ...
4. [N] Pergunta Need-Payoff: ...
(continue...)

**3. GATILHOS CIALDINI A EXPLORAR**
Prioridade 1: [Gatilho + Como usar + Momento]
Prioridade 2: [Gatilho + Como usar + Momento]
Prioridade 3: [Gatilho + Como usar + Momento]

**4. CONTROLE DE OBJEÇÕES (Top 5)**
Para cada objeção:
Objeção: [texto]
Técnica: [SPIN/Cialdini/IE]
Resposta Exata: [frase pronta]
Framework usado: [nome]

**5. FECHAMENTO ESTRATÉGICO**
Momento ideal: [quando pedir fechamento]
Frase de fechamento: [adaptada ao perfil numerológico]
Alternativa se houver resistência: [plano B]

**6. LINGUAGEM CORPORAL & TOM**
Tom de voz: [grave/agudo, pausado/rápido]
Postura: [descrição]
Gestos: [o que fazer/evitar]
Ritmo: [adaptar ao perfil]

Seja ULTRA-ESPECÍFICO. Cada frase deve ser COPIÁVEL e USÁVEL imediatamente.`,
        response_json_schema: {
          type: "object",
          properties: {
            aberturas: {
              type: "object",
              properties: {
                variacao_a: { type: "string" },
                variacao_b: { type: "string" },
                variacao_c: { type: "string" },
                recomendada: { type: "string" }
              }
            },
            perguntas_spin: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  pergunta: { type: "string" }
                }
              }
            },
            gatilhos_cialdini: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  como_usar: { type: "string" },
                  momento: { type: "string" }
                }
              }
            },
            objecoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  objecao: { type: "string" },
                  tecnica: { type: "string" },
                  resposta: { type: "string" },
                  framework: { type: "string" }
                }
              }
            },
            fechamento: {
              type: "object",
              properties: {
                momento_ideal: { type: "string" },
                frase_fechamento: { type: "string" },
                plano_b: { type: "string" }
              }
            },
            comunicacao_nao_verbal: {
              type: "object",
              properties: {
                tom_voz: { type: "string" },
                postura: { type: "string" },
                gestos: { type: "string" },
                ritmo: { type: "string" }
              }
            }
          }
        }
      });

      setPlaybook(playbookData);
      toast.success('Playbook gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar playbook');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
    if (!isLiveMode) {
      setLiveTranscript('');
      setRealtimeFeedback(null);
      setMicroAdjustments([]);
      setFrameworkScores(null);
    }
  };

  if (!client) {
    return (
      <Card className="p-6 text-center">
        <Brain className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-slate-600">Selecione um cliente para iniciar o coaching ao vivo</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Live Coaching AI</h3>
              <p className="text-xs text-purple-700">Feedback em tempo real • Playbooks dinâmicos</p>
            </div>
          </div>
          {isLiveMode && (
            <Badge className="bg-red-500 text-white animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white mr-2" />
              AO VIVO
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={toggleLiveMode}
            className={`flex-1 ${isLiveMode ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isLiveMode ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Parar Coaching
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Iniciar Coaching
              </>
            )}
          </Button>
          <Button
            onClick={generateDynamicPlaybook}
            disabled={analyzing}
            variant="outline"
            className="flex-1 border-purple-300"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Gerar Playbook
          </Button>
        </div>
      </Card>

      {/* Live Transcript Input */}
      {isLiveMode && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Transcrição da Conversa
            </label>
            {analyzing && (
              <Badge variant="outline" className="text-purple-600">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Analisando...
              </Badge>
            )}
          </div>
          <Textarea
            value={liveTranscript}
            onChange={(e) => setLiveTranscript(e.target.value)}
            placeholder="Cole ou digite a conversa aqui (atualiza automaticamente a análise)..."
            className="min-h-[120px] text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            💡 Dica: Cole transcrições de chamadas ou digite durante role-play
          </p>
        </Card>
      )}

      {/* Framework Scores */}
      {frameworkScores && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Aderência aos Frameworks Primori
          </h4>
          <div className="space-y-2">
            {[
              { name: 'SPIN Selling', score: frameworkScores.spin, feedback: frameworkScores.spin_feedback },
              { name: 'Numerologia', score: frameworkScores.numerologia, feedback: frameworkScores.numerologia_feedback },
              { name: 'Cialdini', score: frameworkScores.cialdini, feedback: frameworkScores.cialdini_feedback },
              { name: 'Int. Emocional', score: frameworkScores.inteligencia_emocional, feedback: frameworkScores.ie_feedback },
              { name: 'Neurovendas', score: frameworkScores.neurovendas, feedback: frameworkScores.neurovendas_feedback }
            ].map((framework, i) => (
              <div key={i} className="p-2 bg-white rounded border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{framework.name}</span>
                  <Badge className={
                    framework.score >= 8 ? 'bg-green-100 text-green-700' :
                    framework.score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {framework.score}/10
                  </Badge>
                </div>
                <Progress value={framework.score * 10} className="h-1.5 mb-1" />
                <p className="text-xs text-slate-600">{framework.feedback}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Micro-Adjustments */}
      {microAdjustments.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
          <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Micro-Ajustes IMEDIATOS (Próximos 30s)
          </h4>
          <div className="space-y-2">
            {microAdjustments.map((ajuste, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border-l-4 ${
                  ajuste.prioridade === 'alta' ? 'bg-red-50 border-red-500' :
                  ajuste.prioridade === 'media' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg font-bold text-slate-600">{i + 1}</span>
                  <p className="text-sm text-slate-800 flex-1">{ajuste.acao}</p>
                  <Badge variant="outline" className="text-xs">
                    {ajuste.prioridade}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alertas */}
      {realtimeFeedback?.alertas && (
        <div className="space-y-2">
          {realtimeFeedback.alertas.critico && (
            <Card className="p-3 bg-red-50 border-2 border-red-500">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-800">ERRO CRÍTICO</p>
                  <p className="text-sm text-red-700">{realtimeFeedback.alertas.critico}</p>
                </div>
              </div>
            </Card>
          )}
          {realtimeFeedback.alertas.atencao && (
            <Card className="p-3 bg-yellow-50 border border-yellow-500">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-yellow-800">ATENÇÃO</p>
                  <p className="text-sm text-yellow-700">{realtimeFeedback.alertas.atencao}</p>
                </div>
              </div>
            </Card>
          )}
          {realtimeFeedback.alertas.acerto && (
            <Card className="p-3 bg-green-50 border border-green-500">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-800">ACERTO!</p>
                  <p className="text-sm text-green-700">{realtimeFeedback.alertas.acerto}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Próxima Frase Sugerida */}
      {realtimeFeedback?.proxima_frase_sugerida && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300">
          <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Próxima Frase Sugerida
          </h4>
          <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
            <p className="text-sm text-slate-800 leading-relaxed">
              "{realtimeFeedback.proxima_frase_sugerida}"
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(realtimeFeedback.proxima_frase_sugerida);
              toast.success('Frase copiada!');
            }}
            className="mt-2 text-emerald-700"
          >
            📋 Copiar
          </Button>
        </Card>
      )}

      {/* Playbook Dinâmico */}
      {playbook && (
        <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Playbook Personalizado - {client.first_name}
          </h4>

          {/* Aberturas */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">🎯 Aberturas (3 Variações)</p>
            <div className="space-y-2">
              {['variacao_a', 'variacao_b', 'variacao_c'].map((key, i) => (
                <div key={i} className={`p-2 rounded ${playbook.aberturas.recomendada === String.fromCharCode(65 + i) ? 'bg-green-100 border-2 border-green-400' : 'bg-white border border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                      Variação {String.fromCharCode(65 + i)}
                      {playbook.aberturas.recomendada === String.fromCharCode(65 + i) && (
                        <Badge className="ml-2 bg-green-600 text-white text-xs">RECOMENDADA</Badge>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{playbook.aberturas[key]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Perguntas SPIN */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">❓ Sequência SPIN</p>
            <div className="space-y-1">
              {playbook.perguntas_spin.map((p, i) => (
                <div key={i} className="p-2 bg-white rounded border border-slate-200 flex items-start gap-2">
                  <Badge className={
                    p.tipo === 'S' ? 'bg-blue-100 text-blue-700' :
                    p.tipo === 'P' ? 'bg-red-100 text-red-700' :
                    p.tipo === 'I' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }>
                    {p.tipo}
                  </Badge>
                  <p className="text-sm text-slate-800 flex-1">{p.pergunta}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gatilhos Cialdini */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">🎯 Gatilhos Cialdini</p>
            <div className="space-y-2">
              {playbook.gatilhos_cialdini.map((g, i) => (
                <div key={i} className="p-2 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs font-bold text-purple-800">{g.gatilho}</p>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong>Como:</strong> {g.como_usar}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>Momento:</strong> {g.momento}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Objeções */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">🛡️ Controle de Objeções</p>
            <div className="space-y-2">
              {playbook.objecoes.map((obj, i) => (
                <div key={i} className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-xs font-bold text-red-800 mb-1">"{obj.objecao}"</p>
                  <Badge className="bg-blue-100 text-blue-700 text-xs mb-1">
                    {obj.tecnica} • {obj.framework}
                  </Badge>
                  <p className="text-sm text-slate-800 mt-1">
                    <strong>Resposta:</strong> "{obj.resposta}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fechamento */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">🏁 Fechamento Estratégico</p>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-300">
              <p className="text-xs text-slate-600 mb-1">
                <strong>Momento:</strong> {playbook.fechamento.momento_ideal}
              </p>
              <p className="text-sm text-slate-800 mb-2">
                <strong>Frase:</strong> "{playbook.fechamento.frase_fechamento}"
              </p>
              <p className="text-xs text-orange-700">
                <strong>Plano B:</strong> {playbook.fechamento.plano_b}
              </p>
            </div>
          </div>

          {/* Comunicação Não-Verbal */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">🗣️ Comunicação Não-Verbal</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-xs font-medium text-slate-600">Tom de Voz</p>
                <p className="text-xs text-slate-800">{playbook.comunicacao_nao_verbal.tom_voz}</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-xs font-medium text-slate-600">Ritmo</p>
                <p className="text-xs text-slate-800">{playbook.comunicacao_nao_verbal.ritmo}</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-xs font-medium text-slate-600">Postura</p>
                <p className="text-xs text-slate-800">{playbook.comunicacao_nao_verbal.postura}</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-xs font-medium text-slate-600">Gestos</p>
                <p className="text-xs text-slate-800">{playbook.comunicacao_nao_verbal.gestos}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}