import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AILeadQualifier({ lead }) {
  const [qualification, setQualification] = useState(null);
  const [isQualifying, setIsQualifying] = useState(false);
  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(lead.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead qualificado!');
    }
  });

  const qualifyLead = async () => {
    setIsQualifying(true);
    try {
      const prompt = `
QUALIFICAÇÃO INTELIGENTE DE LEAD:

DADOS DEMOGRÁFICOS:
- Nome: ${lead.full_name}
- Empresa: ${lead.company || 'Não informado'}
- Cidade: ${lead.city || 'Não informado'}
- Tamanho: ${lead.company_size || 'Não informado'}
- Orçamento: ${lead.budget_range || 'Não informado'}
- Urgência: ${lead.urgency || 'Não informado'}
- Interesse: ${lead.interest || 'Não informado'}
- Origem: ${lead.source}

HISTÓRICO:
- Status atual: ${lead.status}
- Score atual: ${lead.lead_score || 0}
- Último contato: ${lead.last_contact_date || 'Nunca'}
- Notas: ${lead.notes || 'Sem notas'}

TAREFA: Analise e qualifique este lead com score 0-100 e classificação.

Retorne JSON:
{
  "lead_score": 85,
  "qualification": "hot|warm|cold",
  "conversion_probability": 75,
  "priority_level": "alta|media|baixa",
  "recommended_actions": ["Ação 1", "Ação 2", "Ação 3"],
  "best_approach": "Melhor estratégia de abordagem",
  "estimated_deal_size": "R$ 50.000 - R$ 80.000",
  "key_factors": {
    "positivos": ["Fator 1", "Fator 2"],
    "negativos": ["Fator 1"]
  },
  "next_step": "Próxima ação específica",
  "timing": "Quando agir (imediato/1-3 dias/1 semana)"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            lead_score: { type: "number" },
            qualification: { type: "string" },
            conversion_probability: { type: "number" },
            priority_level: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } },
            best_approach: { type: "string" },
            estimated_deal_size: { type: "string" },
            key_factors: {
              type: "object",
              properties: {
                positivos: { type: "array", items: { type: "string" } },
                negativos: { type: "array", items: { type: "string" } }
              }
            },
            next_step: { type: "string" },
            timing: { type: "string" }
          }
        }
      });

      setQualification(result);

      // Atualizar lead automaticamente
      await updateLeadMutation.mutateAsync({
        lead_score: result.lead_score,
        status: result.qualification === 'hot' ? 'qualificado' : lead.status
      });

    } catch (error) {
      toast.error('Erro ao qualificar lead');
    } finally {
      setIsQualifying(false);
    }
  };

  const qualificationColors = {
    hot: 'from-red-500 to-orange-500',
    warm: 'from-yellow-500 to-orange-500',
    cold: 'from-blue-400 to-blue-600'
  };

  const priorityColors = {
    alta: 'bg-red-100 text-red-800 border-red-300',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    baixa: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-purple-600" />
          Qualificação Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!qualification ? (
          <Button
            onClick={qualifyLead}
            disabled={isQualifying}
            className="w-full bg-purple-600"
          >
            {isQualifying ? 'Analisando...' : 'Qualificar Lead'}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Score e Classificação */}
            <div className={`p-4 rounded-lg bg-gradient-to-r ${qualificationColors[qualification.qualification]} text-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">SCORE DO LEAD</span>
                <span className="text-3xl font-bold">{qualification.lead_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge className="bg-white/20 text-white border-white/40">
                  {qualification.qualification.toUpperCase()}
                </Badge>
                <span className="text-sm">{qualification.conversion_probability}% conversão</span>
              </div>
            </div>

            {/* Prioridade */}
            <div className={`p-3 rounded-lg border-2 ${priorityColors[qualification.priority_level]}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">Prioridade: {qualification.priority_level}</span>
              </div>
            </div>

            {/* Fatores */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">✓ Positivos</p>
                <ul className="text-xs text-green-600 space-y-1">
                  {qualification.key_factors.positivos.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠ Atenção</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {qualification.key_factors.negativos.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Estratégia */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-1">🎯 Melhor Abordagem</p>
              <p className="text-sm text-blue-900">{qualification.best_approach}</p>
            </div>

            {/* Valor Estimado */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">💰 Valor Estimado</p>
              <p className="text-sm font-bold text-purple-900">{qualification.estimated_deal_size}</p>
            </div>

            {/* Próximo Passo */}
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-700 mb-1">⚡ Próximo Passo</p>
              <p className="text-sm text-orange-900 mb-1">{qualification.next_step}</p>
              <Badge variant="outline" className="text-xs">{qualification.timing}</Badge>
            </div>

            {/* Ações Recomendadas */}
            <div className="bg-slate-50 p-3 rounded-lg border">
              <p className="text-xs font-semibold text-slate-700 mb-2">📋 Ações Recomendadas</p>
              <ul className="text-xs text-slate-600 space-y-1">
                {qualification.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={qualifyLead}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Requalificar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}