import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Loader2, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function RiskScoringSystem() {
  const [analyzing, setAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list();
      return data.filter(c => c && c.id && c.first_name);
    }
  });

  const analyzeRisks = async () => {
    setAnalyzing(true);
    try {
      const clientsWithRisk = clients.map(client => {
        let riskScore = 0;
        const factors = [];

        // Sem contato recente
        if (!client.last_contact_date) {
          riskScore += 20;
          factors.push('Sem registro de contato');
        } else {
          const daysSinceContact = Math.floor((Date.now() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24));
          if (daysSinceContact > 90) {
            riskScore += 15;
            factors.push(`${daysSinceContact} dias sem contato`);
          }
        }

        // Status frio
        if (client.status === 'frio') {
          riskScore += 25;
          factors.push('Status: Frio');
        }

        // Score baixo
        if ((client.purchase_score || 0) < 30) {
          riskScore += 20;
          factors.push('Score de compra baixo');
        }

        // Sem email/telefone
        if (!client.email && !client.phone) {
          riskScore += 15;
          factors.push('Sem contato cadastrado');
        }

        // Sem cidade
        if (!client.city) {
          riskScore += 10;
          factors.push('Sem localização');
        }

        return {
          ...client,
          risk_score: Math.min(riskScore, 100),
          risk_factors: factors,
          risk_level: riskScore >= 60 ? 'alto' : riskScore >= 30 ? 'medio' : 'baixo'
        };
      }).sort((a, b) => b.risk_score - a.risk_score);

      const highRisk = clientsWithRisk.filter(c => c.risk_level === 'alto');
      const mediumRisk = clientsWithRisk.filter(c => c.risk_level === 'medio');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os riscos desta base de clientes e gere ações de mitigação:

TOTAL: ${clients.length} clientes
ALTO RISCO: ${highRisk.length} (${((highRisk.length/clients.length)*100).toFixed(1)}%)
MÉDIO RISCO: ${mediumRisk.length}

PRINCIPAIS FATORES DE RISCO:
${highRisk.slice(0, 10).map(c => 
  `- ${c.first_name}: Score ${c.risk_score} (${c.risk_factors.join(', ')})`
).join('\n')}

GERE:
1. Análise de risco por segmento
2. Plano de ação para clientes de alto risco
3. Estratégias de reengajamento
4. Priorização de contatos
5. Métricas de acompanhamento`,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_riscos: { type: "string" },
            acoes_alto_risco: { type: "array", items: { type: "string" } },
            acoes_medio_risco: { type: "array", items: { type: "string" } },
            estrategias_reengajamento: { type: "array", items: { type: "string" } },
            prioridades: { type: "array", items: { type: "string" } },
            metricas_acompanhamento: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRiskAnalysis({
        clients: clientsWithRisk,
        highRisk,
        mediumRisk,
        insights: response
      });

      toast.success('Análise de risco concluída!');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao analisar riscos');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Scoring de Risco</h3>
          <p className="text-xs text-slate-600">Identifique clientes em risco de perda</p>
        </div>
      </div>

      <Button
        onClick={analyzeRisks}
        disabled={analyzing}
        className="w-full bg-red-600 hover:bg-red-700 mb-3"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando riscos...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Analisar Riscos de Todos os Clientes
          </>
        )}
      </Button>

      {riskAnalysis && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded-lg text-center">
              <p className="text-lg font-bold text-slate-800">{riskAnalysis.clients.length}</p>
              <p className="text-xs text-slate-600">Total</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-center border border-red-300">
              <p className="text-lg font-bold text-red-700">{riskAnalysis.highRisk.length}</p>
              <p className="text-xs text-red-600">Alto Risco</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-300">
              <p className="text-lg font-bold text-orange-700">{riskAnalysis.mediumRisk.length}</p>
              <p className="text-xs text-orange-600">Médio</p>
            </div>
          </div>

          {/* Resumo */}
          <div className="p-3 bg-white rounded-lg border border-red-200">
            <p className="text-xs font-semibold text-red-800 mb-2">📊 Resumo de Riscos</p>
            <p className="text-xs text-slate-700">{riskAnalysis.insights.resumo_riscos}</p>
          </div>

          {/* Alto Risco */}
          {riskAnalysis.highRisk.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-300 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-xs font-semibold text-red-800">⚠️ Clientes de Alto Risco</p>
              </div>
              <div className="space-y-2">
                {riskAnalysis.highRisk.slice(0, 10).map((client, i) => (
                  <div key={i} className="p-2 bg-white rounded border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold">{client.first_name}</p>
                      <Badge className="bg-red-600 text-xs">Score: {client.risk_score}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {client.risk_factors.slice(0, 3).map((factor, j) => (
                        <Badge key={j} variant="outline" className="text-[9px] border-red-300">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações Recomendadas */}
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ Ações para Alto Risco</p>
            <ol className="space-y-1 text-xs list-decimal list-inside text-green-700">
              {riskAnalysis.insights.acoes_alto_risco?.map((acao, i) => (
                <li key={i}>{acao}</li>
              ))}
            </ol>
          </div>

          {/* Estratégias */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2">🎯 Estratégias de Reengajamento</p>
            {riskAnalysis.insights.estrategias_reengajamento?.map((estrategia, i) => (
              <p key={i} className="text-xs text-blue-700 mb-1">• {estrategia}</p>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}