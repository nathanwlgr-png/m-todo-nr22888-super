import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function FunnelOptimizer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const funnelStages = useMemo(() => {
    return {
      lead: clients.filter(c => c.pipeline_stage === 'lead').length,
      qualificado: clients.filter(c => c.pipeline_stage === 'qualificado').length,
      proposta: clients.filter(c => c.pipeline_stage === 'proposta').length,
      negociacao: clients.filter(c => c.pipeline_stage === 'negociacao').length,
      fechado: clients.filter(c => c.pipeline_stage === 'fechado').length,
      perdido: clients.filter(c => c.pipeline_stage === 'perdido').length
    };
  }, [clients]);

  const analyzeBottlenecks = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em otimização de funil de vendas. Analise este funil e identifique gargalos:

FUNIL ATUAL:
- Leads: ${funnelStages.lead}
- Qualificados: ${funnelStages.qualificado}
- Proposta: ${funnelStages.proposta}
- Negociação: ${funnelStages.negociacao}
- Fechado: ${funnelStages.fechado}
- Perdido: ${funnelStages.perdido}

CLIENTES POR STATUS:
${clients.slice(0, 50).map(c => `- ${c.first_name}: Pipeline ${c.pipeline_stage}, Status ${c.status}, Score ${c.purchase_score}`).join('\n')}

IDENTIFIQUE:
1. Qual etapa está travando o funil?
2. Por que clientes não estão avançando?
3. Quais 5 ações CONCRETAS vão destrancar?
4. Quais clientes específicos precisam atenção AGORA?`,
        response_json_schema: {
          type: "object",
          properties: {
            bottleneck_stage: { type: "string" },
            bottleneck_reason: { type: "string" },
            conversion_rates: {
              type: "object",
              properties: {
                lead_to_qualified: { type: "number" },
                qualified_to_proposal: { type: "number" },
                proposal_to_negotiation: { type: "number" },
                negotiation_to_closed: { type: "number" }
              }
            },
            immediate_actions: { type: "array", items: { type: "string" } },
            clients_stuck: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  stage: { type: "string" },
                  recommended_action: { type: "string" }
                }
              }
            },
            health_score: { type: "number" }
          }
        }
      });

      setInsights(result);
      toast.success('Análise de funil concluída!');
    } catch (error) {
      toast.error('Erro ao analisar funil');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="font-bold text-slate-900">Otimizador de Funil</h3>
          <p className="text-xs text-slate-600">IA identifica gargalos e sugere ações</p>
        </div>
      </div>

      {/* Funil Overview */}
      <div className="space-y-2 mb-4">
        {Object.entries({
          lead: 'Leads',
          qualificado: 'Qualificados',
          proposta: 'Proposta',
          negociacao: 'Negociação',
          fechado: 'Fechado'
        }).map(([key, label]) => {
          const count = funnelStages[key];
          const total = Object.values(funnelStages).reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? (count / total * 100) : 0;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">{label}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-end pr-2"
                  style={{ width: `${percentage}%` }}
                >
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!insights ? (
        <Button
          onClick={analyzeBottlenecks}
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
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar Gargalos
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Health Score */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-900">Saúde do Funil</span>
              <Badge className={
                insights.health_score >= 70 ? 'bg-green-500' :
                insights.health_score >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }>
                {insights.health_score}/100
              </Badge>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                style={{ width: `${insights.health_score}%` }}
              />
            </div>
          </div>

          {/* Bottleneck */}
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-700" />
              <span className="text-sm font-semibold text-red-900">Gargalo Identificado</span>
            </div>
            <p className="text-sm font-bold text-red-800 mb-1">{insights.bottleneck_stage}</p>
            <p className="text-xs text-red-700">{insights.bottleneck_reason}</p>
          </div>

          {/* Ações Imediatas */}
          <div>
            <h4 className="font-semibold text-sm mb-2">🎯 Ações Imediatas</h4>
            <div className="space-y-1">
              {insights.immediate_actions?.map((action, i) => (
                <div key={i} className="p-2 bg-indigo-50 rounded text-xs text-indigo-800">
                  {i + 1}. {action}
                </div>
              ))}
            </div>
          </div>

          {/* Clientes Travados */}
          {insights.clients_stuck?.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">⚠️ Clientes Travados</h4>
              <div className="space-y-2">
                {insights.clients_stuck.slice(0, 3).map((stuck, i) => (
                  <div key={i} className="p-2 bg-yellow-50 rounded-lg text-xs">
                    <p className="font-semibold text-yellow-900">{stuck.client_name}</p>
                    <p className="text-yellow-700">Travado em: {stuck.stage}</p>
                    <p className="text-yellow-800">→ {stuck.recommended_action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setInsights(null)}
            variant="outline"
            className="w-full"
          >
            Nova Análise
          </Button>
        </div>
      )}
    </Card>
  );
}