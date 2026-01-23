import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertTriangle, DollarSign, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveAnalyticsEngine({ client, interactions = [], sales = [], visits = [] }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePredictiveAnalysis = async () => {
    setLoading(true);
    try {
      // Calcular métricas históricas
      const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const avgDealSize = sales.length > 0 ? totalRevenue / sales.length : 0;
      const lastPurchaseDays = sales.length > 0 ? 
        Math.floor((Date.now() - new Date(sales[sales.length - 1].sale_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      const totalInteractions = interactions.length;
      const lastInteractionDays = interactions.length > 0 ?
        Math.floor((Date.now() - new Date(interactions[interactions.length - 1].created_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      const visitFrequency = visits.length > 0 ? visits.length / 12 : 0; // por mês

      const prompt = `Você é um cientista de dados especializado em análise preditiva de vendas B2B.

DADOS DO CLIENTE:
Nome: ${client.first_name}
Status Atual: ${client.status}
Health Score: ${client.health_score || 50}/100
Engagement Score: ${client.engagement_score || 0}/100
Pipeline Stage: ${client.pipeline_stage || 'lead'}

HISTÓRICO FINANCEIRO:
- Total Receita: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Vendas Fechadas: ${sales.length}
- Ticket Médio: R$ ${avgDealSize.toLocaleString('pt-BR')}
- Última Compra: ${lastPurchaseDays} dias atrás

ENGAJAMENTO:
- Total Interações: ${totalInteractions}
- Última Interação: ${lastInteractionDays} dias atrás
- Visitas Realizadas: ${visits.length}
- Frequência Visitas: ${visitFrequency.toFixed(1)}/mês

PERFIL:
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Orçamento: R$ ${(client.available_budget || 0).toLocaleString('pt-BR')}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}

ANÁLISE NECESSÁRIA:

1. **LIFETIME VALUE (LTV) PROJETADO**: 
   - Calcule o valor vitalício projetado para os próximos 3 anos
   - Baseie em ticket médio, frequência de compra, taxa de retenção
   - Considere potencial de upsell/cross-sell

2. **CHURN RISK**: 
   - Probabilidade de perda do cliente (0-100%)
   - Fatores de risco identificados
   - Sinais de alerta (red flags)
   - Tempo estimado até churn (se aplicável)

3. **NEXT PURCHASE PREDICTION**:
   - Probabilidade de próxima compra nos próximos 30/60/90 dias
   - Produto mais provável
   - Valor estimado da próxima venda

4. **VALOR ESTRATÉGICO**:
   - Classificação do cliente (Diamante/Ouro/Prata/Bronze)
   - Potencial de crescimento
   - ROI esperado de investimento comercial

5. **RECOMENDAÇÕES ACIONÁVEIS**:
   - Ações imediatas para maximizar LTV
   - Estratégias de retenção se churn risk alto
   - Timing ideal para próxima abordagem

Retorne JSON estruturado:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            ltv_analysis: {
              type: "object",
              properties: {
                projected_ltv_3years: { type: "number" },
                confidence_level: { type: "number" },
                calculation_method: { type: "string" },
                key_drivers: { type: "array", items: { type: "string" } },
                upsell_potential: { type: "number" }
              }
            },
            churn_risk: {
              type: "object",
              properties: {
                risk_percentage: { type: "number" },
                risk_level: { type: "string" },
                risk_factors: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                estimated_days_to_churn: { type: "number" },
                retention_probability: { type: "number" }
              }
            },
            next_purchase: {
              type: "object",
              properties: {
                probability_30days: { type: "number" },
                probability_60days: { type: "number" },
                probability_90days: { type: "number" },
                predicted_product: { type: "string" },
                estimated_value: { type: "number" },
                optimal_timing: { type: "string" }
              }
            },
            strategic_value: {
              type: "object",
              properties: {
                tier: { type: "string" },
                growth_potential: { type: "string" },
                expected_roi: { type: "number" },
                investment_recommendation: { type: "string" },
                competitive_vulnerability: { type: "string" }
              }
            },
            action_plan: {
              type: "object",
              properties: {
                immediate_actions: { type: "array", items: { type: "string" } },
                retention_strategies: { type: "array", items: { type: "string" } },
                growth_opportunities: { type: "array", items: { type: "string" } },
                optimal_next_contact: { type: "string" }
              }
            }
          }
        }
      });

      setAnalysis(result);

      // Atualizar cliente com dados preditivos
      await base44.entities.Client.update(client.id, {
        ltv_estimate: result.ltv_analysis.projected_ltv_3years,
        ai_sales_intelligence: {
          ...client.ai_sales_intelligence,
          churn_risk: result.churn_risk.risk_percentage,
          conversion_probability: result.next_purchase.probability_90days,
          last_ai_analysis: new Date().toISOString()
        }
      });

      toast.success('Análise preditiva gerada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      'Diamante': 'from-purple-500 to-pink-500',
      'Ouro': 'from-yellow-500 to-amber-500',
      'Prata': 'from-gray-400 to-slate-500',
      'Bronze': 'from-orange-700 to-orange-900'
    };
    return colors[tier] || 'from-gray-500 to-gray-600';
  };

  const getRiskColor = (risk) => {
    if (risk > 70) return 'from-red-500 to-red-700';
    if (risk > 40) return 'from-orange-500 to-orange-600';
    return 'from-green-500 to-emerald-600';
  };

  if (!analysis) {
    return (
      <Card className="p-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-none shadow-xl">
        <div className="text-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Análise Preditiva Avançada</h3>
              <p className="text-xs text-white/80">LTV • Churn Risk • Previsão de Compra • Valor Estratégico</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3">
            <p className="text-xs leading-relaxed">
              Sistema analisa histórico completo e gera previsões usando algoritmos de machine learning: valor vitalício, risco de perda, próxima compra e tier estratégico.
            </p>
          </div>

          <Button
            onClick={generatePredictiveAnalysis}
            disabled={loading}
            className="w-full h-12 bg-white text-purple-700 hover:bg-white/90 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando padrões...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Gerar Análise Preditiva
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Strategic Tier */}
      <Card className={`p-4 bg-gradient-to-r ${getTierColor(analysis.strategic_value.tier)} border-none text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="font-bold">Cliente {analysis.strategic_value.tier}</h3>
          </div>
          <Badge className="bg-white/20 text-white">ROI: {analysis.strategic_value.expected_roi}%</Badge>
        </div>
        <p className="text-sm text-white/90">{analysis.strategic_value.investment_recommendation}</p>
      </Card>

      {/* LTV */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-green-700 font-semibold mb-1">LIFETIME VALUE PROJETADO (3 ANOS)</p>
            <p className="text-3xl font-bold text-green-900 mb-2">
              R$ {analysis.ltv_analysis.projected_ltv_3years.toLocaleString('pt-BR')}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
              <span>Confiança: {analysis.ltv_analysis.confidence_level}%</span>
              <span>•</span>
              <span>Upsell: +R$ {analysis.ltv_analysis.upsell_potential.toLocaleString('pt-BR')}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700">Principais Drivers:</p>
              {analysis.ltv_analysis.key_drivers.map((driver, i) => (
                <p key={i} className="text-xs text-slate-600">• {driver}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Churn Risk */}
      <Card className={`p-4 bg-gradient-to-r ${getRiskColor(analysis.churn_risk.risk_percentage)} border-none text-white shadow-lg`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/90 font-semibold mb-1">RISCO DE CHURN</p>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-4xl font-bold">{analysis.churn_risk.risk_percentage}%</p>
              <Badge className="bg-white/20 text-white">{analysis.churn_risk.risk_level}</Badge>
            </div>
            
            {analysis.churn_risk.estimated_days_to_churn && (
              <p className="text-sm text-white/90 mb-2">
                ⏱️ Estimativa: {analysis.churn_risk.estimated_days_to_churn} dias
              </p>
            )}

            {analysis.churn_risk.red_flags.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-2 mb-2">
                <p className="text-xs font-semibold mb-1">🚨 Sinais de Alerta:</p>
                {analysis.churn_risk.red_flags.map((flag, i) => (
                  <p key={i} className="text-xs">• {flag}</p>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold mb-1">Fatores de Risco:</p>
              {analysis.churn_risk.risk_factors.map((factor, i) => (
                <p key={i} className="text-xs">• {factor}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Next Purchase Prediction */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800">Previsão de Próxima Compra</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">30 dias</p>
            <p className="text-lg font-bold text-blue-600">{analysis.next_purchase.probability_30days}%</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">60 dias</p>
            <p className="text-lg font-bold text-blue-600">{analysis.next_purchase.probability_60days}%</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">90 dias</p>
            <p className="text-lg font-bold text-blue-600">{analysis.next_purchase.probability_90days}%</p>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-xs text-indigo-700 font-semibold mb-1">Produto Previsto:</p>
          <p className="font-bold text-slate-800 mb-1">{analysis.next_purchase.predicted_product}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Valor: R$ {analysis.next_purchase.estimated_value.toLocaleString('pt-BR')}</span>
            <span className="text-indigo-600">⏰ {analysis.next_purchase.optimal_timing}</span>
          </div>
        </div>
      </Card>

      {/* Action Plan */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          Plano de Ação Estratégico
        </h3>

        {analysis.action_plan.immediate_actions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-red-700 mb-1">🔥 Ações Imediatas:</p>
            {analysis.action_plan.immediate_actions.map((action, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">✓ {action}</p>
            ))}
          </div>
        )}

        {analysis.action_plan.retention_strategies.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-orange-700 mb-1">🛡️ Estratégias de Retenção:</p>
            {analysis.action_plan.retention_strategies.map((strategy, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">• {strategy}</p>
            ))}
          </div>
        )}

        {analysis.action_plan.growth_opportunities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-green-700 mb-1">📈 Oportunidades de Crescimento:</p>
            {analysis.action_plan.growth_opportunities.map((opp, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">→ {opp}</p>
            ))}
          </div>
        )}

        <div className="bg-purple-100 rounded-lg p-2 border border-purple-300">
          <p className="text-xs font-semibold text-purple-800">🎯 Próximo Contato Ideal:</p>
          <p className="text-sm text-purple-900">{analysis.action_plan.optimal_next_contact}</p>
        </div>
      </Card>

      <Button
        onClick={() => setAnalysis(null)}
        variant="outline"
        className="w-full"
      >
        Gerar Nova Análise
      </Button>
    </div>
  );
}