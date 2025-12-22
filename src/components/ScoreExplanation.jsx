import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { HelpCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function ScoreExplanation({ client, score }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateExplanation = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um analista de vendas especializado em scoring preditivo.

DADOS DO CLIENTE:
- Nome: ${client.first_name}
- Score Atual: ${score}%
- Status: ${client.status}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Orçamento: R$ ${client.available_budget || 'Não informado'}
- Prazo Decisão: ${client.decision_deadline || 'Não definido'}
- Visitas Realizadas: ${client.total_visits_count || 0}
- Última Visita: ${client.last_visit_date || 'Nunca'}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Necessidades Lab: ${client.lab_needs?.join(', ') || 'Não especificadas'}

TAREFA:
Explique EXATAMENTE por que este cliente tem ${score}% de score de fechamento.

Retorne JSON estruturado:
{
  "score_category": "baixo|médio|alto",
  "main_reason": "Motivo principal em 1 frase",
  "positive_factors": [
    {"factor": "Nome do fator", "impact": "+15%", "explanation": "Como isso ajuda"}
  ],
  "negative_factors": [
    {"factor": "Nome do fator", "impact": "-10%", "explanation": "Como isso prejudica"}
  ],
  "neutral_factors": [
    {"factor": "Nome do fator", "explanation": "Sem impacto significativo"}
  ],
  "actions_to_increase": [
    {"action": "Ação específica", "potential_increase": "+10%"}
  ],
  "estimated_closing_time": "X semanas/meses",
  "confidence_level": "baixa|média|alta"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            score_category: { type: "string" },
            main_reason: { type: "string" },
            positive_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            negative_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            neutral_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            actions_to_increase: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  potential_increase: { type: "string" }
                }
              }
            },
            estimated_closing_time: { type: "string" },
            confidence_level: { type: "string" }
          }
        }
      });

      setExplanation(result);
    } catch (error) {
      toast.error('Erro ao gerar explicação');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!explanation) {
      generateExplanation();
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 rounded-full hover:bg-indigo-100"
      >
        <HelpCircle className="w-4 h-4 text-indigo-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">{score}%</span>
              </div>
              Por que este score?
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}

          {explanation && (
            <div className="space-y-4 py-4">
              {/* Main Reason */}
              <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <p className="text-sm text-slate-700 font-medium">{explanation.main_reason}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-indigo-600">
                    Confiança: {explanation.confidence_level}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-purple-600">
                    Estimativa: {explanation.estimated_closing_time}
                  </span>
                </div>
              </Card>

              {/* Positive Factors */}
              {explanation.positive_factors?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Fatores Positivos
                  </h4>
                  <div className="space-y-2">
                    {explanation.positive_factors.map((factor, idx) => (
                      <Card key={idx} className="p-3 bg-green-50 border-green-200">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-green-800">{factor.factor}</p>
                          <span className="text-xs font-bold text-green-600">{factor.impact}</span>
                        </div>
                        <p className="text-xs text-green-700">{factor.explanation}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Factors */}
              {explanation.negative_factors?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    Fatores Negativos
                  </h4>
                  <div className="space-y-2">
                    {explanation.negative_factors.map((factor, idx) => (
                      <Card key={idx} className="p-3 bg-red-50 border-red-200">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-red-800">{factor.factor}</p>
                          <span className="text-xs font-bold text-red-600">{factor.impact}</span>
                        </div>
                        <p className="text-xs text-red-700">{factor.explanation}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions to Increase */}
              <div>
                <h4 className="text-sm font-semibold text-indigo-700 mb-2">💡 Como Aumentar o Score</h4>
                <div className="space-y-2">
                  {explanation.actions_to_increase.map((action, idx) => (
                    <Card key={idx} className="p-3 bg-indigo-50 border-indigo-200">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-indigo-800">{action.action}</p>
                        <span className="text-xs font-bold text-indigo-600">{action.potential_increase}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateExplanation()}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Atualizar Análise
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}