import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Brain, Target, MessageSquare, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function UltimateSalesStrategyAI({ client }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const generateUltimateStrategy = async () => {
    setLoading(true);
    try {
      const prompt = `Você é o MAIOR especialista mundial em vendas consultivas, combinando conhecimento de TODOS os principais livros, metodologias e estudos científicos de vendas.

📚 BIBLIOTECA DE REFERÊNCIA COMPLETA:

**VENDAS CONSULTIVAS & METODOLOGIAS:**
- SPIN Selling (Neil Rackham) - Situation, Problem, Implication, Need-Payoff
- The Challenger Sale (Dixon & Adamson) - Ensinar, Adaptar, Assumir Controle
- Gap Selling (Keenan) - Identificar gaps entre estado atual e desejado
- Solution Selling - Vender soluções, não produtos
- MEDDIC/MEDDPICC - Qualificação profunda (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition)
- Sandler Selling System - Pain, Budget, Decision
- Conceptual Selling - Alinhar conceitos com o cliente
- Customer Centric Selling - Foco total no cliente
- Value Selling - Demonstrar ROI e valor tangível

**PERSUASÃO & INFLUÊNCIA:**
- As Armas da Persuasão (Robert Cialdini) - 6 princípios: Reciprocidade, Compromisso/Coerência, Aprovação Social, Afeição, Autoridade, Escassez
- Pre-Suasion (Cialdini) - Preparar terreno antes da persuasão
- Influence: Science and Practice - Estudos científicos de persuasão

**NEGOCIAÇÃO:**
- Never Split the Difference (Chris Voss - Ex-FBI) - Negociação com reféns aplicada a vendas: Escuta Ativa, Espelhamento, Rotulagem de Emoções, Perguntas Calibradas
- Getting to Yes (Fisher & Ury) - Negociação de Harvard
- Start with NO (Jim Camp) - Inverter a lógica da negociação

**PSICOLOGIA & NEUROCIÊNCIA:**
- Neurovendas (Jürgen Klarić) - Como o cérebro toma decisões de compra (reptiliano, límbico, neocórtex)
- The Psychology of Selling (Brian Tracy) - Psicologia aplicada
- Thinking Fast and Slow (Daniel Kahneman) - Sistema 1 e Sistema 2 de decisão
- Predictably Irrational (Dan Ariely) - Economia comportamental

**COMUNICAÇÃO & RAPPORT:**
- Como Fazer Amigos e Influenciar Pessoas (Dale Carnegie) - Princípios atemporais de relacionamento
- PNL - Programação Neurolinguística aplicada a vendas
- Técnicas de Rapport Building - Espelhamento, Matching, Pacing and Leading
- Comunicação Não-Violenta (Marshall Rosenberg)

**PROSPECÇÃO & FECHAMENTO:**
- Fanatical Prospecting (Jeb Blount) - Prospecção sistemática e persistente
- The Little Red Book of Selling (Jeffrey Gitomer) - Princípios práticos
- Secrets of Closing the Sale (Zig Ziglar) - Técnicas de fechamento
- Way of the Wolf (Jordan Belfort) - Linha reta de persuasão
- The Ultimate Sales Machine (Chet Holmes) - Sistema de vendas

**ESTRATÉGIA & PODER:**
- A Arte da Guerra (Sun Tzu) - Estratégia militar aplicada a vendas
- As 48 Leis do Poder (Robert Greene) - Dinâmicas de poder
- 33 Estratégias de Guerra (Robert Greene) - Táticas estratégicas
- Antifrágil (Nassim Taleb) - Beneficiar-se da adversidade

**METODOLOGIAS MODERNAS:**
- Inbound Selling - Atrair vs. Perseguir
- Social Selling - Venda através de redes sociais
- Account-Based Selling - Foco em contas específicas
- Consultative Selling 2.0 - Consultoria estratégica

**ESTUDOS CIENTÍFICOS:**
- Estudo de Harvard sobre perguntas em vendas
- Pesquisas de Gong.io sobre padrões de vendas vencedoras
- Estudos de neurociência sobre decisão de compra
- Análises de conversão B2B de Forrester e Gartner

---

🎯 PERFIL COMPLETO DO CLIENTE:

**DADOS BÁSICOS:**
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Status: ${client.status} | Score: ${client.purchase_score}%

**PERFIL NUMEROLÓGICO:**
- Número: ${client.numerology_number || 'N/A'}
- Caminho de Vida: ${client.life_path_number || 'N/A'}
- Perfil Comportamental: ${client.behavioral_profile || 'N/A'}
- Estilo de Decisão: ${client.decision_style || 'N/A'}
- Tom Observado: ${client.client_tone || 'N/A'}

**SITUAÇÃO ATUAL:**
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Interesse: ${client.equipment_interest || 'Não definido'}
- Orçamento: R$ ${client.available_budget?.toLocaleString('pt-BR') || 'Não informado'}
- Prazo Decisão: ${client.decision_deadline || 'Não definido'}
- Volume Exames: ${client.current_volume || 'N/A'}

**CATÁLOGO SEAMATY/CIAMAT BRASIL (USE APENAS ESTES):**
- SMT-120VP (R$ 23.500) - Bioquímico veterinário
- QT3 (R$ 31.000) - Bioquímico multifuncional
- VG1 (R$ 28.000) - Gases e eletrólitos
- VG2 (R$ 33.000) - Gases + Imunofluorescência
- 3DX (R$ 55.000) - Minilab multifuncional
- VBC50A (R$ 70.000) - Hematológico 5 partes
- Vi1 (R$ 8.500) - Imunofluorescência
- VQ1 (R$ 45.000) - PCR veterinário

**DORES E MOTIVADORES:**
- Dores Identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores de Compra: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Objeções Reais: ${client.real_objections?.join(', ') || 'Nenhuma'}

**HISTÓRICO:**
- Visitas Realizadas: ${client.total_visits_count || 0}
- Última Visita: ${client.last_visit_date || 'Nunca'}
- Objetivo Atual: ${client.visit_objective || 'Não definido'}
- Notas: ${client.notes || 'Sem notas'}

---

🧠 TAREFA: Crie a ESTRATÉGIA DE VENDAS DEFINITIVA para este cliente específico.

Analise PROFUNDAMENTE usando TODAS as metodologias acima e retorne JSON estruturado:

{
  "personality_analysis": {
    "numerology_insights": "Análise numerológica profunda",
    "behavioral_type": "Tipo comportamental (Driver/Analítico/Expressivo/Amigável)",
    "decision_making_style": "Como este cliente toma decisões",
    "communication_preferences": "Preferências de comunicação",
    "trust_building_approach": "Como construir confiança com este perfil"
  },
  
  "strategic_framework": {
    "primary_methodology": "Metodologia principal a usar (SPIN/Challenger/Gap Selling/etc)",
    "why_this_methodology": "Por que esta metodologia é ideal para este cliente",
    "secondary_frameworks": ["Framework 2", "Framework 3"],
    "sun_tzu_strategy": "Estratégia da Arte da Guerra aplicável",
    "robert_greene_laws": ["Lei do Poder aplicável 1", "Lei 2"]
  },
  
  "cialdini_triggers": {
    "reciprocity": "Como usar reciprocidade",
    "commitment_consistency": "Como usar compromisso e coerência",
    "social_proof": "Provas sociais específicas a usar",
    "liking": "Como construir afinidade",
    "authority": "Como demonstrar autoridade",
    "scarcity": "Como criar urgência ética"
  },
  
  "neuro_selling": {
    "reptilian_brain": "Mensagens para cérebro reptiliano (segurança, dinheiro)",
    "limbic_brain": "Apelar emoções (relacionamento, status)",
    "neocortex": "Argumentos lógicos (dados, ROI, comparações)"
  },
  
  "chris_voss_negotiation": {
    "tactical_empathy": "Como usar empatia tática",
    "calibrated_questions": ["Pergunta calibrada 1", "Pergunta 2", "Pergunta 3"],
    "mirroring_technique": "Como espelhar este cliente",
    "labeling_emotions": "Emoções a rotular e validar",
    "accusation_audit": "Objeções a antecipar"
  },
  
  "spin_selling_sequence": {
    "situation_questions": ["Pergunta situação 1", "Pergunta 2"],
    "problem_questions": ["Pergunta problema 1", "Pergunta 2"],
    "implication_questions": ["Pergunta implicação 1", "Pergunta 2"],
    "need_payoff_questions": ["Pergunta need-payoff 1", "Pergunta 2"]
  },
  
  "challenger_approach": {
    "teach_insight": "Insight único a ensinar ao cliente",
    "tailor_message": "Como adaptar mensagem ao perfil",
    "take_control": "Como assumir controle da venda"
  },
  
  "gap_selling_analysis": {
    "current_state": "Estado atual detalhado",
    "desired_state": "Estado desejado",
    "gap_identified": "Gap específico identificado",
    "cost_of_inaction": "Custo de não agir (quantificado)",
    "impact_of_solution": "Impacto da solução"
  },
  
  "rapport_building": {
    "pnl_techniques": ["Técnica PNL 1", "Técnica 2"],
    "matching_pacing": "Como fazer matching e pacing",
    "dale_carnegie_principles": ["Princípio aplicável 1", "Princípio 2"],
    "trust_accelerators": ["Acelerador confiança 1", "Acelerador 2"]
  },
  
  "objection_handling": {
    "predicted_objections": [
      {
        "objection": "Objeção específica",
        "real_concern": "Preocupação real por trás",
        "response_framework": "Framework de resposta",
        "reframe": "Como reframing a objeção",
        "proof_elements": ["Prova 1", "Prova 2"]
      }
    ]
  },
  
  "closing_strategy": {
    "ideal_closing_technique": "Técnica de fechamento ideal",
    "ziglar_approach": "Técnica Zig Ziglar aplicável",
    "trial_closes": ["Trial close 1", "Trial close 2"],
    "final_close": "Fechamento final",
    "assumptive_language": "Linguagem assumptiva a usar"
  },
  
  "conversation_script": {
    "opening": "Abertura ideal (primeiros 30 segundos)",
    "discovery": "Perguntas de descoberta sequenciais",
    "presentation": "Como apresentar solução",
    "handling_resistance": "Como lidar com resistência",
    "closing": "Fechamento natural"
  },
  
  "communication_style": {
    "words_to_use": ["Palavra 1", "Palavra 2"],
    "words_to_avoid": ["Palavra 1", "Palavra 2"],
    "tone_of_voice": "Tom ideal",
    "pace_of_conversation": "Ritmo ideal",
    "body_language": "Linguagem corporal (se presencial)"
  },
  
  "value_proposition": {
    "quantified_roi": "ROI específico quantificado",
    "emotional_benefits": ["Benefício emocional 1", "Benefício 2"],
    "risk_reversal": "Como reverter percepção de risco",
    "competitive_advantage": "Vantagem competitiva clara"
  },
  
  "timing_strategy": {
    "best_day_week": "Melhor dia da semana",
    "best_time_day": "Melhor horário",
    "numerology_lucky_dates": "Datas favoráveis (numerologia)",
    "urgency_creation": "Como criar urgência sem pressão"
  },
  
  "follow_up_cadence": {
    "sequence": [
      {
        "day": 0,
        "channel": "canal",
        "message_type": "tipo",
        "goal": "objetivo"
      }
    ]
  },
  
  "psychological_triggers": {
    "loss_aversion": "Como usar aversão à perda",
    "anchoring": "Como usar ancoragem de preço",
    "framing_effect": "Como enquadrar oferta",
    "commitment_escalation": "Como escalar compromisso gradualmente"
  },
  
  "personalized_recommendations": {
    "do_this": ["Ação específica 1", "Ação 2", "Ação 3"],
    "never_do_this": ["Evitar 1", "Evitar 2"],
    "secret_weapon": "Arma secreta para este cliente específico",
    "winning_probability": 85
  }
}

INSTRUÇÕES CRÍTICAS:
- Seja ULTRA-ESPECÍFICO para ESTE cliente
- Use TODAS as metodologias de forma integrada
- Baseie-se em dados REAIS do cliente
- Combine ciência + psicologia + numerologia
- Forneça estratégia ACIONÁVEL e PRÁTICA
- Quantifique sempre que possível
- Use estudos científicos para validar abordagens`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            personality_analysis: {
              type: "object",
              properties: {
                numerology_insights: { type: "string" },
                behavioral_type: { type: "string" },
                decision_making_style: { type: "string" },
                communication_preferences: { type: "string" },
                trust_building_approach: { type: "string" }
              }
            },
            strategic_framework: {
              type: "object",
              properties: {
                primary_methodology: { type: "string" },
                why_this_methodology: { type: "string" },
                secondary_frameworks: { type: "array", items: { type: "string" } },
                sun_tzu_strategy: { type: "string" },
                robert_greene_laws: { type: "array", items: { type: "string" } }
              }
            },
            cialdini_triggers: {
              type: "object",
              properties: {
                reciprocity: { type: "string" },
                commitment_consistency: { type: "string" },
                social_proof: { type: "string" },
                liking: { type: "string" },
                authority: { type: "string" },
                scarcity: { type: "string" }
              }
            },
            neuro_selling: {
              type: "object",
              properties: {
                reptilian_brain: { type: "string" },
                limbic_brain: { type: "string" },
                neocortex: { type: "string" }
              }
            },
            chris_voss_negotiation: {
              type: "object",
              properties: {
                tactical_empathy: { type: "string" },
                calibrated_questions: { type: "array", items: { type: "string" } },
                mirroring_technique: { type: "string" },
                labeling_emotions: { type: "string" },
                accusation_audit: { type: "string" }
              }
            },
            spin_selling_sequence: {
              type: "object",
              properties: {
                situation_questions: { type: "array", items: { type: "string" } },
                problem_questions: { type: "array", items: { type: "string" } },
                implication_questions: { type: "array", items: { type: "string" } },
                need_payoff_questions: { type: "array", items: { type: "string" } }
              }
            },
            challenger_approach: {
              type: "object",
              properties: {
                teach_insight: { type: "string" },
                tailor_message: { type: "string" },
                take_control: { type: "string" }
              }
            },
            gap_selling_analysis: {
              type: "object",
              properties: {
                current_state: { type: "string" },
                desired_state: { type: "string" },
                gap_identified: { type: "string" },
                cost_of_inaction: { type: "string" },
                impact_of_solution: { type: "string" }
              }
            },
            rapport_building: {
              type: "object",
              properties: {
                pnl_techniques: { type: "array", items: { type: "string" } },
                matching_pacing: { type: "string" },
                dale_carnegie_principles: { type: "array", items: { type: "string" } },
                trust_accelerators: { type: "array", items: { type: "string" } }
              }
            },
            objection_handling: {
              type: "object",
              properties: {
                predicted_objections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      objection: { type: "string" },
                      real_concern: { type: "string" },
                      response_framework: { type: "string" },
                      reframe: { type: "string" },
                      proof_elements: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            },
            closing_strategy: {
              type: "object",
              properties: {
                ideal_closing_technique: { type: "string" },
                ziglar_approach: { type: "string" },
                trial_closes: { type: "array", items: { type: "string" } },
                final_close: { type: "string" },
                assumptive_language: { type: "string" }
              }
            },
            conversation_script: {
              type: "object",
              properties: {
                opening: { type: "string" },
                discovery: { type: "string" },
                presentation: { type: "string" },
                handling_resistance: { type: "string" },
                closing: { type: "string" }
              }
            },
            communication_style: {
              type: "object",
              properties: {
                words_to_use: { type: "array", items: { type: "string" } },
                words_to_avoid: { type: "array", items: { type: "string" } },
                tone_of_voice: { type: "string" },
                pace_of_conversation: { type: "string" },
                body_language: { type: "string" }
              }
            },
            value_proposition: {
              type: "object",
              properties: {
                quantified_roi: { type: "string" },
                emotional_benefits: { type: "array", items: { type: "string" } },
                risk_reversal: { type: "string" },
                competitive_advantage: { type: "string" }
              }
            },
            timing_strategy: {
              type: "object",
              properties: {
                best_day_week: { type: "string" },
                best_time_day: { type: "string" },
                numerology_lucky_dates: { type: "string" },
                urgency_creation: { type: "string" }
              }
            },
            follow_up_cadence: {
              type: "object",
              properties: {
                sequence: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      channel: { type: "string" },
                      message_type: { type: "string" },
                      goal: { type: "string" }
                    }
                  }
                }
              }
            },
            psychological_triggers: {
              type: "object",
              properties: {
                loss_aversion: { type: "string" },
                anchoring: { type: "string" },
                framing_effect: { type: "string" },
                commitment_escalation: { type: "string" }
              }
            },
            personalized_recommendations: {
              type: "object",
              properties: {
                do_this: { type: "array", items: { type: "string" } },
                never_do_this: { type: "array", items: { type: "string" } },
                secret_weapon: { type: "string" },
                winning_probability: { type: "number" }
              }
            }
          }
        }
      });

      setStrategy(result);
      
      // Criar tarefa automática com melhor dia/horário
      if (result.timing_strategy?.best_day_week && result.timing_strategy?.best_time_day) {
        try {
          const nextDate = new Date();
          // Encontrar próximo dia da semana recomendado
          const dayMap = { 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6, 'domingo': 0 };
          const targetDay = dayMap[result.timing_strategy.best_day_week.toLowerCase()];
          const currentDay = nextDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
          nextDate.setDate(nextDate.getDate() + daysUntilTarget);
          
          await base44.entities.Task.create({
            client_id: client.id,
            client_name: client.first_name,
            title: `🎯 Contato Estratégico - ${client.first_name}`,
            description: `Melhor momento para contato baseado em análise científica:\n\n⏰ ${result.timing_strategy.best_time_day}\n📅 ${result.timing_strategy.best_day_week}\n🔮 ${result.timing_strategy.numerology_lucky_dates}\n\n💡 ${result.personalized_recommendations.secret_weapon}`,
            due_date: nextDate.toISOString().split('T')[0],
            priority: 'alta',
            type: 'ligacao',
            auto_created: true
          });
        } catch (error) {
          console.error('Erro ao criar tarefa:', error);
        }
      }
      
      toast.success('Estratégia gerada + tarefa criada!');
    } catch (error) {
      console.error('Erro ao gerar estratégia:', error);
      toast.error('Erro ao gerar estratégia');
    } finally {
      setLoading(false);
    }
  };

  if (!strategy) {
    return (
      <Card className="p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 border-none shadow-2xl">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Estratégia de Vendas Definitiva</h3>
              <p className="text-xs text-white/80">Baseada em 30+ livros e estudos científicos</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3">
            <p className="text-xs text-white/90 leading-relaxed">
              Análise profunda combinando <strong>SPIN Selling</strong>, <strong>Challenger Sale</strong>, <strong>Chris Voss (FBI)</strong>, <strong>Cialdini</strong>, <strong>Neurovendas</strong>, <strong>Arte da Guerra</strong> e mais 25 metodologias + numerologia personalizada.
            </p>
          </div>

          <Button
            onClick={generateUltimateStrategy}
            disabled={loading}
            className="w-full h-12 bg-white text-purple-700 hover:bg-white/90 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando com 30+ frameworks...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Estratégia Completa
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <h3 className="font-bold">Estratégia Definitiva Gerada</h3>
              <p className="text-xs text-white/80">Probabilidade de Sucesso: {strategy.personalized_recommendations.winning_probability}%</p>
            </div>
          </div>
          <Button
            onClick={() => setStrategy(null)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            Recarregar
          </Button>
        </div>
      </Card>

      {/* Personality Analysis */}
      <Card className="p-4 bg-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-purple-600" />
          <h4 className="font-bold text-slate-800">Análise de Personalidade</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-purple-600 font-medium">Tipo Comportamental</p>
            <p className="text-slate-800">{strategy.personality_analysis.behavioral_type}</p>
          </div>
          <div>
            <p className="text-xs text-purple-600 font-medium">Insights Numerológicos</p>
            <p className="text-slate-700 text-xs leading-relaxed">{strategy.personality_analysis.numerology_insights}</p>
          </div>
          <div>
            <p className="text-xs text-purple-600 font-medium">Estilo de Decisão</p>
            <p className="text-slate-700 text-xs">{strategy.personality_analysis.decision_making_style}</p>
          </div>
        </div>
      </Card>

      {/* Strategic Framework */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-slate-800">Framework Estratégico</h4>
        </div>
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-indigo-600 font-medium mb-1">Metodologia Principal</p>
            <Badge className="bg-indigo-600 text-white mb-2">{strategy.strategic_framework.primary_methodology}</Badge>
            <p className="text-xs text-slate-700">{strategy.strategic_framework.why_this_methodology}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-indigo-600 font-medium mb-1">Frameworks Complementares</p>
            <div className="flex flex-wrap gap-1">
              {strategy.strategic_framework.secondary_frameworks.map((fw, i) => (
                <Badge key={i} variant="outline" className="text-xs">{fw}</Badge>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700 font-medium mb-1">⚔️ Arte da Guerra - Sun Tzu</p>
            <p className="text-xs text-slate-700">{strategy.strategic_framework.sun_tzu_strategy}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs text-red-700 font-medium mb-1">👑 Leis do Poder - Robert Greene</p>
            {strategy.strategic_framework.robert_greene_laws.map((law, i) => (
              <p key={i} className="text-xs text-slate-700">• {law}</p>
            ))}
          </div>
        </div>
      </Card>

      {/* Cialdini Triggers */}
      <Card className="p-4 bg-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-slate-800">6 Gatilhos de Cialdini</h4>
        </div>
        <div className="space-y-2">
          {Object.entries(strategy.cialdini_triggers).map(([key, value]) => (
            <div key={key} className="bg-orange-50 rounded-lg p-2 border border-orange-200">
              <p className="text-xs text-orange-700 font-medium capitalize">{key.replace('_', ' ')}</p>
              <p className="text-xs text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Neuro Selling */}
      <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-pink-600" />
          <h4 className="font-bold text-slate-800">Neurovendas - Jürgen Klarić</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-white rounded-lg p-2">
            <p className="text-pink-600 font-medium">🦎 Cérebro Reptiliano (Sobrevivência)</p>
            <p className="text-slate-700">{strategy.neuro_selling.reptilian_brain}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-pink-600 font-medium">❤️ Cérebro Límbico (Emoção)</p>
            <p className="text-slate-700">{strategy.neuro_selling.limbic_brain}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-pink-600 font-medium">🧠 Neocórtex (Lógica)</p>
            <p className="text-slate-700">{strategy.neuro_selling.neocortex}</p>
          </div>
        </div>
      </Card>

      {/* Chris Voss - FBI Negotiation */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-slate-600" />
          <h4 className="font-bold text-slate-800">Chris Voss - Negociação FBI</h4>
        </div>
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-slate-600 font-medium">Empatia Tática</p>
            <p className="text-xs text-slate-700">{strategy.chris_voss_negotiation.tactical_empathy}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">Perguntas Calibradas</p>
            {strategy.chris_voss_negotiation.calibrated_questions.map((q, i) => (
              <p key={i} className="text-xs text-slate-700">• {q}</p>
            ))}
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-slate-600 font-medium">Técnica de Espelhamento</p>
            <p className="text-xs text-slate-700">{strategy.chris_voss_negotiation.mirroring_technique}</p>
          </div>
        </div>
      </Card>

      {/* SPIN Selling */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-green-600" />
          <h4 className="font-bold text-slate-800">SPIN Selling - Neil Rackham</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-white rounded-lg p-2">
            <p className="text-green-700 font-medium">S - Situation (Situação)</p>
            {strategy.spin_selling_sequence.situation_questions.map((q, i) => (
              <p key={i} className="text-slate-700">• {q}</p>
            ))}
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-yellow-700 font-medium">P - Problem (Problema)</p>
            {strategy.spin_selling_sequence.problem_questions.map((q, i) => (
              <p key={i} className="text-slate-700">• {q}</p>
            ))}
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-orange-700 font-medium">I - Implication (Implicação)</p>
            {strategy.spin_selling_sequence.implication_questions.map((q, i) => (
              <p key={i} className="text-slate-700">• {q}</p>
            ))}
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-blue-700 font-medium">N - Need-Payoff (Benefício)</p>
            {strategy.spin_selling_sequence.need_payoff_questions.map((q, i) => (
              <p key={i} className="text-slate-700">• {q}</p>
            ))}
          </div>
        </div>
      </Card>

      {/* Gap Selling */}
      <Card className="p-4 bg-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-purple-600" />
          <h4 className="font-bold text-slate-800">Gap Selling - Keenan</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-red-50 rounded p-2 border border-red-200">
              <p className="text-red-700 font-medium">Estado Atual</p>
              <p className="text-slate-700">{strategy.gap_selling_analysis.current_state}</p>
            </div>
            <span className="text-2xl">→</span>
            <div className="flex-1 bg-green-50 rounded p-2 border border-green-200">
              <p className="text-green-700 font-medium">Estado Desejado</p>
              <p className="text-slate-700">{strategy.gap_selling_analysis.desired_state}</p>
            </div>
          </div>
          <div className="bg-amber-50 rounded p-2 border border-amber-200">
            <p className="text-amber-700 font-medium">💰 Custo da Inação</p>
            <p className="text-slate-700">{strategy.gap_selling_analysis.cost_of_inaction}</p>
          </div>
          <div className="bg-blue-50 rounded p-2 border border-blue-200">
            <p className="text-blue-700 font-medium">🎯 Impacto da Solução</p>
            <p className="text-slate-700">{strategy.gap_selling_analysis.impact_of_solution}</p>
          </div>
        </div>
      </Card>

      {/* Objection Handling */}
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-red-600" />
          <h4 className="font-bold text-slate-800">Controle de Objeções</h4>
        </div>
        <div className="space-y-3">
          {strategy.objection_handling.predicted_objections.map((obj, i) => (
            <div key={i} className="bg-white rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 mb-1">"{obj.objection}"</p>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500">Preocupação Real:</span>
                  <p className="text-slate-700">{obj.real_concern}</p>
                </div>
                <div>
                  <span className="text-slate-500">Framework:</span>
                  <p className="text-slate-700">{obj.response_framework}</p>
                </div>
                <div>
                  <span className="text-slate-500">Reframe:</span>
                  <p className="text-slate-700">{obj.reframe}</p>
                </div>
                <div>
                  <span className="text-slate-500">Provas:</span>
                  {obj.proof_elements.map((proof, j) => (
                    <p key={j} className="text-slate-700">• {proof}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Closing Strategy */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-green-600" />
          <h4 className="font-bold text-slate-800">Estratégia de Fechamento - Zig Ziglar</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-white rounded-lg p-2">
            <p className="text-green-700 font-medium">Técnica Ideal</p>
            <p className="text-slate-700">{strategy.closing_strategy.ideal_closing_technique}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-green-700 font-medium">Abordagem Ziglar</p>
            <p className="text-slate-700">{strategy.closing_strategy.ziglar_approach}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-blue-700 font-medium mb-1">Trial Closes</p>
            {strategy.closing_strategy.trial_closes.map((tc, i) => (
              <p key={i} className="text-slate-700">• {tc}</p>
            ))}
          </div>
          <div className="bg-green-100 rounded-lg p-2 border border-green-300">
            <p className="text-green-800 font-medium">✅ Fechamento Final</p>
            <p className="text-slate-800">{strategy.closing_strategy.final_close}</p>
          </div>
        </div>
      </Card>

      {/* Communication Script */}
      <Card className="p-4 bg-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-slate-800">Script de Conversação</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
            <p className="text-indigo-700 font-medium">🎤 Abertura (30 segundos)</p>
            <p className="text-slate-700">{strategy.conversation_script.opening}</p>
          </div>
          <div className="bg-purple-50 rounded p-2 border border-purple-200">
            <p className="text-purple-700 font-medium">🔍 Descoberta</p>
            <p className="text-slate-700">{strategy.conversation_script.discovery}</p>
          </div>
          <div className="bg-blue-50 rounded p-2 border border-blue-200">
            <p className="text-blue-700 font-medium">📊 Apresentação</p>
            <p className="text-slate-700">{strategy.conversation_script.presentation}</p>
          </div>
        </div>
      </Card>

      {/* Personalized Recommendations */}
      <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          <h4 className="font-bold text-slate-800">Recomendações Personalizadas</h4>
        </div>
        <div className="space-y-2">
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <p className="text-xs text-green-700 font-medium mb-1">✅ FAÇA ISSO</p>
            {strategy.personalized_recommendations.do_this.map((action, i) => (
              <p key={i} className="text-xs text-slate-700">• {action}</p>
            ))}
          </div>
          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
            <p className="text-xs text-red-700 font-medium mb-1">❌ NUNCA FAÇA</p>
            {strategy.personalized_recommendations.never_do_this.map((action, i) => (
              <p key={i} className="text-xs text-slate-700">• {action}</p>
            ))}
          </div>
          <div className="bg-purple-100 rounded-lg p-3 border-2 border-purple-300">
            <p className="text-xs text-purple-700 font-bold mb-1">🎯 ARMA SECRETA</p>
            <p className="text-sm font-semibold text-purple-900">{strategy.personalized_recommendations.secret_weapon}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}