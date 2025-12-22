import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PipelineAIAssistant({ client, interactions = [], visits = [], sales = [] }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => queryClient.invalidateQueries(['client'])
  });

  useEffect(() => {
    generateSuggestion();
  }, [client.id]);

  const generateSuggestion = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um consultor de vendas B2B veterinário especializado em pipeline.

CLIENTE: ${client.first_name}
ETAPA ATUAL: ${client.visit_objective || 'diagnosticar_necessidades'}
PERFIL NUMEROLÓGICO: ${client.numerology_number} - ${client.behavioral_profile}
ESTILO DECISÃO: ${client.decision_style}
STATUS: ${client.status} | SCORE: ${client.purchase_score}%
TIPO: ${client.client_type}
EQUIPAMENTO ATUAL: ${client.current_equipment || 'Nenhum'}

HISTÓRICO:
- Interações: ${interactions.length} (${interactions.filter(i => i.outcome === 'positive').length} positivas)
- Visitas: ${visits.length}
- Vendas anteriores: ${sales.length}
- Última interação: ${interactions.length > 0 ? new Date(interactions[0].created_date).toLocaleDateString() : 'Nenhuma'}
- Dias sem contato: ${interactions.length > 0 ? Math.floor((new Date() - new Date(interactions[0].created_date)) / (1000*60*60*24)) : 'N/A'}

ETAPAS DISPONÍVEIS:
1. diagnosticar_necessidades - Diagnóstico inicial
2. apresentar_equipamento - Apresentação de soluções
3. demonstracao_tecnica - Demo técnica
4. negociar_proposta - Negociação comercial
5. fechar_venda - Fechamento

Analise o cliente e retorne JSON com:
{
  "next_stage": "etapa_recomendada",
  "confidence": 0-100,
  "reasoning": "explicação de 1-2 linhas",
  "action_items": ["ação 1", "ação 2"],
  "estimated_days_to_close": número_dias,
  "risk_factors": ["risco 1", "risco 2"],
  "success_probability": 0-100
}

Seja estratégico e baseie-se em dados do histórico.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            next_stage: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            action_items: { type: "array", items: { type: "string" } },
            estimated_days_to_close: { type: "number" },
            risk_factors: { type: "array", items: { type: "string" } },
            success_probability: { type: "number" }
          }
        }
      });

      setSuggestion(response);
    } catch (error) {
      console.error('Erro ao gerar sugestão:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyStage = () => {
    updateMutation.mutate({ visit_objective: suggestion.next_stage });
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

  if (!suggestion) return null;

  const stageLabels = {
    diagnosticar_necessidades: 'Diagnóstico',
    apresentar_equipamento: 'Apresentação',
    demonstracao_tecnica: 'Demo Técnica',
    negociar_proposta: 'Negociação',
    fechar_venda: 'Fechamento'
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900">Sugestão de IA - Próxima Etapa</h3>
        <Badge className="ml-auto bg-purple-600">{suggestion.confidence}% confiança</Badge>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-600 font-medium">RECOMENDAÇÃO</span>
            <Badge className="bg-green-500">
              {suggestion.success_probability}% probabilidade
            </Badge>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stageLabels[suggestion.next_stage]}
          </p>
          <p className="text-sm text-slate-600 mt-2">{suggestion.reasoning}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500">Estimativa Fechamento</p>
            <p className="text-sm font-bold text-indigo-600">
              {suggestion.estimated_days_to_close} dias
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500">Probabilidade</p>
            <p className="text-sm font-bold text-green-600">
              {suggestion.success_probability}%
            </p>
          </div>
        </div>

        {suggestion.action_items?.length > 0 && (
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">🎯 AÇÕES RECOMENDADAS</p>
            <ul className="space-y-1">
              {suggestion.action_items.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestion.risk_factors?.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ RISCOS IDENTIFICADOS</p>
            <ul className="space-y-1">
              {suggestion.risk_factors.map((risk, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

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