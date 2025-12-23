import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Volume2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ObjectionHandlingByProfile({ client }) {
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [objectionType, setObjectionType] = useState('');

  const generateStrategy = async () => {
    if (!objectionType) {
      toast.error('Selecione o tipo de objeção');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um MASTER em controle de objeções personalizado.

CLIENTE: ${client?.first_name || 'N/A'}
PERFIL NUMEROLÓGICO: ${client?.numerology_number || 'N/A'} - ${client?.behavioral_profile || 'N/A'}
TOM DE VOZ OBSERVADO: ${client?.client_tone || 'Não observado'}
ESTILO DE DECISÃO: ${client?.decision_style || 'N/A'}
STATUS: ${client?.status || 'N/A'}

OBJEÇÃO: ${objectionType}

CRIE estratégia CIRÚRGICA:

1. TOM DE VOZ IDEAL para este perfil:
   - Volume: alto, médio, baixo?
   - Ritmo: rápido, pausado, variado?
   - Energia: alta, moderada, calma?
   - Ênfase: onde colocar?

2. LINGUAGEM CORPORAL:
   - Postura: inclinado, ereto, relaxado?
   - Gestos: abertos, fechados, pontudos?
   - Espaço pessoal: próximo, distante?
   - Contato visual: direto, suave?

3. ARGUMENTAÇÃO por perfil:
   - Se analítico: dados, lógica, ROI
   - Se emocional: histórias, benefícios, impacto
   - Se assertivo: direto, sem rodeios
   - Se cauteloso: segurança, garantias

4. TÉCNICA ESPECÍFICA:
   - Qual framework usar? (SPIN, Sandler, Challenger?)
   - Gatilhos mentais apropriados
   - Perguntas estratégicas

5. PALAVRAS-CHAVE e EVITAR:
   - O que dizer
   - O que NÃO dizer

6. EXEMPLO DE ROTEIRO completo com:
   - Entrada
   - Desenvolvimento
   - Fechamento

CORRELACIONE tudo com neurociência da persuasão.`,
        response_json_schema: {
          type: "object",
          properties: {
            voice_strategy: {
              type: "object",
              properties: {
                volume: { type: "string" },
                rhythm: { type: "string" },
                energy: { type: "string" },
                emphasis_points: { type: "array", items: { type: "string" } },
                tone_example: { type: "string" }
              }
            },
            body_language: {
              type: "object",
              properties: {
                posture: { type: "string" },
                gestures: { type: "string" },
                personal_space: { type: "string" },
                eye_contact: { type: "string" },
                facial_expression: { type: "string" }
              }
            },
            argumentation_style: {
              type: "object",
              properties: {
                primary_approach: { type: "string" },
                secondary_approach: { type: "string" },
                key_points: { type: "array", items: { type: "string" } }
              }
            },
            technique: {
              type: "object",
              properties: {
                framework: { type: "string" },
                mental_triggers: { type: "array", items: { type: "string" } },
                strategic_questions: { type: "array", items: { type: "string" } }
              }
            },
            keywords: {
              type: "object",
              properties: {
                use: { type: "array", items: { type: "string" } },
                avoid: { type: "array", items: { type: "string" } }
              }
            },
            complete_script: {
              type: "object",
              properties: {
                opening: { type: "string" },
                development: { type: "string" },
                closing: { type: "string" }
              }
            },
            neuroscience_reasoning: { type: "string" },
            success_probability: { type: "number" }
          }
        }
      });

      setStrategy(result);
      toast.success('Estratégia personalizada criada!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar estratégia');
    } finally {
      setGenerating(false);
    }
  };

  const objectionTypes = [
    { value: 'preco', label: '💰 Preço muito alto' },
    { value: 'tempo', label: '⏰ Não é o momento' },
    { value: 'concorrente', label: '🏆 Já tenho outro fornecedor' },
    { value: 'decisao', label: '👥 Preciso falar com sócio' },
    { value: 'resultado', label: '❓ Não sei se funciona' },
    { value: 'urgencia', label: '⚡ Não tenho urgência' }
  ];

  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-2 border-orange-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">🛡️ Controle de Objeções IA</h3>
          <p className="text-xs text-slate-700">Por perfil + tom de voz + linguagem corporal</p>
        </div>
      </div>

      {!strategy ? (
        <div className="space-y-3">
          {client && (
            <div className="p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-xs text-slate-600 mb-1">Cliente:</p>
              <p className="font-semibold text-slate-900">{client.first_name}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{client.behavioral_profile || 'N/A'}</Badge>
                <Badge variant="outline">{client.client_tone || 'Tom não observado'}</Badge>
              </div>
            </div>
          )}

          <Select value={objectionType} onValueChange={setObjectionType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione a objeção" />
            </SelectTrigger>
            <SelectContent>
              {objectionTypes.map((obj) => (
                <SelectItem key={obj.value} value={obj.value}>
                  {obj.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generateStrategy}
            disabled={generating || !objectionType}
            className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando estratégia...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Estratégia Personalizada
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Probabilidade de Sucesso */}
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">Probabilidade de Sucesso</span>
              <Badge className={
                strategy.success_probability >= 70 ? 'bg-green-500' :
                strategy.success_probability >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }>
                {strategy.success_probability}%
              </Badge>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-red-600"
                style={{ width: `${strategy.success_probability}%` }}
              />
            </div>
          </div>

          {/* Tom de Voz */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-purple-700" />
              <h4 className="font-semibold text-purple-900 text-sm">🎤 Tom de Voz Ideal</h4>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Volume:</strong> {strategy.voice_strategy?.volume}</p>
              <p><strong>Ritmo:</strong> {strategy.voice_strategy?.rhythm}</p>
              <p><strong>Energia:</strong> {strategy.voice_strategy?.energy}</p>
              <div>
                <strong>Ênfase em:</strong>
                <ul className="mt-1 space-y-1">
                  {strategy.voice_strategy?.emphasis_points?.map((point, i) => (
                    <li key={i} className="text-purple-700">• {point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Linguagem Corporal */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">🤝 Linguagem Corporal</h4>
            <div className="space-y-1 text-xs">
              <p><strong>Postura:</strong> {strategy.body_language?.posture}</p>
              <p><strong>Gestos:</strong> {strategy.body_language?.gestures}</p>
              <p><strong>Espaço pessoal:</strong> {strategy.body_language?.personal_space}</p>
              <p><strong>Contato visual:</strong> {strategy.body_language?.eye_contact}</p>
            </div>
          </div>

          {/* Técnica */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-green-900 text-sm mb-3">🎯 Técnica & Framework</h4>
            <p className="text-sm font-bold text-green-800 mb-2">{strategy.technique?.framework}</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Gatilhos Mentais:</p>
                {strategy.technique?.mental_triggers?.map((trigger, i) => (
                  <Badge key={i} className="mr-1 mb-1 text-xs">{trigger}</Badge>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Perguntas Estratégicas:</p>
                {strategy.technique?.strategic_questions?.map((q, i) => (
                  <p key={i} className="text-xs text-green-600 mb-1">❓ {q}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Palavras-chave */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-semibold text-green-700 mb-2">✅ USAR</p>
              {strategy.keywords?.use?.map((word, i) => (
                <p key={i} className="text-xs text-green-600 mb-1">• {word}</p>
              ))}
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-semibold text-red-700 mb-2">❌ EVITAR</p>
              {strategy.keywords?.avoid?.map((word, i) => (
                <p key={i} className="text-xs text-red-600 mb-1">• {word}</p>
              ))}
            </div>
          </div>

          {/* Roteiro Completo */}
          <div className="p-4 bg-white rounded-xl border-2 border-orange-200">
            <h4 className="font-semibold text-orange-900 text-sm mb-3">📝 Roteiro Completo</h4>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-slate-800 mb-1">🎬 Abertura:</p>
                <p className="text-slate-700 bg-slate-50 p-2 rounded">{strategy.complete_script?.opening}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">💬 Desenvolvimento:</p>
                <p className="text-slate-700 bg-slate-50 p-2 rounded">{strategy.complete_script?.development}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">🎯 Fechamento:</p>
                <p className="text-slate-700 bg-slate-50 p-2 rounded">{strategy.complete_script?.closing}</p>
              </div>
            </div>
          </div>

          {/* Neurociência */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 text-sm mb-2">🧠 Neurociência</h4>
            <p className="text-xs text-indigo-800">{strategy.neuroscience_reasoning}</p>
          </div>

          <Button
            onClick={() => {
              setStrategy(null);
              setObjectionType('');
            }}
            variant="outline"
            className="w-full"
          >
            Nova Estratégia
          </Button>
        </div>
      )}
    </Card>
  );
}