import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function PersonalizedMarketApproach({ client, interactions = [] }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const generateApproach = async () => {
    setLoading(true);
    try {
      const prompt = `Crie uma ESTRATÉGIA DE VENDA PERSONALIZADA com base em TENDÊNCIAS DE MERCADO:

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name}
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Status: ${client.status}

CONTEXTO DE MERCADO:
- Segmento: Veterinária/Laboratório
- Localização: ${client.city}
- Tendências: Automação, eficiência, telemedicina, integração digital

HISTÓRICO:
- Interações: ${interactions.length}
- Equipamento interesse: ${client.equipment_interest}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}

TAREFA:
Desenvolva uma abordagem em 4 fases:

FASE 1: ABERTURA (Como abordar)
- Gancho inicial baseado em tendência de mercado
- Por que AGORA é o momento certo
- Urgência ética (não pressão)

FASE 2: EXPLORAÇÃO (Questionamento SPIN adaptado)
- 3 perguntas situacionais
- 2 perguntas de problema
- 2 perguntas de implicação

FASE 3: DEMONSTRAÇÃO (Proposta de valor)
- Como a solução se alinha com tendências
- ROI esperado baseado em benchmark
- Diferenciais únicos

FASE 4: FECHAMENTO (Call to action)
- Urgência baseada em mercado
- Próxima ação específica
- Tratamento de objeção esperada

Considere: ciclo de vida do equipamento, sazonalidade, competição local, regulamentações.`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              market_timing: { type: "string" },
              opening_hook: { type: "string" },
              opening_reason: { type: "string" },
              opening_urgency: { type: "string" },
              spin_questions: {
                type: "object",
                properties: {
                  situational: { type: "array", items: { type: "string" } },
                  problem: { type: "array", items: { type: "string" } },
                  implication: { type: "array", items: { type: "string" } }
                }
              },
              value_proposition: { type: "string" },
              market_roi: { type: "string" },
              unique_differentials: { type: "array", items: { type: "string" } },
              closing_urgency: { type: "string" },
              next_action: { type: "string" },
              expected_objection: { type: "string" },
              objection_response: { type: "string" }
            }
          }
        });
      }, 'high');

      setStrategy(result);
      toast.success('Estratégia personalizada criada!');
    } catch (error) {
      toast.error('Erro ao gerar estratégia');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">💡 Abordagem Personalizada</h3>
          <p className="text-xs text-slate-600">Estratégia baseada em tendências de mercado</p>
        </div>
      </div>

      {!strategy ? (
        <Button
          onClick={generateApproach}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            'Gerar Estratégia de Venda'
          )}
        </Button>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-1">⏰ Timing de Mercado</p>
            <p className="text-sm text-slate-700">{strategy.market_timing}</p>
          </div>

          <Card className="p-3 bg-blue-50 border-l-4 border-l-blue-500">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700">🎯 Gancho de Abertura</p>
                <p className="text-sm text-blue-900 font-medium">{strategy.opening_hook}</p>
                <p className="text-xs text-blue-700 mt-1"><strong>Por quê:</strong> {strategy.opening_reason}</p>
                <p className="text-xs text-blue-700"><strong>Urgência:</strong> {strategy.opening_urgency}</p>
              </div>
            </div>
          </Card>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">❓ Perguntas SPIN</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-purple-700">Situacionais:</p>
                {strategy.spin_questions?.situational?.map((q, i) => (
                  <p key={i} className="text-xs text-slate-700 ml-2">• {q}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700">Problema:</p>
                {strategy.spin_questions?.problem?.map((q, i) => (
                  <p key={i} className="text-xs text-slate-700 ml-2">• {q}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700">Implicação:</p>
                {strategy.spin_questions?.implication?.map((q, i) => (
                  <p key={i} className="text-xs text-slate-700 ml-2">• {q}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-1">💰 Proposta de Valor</p>
            <p className="text-sm text-slate-700">{strategy.value_proposition}</p>
            <p className="text-xs text-green-700 mt-1"><strong>ROI:</strong> {strategy.market_roi}</p>
          </div>

          {strategy.unique_differentials && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-2">⭐ Diferenciais</p>
              <div className="space-y-1">
                {strategy.unique_differentials.map((diff, i) => (
                  <p key={i} className="text-xs text-slate-700">• {diff}</p>
                ))}
              </div>
            </div>
          )}

          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-2">🚨 Fechamento</p>
            <p className="text-sm text-red-900 font-medium">Urgência: {strategy.closing_urgency}</p>
            <p className="text-xs text-slate-700 mt-1"><strong>Ação:</strong> {strategy.next_action}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Objeção Esperada</p>
            <p className="text-sm text-slate-700">{strategy.expected_objection}</p>
            <p className="text-xs text-orange-700 mt-1"><strong>Resposta:</strong> {strategy.objection_response}</p>
          </div>

          <Button
            size="sm"
            onClick={() => setStrategy(null)}
            variant="outline"
          >
            Nova Estratégia
          </Button>
        </div>
      )}
    </Card>
  );
}