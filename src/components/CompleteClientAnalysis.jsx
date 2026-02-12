import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Brain, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CompleteClientAnalysis({ client }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateCompleteAnalysis = async () => {
    setLoading(true);
    try {
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative na Home');
        setLoading(false);
        return;
      }

      const prompt = `Você é um especialista em vendas B2B veterinária com domínio profundo em psicologia de consumo, numerologia, neuromarketing e gatilhos mentais.

DADOS DO CLIENTE:
Nome: ${client.clinic_name || client.first_name}
Cidade: ${client.city}
Tipo: ${client.client_type}
Score: ${client.purchase_score}/100
Status: ${client.status}
Equipamento: ${client.current_equipment || 'Não informado'}
Budget: R$ ${client.available_budget || 0}
Numerologia: ${client.numerology_number || 'Não calculado'}
Perfil: ${client.behavioral_profile || 'Não analisado'}
Tom: ${client.client_tone || 'Não definido'}

TAREFA: Gere uma análise COMPLETA e ACIONÁVEL incorporando:

1. PSICOLOGIA DE CONSUMO (Lei da Atração, Verdades/Mentiras de Compra)
2. NUMEROLOGIA (Dias melhores para venda, abordagem personalizada)
3. GATILHOS MENTAIS (Cialdini, Priming, Escassez)
4. PERSUASÃO (Arte da Persuasão, Não Me Faça Pensar)
5. INFLUÊNCIA (Como construir autoridade nas redes)
6. DICÇÃO E COMUNICAÇÃO (Melhor forma de falar)
7. ESTRUTURA DE VENDA (Pense Rápido, SPIN Selling)

Retorne em JSON:

{
  "psychological_profile": {
    "buying_triggers": ["Gatilho 1", "Gatilho 2", "Gatilho 3"],
    "consumption_logic": "Lógica de compra deste cliente",
    "true_needs": "Necessidades reais (verdades)",
    "false_objections": "Objeções que não são reais (mentiras)",
    "real_objections": "Objeções verdadeiras"
  },
  "numerology_strategy": {
    "life_path": "Interpretação",
    "best_days": ["Dia 1", "Dia 2"],
    "communication_style": "Como falar com este número",
    "power_phrases": ["Frase 1", "Frase 2", "Frase 3"]
  },
  "mental_triggers": {
    "primary_trigger": "Gatilho principal (Cialdini)",
    "trigger_implementation": "Como usar este gatilho",
    "secondary_triggers": ["Trigger 1", "Trigger 2"],
    "urgency_angle": "Como criar urgência autêntica"
  },
  "persuasion_framework": {
    "core_message": "Mensagem central",
    "emotional_appeal": "Apelo emocional",
    "logical_appeal": "Apelo lógico",
    "closing_statement": "Frase de fechamento poderosa",
    "objection_handler": "Como responder objeções comuns"
  },
  "communication_strategy": {
    "tone_to_use": "Tom de voz recomendado",
    "diction_tips": "Dicas de dicção",
    "speaking_pace": "Velocidade de fala",
    "key_words": ["Palavra 1", "Palavra 2"],
    "power_words": ["Poder 1", "Poder 2"]
  },
  "selling_sequence": [
    "Passo 1: Descrição",
    "Passo 2: Descrição",
    "Passo 3: Descrição"
  ],
  "authority_building": {
    "social_proof_strategy": "Como gerar prova social",
    "brand_strengthening": "Fortalecer marca nas redes",
    "permission_marketing": "Marketing de permissão (email, whatsapp)",
    "influence_tactics": "Tácticas de influência"
  },
  "recommended_materials": [
    "Material 1 para este cliente",
    "Material 2 para este cliente",
    "Material 3 para este cliente"
  ],
  "action_plan": [
    "Ação imediata 1",
    "Ação imediata 2",
    "Ação imediata 3"
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            psychological_profile: {
              type: "object",
              properties: {
                buying_triggers: { type: "array", items: { type: "string" } },
                consumption_logic: { type: "string" },
                true_needs: { type: "string" },
                false_objections: { type: "string" },
                real_objections: { type: "string" }
              }
            },
            numerology_strategy: {
              type: "object",
              properties: {
                life_path: { type: "string" },
                best_days: { type: "array", items: { type: "string" } },
                communication_style: { type: "string" },
                power_phrases: { type: "array", items: { type: "string" } }
              }
            },
            mental_triggers: {
              type: "object",
              properties: {
                primary_trigger: { type: "string" },
                trigger_implementation: { type: "string" },
                secondary_triggers: { type: "array", items: { type: "string" } },
                urgency_angle: { type: "string" }
              }
            },
            persuasion_framework: {
              type: "object",
              properties: {
                core_message: { type: "string" },
                emotional_appeal: { type: "string" },
                logical_appeal: { type: "string" },
                closing_statement: { type: "string" },
                objection_handler: { type: "string" }
              }
            },
            communication_strategy: {
              type: "object",
              properties: {
                tone_to_use: { type: "string" },
                diction_tips: { type: "string" },
                speaking_pace: { type: "string" },
                key_words: { type: "array", items: { type: "string" } },
                power_words: { type: "array", items: { type: "string" } }
              }
            },
            selling_sequence: { type: "array", items: { type: "string" } },
            authority_building: {
              type: "object",
              properties: {
                social_proof_strategy: { type: "string" },
                brand_strengthening: { type: "string" },
                permission_marketing: { type: "string" },
                influence_tactics: { type: "string" }
              }
            },
            recommended_materials: { type: "array", items: { type: "string" } },
            action_plan: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise completa gerada!');
    } catch (error) {
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido');
      } else {
        toast.error('Erro ao gerar análise');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <Button
        onClick={generateCompleteAnalysis}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-base font-bold mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Gerando Análise Completa...
          </>
        ) : (
          <>
            <BarChart3 className="w-5 h-5 mr-2" />
            📊 ANÁLISE COMPLETA DO CLIENTE
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      {/* Perfil Psicológico */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          🧠 Perfil Psicológico de Compra
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded border-l-4 border-purple-600">
            <p className="font-semibold text-purple-700">Gatilhos de Compra:</p>
            <p className="text-slate-700">{analysis.psychological_profile?.buying_triggers?.join(', ')}</p>
          </div>
          <div className="p-2 bg-white rounded border-l-4 border-green-600">
            <p className="font-semibold text-green-700">Lógica de Consumo:</p>
            <p className="text-slate-700">{analysis.psychological_profile?.consumption_logic}</p>
          </div>
          <div className="p-2 bg-white rounded border-l-4 border-blue-600">
            <p className="font-semibold text-blue-700">Necessidades Reais:</p>
            <p className="text-slate-700">{analysis.psychological_profile?.true_needs}</p>
          </div>
          <div className="p-2 bg-red-50 rounded border-l-4 border-red-600">
            <p className="font-semibold text-red-700">Objeções Reais vs Falsas:</p>
            <p className="text-slate-700 mb-1"><strong>Verdadeiras:</strong> {analysis.psychological_profile?.real_objections}</p>
            <p className="text-slate-700"><strong>Falsas:</strong> {analysis.psychological_profile?.false_objections}</p>
          </div>
        </div>
      </Card>

      {/* Numerologia */}
      <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
        <h3 className="font-bold text-yellow-900 mb-3">✨ Estratégia Numerológica</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-yellow-700">Número da Vida:</p>
            <p className="text-slate-700">{analysis.numerology_strategy?.life_path}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-yellow-700">Melhores Dias para Venda:</p>
            <p className="text-slate-700">{analysis.numerology_strategy?.best_days?.join(', ')}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-yellow-700">Estilo de Comunicação:</p>
            <p className="text-slate-700">{analysis.numerology_strategy?.communication_style}</p>
          </div>
          <div className="p-2 bg-amber-50 rounded">
            <p className="font-semibold text-amber-700">Frases Poderosas:</p>
            {analysis.numerology_strategy?.power_phrases?.map((phrase, idx) => (
              <p key={idx} className="text-slate-700">💡 "{phrase}"</p>
            ))}
          </div>
        </div>
      </Card>

      {/* Gatilhos Mentais */}
      <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
        <h3 className="font-bold text-red-900 mb-3">⚡ Gatilhos Mentais (Cialdini)</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded border-l-4 border-red-600">
            <p className="font-semibold text-red-700">Gatilho Principal:</p>
            <p className="text-slate-700 font-bold">{analysis.mental_triggers?.primary_trigger}</p>
            <p className="text-slate-600 mt-1">{analysis.mental_triggers?.trigger_implementation}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-slate-700">Gatilhos Secundários:</p>
            <p className="text-slate-700">{analysis.mental_triggers?.secondary_triggers?.join(', ')}</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <p className="font-semibold text-yellow-700">Criar Urgência:</p>
            <p className="text-slate-700">{analysis.mental_triggers?.urgency_angle}</p>
          </div>
        </div>
      </Card>

      {/* Persuasão */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
        <h3 className="font-bold text-green-900 mb-3">💬 Framework de Persuasão</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-green-700">Mensagem Central:</p>
            <p className="text-slate-700">{analysis.persuasion_framework?.core_message}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white rounded">
              <p className="font-semibold text-slate-700">Apelo Emocional:</p>
              <p className="text-slate-700">{analysis.persuasion_framework?.emotional_appeal}</p>
            </div>
            <div className="p-2 bg-white rounded">
              <p className="font-semibold text-slate-700">Apelo Lógico:</p>
              <p className="text-slate-700">{analysis.persuasion_framework?.logical_appeal}</p>
            </div>
          </div>
          <div className="p-2 bg-blue-50 rounded border-2 border-blue-300">
            <p className="font-semibold text-blue-700">Frase de Fechamento:</p>
            <p className="text-blue-900 font-bold">"{analysis.persuasion_framework?.closing_statement}"</p>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <p className="font-semibold text-purple-700">Lidar com Objeções:</p>
            <p className="text-slate-700">{analysis.persuasion_framework?.objection_handler}</p>
          </div>
        </div>
      </Card>

      {/* Comunicação */}
      <Card className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300">
        <h3 className="font-bold text-cyan-900 mb-3">🎤 Estratégia de Comunicação & Dicção</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-cyan-700">Tom de Voz:</p>
            <p className="text-slate-700">{analysis.communication_strategy?.tone_to_use}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-cyan-700">Dicção:</p>
            <p className="text-slate-700">{analysis.communication_strategy?.diction_tips}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-cyan-700">Velocidade de Fala:</p>
            <p className="text-slate-700">{analysis.communication_strategy?.speaking_pace}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-cyan-700">Palavras-Chave:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.communication_strategy?.key_words?.map((word, idx) => (
                <Badge key={idx} className="bg-cyan-200 text-cyan-800">{word}</Badge>
              ))}
            </div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <p className="font-semibold text-red-700">Palavras Poderosas:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.communication_strategy?.power_words?.map((word, idx) => (
                <Badge key={idx} className="bg-red-600 text-white">{word}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Sequência de Venda */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <h3 className="font-bold text-indigo-900 mb-3">📋 Sequência de Venda</h3>
        <div className="space-y-2 text-xs">
          {analysis.selling_sequence?.map((step, idx) => (
            <div key={idx} className="p-2 bg-white rounded border-l-4 border-indigo-600">
              <p className="font-bold text-indigo-700">Passo {idx + 1}:</p>
              <p className="text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Construir Autoridade */}
      <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300">
        <h3 className="font-bold text-teal-900 mb-3">👑 Fortalecer Autoridade & Influência</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-teal-700">Prova Social:</p>
            <p className="text-slate-700">{analysis.authority_building?.social_proof_strategy}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-teal-700">Fortalecer Marca nas Redes:</p>
            <p className="text-slate-700">{analysis.authority_building?.brand_strengthening}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-teal-700">Marketing de Permissão:</p>
            <p className="text-slate-700">{analysis.authority_building?.permission_marketing}</p>
          </div>
          <div className="p-2 bg-white rounded">
            <p className="font-semibold text-teal-700">Táticas de Influência:</p>
            <p className="text-slate-700">{analysis.authority_building?.influence_tactics}</p>
          </div>
        </div>
      </Card>

      {/* Materiais */}
      <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300">
        <h3 className="font-bold text-pink-900 mb-3">📚 Materiais Recomendados</h3>
        <ul className="space-y-1 text-xs">
          {analysis.recommended_materials?.map((material, idx) => (
            <li key={idx} className="p-2 bg-white rounded">✓ {material}</li>
          ))}
        </ul>
      </Card>

      {/* Plano de Ação */}
      <Card className="p-4 bg-gradient-to-br from-lime-50 to-green-50 border-2 border-lime-300">
        <h3 className="font-bold text-lime-900 mb-3">✅ Plano de Ação Imediato</h3>
        <ol className="space-y-2 text-xs list-decimal list-inside">
          {analysis.action_plan?.map((action, idx) => (
            <li key={idx} className="p-2 bg-white rounded text-slate-700">{action}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}