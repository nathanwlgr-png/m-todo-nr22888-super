import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  ShoppingCart, 
  MessageSquare, 
  Zap,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function MarketContextualIntelligence({ client }) {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const generateIntelligence = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `INTELIGÊNCIA DE MERCADO CONTEXTUAL - PRIMORI

═══════════════════════════════════════
📊 DADOS DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Clínica: ${client.clinic_name || 'N/A'}
Localização: ${client.city || 'N/A'}
Tipo: ${client.client_type || 'N/A'}
Equipamentos Atuais: ${client.current_equipment || 'Nenhum'}
Equipamento Interesse: ${client.equipment_interest || 'Não definido'}
Necessidades Lab: ${client.lab_needs?.join(', ') || 'Não especificadas'}
Volume Exames: ${client.current_volume || 'Não estimado'}
Numerologia: ${client.numerology_number} - ${client.behavioral_profile || 'N/A'}
Status: ${client.status}
Score: ${client.purchase_score || 0}%

═══════════════════════════════════════
🎯 GERAR INTELIGÊNCIA CONTEXTUAL
═══════════════════════════════════════

Use dados REAIS do Google sobre:
- Mercado veterinário brasileiro atual
- Tendências em ${client.city || 'região'}
- Equipamentos veterinários Seamaty (VG1, VG2, VQ1, VI1, QT3, 3DX, SMT120)
- Concorrentes e soluções alternativas

RETORNE JSON com:

**1. conversation_topics** (array de 4-5 tópicos)
Tópicos RELEVANTES para conversar com este cliente:
- Relacionados ao perfil, equipamentos, necessidades
- Atuais e impactantes
- Cada tópico: {
    "topic": "Título chamativo",
    "relevance": "Por que é relevante para ESTE cliente",
    "talking_point": "Frase pronta para iniciar conversa"
  }

**2. complementary_equipment** (array de 3-4 equipamentos)
Equipamentos que COMPLEMENTARIAM o portfólio atual:
- Considerando o que já possui
- Baseado nas necessidades do laboratório
- Cada equipamento: {
    "equipment_name": "Nome do equipamento",
    "reason": "Por que complementa o atual",
    "benefit": "Principal benefício",
    "priority": "alta | media | baixa"
  }

**3. cross_sell_opportunities** (array de 3 oportunidades)
Oportunidades de CROSS-SELL baseadas em:
- Equipamentos atuais
- Volume de exames
- Tipo de clínica
- Cada oportunidade: {
    "opportunity": "Descrição da oportunidade",
    "products": ["Produto 1", "Produto 2"],
    "estimated_value": 50000,
    "trigger": "Quando abordar",
    "script": "Script de abordagem"
  }

**4. upsell_opportunities** (array de 2-3 oportunidades)
Oportunidades de UP-SELL:
- Upgrades de equipamentos atuais
- Soluções premium
- Cada oportunidade: {
    "current": "Solução atual",
    "upgrade": "Upgrade sugerido",
    "value_add": "Valor agregado",
    "roi": "ROI estimado"
  }

**5. market_trends** (array de 3-4 tendências)
Alertas de TENDÊNCIAS customizados para este cliente:
- Específicas para ${client.city || 'região'}
- Relacionadas ao tipo de clínica
- Relevantes para decisões de compra
- Cada tendência: {
    "trend": "Tendência identificada",
    "impact": "Impacto para este cliente",
    "action": "Ação recomendada",
    "urgency": "alta | media | baixa"
  }

**6. next_best_action** (objeto único)
PRÓXIMA MELHOR AÇÃO baseada em tudo acima:
{
  "action": "Ação específica",
  "timing": "Quando executar",
  "channel": "whatsapp | email | ligacao | visita",
  "message_template": "Template de mensagem"
}

Seja ULTRA ESPECÍFICO e ACIONÁVEL. Use dados reais de mercado.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            conversation_topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  relevance: { type: "string" },
                  talking_point: { type: "string" }
                }
              }
            },
            complementary_equipment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  equipment_name: { type: "string" },
                  reason: { type: "string" },
                  benefit: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            cross_sell_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  opportunity: { type: "string" },
                  products: { type: "array", items: { type: "string" } },
                  estimated_value: { type: "number" },
                  trigger: { type: "string" },
                  script: { type: "string" }
                }
              }
            },
            upsell_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  current: { type: "string" },
                  upgrade: { type: "string" },
                  value_add: { type: "string" },
                  roi: { type: "string" }
                }
              }
            },
            market_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend: { type: "string" },
                  impact: { type: "string" },
                  action: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            next_best_action: {
              type: "object",
              properties: {
                action: { type: "string" },
                timing: { type: "string" },
                channel: { type: "string" },
                message_template: { type: "string" }
              }
            }
          }
        }
      });

      setIntelligence(result);
      toast.success('Inteligência contextual gerada!');
    } catch (error) {
      toast.error('Erro ao gerar inteligência');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client && autoRefresh) {
      generateIntelligence();
    }
  }, [client?.id]);

  const getPriorityColor = (priority) => {
    const colors = {
      alta: 'bg-red-100 text-red-800 border-red-300',
      media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      baixa: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority] || colors.media;
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'alta') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (urgency === 'media') return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  };

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-white">🧠 Inteligência Contextual</CardTitle>
                <p className="text-xs text-indigo-100">Sugestões baseadas em IA + Mercado</p>
              </div>
            </div>
            <Button
              onClick={generateIntelligence}
              disabled={loading}
              size="sm"
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Analisando mercado e gerando inteligência...</p>
        </Card>
      )}

      {intelligence && (
        <>
          {/* Next Best Action */}
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                🎯 Próxima Melhor Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <p className="font-semibold text-slate-800 mb-2">{intelligence.next_best_action.action}</p>
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-800">{intelligence.next_best_action.channel}</Badge>
                  <Badge variant="outline">{intelligence.next_best_action.timing}</Badge>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded italic">
                  "{intelligence.next_best_action.message_template}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                💬 Tópicos de Conversa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {intelligence.conversation_topics?.map((topic, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-slate-800 text-sm mb-1">{topic.topic}</p>
                  <p className="text-xs text-slate-600 mb-2">{topic.relevance}</p>
                  <p className="text-xs text-blue-700 bg-white p-2 rounded italic">
                    💡 "{topic.talking_point}"
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Complementary Equipment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                🔧 Equipamentos Complementares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {intelligence.complementary_equipment?.map((eq, i) => (
                <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-slate-800 text-sm">{eq.equipment_name}</p>
                    <Badge className={getPriorityColor(eq.priority)}>{eq.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">
                    <span className="font-semibold">Por quê:</span> {eq.reason}
                  </p>
                  <p className="text-xs text-orange-700 bg-white p-2 rounded">
                    ✨ <span className="font-semibold">Benefício:</span> {eq.benefit}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cross-Sell Opportunities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                💰 Oportunidades Cross-Sell
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intelligence.cross_sell_opportunities?.map((opp, i) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-slate-800 text-sm mb-2">{opp.opportunity}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {opp.products?.map((prod, j) => (
                      <Badge key={j} className="bg-green-100 text-green-800">{prod}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="bg-white p-2 rounded">
                      <p className="text-slate-500">Valor Estimado</p>
                      <p className="font-semibold text-green-700">
                        R$ {(opp.estimated_value / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-slate-500">Momento</p>
                      <p className="font-semibold text-slate-700">{opp.trigger}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 bg-white p-2 rounded italic">
                    "{opp.script}"
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Up-Sell Opportunities */}
          {intelligence.upsell_opportunities?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                  📈 Oportunidades Up-Sell
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {intelligence.upsell_opportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="text-slate-600">{opp.current}</span>
                      <ArrowUpRight className="w-3 h-3 text-indigo-600" />
                      <span className="font-semibold text-indigo-700">{opp.upgrade}</span>
                    </div>
                    <p className="text-xs text-slate-700 mb-1">{opp.value_add}</p>
                    <p className="text-xs text-indigo-700 bg-white p-2 rounded">
                      💰 <span className="font-semibold">ROI:</span> {opp.roi}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Market Trends */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                📊 Tendências de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {intelligence.market_trends?.map((trend, i) => (
                <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      {getUrgencyIcon(trend.urgency)}
                      {trend.trend}
                    </p>
                    <Badge className={getPriorityColor(trend.urgency)}>{trend.urgency}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    <span className="font-semibold">Impacto:</span> {trend.impact}
                  </p>
                  <p className="text-xs text-amber-700 bg-white p-2 rounded">
                    🎯 <span className="font-semibold">Ação:</span> {trend.action}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}