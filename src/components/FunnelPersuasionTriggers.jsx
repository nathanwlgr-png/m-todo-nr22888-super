import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, RefreshCw } from 'lucide-react';

const funnelStages = {
  prospecção: { label: 'Prospecção', color: 'bg-slate-500' },
  qualificação: { label: 'Qualificação', color: 'bg-blue-500' },
  apresentação: { label: 'Apresentação', color: 'bg-indigo-500' },
  proposta: { label: 'Proposta', color: 'bg-purple-500' },
  negociação: { label: 'Negociação', color: 'bg-orange-500' },
  fechamento: { label: 'Fechamento', color: 'bg-green-500' }
};

export default function FunnelPersuasionTriggers({ client }) {
  const [triggers, setTriggers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState('prospecção');

  const generateTriggers = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vendas consultivas e persuasão ética.

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}

TAREFA:
Para CADA etapa do funil de vendas, sugira 3 gatilhos de persuasão (Cialdini) personalizados ao perfil numerológico.

Retorne em JSON:
{
  "prospecção": [
    {"gatilho": "Reciprocidade", "acao": "Ação específica", "exemplo": "Frase exemplo"},
    {"gatilho": "Simpatia", "acao": "Ação específica", "exemplo": "Frase exemplo"},
    {"gatilho": "Autoridade", "acao": "Ação específica", "exemplo": "Frase exemplo"}
  ],
  "qualificação": [...],
  "apresentação": [...],
  "proposta": [...],
  "negociação": [...],
  "fechamento": [...]
}

Use os 6 princípios de Cialdini:
1. Reciprocidade
2. Compromisso e Coerência
3. Prova Social
4. Autoridade
5. Simpatia
6. Escassez

Adapte ao perfil NUMEROLÓGICO e ao STATUS atual do cliente.
Seja PRÁTICO e ÉTICO.`,
        response_json_schema: {
          type: "object",
          properties: {
            prospecção: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            },
            qualificação: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            },
            apresentação: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            },
            proposta: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            },
            negociação: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            },
            fechamento: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  exemplo: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTriggers(response);
    } catch (error) {
      console.error('Erro ao gerar gatilhos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client && !triggers) {
      generateTriggers();
    }
  }, [client]);

  if (loading || !triggers) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Gerando gatilhos personalizados...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stage Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.keys(funnelStages).map((stage) => (
          <Button
            key={stage}
            onClick={() => setCurrentStage(stage)}
            variant={currentStage === stage ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 ${currentStage === stage ? funnelStages[stage].color : ''}`}
          >
            {funnelStages[stage].label}
          </Button>
        ))}
      </div>

      {/* Triggers for Current Stage */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800">
              Gatilhos: {funnelStages[currentStage].label}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateTriggers}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {triggers[currentStage]?.map((trigger, i) => (
            <div key={i} className="border-l-4 border-amber-400 pl-3 py-2">
              <Badge className="bg-amber-100 text-amber-700 mb-2">
                {trigger.gatilho}
              </Badge>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {trigger.acao}
              </p>
              <p className="text-xs text-slate-600 italic">
                💬 "{trigger.exemplo}"
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}