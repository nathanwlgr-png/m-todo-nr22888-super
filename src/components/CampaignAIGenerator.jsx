import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Target, Users, MessageCircle, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignAIGenerator({ onStrategyGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const generateStrategy = async () => {
    setGenerating(true);
    try {
      // Buscar dados
      const [clients, sales, equipmentMaterials] = await Promise.all([
        base44.entities.Client.list('-updated_date', 500),
        base44.entities.Sale.list('-sale_date', 500),
        base44.entities.EquipmentMaterial.list('-created_date', 100)
      ]);

      // Análise com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um estrategista de marketing e vendas veterinárias EXPERT. Analise os dados e crie UMA estratégia de campanha MATADORA:

DADOS DO MERCADO:
- Total de Clientes: ${clients.length}
- Clientes Quentes: ${clients.filter(c => c.status === 'quente').length}
- Clientes Mornos: ${clients.filter(c => c.status === 'morno').length}
- Clientes Frios: ${clients.filter(c => c.status === 'frio').length}
- Vendas Fechadas (últimos 6 meses): ${sales.filter(s => s.status === 'fechada').length}
- Ticket Médio: R$ ${(sales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / Math.max(sales.length, 1)).toFixed(0)}

PERFIL DOS CLIENTES:
${clients.slice(0, 50).map(c => `- ${c.first_name}: ${c.clinic_name || 'N/A'}, Status: ${c.status}, Score: ${c.purchase_score || 0}, Tipo: ${c.client_type}, Cidade: ${c.city}`).join('\n')}

EQUIPAMENTOS DISPONÍVEIS:
${equipmentMaterials.map(e => `- ${e.equipment_name}: ${e.summary}`).join('\n')}

HISTÓRICO DE VENDAS:
${sales.slice(0, 30).map(s => `- ${s.equipment_name}: R$ ${s.sale_value}, Status: ${s.status}`).join('\n')}

TAREFA:
Analise PROFUNDAMENTE esses dados e crie a MELHOR estratégia de campanha possível:

1. Identifique o MOMENTO perfeito (qual necessidade urgente do mercado?)
2. Escolha o EQUIPAMENTO ideal (qual tem melhor fit com clientes atuais?)
3. Defina PÚBLICO-ALVO cirúrgico (quem TEM MAIS chance de comprar AGORA?)
4. Sugira CANAIS corretos (onde esses clientes estão?)
5. Crie MENSAGEM matadora (que dor vamos resolver?)
6. Preveja RESULTADOS realistas

Seja ESTRATÉGICO, ACIONÁVEL e BASEADO EM DADOS.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            campaign_name: { type: "string" },
            objective: { type: "string" },
            strategic_reasoning: { type: "string" },
            equipment_focus: { type: "string" },
            equipment_reasoning: { type: "string" },
            target_audience: {
              type: "object",
              properties: {
                status: { type: "array", items: { type: "string" } },
                client_types: { type: "array", items: { type: "string" } },
                cities: { type: "array", items: { type: "string" } },
                min_score: { type: "number" },
                profile_description: { type: "string" }
              }
            },
            recommended_channels: {
              type: "array",
              items: { type: "string" }
            },
            channel_strategy: { type: "string" },
            key_messages: {
              type: "array",
              items: { type: "string" }
            },
            expected_metrics: {
              type: "object",
              properties: {
                target_leads: { type: "number" },
                target_meetings: { type: "number" },
                target_sales: { type: "number" },
                target_revenue: { type: "number" }
              }
            },
            campaign_duration_days: { type: "number" },
            suggested_budget: { type: "number" },
            budget_breakdown: { type: "string" },
            success_factors: {
              type: "array",
              items: { type: "string" }
            },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            },
            urgency_score: { type: "number" },
            competitive_angle: { type: "string" }
          }
        }
      });

      setStrategy(result);
      toast.success('Estratégia gerada com IA!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar estratégia');
    } finally {
      setGenerating(false);
    }
  };

  const applyStrategy = () => {
    if (!strategy) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + strategy.campaign_duration_days);

    onStrategyGenerated({
      name: strategy.campaign_name,
      objective: strategy.objective,
      equipment_focus: strategy.equipment_focus,
      start_date: startDate,
      end_date: endDate,
      budget: strategy.suggested_budget?.toString() || '',
      channels: strategy.recommended_channels || [],
      target_audience: strategy.target_audience,
      metrics: strategy.expected_metrics
    });

    toast.success('Estratégia aplicada! Revise e ajuste se necessário.');
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-1">🎯 Gerador de Estratégia IA</h3>
          <p className="text-sm text-slate-700">Análise profunda do mercado para campanha perfeita</p>
        </div>
      </div>

      {!strategy ? (
        <Button
          onClick={generateStrategy}
          disabled={generating}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-base font-semibold"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analisando mercado...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Estratégia Completa
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          {/* Nome e Objetivo */}
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <h4 className="font-bold text-lg text-slate-900 mb-2">{strategy.campaign_name}</h4>
            <p className="text-sm text-slate-700 mb-3">{strategy.objective}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">
                Urgência: {strategy.urgency_score}/10
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-700">
                {strategy.campaign_duration_days} dias
              </Badge>
            </div>
          </div>

          {/* Raciocínio Estratégico */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-700" />
              <h5 className="font-semibold text-blue-900 text-sm">Por que esta estratégia?</h5>
            </div>
            <p className="text-sm text-blue-800">{strategy.strategic_reasoning}</p>
          </div>

          {/* Equipamento Foco */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-700" />
              <h5 className="font-semibold text-orange-900 text-sm">Equipamento Foco</h5>
            </div>
            <p className="font-bold text-orange-900 mb-1">{strategy.equipment_focus}</p>
            <p className="text-sm text-orange-800">{strategy.equipment_reasoning}</p>
          </div>

          {/* Público-Alvo */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-700" />
              <h5 className="font-semibold text-green-900 text-sm">Público-Alvo</h5>
            </div>
            <p className="text-sm text-green-800 mb-2">{strategy.target_audience.profile_description}</p>
            <div className="flex flex-wrap gap-1">
              {strategy.target_audience.status?.map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
              ))}
              {strategy.target_audience.cities?.slice(0, 3).map((c, i) => (
                <Badge key={i} variant="outline" className="text-xs">📍 {c}</Badge>
              ))}
            </div>
          </div>

          {/* Canais e Mensagens */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-purple-700" />
              <h5 className="font-semibold text-purple-900 text-sm">Canais & Mensagens</h5>
            </div>
            <div className="flex gap-2 mb-3">
              {strategy.recommended_channels?.map((ch, i) => (
                <Badge key={i} className="bg-purple-600 text-white">{ch}</Badge>
              ))}
            </div>
            <p className="text-sm text-purple-800 mb-2">{strategy.channel_strategy}</p>
            <div className="space-y-1 mt-3">
              {strategy.key_messages?.map((msg, i) => (
                <p key={i} className="text-xs text-purple-700">💬 {msg}</p>
              ))}
            </div>
          </div>

          {/* Métricas Esperadas */}
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h5 className="font-semibold text-slate-900 text-sm">Métricas Esperadas</h5>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Leads</p>
                <p className="font-bold text-slate-900">{strategy.expected_metrics?.target_leads || 0}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Reuniões</p>
                <p className="font-bold text-slate-900">{strategy.expected_metrics?.target_meetings || 0}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-green-700">Vendas</p>
                <p className="font-bold text-green-900">{strategy.expected_metrics?.target_sales || 0}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-green-700">Receita</p>
                <p className="font-bold text-green-900">R$ {((strategy.expected_metrics?.target_revenue || 0) / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>

          {/* Orçamento */}
          {strategy.suggested_budget && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h5 className="font-semibold text-yellow-900 text-sm mb-2">💰 Orçamento Sugerido</h5>
              <p className="text-2xl font-bold text-yellow-900 mb-2">R$ {strategy.suggested_budget.toLocaleString()}</p>
              <p className="text-xs text-yellow-800">{strategy.budget_breakdown}</p>
            </div>
          )}

          {/* Fatores de Sucesso */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-semibold text-green-700 mb-2">✅ Fatores de Sucesso</p>
              {strategy.success_factors?.slice(0, 3).map((f, i) => (
                <p key={i} className="text-xs text-green-600 mb-1">• {f}</p>
              ))}
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Riscos</p>
              {strategy.risk_factors?.slice(0, 3).map((r, i) => (
                <p key={i} className="text-xs text-red-600 mb-1">• {r}</p>
              ))}
            </div>
          </div>

          {/* Ângulo Competitivo */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <h5 className="font-semibold text-orange-900 text-sm mb-2">🎯 Ângulo Competitivo</h5>
            <p className="text-sm text-orange-800">{strategy.competitive_angle}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={applyStrategy}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Aplicar Estratégia
            </Button>
            <Button
              onClick={() => setStrategy(null)}
              variant="outline"
            >
              Gerar Nova
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}