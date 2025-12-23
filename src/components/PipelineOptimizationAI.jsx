import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

/**
 * IA de Otimização de Pipeline
 * Analisa funil e sugere ações para mover clientes entre estágios
 */
export default function PipelineOptimizationAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const optimizePipeline = async () => {
    setAnalyzing(true);
    try {
      const pipelineStages = {
        lead: clients.filter(c => c.pipeline_stage === 'lead'),
        qualificado: clients.filter(c => c.pipeline_stage === 'qualificado'),
        proposta: clients.filter(c => c.pipeline_stage === 'proposta'),
        negociacao: clients.filter(c => c.pipeline_stage === 'negociacao'),
        fechado: clients.filter(c => c.pipeline_stage === 'fechado')
      };

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em otimização de pipeline de vendas. Analise o funil e sugira ações específicas.

PIPELINE ATUAL:
• Leads: ${pipelineStages.lead.length} clientes
• Qualificados: ${pipelineStages.qualificado.length} clientes
• Proposta: ${pipelineStages.proposta.length} clientes
• Negociação: ${pipelineStages.negociacao.length} clientes
• Fechado: ${pipelineStages.fechado.length} clientes

CLIENTES DETALHADOS (amostra top 20):
${clients.slice(0, 20).map(c => `- ${c.first_name}: stage=${c.pipeline_stage}, status=${c.status}, score=${c.purchase_score}%, engagement=${c.engagement_score || 0}%, revenue=${c.projected_revenue || 0}`).join('\n')}

Retorne JSON com otimizações:
{
  "bottlenecks": [
    {
      "stage": "nome do estágio",
      "issue": "problema identificado",
      "impact": "impacto no funil"
    }
  ],
  "stage_optimization": {
    "lead_to_qualified": {
      "actions": ["ação 1", "ação 2"],
      "target_clients": ["nome cliente 1", "nome cliente 2"]
    },
    "qualified_to_proposal": {
      "actions": ["ação 1", "ação 2"],
      "target_clients": ["nome cliente 1"]
    },
    "proposal_to_negotiation": {
      "actions": ["ação 1"],
      "target_clients": ["nome cliente 1"]
    },
    "negotiation_to_closed": {
      "actions": ["ação 1", "ação 2"],
      "target_clients": ["nome cliente 1", "nome cliente 2"]
    }
  },
  "quick_wins": [
    {
      "client": "nome do cliente",
      "current_stage": "estágio atual",
      "suggested_stage": "próximo estágio",
      "reason": "por que mover agora",
      "action": "ação necessária"
    }
  ],
  "summary": "Resumo executivo da análise (3 linhas)"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  issue: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            stage_optimization: {
              type: "object",
              properties: {
                lead_to_qualified: {
                  type: "object",
                  properties: {
                    actions: { type: "array", items: { type: "string" } },
                    target_clients: { type: "array", items: { type: "string" } }
                  }
                },
                qualified_to_proposal: {
                  type: "object",
                  properties: {
                    actions: { type: "array", items: { type: "string" } },
                    target_clients: { type: "array", items: { type: "string" } }
                  }
                },
                proposal_to_negotiation: {
                  type: "object",
                  properties: {
                    actions: { type: "array", items: { type: "string" } },
                    target_clients: { type: "array", items: { type: "string" } }
                  }
                },
                negotiation_to_closed: {
                  type: "object",
                  properties: {
                    actions: { type: "array", items: { type: "string" } },
                    target_clients: { type: "array", items: { type: "string" } }
                  }
                }
              }
            },
            quick_wins: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client: { type: "string" },
                  current_stage: { type: "string" },
                  suggested_stage: { type: "string" },
                  reason: { type: "string" },
                  action: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      toast.success('Pipeline otimizado!', {
        description: analysis.summary,
        duration: 8000
      });

      // Mostrar quick wins
      if (analysis.quick_wins.length > 0) {
        const winsMessage = analysis.quick_wins.map(w => 
          `• ${w.client}: ${w.current_stage} → ${w.suggested_stage}\n  ${w.reason}`
        ).join('\n\n');
        
        toast.info(`🎯 ${analysis.quick_wins.length} Quick Wins Identificados`, {
          description: 'Verifique as sugestões',
          duration: 10000
        });
      }

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao otimizar pipeline');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Otimização de Pipeline IA</h3>
          <p className="text-xs text-slate-600">Analisa funil e sugere ações</p>
        </div>
      </div>

      <Button
        onClick={optimizePipeline}
        disabled={analyzing}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando Funil...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Otimizar Pipeline
          </>
        )}
      </Button>
    </Card>
  );
}