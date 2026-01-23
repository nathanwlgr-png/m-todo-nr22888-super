import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Target, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartSegmentationEngine() {
  const [segments, setSegments] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients-segmentation'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales-segmentation'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['all-interactions-segmentation'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const generateSegmentation = async () => {
    setLoading(true);
    try {
      // Preparar dados agregados
      const clientsData = clients.map(c => {
        const clientSales = sales.filter(s => s.client_id === c.id);
        const clientInteractions = interactions.filter(i => i.client_id === c.id);
        const totalRevenue = clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
        const lastSaleDate = clientSales.length > 0 ? 
          Math.max(...clientSales.map(s => new Date(s.sale_date).getTime())) : 0;
        const daysSinceLastSale = lastSaleDate > 0 ? 
          Math.floor((Date.now() - lastSaleDate) / (1000 * 60 * 60 * 24)) : 999;

        return {
          id: c.id,
          name: c.first_name,
          status: c.status,
          health_score: c.health_score || 50,
          engagement_score: c.engagement_score || 0,
          ltv: c.ltv_estimate || totalRevenue,
          total_sales: clientSales.length,
          total_revenue: totalRevenue,
          avg_deal_size: clientSales.length > 0 ? totalRevenue / clientSales.length : 0,
          interactions_count: clientInteractions.length,
          days_since_last_sale: daysSinceLastSale,
          pipeline_stage: c.pipeline_stage,
          churn_risk: c.ai_sales_intelligence?.churn_risk || 0,
          ai_segment: c.ai_segment
        };
      });

      const prompt = `Você é um especialista em segmentação de clientes e marketing de dados.

DADOS DA BASE DE CLIENTES (${clients.length} clientes):

Resumo Estatístico:
- Total Clientes: ${clients.length}
- Clientes Ativos: ${clients.filter(c => c.status === 'quente').length}
- Total Vendas: ${sales.length}
- Receita Total: R$ ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}

Distribuição:
- Health Score Médio: ${(clients.reduce((sum, c) => sum + (c.health_score || 50), 0) / clients.length).toFixed(1)}
- Engagement Médio: ${(clients.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / clients.length).toFixed(1)}

MISSÃO:
Crie uma segmentação INTELIGENTE e ACIONÁVEL da base de clientes. Para cada segmento:

1. **Critérios de Pertencimento**: Regras claras
2. **Comportamentos Típicos**: Padrões observados
3. **Valor Estratégico**: Importância para o negócio
4. **Campanhas Recomendadas**: Ações de marketing específicas
5. **Métricas de Sucesso**: KPIs para acompanhar

SEGMENTOS A CRIAR:

**RFM + COMPORTAMENTAL:**
1. Champions (Compram muito, recentemente, frequentemente)
2. Loyal Customers (Compram frequentemente, mas valor menor)
3. Big Spenders (Alto valor, baixa frequência)
4. Promising (Potencial alto, recente)
5. Need Attention (Bons clientes perdendo engagement)
6. At Risk (Alto valor, mas sem comprar há tempo)
7. Can't Lose Them (Melhores clientes em risco de churn)
8. Hibernating (Bons clientes inativos)
9. Lost (Não respondem, alto tempo sem compra)

**ANÁLISE REQUERIDA:**
- Tamanho de cada segmento
- Valor total por segmento
- Campanhas específicas para cada um
- Prioridade de atenção (1-10)
- ROI esperado de investimento marketing

Retorne JSON estruturado:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            total_segments: { type: "number" },
            segmentation_date: { type: "string" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  criteria: {
                    type: "object",
                    properties: {
                      recency_days: { type: "string" },
                      frequency_threshold: { type: "number" },
                      monetary_min: { type: "number" },
                      health_score_range: { type: "string" },
                      engagement_level: { type: "string" }
                    }
                  },
                  size: { type: "number" },
                  total_value: { type: "number" },
                  avg_ltv: { type: "number" },
                  behavioral_traits: { type: "array", items: { type: "string" } },
                  strategic_importance: { type: "string" },
                  priority_score: { type: "number" },
                  campaigns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        campaign_name: { type: "string" },
                        objective: { type: "string" },
                        channel: { type: "string" },
                        message_type: { type: "string" },
                        frequency: { type: "string" },
                        expected_response_rate: { type: "number" },
                        estimated_roi: { type: "number" }
                      }
                    }
                  },
                  success_metrics: { type: "array", items: { type: "string" } },
                  risk_level: { type: "string" },
                  recommended_actions: { type: "array", items: { type: "string" } }
                }
              }
            },
            overall_insights: {
              type: "object",
              properties: {
                most_valuable_segment: { type: "string" },
                highest_risk_segment: { type: "string" },
                biggest_opportunity: { type: "string" },
                recommended_focus: { type: "string" }
              }
            }
          }
        }
      });

      setSegments(result);
      toast.success(`${result.total_segments} segmentos criados!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao segmentar clientes');
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (name) => {
    const colors = {
      'Champions': 'from-purple-500 to-pink-500',
      'Loyal': 'from-blue-500 to-cyan-500',
      'Big Spenders': 'from-yellow-500 to-amber-500',
      'Promising': 'from-green-500 to-emerald-500',
      'Need Attention': 'from-orange-500 to-red-500',
      'At Risk': 'from-red-500 to-rose-600',
      'Can\'t Lose': 'from-red-600 to-red-800',
      'Hibernating': 'from-slate-400 to-gray-500',
      'Lost': 'from-gray-600 to-slate-700'
    };
    
    for (let key in colors) {
      if (name.includes(key)) return colors[key];
    }
    return 'from-indigo-500 to-purple-500';
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 8) return { text: 'Crítico', color: 'bg-red-500 text-white' };
    if (priority >= 6) return { text: 'Alto', color: 'bg-orange-500 text-white' };
    if (priority >= 4) return { text: 'Médio', color: 'bg-yellow-500 text-white' };
    return { text: 'Baixo', color: 'bg-blue-500 text-white' };
  };

  if (!segments) {
    return (
      <Card className="p-5 bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 border-none shadow-xl">
        <div className="text-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Segmentação Inteligente</h3>
              <p className="text-xs text-white/80">RFM + Comportamento + Campanhas Personalizadas</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3">
            <p className="text-xs leading-relaxed">
              Segmenta automaticamente todos os {clients.length} clientes usando análise RFM (Recência, Frequência, Valor Monetário) + comportamento + health score. Gera campanhas de marketing personalizadas para cada segmento.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="bg-white/10 backdrop-blur rounded p-2 text-center">
              <p className="text-white/70">Clientes</p>
              <p className="font-bold">{clients.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded p-2 text-center">
              <p className="text-white/70">Vendas</p>
              <p className="font-bold">{sales.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded p-2 text-center">
              <p className="text-white/70">Interações</p>
              <p className="font-bold">{interactions.length}</p>
            </div>
          </div>

          <Button
            onClick={generateSegmentation}
            disabled={loading || clients.length === 0}
            className="w-full h-12 bg-white text-blue-700 hover:bg-white/90 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Segmentando clientes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Segmentar Base Completa
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Insights */}
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white shadow-lg">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights Estratégicos
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70 mb-1">Segmento Mais Valioso</p>
            <p className="font-bold">{segments.overall_insights.most_valuable_segment}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70 mb-1">Maior Risco</p>
            <p className="font-bold">{segments.overall_insights.highest_risk_segment}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70 mb-1">Maior Oportunidade</p>
            <p className="font-bold">{segments.overall_insights.biggest_opportunity}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70 mb-1">Foco Recomendado</p>
            <p className="font-bold">{segments.overall_insights.recommended_focus}</p>
          </div>
        </div>
      </Card>

      {/* Segments */}
      {segments.segments
        .sort((a, b) => b.priority_score - a.priority_score)
        .map((segment, index) => {
          const priorityBadge = getPriorityBadge(segment.priority_score);
          
          return (
            <Card key={index} className="overflow-hidden shadow-lg">
              {/* Header */}
              <div className={`p-4 bg-gradient-to-r ${getSegmentColor(segment.name)} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-lg">{segment.name}</h4>
                  <Badge className={priorityBadge.color}>
                    {priorityBadge.text} ({segment.priority_score}/10)
                  </Badge>
                </div>
                <p className="text-sm text-white/90">{segment.description}</p>
              </div>

              <div className="p-4 space-y-3">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 rounded p-2 text-center">
                    <p className="text-slate-500">Clientes</p>
                    <p className="font-bold text-slate-800">{segment.size}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2 text-center">
                    <p className="text-slate-500">Valor Total</p>
                    <p className="font-bold text-slate-800">R$ {(segment.total_value / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2 text-center">
                    <p className="text-slate-500">LTV Médio</p>
                    <p className="font-bold text-slate-800">R$ {(segment.avg_ltv / 1000).toFixed(0)}k</p>
                  </div>
                </div>

                {/* Behavioral Traits */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Características Comportamentais:</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.behavioral_traits.map((trait, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Campaigns */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Campanhas Recomendadas ({segment.campaigns.length})
                  </p>
                  {segment.campaigns.map((campaign, i) => (
                    <div key={i} className="bg-white rounded p-2 mb-2 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-800 text-xs">{campaign.campaign_name}</p>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          ROI: {campaign.estimated_roi}x
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{campaign.objective}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>📢 {campaign.channel}</span>
                        <span>•</span>
                        <span>📨 {campaign.message_type}</span>
                        <span>•</span>
                        <span>📅 {campaign.frequency}</span>
                        <span>•</span>
                        <span>✓ {campaign.expected_response_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended Actions */}
                {segment.recommended_actions.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-1">⚡ Ações Recomendadas:</p>
                    {segment.recommended_actions.map((action, i) => (
                      <p key={i} className="text-xs text-slate-700 mb-1">✓ {action}</p>
                    ))}
                  </div>
                )}

                {/* Risk Level */}
                {segment.risk_level && (
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-slate-600">Nível de Risco: <strong>{segment.risk_level}</strong></span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

      <Button
        onClick={() => setSegments(null)}
        variant="outline"
        className="w-full"
      >
        Gerar Nova Segmentação
      </Button>
    </div>
  );
}