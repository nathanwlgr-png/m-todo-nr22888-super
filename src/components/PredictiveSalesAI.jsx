import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Sparkles,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingCart
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

export default function PredictiveSalesAI() {
  const [activeTab, setActiveTab] = useState('tendencias');
  const [predictions, setPredictions] = useState(null);
  const [churnAnalysis, setChurnAnalysis] = useState(null);
  const [crossSell, setCrossSell] = useState(null);
  const [loading, setLoading] = useState({ tendencias: false, churn: false, crosssell: false });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  // 1. ANÁLISE PREDITIVA DE TENDÊNCIAS
  const analyzeTrends = async () => {
    setLoading({ ...loading, tendencias: true });
    try {
      // Agrupar vendas por mês
      const salesByMonth = {};
      sales.forEach(sale => {
        const month = format(new Date(sale.sale_date), 'yyyy-MM');
        if (!salesByMonth[month]) {
          salesByMonth[month] = { revenue: 0, count: 0 };
        }
        salesByMonth[month].revenue += sale.sale_value || 0;
        salesByMonth[month].count += 1;
      });

      const monthlyData = Object.entries(salesByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));

      const prompt = `Você é um analista de vendas especializado em previsões.

DADOS HISTÓRICOS (últimos meses):
${monthlyData.slice(-12).map(m => `- ${m.month}: R$ ${m.revenue.toLocaleString('pt-BR')} (${m.count} vendas)`).join('\n')}

PRODUTOS VENDIDOS:
${sales.slice(-50).map(s => `${s.equipment_name}: R$ ${s.sale_value}`).join(', ')}

TAREFA:
1. Identifique padrões sazonais
2. Preveja vendas dos próximos 3 meses
3. Sugira ações estratégicas
4. Identifique produtos em alta/baixa

Retorne análise completa em JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tendencia_geral: { type: "string", enum: ["crescente", "estavel", "decrescente"] },
            previsao_proximo_mes: { type: "number" },
            previsao_trimestre: { type: "number" },
            sazonalidade: { type: "string" },
            produtos_em_alta: { type: "array", items: { type: "string" } },
            produtos_em_baixa: { type: "array", items: { type: "string" } },
            acoes_recomendadas: { type: "array", items: { type: "string" } },
            insights: { type: "string" },
            confianca_previsao: { type: "number", description: "0-100" }
          }
        }
      });

      setPredictions({ ...result, monthlyData });
      toast.success('Previsão gerada!');
    } catch (error) {
      toast.error('Erro ao gerar previsão');
    } finally {
      setLoading({ ...loading, tendencias: false });
    }
  };

  // 2. ANÁLISE DE CHURN E RETENÇÃO
  const analyzeChurn = async () => {
    setLoading({ ...loading, churn: true });
    try {
      const now = new Date();
      const threeMonthsAgo = subMonths(now, 3);
      
      const atRiskClients = clients.filter(c => {
        const lastContact = c.last_contact_date || c.last_visit_date;
        if (!lastContact) return false;
        return new Date(lastContact) < threeMonthsAgo;
      }).slice(0, 20);

      const prompt = `Você é um especialista em retenção de clientes.

CLIENTES EM RISCO DE CHURN (${atRiskClients.length}):
${atRiskClients.map(c => `
- ${c.first_name} | Status: ${c.status} | Score: ${c.purchase_score || 0} | Último contato: ${c.last_contact_date || 'N/A'}
  Equipamento: ${c.current_equipment || 'Nenhum'} | Interesse: ${c.equipment_interest || 'N/A'}
`).join('\n')}

TAREFA:
1. Classifique cada cliente por risco (alto/médio/baixo)
2. Sugira estratégia de retenção personalizada
3. Identifique gatilhos de reativação
4. Preveja probabilidade de recuperação

Analise os ${Math.min(atRiskClients.length, 10)} clientes de maior risco.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_geral: { type: "string" },
            total_em_risco: { type: "number" },
            clientes_alto_risco: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  nivel_risco: { type: "string", enum: ["alto", "medio", "baixo"] },
                  razao_principal: { type: "string" },
                  estrategia_retencao: { type: "string" },
                  probabilidade_recuperacao: { type: "number" },
                  acao_imediata: { type: "string" }
                }
              }
            },
            estrategias_gerais: { type: "array", items: { type: "string" } },
            estimativa_perda_receita: { type: "number" }
          }
        }
      });

      setChurnAnalysis(result);
      toast.success('Análise de churn concluída!');
    } catch (error) {
      toast.error('Erro ao analisar churn');
    } finally {
      setLoading({ ...loading, churn: false });
    }
  };

  // 3. RECOMENDAÇÃO DE CROSS-SELL/UP-SELL
  const analyzeCrossSell = async () => {
    setLoading({ ...loading, crosssell: true });
    try {
      const clientsWithSales = clients.filter(c => {
        return sales.some(s => s.client_id === c.id && (s.status === 'fechada' || s.status === 'entregue'));
      }).slice(0, 30);

      const prompt = `Você é um especialista em vendas consultivas de equipamentos veterinários.

CLIENTES ATIVOS COM VENDAS (${clientsWithSales.length}):
${clientsWithSales.map(c => {
  const clientSales = sales.filter(s => s.client_id === c.id && (s.status === 'fechada' || s.status === 'entregue'));
  return `
- ${c.first_name} | Tipo: ${c.client_type || 'N/A'}
  Comprou: ${clientSales.map(s => s.equipment_name).join(', ')}
  Interesse: ${c.equipment_interest || 'Nenhum'}
  Volume mensal: ${c.current_volume || 'N/A'}
  `;
}).join('\n')}

CATÁLOGO DISPONÍVEL:
- VG2 (Hemogasometria + Imunofluorescência)
- VG1 (Hemogasometria Básica)
- VQ1 (PCR Veterinário)
- QT3 (Bioquímico + Coagulação + Gases)
- 3DX (Lab completo)
- SMT-120VP (Bioquímico)
- VI1 (Imunofluorescência)
- Hematologia
- Insumos e reagentes

TAREFA:
Identifique os ${Math.min(clientsWithSales.length, 15)} melhores clientes para cross-sell/up-sell.
Para cada um, sugira produto complementar e estratégia de abordagem.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumo: { type: "string" },
            total_oportunidades: { type: "number" },
            oportunidades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cliente_nome: { type: "string" },
                  produto_atual: { type: "string" },
                  produto_recomendado: { type: "string" },
                  razao: { type: "string" },
                  valor_estimado: { type: "number" },
                  probabilidade: { type: "number" },
                  abordagem: { type: "string" },
                  melhor_momento: { type: "string" }
                }
              }
            },
            receita_potencial_total: { type: "number" }
          }
        }
      });

      setCrossSell(result);
      toast.success('Oportunidades identificadas!');
    } catch (error) {
      toast.error('Erro ao analisar cross-sell');
    } finally {
      setLoading({ ...loading, crosssell: false });
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          IA Preditiva de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tendencias">
              <TrendingUp className="w-4 h-4 mr-1" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="churn">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Churn
            </TabsTrigger>
            <TabsTrigger value="crosssell">
              <Package className="w-4 h-4 mr-1" />
              Cross-Sell
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TENDÊNCIAS E PREVISÕES */}
          <TabsContent value="tendencias" className="space-y-3 mt-4">
            {!predictions ? (
              <div className="text-center py-6">
                <TrendingUp className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  Analise tendências futuras com base em dados históricos e sazonalidade
                </p>
                <Button
                  onClick={analyzeTrends}
                  disabled={loading.tendencias}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading.tendencias ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gerar Previsão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tendência Geral */}
                <div className={`p-3 rounded-lg border-2 ${
                  predictions.tendencia_geral === 'crescente' ? 'bg-green-50 border-green-200' :
                  predictions.tendencia_geral === 'decrescente' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {predictions.tendencia_geral === 'crescente' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : predictions.tendencia_geral === 'decrescente' ? (
                      <ArrowDownRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <Target className="w-5 h-5 text-yellow-600" />
                    )}
                    <p className="font-bold text-sm">
                      Tendência: {predictions.tendencia_geral.toUpperCase()}
                    </p>
                    <Badge className="ml-auto">
                      {predictions.confianca_previsao}% confiança
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{predictions.insights}</p>
                </div>

                {/* Previsões Numéricas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Próximo Mês</p>
                    <p className="text-xl font-bold text-purple-800">
                      R$ {(predictions.previsao_proximo_mes / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-600 mb-1">Próximo Trimestre</p>
                    <p className="text-xl font-bold text-indigo-800">
                      R$ {(predictions.previsao_trimestre / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>

                {/* Gráfico de Tendência */}
                {predictions.monthlyData && predictions.monthlyData.length > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2">Histórico de Vendas</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={predictions.monthlyData.slice(-6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Sazonalidade */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📅 Sazonalidade</p>
                  <p className="text-sm text-blue-600">{predictions.sazonalidade}</p>
                </div>

                {/* Produtos em Alta/Baixa */}
                <div className="grid grid-cols-2 gap-3">
                  {predictions.produtos_em_alta?.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-700 mb-2">🔥 Em Alta</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {predictions.produtos_em_alta.slice(0, 3).map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {predictions.produtos_em_baixa?.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-xs font-semibold text-red-700 mb-2">📉 Em Baixa</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {predictions.produtos_em_baixa.slice(0, 3).map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Ações Recomendadas */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-2">💡 Ações Estratégicas</p>
                  <ul className="text-sm text-purple-600 space-y-1">
                    {predictions.acoes_recomendadas?.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={analyzeTrends}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Atualizar Previsão
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: ANÁLISE DE CHURN */}
          <TabsContent value="churn" className="space-y-3 mt-4">
            {!churnAnalysis ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  Identifique clientes em risco e receba estratégias de retenção
                </p>
                <Button
                  onClick={analyzeChurn}
                  disabled={loading.churn}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading.churn ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analisar Churn
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resumo */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ⚠️ {churnAnalysis.total_em_risco} clientes em risco
                  </p>
                  <p className="text-xs text-red-600">{churnAnalysis.resumo_geral}</p>
                </div>

                {/* Perda Estimada */}
                <div className="p-3 bg-white rounded-lg border-2 border-red-300">
                  <p className="text-xs text-red-600 mb-1">💸 Perda de Receita Estimada</p>
                  <p className="text-2xl font-bold text-red-700">
                    R$ {(churnAnalysis.estimativa_perda_receita / 1000).toFixed(0)}k
                  </p>
                </div>

                {/* Clientes em Alto Risco */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">🚨 Clientes Críticos:</p>
                  {churnAnalysis.clientes_alto_risco?.slice(0, 8).map((cliente, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        cliente.nivel_risco === 'alto' ? 'bg-red-50 border-red-200' :
                        cliente.nivel_risco === 'medio' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{cliente.nome}</p>
                          <Badge className={
                            cliente.nivel_risco === 'alto' ? 'bg-red-600' :
                            cliente.nivel_risco === 'medio' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          }>
                            {cliente.nivel_risco.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Recuperação</p>
                          <p className="font-bold text-sm text-purple-600">
                            {cliente.probabilidade_recuperacao}%
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        <strong>Razão:</strong> {cliente.razao_principal}
                      </p>
                      <div className="bg-white/70 p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-700">
                          <strong>Estratégia:</strong> {cliente.estrategia_retencao}
                        </p>
                      </div>
                      <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                        <p className="text-xs text-indigo-700">
                          <strong>⚡ Ação Imediata:</strong> {cliente.acao_imediata}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Estratégias Gerais */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">🎯 Estratégias Gerais</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    {churnAnalysis.estrategias_gerais?.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={analyzeChurn}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Atualizar Análise
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: CROSS-SELL E UP-SELL */}
          <TabsContent value="crosssell" className="space-y-3 mt-4">
            {!crossSell ? (
              <div className="text-center py-6">
                <ShoppingCart className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  Identifique oportunidades de vendas complementares
                </p>
                <Button
                  onClick={analyzeCrossSell}
                  disabled={loading.crosssell}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading.crosssell ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analisar Oportunidades
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resumo */}
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-800 mb-2">
                    🎯 {crossSell.total_oportunidades} oportunidades identificadas
                  </p>
                  <p className="text-xs text-indigo-600">{crossSell.resumo}</p>
                </div>

                {/* Receita Potencial */}
                <div className="p-3 bg-white rounded-lg border-2 border-indigo-300">
                  <p className="text-xs text-indigo-600 mb-1">💰 Receita Potencial</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    R$ {(crossSell.receita_potencial_total / 1000).toFixed(0)}k
                  </p>
                </div>

                {/* Oportunidades */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">🚀 Melhores Oportunidades:</p>
                  {crossSell.oportunidades?.slice(0, 10).map((opp, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800">{opp.cliente_nome}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Atual: {opp.produto_atual}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-indigo-600">Prob.</p>
                          <p className="font-bold text-sm text-indigo-700">{opp.probabilidade}%</p>
                        </div>
                      </div>

                      <div className="bg-indigo-50 p-2 rounded border border-indigo-100 mb-2">
                        <p className="text-xs text-indigo-700">
                          <strong>Recomendar:</strong> {opp.produto_recomendado}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Valor est.: R$ {opp.valor_estimado?.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      <div className="bg-purple-50 p-2 rounded border border-purple-100 mb-2">
                        <p className="text-xs text-purple-700">
                          <strong>Razão:</strong> {opp.razao}
                        </p>
                      </div>

                      <div className="bg-green-50 p-2 rounded border border-green-100 mb-2">
                        <p className="text-xs text-green-700">
                          <strong>Abordagem:</strong> {opp.abordagem}
                        </p>
                      </div>

                      <div className="bg-amber-50 p-2 rounded border border-amber-100">
                        <p className="text-xs text-amber-700">
                          <strong>⏰ Melhor momento:</strong> {opp.melhor_momento}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={analyzeCrossSell}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Atualizar Oportunidades
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}