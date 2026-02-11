import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  DollarSign,
  Users,
  Activity,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import LocalAIFallbacks from './LocalAIFallbacks';
import { addPhilosophicalEnding } from './PhilosophicalQuotes';

export default function SalesIntelligenceDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const [intelligence, setIntelligence] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-intelligence'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-intelligence'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-intelligence'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const runIntelligenceAnalysis = async () => {
    setAnalyzing(true);
    
    // Tentar com IA, mas ter fallback local
    const useAI = true; // Nathan pode mudar para false se quiser rodar sem IA
    
    try {
      if (!useAI) {
        // Modo SEM IA - usar análise local
        toast.info('Nathan, executando análise local (sem IA)...');
        const localResult = LocalAIFallbacks.runFullAnalysisLocal(
          clients, sales, interactions, []
        );
        setIntelligence(localResult);
        toast.success(addPhilosophicalEnding('Análise completa!'));
        setAnalyzing(false);
        return;
      }
      
      // Modo COM IA
      // Preparar dados agregados
      const activeClients = clients.filter(c => c.status !== 'frio' && !c.sale_closed);
      const hotClients = clients.filter(c => c.status === 'quente');
      const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      
      const clientsWithHistory = clients.map(c => {
        const clientSales = sales.filter(s => s.client_id === c.id);
        const clientInteractions = interactions.filter(i => i.client_id === c.id);
        return {
          id: c.id,
          name: c.first_name,
          status: c.status,
          score: c.purchase_score || 0,
          pipeline: c.pipeline_stage,
          sales_count: clientSales.length,
          total_spent: clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
          last_contact: c.last_contact_date,
          interactions_count: clientInteractions.length,
          engagement: c.engagement_score || 0
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Análise completa de Inteligência de Vendas. Gere insights preditivos e acionáveis.

DADOS GERAIS:
- Total clientes: ${clients.length}
- Clientes ativos: ${activeClients.length}
- Clientes quentes: ${hotClients.length}
- Vendas totais: ${sales.length}
- Receita total: R$ ${totalRevenue.toLocaleString('pt-BR')}

TOP 10 CLIENTES POR SCORE:
${clientsWithHistory.sort((a, b) => b.score - a.score).slice(0, 10).map(c => 
  `- ${c.name}: Score ${c.score}%, Pipeline: ${c.pipeline}, Vendas: ${c.sales_count}, Valor: R$ ${c.total_spent}`
).join('\n')}

ANÁLISES NECESSÁRIAS:
1. CHURN PREDICTION: Identifique 5-8 clientes em alto risco de abandono
2. UPSELL/CROSS-SELL: Identifique 5-8 oportunidades com maior potencial
3. AÇÕES PROATIVAS: 8-10 ações específicas para converter/reativar
4. KPIs CHAVE: Métricas críticas do funil

Seja específico, prático e acionável:`,
        response_json_schema: {
          type: "object",
          properties: {
            churn_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  risk_level: { type: "string" },
                  risk_score: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } },
                  recommended_action: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            upsell_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  opportunity_type: { type: "string" },
                  potential_value: { type: "number" },
                  probability: { type: "number" },
                  recommended_products: { type: "array", items: { type: "string" } },
                  best_approach: { type: "string" },
                  timing: { type: "string" }
                }
              }
            },
            proactive_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  target: { type: "string" },
                  priority: { type: "string" },
                  expected_impact: { type: "string" },
                  deadline: { type: "string" }
                }
              }
            },
            kpis: {
              type: "object",
              properties: {
                conversion_rate: { type: "number" },
                avg_deal_size: { type: "number" },
                sales_velocity: { type: "string" },
                pipeline_health: { type: "string" },
                top_bottleneck: { type: "string" },
                revenue_forecast_30d: { type: "number" },
                churn_rate: { type: "number" }
              }
            },
            strategic_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setIntelligence(result);
      toast.success(addPhilosophicalEnding('Análise de inteligência completa!'));
    } catch (error) {
      console.error('Erro na IA, Nathan. Usando análise local:', error);
      toast.warning('IA indisponível. Usando análise local...');
      
      // FALLBACK: Se IA falhar, usar análise local
      const localResult = LocalAIFallbacks.runFullAnalysisLocal(
        clients, sales, interactions, []
      );
      setIntelligence(localResult);
      toast.success(addPhilosophicalEnding('IA indisponível. Análise local completa!'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Brain className="w-6 h-6" />
            Inteligência de Vendas IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!intelligence ? (
            <div className="space-y-3">
              <p className="text-sm text-indigo-700">
                Análise preditiva completa: churn, oportunidades, ações e KPIs
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white rounded border border-indigo-200">
                  <p className="font-semibold text-slate-700">Clientes</p>
                  <p className="text-2xl font-bold text-indigo-600">{clients.length}</p>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-200">
                  <p className="font-semibold text-slate-700">Vendas</p>
                  <p className="text-2xl font-bold text-green-600">{sales.length}</p>
                </div>
                <div className="p-2 bg-white rounded border border-indigo-200">
                  <p className="font-semibold text-slate-700">Interações</p>
                  <p className="text-2xl font-bold text-blue-600">{interactions.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={runIntelligenceAnalysis}
                  disabled={analyzing || clients.length < 5}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Executar Análise (COM IA)
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-indigo-600">
                  ℹ️ Se IA falhar, usa análise estatística local
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIntelligence(null)}
              variant="outline"
              className="w-full"
            >
              Nova Análise
            </Button>
          )}
        </CardContent>
      </Card>

      {intelligence && (
        <>
          {/* KPIs Dashboard */}
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                KPIs Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-green-700 font-semibold">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-green-600">
                    {intelligence.kpis.conversion_rate}%
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-blue-700 font-semibold">Ticket Médio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {intelligence.kpis.avg_deal_size?.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <p className="text-purple-700 font-semibold">Velocidade</p>
                  <p className="text-sm font-bold text-purple-600">
                    {intelligence.kpis.sales_velocity}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded">
                  <p className="text-amber-700 font-semibold">Previsão 30d</p>
                  <p className="text-xl font-bold text-amber-600">
                    R$ {intelligence.kpis.revenue_forecast_30d?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs">
                <p className="font-semibold text-slate-700">Saúde Pipeline:</p>
                <p className="text-slate-600">{intelligence.kpis.pipeline_health}</p>
                <p className="font-semibold text-red-700 mt-1">Gargalo:</p>
                <p className="text-red-600">{intelligence.kpis.top_bottleneck}</p>
              </div>
            </CardContent>
          </Card>

          {/* Churn Risks */}
          <Card className="border-2 border-red-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-red-900">
                <AlertTriangle className="w-4 h-4" />
                Risco de Churn ({intelligence.churn_risks?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {intelligence.churn_risks?.map((risk, i) => (
                <div key={i} className="p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-800">{risk.client_name}</p>
                    <Badge className={
                      risk.risk_level === 'alto' ? 'bg-red-600' :
                      risk.risk_level === 'médio' ? 'bg-orange-600' :
                      'bg-yellow-600'
                    }>
                      {risk.risk_score}% risco
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-red-700 font-semibold">Motivos:</p>
                    {risk.reasons?.map((reason, j) => (
                      <p key={j} className="text-red-600">• {reason}</p>
                    ))}
                    <p className="text-blue-700 font-semibold mt-1">✓ Ação:</p>
                    <p className="text-blue-600">{risk.recommended_action}</p>
                    <Badge variant="outline" className="text-xs">
                      Urgência: {risk.urgency}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upsell/Cross-sell */}
          <Card className="border-2 border-green-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                <DollarSign className="w-4 h-4" />
                Oportunidades Upsell/Cross-sell ({intelligence.upsell_opportunities?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {intelligence.upsell_opportunities?.map((opp, i) => (
                <div key={i} className="p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-800">{opp.client_name}</p>
                    <Badge className="bg-green-600">
                      {opp.probability}% chance
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-green-700 font-semibold">
                      {opp.opportunity_type} • R$ {opp.potential_value?.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-slate-600">Produtos:</p>
                    {opp.recommended_products?.map((prod, j) => (
                      <p key={j} className="text-slate-600">• {prod}</p>
                    ))}
                    <p className="text-purple-700 font-semibold">Abordagem:</p>
                    <p className="text-purple-600">{opp.best_approach}</p>
                    <Badge variant="outline" className="text-xs">
                      ⏰ {opp.timing}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ações Proativas */}
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
                <Zap className="w-4 h-4" />
                Ações Proativas Recomendadas ({intelligence.proactive_actions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {intelligence.proactive_actions?.map((action, i) => (
                <div key={i} className="p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={
                      action.priority === 'alta' ? 'bg-red-600' :
                      action.priority === 'média' ? 'bg-orange-600' :
                      'bg-blue-600'
                    }>
                      {action.priority}
                    </Badge>
                    <span className="text-xs text-slate-600">{action.deadline}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{action.action}</p>
                  <p className="text-xs text-purple-600 mt-1">Alvo: {action.target}</p>
                  <p className="text-xs text-green-600">
                    📈 Impacto: {action.expected_impact}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insights Estratégicos */}
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
                <Target className="w-4 h-4" />
                Insights Estratégicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {intelligence.strategic_insights?.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-blue-700">
                    <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}