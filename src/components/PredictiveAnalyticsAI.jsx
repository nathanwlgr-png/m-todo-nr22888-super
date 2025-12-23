import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Loader2, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveAnalyticsAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const runPrediction = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é uma IA especialista em análise preditiva de vendas.

DADOS HISTÓRICOS:
- Clientes: ${clients.length}
- Vendas fechadas: ${sales.length}
- Pipeline: R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString()}

CLIENTES TOP:
${clients.slice(0, 20).map(c => 
  `- ${c.first_name}: score=${c.purchase_score}%, status=${c.status}, valor=${c.projected_revenue || 0}`
).join('\n')}

ANÁLISE PREDITIVA COMPLETA:
1. Probabilidade de fechamento (próximos 30 dias)
2. Receita prevista (conservador/otimista)
3. Clientes em risco de perda
4. Oportunidades ocultas
5. Melhores ações imediatas

Retorne JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            closing_probability: {
              type: "object",
              properties: {
                high_probability: { type: "array", items: { type: "string" } },
                medium_probability: { type: "array", items: { type: "string" } },
                percentage: { type: "number" }
              }
            },
            revenue_forecast: {
              type: "object",
              properties: {
                conservative: { type: "number" },
                optimistic: { type: "number" },
                most_likely: { type: "number" }
              }
            },
            at_risk_clients: { type: "array", items: { type: "string" } },
            hidden_opportunities: { type: "array", items: { type: "string" } },
            immediate_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPrediction(result);
      toast.success('Análise preditiva concluída!', {
        description: `${result.closing_probability?.percentage}% de conversão prevista`
      });

    } catch (error) {
      toast.error('Erro na análise preditiva');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-sm">IA Preditiva</h3>
          <p className="text-xs text-slate-600">Análise futura</p>
        </div>
      </div>

      <Button
        onClick={runPrediction}
        disabled={analyzing}
        className="w-full bg-blue-600 hover:bg-blue-700 h-10 mb-3"
        size="sm"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Prever Vendas
          </>
        )}
      </Button>

      {prediction && (
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-white rounded border">
            <p className="font-semibold text-blue-800">Conversão: {prediction.closing_probability?.percentage}%</p>
            <p className="text-slate-600">Receita: R$ {(prediction.revenue_forecast?.most_likely || 0).toLocaleString()}</p>
          </div>
        </div>
      )}
    </Card>
  );
}