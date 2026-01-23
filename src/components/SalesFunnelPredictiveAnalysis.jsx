import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { executeWithRateLimit } from '@/components/rateLimitManager';

export default function SalesFunnelPredictiveAnalysis({ client, interactions = [], sales = [], visits = [] }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const totalSalesValue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const avgInteractionGap = interactions.length > 1 ? 
        (Date.now() - new Date(interactions[0].created_date).getTime()) / (1000 * 60 * 60 * 24) : 999;

      const prompt = `ANÁLISE PREDITIVA DE FECHAMENTO - Funil de Vendas

CLIENTE: ${client.first_name}
Pipeline: ${client.pipeline_stage || 'lead'}
Status: ${client.status} | Score: ${client.purchase_score}%
Health: ${client.health_score || 50}% | Engagement: ${client.engagement_score || 0}%

DADOS:
- LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}
- Churn Risk: ${client.ai_sales_intelligence?.churn_risk || 0}%
- Vendas: ${sales.length} (R$ ${totalSalesValue.toLocaleString('pt-BR')})
- Visitas: ${visits.length}
- Interações: ${interactions.length}
- Última interação: ${Math.floor(avgInteractionGap)} dias

MISSÃO: Prever probabilidade e tempo de fechamento desta venda.

Analise:
1. Estágio atual no funil
2. Velocidade de progressão
3. Sinais de compra
4. Barreiras identificadas
5. Histórico de comportamento

Retorne previsão completa:`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              closing_probability: { type: "number" },
              estimated_days_to_close: { type: "number" },
              expected_value: { type: "number" },
              confidence_level: { type: "string" },
              key_signals: { type: "array", items: { type: "string" } },
              barriers: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } },
              next_milestone: { type: "string" },
              risk_factors: { type: "array", items: { type: "string" } }
            }
          }
        });
      }, 'high');

      setPrediction(result);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar previsão');
    } finally {
      setLoading(false);
    }
  };

  if (!prediction) {
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">📊 Previsão de Fechamento IA</h3>
            <p className="text-xs text-white/80">Análise preditiva do funil</p>
          </div>
        </div>
        <Button
          onClick={generatePrediction}
          disabled={loading}
          className="w-full h-10 bg-white text-blue-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Previsão'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Previsão de Fechamento
        </h3>
        <Badge className={
          prediction.confidence_level === 'alta' ? 'bg-green-500 text-white' :
          prediction.confidence_level === 'média' ? 'bg-orange-500 text-white' :
          'bg-red-500 text-white'
        }>
          {prediction.confidence_level}
        </Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{prediction.closing_probability}%</p>
          <p className="text-xs text-slate-600">Probabilidade</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-700">{prediction.estimated_days_to_close}d</p>
          <p className="text-xs text-slate-600">Estimativa</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
          <p className="text-lg font-bold text-purple-700">R$ {(prediction.expected_value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-slate-600">Valor Previsto</p>
        </div>
      </div>

      {/* Key Signals */}
      {prediction.key_signals.length > 0 && (
        <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-2">
          <p className="text-xs font-semibold text-green-800 mb-1">✓ Sinais Positivos:</p>
          {prediction.key_signals.map((signal, i) => (
            <p key={i} className="text-xs text-green-700">• {signal}</p>
          ))}
        </div>
      )}

      {/* Barriers */}
      {prediction.barriers.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-2">
          <p className="text-xs font-semibold text-red-800 mb-1">⚠ Barreiras:</p>
          {prediction.barriers.map((barrier, i) => (
            <p key={i} className="text-xs text-red-700">• {barrier}</p>
          ))}
        </div>
      )}

      {/* Next Milestone */}
      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 mb-2">
        <p className="text-xs font-semibold text-indigo-800 mb-1">🎯 Próximo Marco:</p>
        <p className="text-sm text-slate-700">{prediction.next_milestone}</p>
      </div>

      {/* Recommended Actions */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
        <p className="text-xs font-semibold text-blue-800 mb-1">💡 Ações Recomendadas:</p>
        {prediction.recommended_actions.map((action, i) => (
          <p key={i} className="text-xs text-slate-700">→ {action}</p>
        ))}
      </div>

      <Button onClick={() => setPrediction(null)} variant="outline" size="sm" className="w-full">
        Atualizar Previsão
      </Button>
    </Card>
  );
}