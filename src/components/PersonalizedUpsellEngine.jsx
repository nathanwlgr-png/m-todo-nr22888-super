import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { executeWithRateLimit } from '@/components/rateLimitManager';

export default function PersonalizedUpsellEngine({ client, sales = [] }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const totalSpent = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const equipmentsPurchased = sales.map(s => s.equipment_name).join(', ');

      const prompt = `MOTOR DE UPSELL/CROSS-SELL PERSONALIZADO

CLIENTE: ${client.first_name}
LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}
Gasto Total: R$ ${totalSpent.toLocaleString('pt-BR')}
Equipamentos Comprados: ${equipmentsPurchased || 'Nenhum'}
Equipamento Interesse: ${client.equipment_interest || 'Não definido'}
Tipo: ${client.client_type}
Health: ${client.health_score || 50}%

HISTÓRICO DE COMPRAS:
${sales.length > 0 ? sales.map(s => `- ${s.equipment_name}: R$ ${s.sale_value.toLocaleString('pt-BR')}`).join('\n') : 'Nenhuma compra ainda'}

MISSÃO: Gerar 3-5 recomendações de UPSELL/CROSS-SELL personalizadas.

Analise:
1. Equipamentos que complementam o que já tem
2. Upgrades naturais baseados no uso atual
3. Insumos recorrentes de alto valor
4. Pacotes que maximizem ROI
5. LTV esperado de cada recomendação

Para cada recomendação:
- Produto/equipamento específico
- Valor estimado
- Motivo baseado no histórico
- Benefício claro
- Probabilidade de aceitação
- LTV incremental
- Momento ideal para oferta

Seja ESTRATÉGICO e baseado em DADOS.`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_name: { type: "string" },
                    type: { type: "string", enum: ["upsell", "cross_sell", "consumable", "upgrade"] },
                    estimated_value: { type: "number" },
                    reasoning: { type: "string" },
                    benefit: { type: "string" },
                    acceptance_probability: { type: "number" },
                    ltv_impact: { type: "number" },
                    optimal_timing: { type: "string" },
                    pitch_script: { type: "string" }
                  }
                }
              },
              total_potential_ltv: { type: "number" }
            }
          }
        });
      }, 'normal');

      setRecommendations(result);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar recomendações');
    } finally {
      setLoading(false);
    }
  };

  if (!recommendations) {
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">💰 Upsell/Cross-Sell IA</h3>
            <p className="text-xs text-white/80">Recomendações baseadas em histórico + LTV</p>
          </div>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={loading}
          className="w-full h-10 bg-white text-emerald-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Recomendações'}
        </Button>
      </Card>
    );
  }

  const getTypeColor = (type) => {
    return {
      upsell: 'bg-purple-500 text-white',
      cross_sell: 'bg-blue-500 text-white',
      consumable: 'bg-green-500 text-white',
      upgrade: 'bg-orange-500 text-white'
    }[type] || 'bg-gray-500 text-white';
  };

  return (
    <Card className="p-4 bg-white shadow-lg border-2 border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Oportunidades de Upsell
        </h3>
        <Badge className="bg-emerald-600 text-white">
          +R$ {(recommendations.total_potential_ltv || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {recommendations.recommendations.map((rec, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-slate-800">{rec.product_name}</p>
                  <Badge className={getTypeColor(rec.type)}>
                    {rec.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-1">{rec.reasoning}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-700">
                  R$ {rec.estimated_value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-500">{rec.acceptance_probability}% prob.</p>
              </div>
            </div>

            <div className="bg-green-50 rounded p-2 border border-green-200 mb-2">
              <p className="text-xs font-semibold text-green-800 mb-1">✓ Benefício:</p>
              <p className="text-xs text-green-700">{rec.benefit}</p>
            </div>

            <div className="bg-purple-50 rounded p-2 border border-purple-200 mb-2">
              <p className="text-xs font-semibold text-purple-800 mb-1">💬 Pitch Sugerido:</p>
              <p className="text-xs text-purple-700 italic">"{rec.pitch_script}"</p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                <Sparkles className="w-3 h-3 inline mr-1" />
                LTV +R$ {rec.ltv_impact.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-blue-700 font-medium">
                ⏰ {rec.optimal_timing}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => setRecommendations(null)} variant="outline" size="sm" className="w-full">
        Atualizar Recomendações
      </Button>
    </Card>
  );
}