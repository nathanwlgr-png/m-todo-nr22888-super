import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Target, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function NumerologyDeepAnalysis({ client }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const generateDeepAnalysis = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Você é MESTRE em Numerologia Pitagórica + 30+ livros de vendas (SPIN, Cialdini, Challenger, Voss).

**CLIENTE:**
- Nome: ${client.first_name}
- Nome Completo: ${client.full_name || client.first_name}
- Data Nascimento: ${client.birthdate || 'N/A'}
- Número Numerológico: ${client.numerology_number || 'Calcular'}
- Caminho de Vida: ${client.life_path_number || 'Calcular'}
- Perfil: ${client.behavioral_profile || 'N/A'}
- Estilo Decisão: ${client.decision_style || 'N/A'}

**CONTEXTO DE VENDAS:**
- Status: ${client.status}
- Score: ${client.purchase_score || 50}%
- Equipamento Interesse: ${client.equipment_interest || 'N/A'}
- Orçamento: R$ ${client.available_budget?.toLocaleString('pt-BR') || 'N/A'}
- Dores: ${client.main_pains?.join(', ') || 'N/A'}
- Objeções: ${client.real_objections?.join(', ') || 'N/A'}

**FRAMEWORKS DISPONÍVEIS:**
- SPIN Selling (Situation, Problem, Implication, Need-payoff)
- Cialdini (6 princípios: Reciprocidade, Escassez, Autoridade, Consistência, Simpatia, Consenso)
- Challenger Sale (Ensinar, Adaptar, Controlar)
- Chris Voss FBI (Espelhamento, Rotulagem, Silêncio Calibrado, Perguntas Abertas)
- Jeffrey Gitomer (Relacionamento + Valor)
- Neil Rackham (Perguntas Estratégicas)

**TAREFA:**
1. Calcule numerologia COMPLETA (nome + data se disponível)
2. Identifique TRAÇOS DE PERSONALIDADE profundos
3. Selecione OS 3 MELHORES GATILHOS para primeira abordagem
4. Crie sequência de acompanhamento (3-5 toques)
5. Scripts prontos para usar

Retorne JSON:
{
  "numerology_full": {
    "number": 7,
    "life_path": 11,
    "destiny_number": 3,
    "soul_urge": 5,
    "personality_traits": ["Analítico", "Detalhista", "Cético"],
    "decision_pattern": "Precisa de dados e tempo para decidir",
    "ideal_communication": "Apresentações técnicas, estudos de caso, dados"
  },
  "first_approach": {
    "best_triggers": [
      {
        "trigger": "Autoridade Científica",
        "framework": "Cialdini + SPIN",
        "why_works": "Perfil analítico responde a dados",
        "script": "Script completo pronto",
        "timing": "Melhor horário e dia"
      }
    ],
    "opening_line": "Frase de abertura perfeita",
    "questions_to_ask": ["Pergunta 1", "Pergunta 2"],
    "avoid": ["O que NÃO fazer"]
  },
  "follow_up_sequence": [
    {
      "day": 3,
      "trigger": "Escassez Ética",
      "framework": "Cialdini",
      "message": "Mensagem completa",
      "objective": "Mover para próxima etapa"
    }
  ],
  "closing_strategy": {
    "best_day_week": "Terça-feira",
    "best_time": "14h-16h",
    "final_trigger": "Gatilho final",
    "script": "Script de fechamento",
    "fallback": "Plano B se objetar"
  },
  "red_flags": ["O que evitar"],
  "power_phrases": ["Frase 1", "Frase 2", "Frase 3"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            numerology_full: {
              type: "object",
              properties: {
                number: { type: "number" },
                life_path: { type: "number" },
                destiny_number: { type: "number" },
                soul_urge: { type: "number" },
                personality_traits: { type: "array", items: { type: "string" } },
                decision_pattern: { type: "string" },
                ideal_communication: { type: "string" }
              }
            },
            first_approach: {
              type: "object",
              properties: {
                best_triggers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      trigger: { type: "string" },
                      framework: { type: "string" },
                      why_works: { type: "string" },
                      script: { type: "string" },
                      timing: { type: "string" }
                    }
                  }
                },
                opening_line: { type: "string" },
                questions_to_ask: { type: "array", items: { type: "string" } },
                avoid: { type: "array", items: { type: "string" } }
              }
            },
            follow_up_sequence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  trigger: { type: "string" },
                  framework: { type: "string" },
                  message: { type: "string" },
                  objective: { type: "string" }
                }
              }
            },
            closing_strategy: {
              type: "object",
              properties: {
                best_day_week: { type: "string" },
                best_time: { type: "string" },
                final_trigger: { type: "string" },
                script: { type: "string" },
                fallback: { type: "string" }
              }
            },
            red_flags: { type: "array", items: { type: "string" } },
            power_phrases: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);

      // Update client with full numerology
      await base44.entities.Client.update(client.id, {
        numerology_number: result.numerology_full.number,
        life_path_number: result.numerology_full.life_path,
        behavioral_profile: result.numerology_full.personality_traits.join(', '),
        decision_style: result.numerology_full.decision_pattern,
        recommended_communication: result.numerology_full.ideal_communication,
        approach_tips: result.first_approach.opening_line
      });

      toast.success('Análise completa gerada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!analysis) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Análise Numerológica Profunda</h4>
            <p className="text-xs text-white/80">Numerologia + 30 livros de vendas</p>
          </div>
        </div>
        <Button
          onClick={generateDeepAnalysis}
          disabled={analyzing}
          className="w-full bg-white text-purple-700 hover:bg-white/90 font-bold"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando perfil...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Análise Completa
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Numerology Full */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-300">
        <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">{analysis.numerology_full.number}</span>
          Perfil Numerológico Completo
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-purple-600">Caminho de Vida</p>
            <p className="text-lg font-bold text-purple-900">{analysis.numerology_full.life_path}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-purple-600">Destino</p>
            <p className="text-lg font-bold text-purple-900">{analysis.numerology_full.destiny_number}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mb-2">
          <p className="text-xs font-semibold text-purple-700 mb-1">Traços de Personalidade</p>
          <div className="flex flex-wrap gap-1">
            {analysis.numerology_full.personality_traits.map((trait, i) => (
              <Badge key={i} className="bg-purple-100 text-purple-700">{trait}</Badge>
            ))}
          </div>
        </div>
        <div className="bg-purple-100 rounded-lg p-2 border border-purple-300">
          <p className="text-xs font-semibold text-purple-800 mb-1">Padrão de Decisão</p>
          <p className="text-xs text-purple-700">{analysis.numerology_full.decision_pattern}</p>
        </div>
      </Card>

      {/* First Approach */}
      <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
        <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Primeira Abordagem
        </h4>
        
        <div className="bg-white rounded-lg p-3 mb-3 border-2 border-orange-300">
          <p className="text-xs font-semibold text-orange-700 mb-1">💬 Frase de Abertura</p>
          <p className="text-sm text-slate-800 font-medium">{analysis.first_approach.opening_line}</p>
        </div>

        {analysis.first_approach.best_triggers.map((trigger, i) => (
          <Card key={i} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-green-900">{trigger.trigger}</p>
              <Badge className="bg-green-600 text-white text-xs">{trigger.framework}</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-2">{trigger.why_works}</p>
            <div className="bg-white rounded-lg p-2 mb-2">
              <p className="text-xs font-semibold text-green-700 mb-1">📝 Script</p>
              <p className="text-xs text-slate-700">{trigger.script}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-green-600" />
              <p className="text-xs text-green-700 font-medium">{trigger.timing}</p>
            </div>
          </Card>
        ))}

        <div className="bg-blue-50 rounded-lg p-2 border border-blue-300 mb-2">
          <p className="text-xs font-semibold text-blue-700 mb-1">❓ Perguntas Estratégicas</p>
          {analysis.first_approach.questions_to_ask.map((q, i) => (
            <p key={i} className="text-xs text-blue-600">{i + 1}. {q}</p>
          ))}
        </div>

        <div className="bg-red-50 rounded-lg p-2 border border-red-300">
          <p className="text-xs font-semibold text-red-700 mb-1">🚫 Evitar</p>
          {analysis.first_approach.avoid.map((a, i) => (
            <p key={i} className="text-xs text-red-600">• {a}</p>
          ))}
        </div>
      </Card>

      {/* Follow-Up Sequence */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300">
        <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Sequência de Follow-Up
        </h4>
        <div className="space-y-2">
          {analysis.follow_up_sequence.map((step, i) => (
            <Card key={i} className="p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-indigo-600 text-white">Dia {step.day}</Badge>
                <Badge variant="outline" className="text-xs">{step.framework}</Badge>
              </div>
              <p className="text-xs font-semibold text-indigo-700 mb-1">{step.trigger}</p>
              <p className="text-xs text-slate-700 mb-2">{step.message}</p>
              <p className="text-xs text-indigo-600">🎯 {step.objective}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Closing Strategy */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
        <h4 className="font-bold text-green-900 mb-3">🏆 Estratégia de Fechamento</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-green-600">Melhor Dia</p>
            <p className="text-sm font-bold text-green-900">{analysis.closing_strategy.best_day_week}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-green-600">Melhor Horário</p>
            <p className="text-sm font-bold text-green-900">{analysis.closing_strategy.best_time}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mb-2 border-2 border-green-300">
          <p className="text-xs font-semibold text-green-700 mb-1">Gatilho Final: {analysis.closing_strategy.final_trigger}</p>
          <p className="text-xs text-slate-700">{analysis.closing_strategy.script}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-300">
          <p className="text-xs font-semibold text-yellow-800 mb-1">Plano B (se objetar)</p>
          <p className="text-xs text-yellow-700">{analysis.closing_strategy.fallback}</p>
        </div>
      </Card>

      {/* Power Phrases */}
      <Card className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300">
        <p className="text-xs font-bold text-yellow-800 mb-2">⚡ Frases de Poder</p>
        {analysis.power_phrases.map((phrase, i) => (
          <p key={i} className="text-xs text-yellow-700 mb-1">"{phrase}"</p>
        ))}
      </Card>

      <Button onClick={() => setAnalysis(null)} variant="outline" size="sm" className="w-full">
        Recalcular
      </Button>
    </div>
  );
}