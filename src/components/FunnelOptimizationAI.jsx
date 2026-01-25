import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Zap,
  AlertTriangle,
  Target,
  Loader2,
  CheckCircle2,
  MessageSquare,
  TestTube,
  Lightbulb,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function FunnelOptimizationAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [creatingAutomations, setCreatingAutomations] = useState(false);

  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-funnel'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-funnel'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-funnel'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200)
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => base44.entities.AutoFollowUpRule.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries(['follow-up-rules']);
    }
  });

  const analyzeAndOptimize = async () => {
    setAnalyzing(true);
    try {
      // Calcular métricas do funil
      const funnelStages = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];
      const funnelData = {};
      const stageDurations = {};
      
      funnelStages.forEach(stage => {
        const stageClients = clients.filter(c => c.pipeline_stage === stage);
        funnelData[stage] = {
          count: stageClients.length,
          avg_score: stageClients.reduce((acc, c) => acc + (c.purchase_score || 50), 0) / (stageClients.length || 1),
          avg_days: stageClients.reduce((acc, c) => {
            const created = new Date(c.created_date);
            const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }, 0) / (stageClients.length || 1)
        };
      });

      // Calcular taxas de conversão
      const conversionRates = {};
      for (let i = 0; i < funnelStages.length - 2; i++) {
        const current = funnelData[funnelStages[i]]?.count || 0;
        const next = funnelData[funnelStages[i + 1]]?.count || 0;
        conversionRates[`${funnelStages[i]}_to_${funnelStages[i + 1]}`] = current > 0 ? (next / current * 100).toFixed(1) : 0;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `OTIMIZAÇÃO INTELIGENTE DE FUNIL DE VENDAS - PRIMORI

═══════════════════════════════════════
📊 DADOS ATUAIS DO FUNIL
═══════════════════════════════════════
${funnelStages.map(stage => `
${stage.toUpperCase()}:
- Clientes: ${funnelData[stage]?.count || 0}
- Score médio: ${funnelData[stage]?.avg_score?.toFixed(1) || 0}%
- Tempo médio na etapa: ${funnelData[stage]?.avg_days?.toFixed(0) || 0} dias
`).join('\n')}

TAXAS DE CONVERSÃO:
${Object.entries(conversionRates).map(([k, v]) => `- ${k}: ${v}%`).join('\n')}

ESTATÍSTICAS GERAIS:
- Total de clientes: ${clients.length}
- Total de vendas: ${sales.length}
- Taxa conversão geral: ${((sales.length / clients.length) * 100).toFixed(1)}%
- Interações totais: ${interactions.length}

═══════════════════════════════════════
🎯 ANÁLISE SOLICITADA
═══════════════════════════════════════

Forneça uma OTIMIZAÇÃO COMPLETA do funil com:

**1. GARGALOS IDENTIFICADOS (3-5)**
Para cada gargalo:
- Etapa afetada
- Severidade (Crítica/Alta/Média)
- Perda estimada (% ou número de leads)
- Causa raiz provável
- Impacto no negócio

**2. AUTOMAÇÕES RECOMENDADAS (4-6)**
Para cada automação:
- Nome da automação
- Gatilho (quando disparar)
- Ação (o que fazer)
- Etapa origem -> Etapa destino
- Conteúdo da mensagem (completo)
- Canal recomendado
- Frequência/timing
- KPI de sucesso

**3. CONTEÚDO POR ETAPA (para cada etapa do funil)**
- Objetivo da comunicação
- Tom de voz ideal
- Mensagens principais (3-4 pontos)
- Objeções a endereçar
- Call-to-action
- Exemplo de email (completo)
- Exemplo de WhatsApp (completo)
- Exemplo de script telefone (completo)

**4. TESTES A/B SUGERIDOS (3-4)**
Para cada teste:
- Hipótese sendo testada
- Variável a testar (assunto/timing/canal/conteúdo)
- Variante A (controle)
- Variante B (teste)
- Métrica de sucesso
- Tamanho de amostra recomendado
- Duração sugerida
- Como medir resultados

**5. PLANO DE AÇÃO PRIORITIZADO**
- Quick wins (impacto imediato, 0-7 dias)
- Médio prazo (8-30 dias)
- Longo prazo (30+ dias)
- KPIs para monitorar
- Meta de melhoria esperada (%)`,
        response_json_schema: {
          type: "object",
          properties: {
            gargalos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  etapa: { type: "string" },
                  severidade: { type: "string" },
                  perda_estimada: { type: "string" },
                  causa_raiz: { type: "string" },
                  impacto_negocio: { type: "string" }
                }
              }
            },
            automacoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  gatilho: { type: "string" },
                  acao: { type: "string" },
                  etapa_origem: { type: "string" },
                  etapa_destino: { type: "string" },
                  conteudo_mensagem: { type: "string" },
                  canal: { type: "string" },
                  timing: { type: "string" },
                  kpi_sucesso: { type: "string" }
                }
              }
            },
            conteudo_por_etapa: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  etapa: { type: "string" },
                  objetivo: { type: "string" },
                  tom_voz: { type: "string" },
                  mensagens_principais: { type: "array", items: { type: "string" } },
                  objecoes: { type: "array", items: { type: "string" } },
                  cta: { type: "string" },
                  exemplo_email: { type: "string" },
                  exemplo_whatsapp: { type: "string" },
                  exemplo_telefone: { type: "string" }
                }
              }
            },
            testes_ab: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hipotese: { type: "string" },
                  variavel: { type: "string" },
                  variante_a: { type: "string" },
                  variante_b: { type: "string" },
                  metrica: { type: "string" },
                  amostra: { type: "string" },
                  duracao: { type: "string" },
                  como_medir: { type: "string" }
                }
              }
            },
            plano_acao: {
              type: "object",
              properties: {
                quick_wins: { type: "array", items: { type: "string" } },
                medio_prazo: { type: "array", items: { type: "string" } },
                longo_prazo: { type: "array", items: { type: "string" } },
                kpis: { type: "array", items: { type: "string" } },
                meta_melhoria: { type: "string" }
              }
            }
          }
        }
      });

      setOptimization({
        ...result,
        funnelData,
        conversionRates
      });

      toast.success('Análise de otimização concluída!');
    } catch (error) {
      toast.error('Erro ao analisar funil');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const implementAutomations = async () => {
    if (!optimization?.automacoes) return;
    
    setCreatingAutomations(true);
    try {
      for (const automacao of optimization.automacoes.slice(0, 3)) {
        await createRuleMutation.mutateAsync({
          name: automacao.nome,
          description: automacao.acao,
          trigger_type: 'pipeline_stage_change',
          trigger_config: {
            target_pipeline_stage: [automacao.etapa_origem]
          },
          channels: [automacao.canal.toLowerCase()],
          use_ai_personalization: true,
          message_template: automacao.conteudo_mensagem,
          priority: 'alta',
          active: true
        });
        
        await new Promise(r => setTimeout(r, 200));
      }
      
      toast.success('Automações criadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar automações');
      console.error(error);
    } finally {
      setCreatingAutomations(false);
    }
  };

  const chartData = optimization?.funnelData 
    ? Object.entries(optimization.funnelData).map(([stage, data]) => ({
        name: stage,
        clientes: data.count,
        score: Math.round(data.avg_score),
        dias: Math.round(data.avg_days)
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Otimização de Funil IA</h3>
            <p className="text-xs text-indigo-700">Análise preditiva e automações inteligentes</p>
          </div>
        </div>

        <Button
          onClick={analyzeAndOptimize}
          disabled={analyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando {clients.length} clientes...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Analisar e Otimizar Funil
            </>
          )}
        </Button>
      </Card>

      {optimization && (
        <Tabs defaultValue="gargalos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gargalos">Gargalos</TabsTrigger>
            <TabsTrigger value="automacoes">Automações</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="testes">Testes A/B</TabsTrigger>
          </TabsList>

          {/* Gráfico do Funil */}
          <Card className="p-4 mt-4">
            <h4 className="font-bold text-slate-800 mb-3">📊 Visão Atual do Funil</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="clientes" fill="#6366f1" name="Clientes" />
                <Bar dataKey="score" fill="#10b981" name="Score Médio" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <TabsContent value="gargalos" className="space-y-3">
            <Card className="p-4 bg-red-50 border-2 border-red-300">
              <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Gargalos Críticos Identificados
              </h4>
              <div className="space-y-2">
                {optimization.gargalos?.map((gargalo, i) => (
                  <Card key={i} className="p-3 bg-white border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-800">{gargalo.etapa}</p>
                        <Badge className={
                          gargalo.severidade === 'Crítica' ? 'bg-red-600' :
                          gargalo.severidade === 'Alta' ? 'bg-orange-500' : 'bg-yellow-500'
                        }>
                          {gargalo.severidade}
                        </Badge>
                      </div>
                      <Badge variant="outline">{gargalo.perda_estimada}</Badge>
                    </div>
                    <p className="text-xs text-slate-700 mb-1">
                      <span className="font-semibold">Causa:</span> {gargalo.causa_raiz}
                    </p>
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold">Impacto:</span> {gargalo.impacto_negocio}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="automacoes" className="space-y-3">
            <Button
              onClick={implementAutomations}
              disabled={creatingAutomations}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {creatingAutomations ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Criando automações...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Implementar Top 3 Automações
                </>
              )}
            </Button>

            <div className="space-y-3">
              {optimization.automacoes?.map((auto, i) => (
                <Card key={i} className="p-4 bg-green-50 border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <h5 className="font-bold text-green-900">{auto.nome}</h5>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-700 font-semibold">Gatilho:</p>
                      <p className="text-xs text-slate-700">{auto.gatilho}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-700 font-semibold">Canal:</p>
                      <p className="text-xs text-slate-700">{auto.canal}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-100 rounded border border-blue-200 mb-2">
                    <p className="text-xs text-blue-800 font-semibold mb-1">Fluxo:</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge>{auto.etapa_origem}</Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge className="bg-blue-600">{auto.etapa_destino}</Badge>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 mb-2">
                    <p className="text-xs text-slate-700 font-semibold mb-1">Ação:</p>
                    <p className="text-xs text-slate-600">{auto.acao}</p>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 mb-2">
                    <p className="text-xs text-slate-700 font-semibold mb-1">Mensagem:</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{auto.conteudo_mensagem}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{auto.timing}</Badge>
                    <p className="text-xs text-green-700">KPI: {auto.kpi_sucesso}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conteudo" className="space-y-3">
            {optimization.conteudo_por_etapa?.map((conteudo, i) => (
              <Card key={i} className="p-4 bg-purple-50 border-2 border-purple-300">
                <h5 className="font-bold text-purple-900 mb-2">{conteudo.etapa}</h5>
                
                <div className="p-2 bg-white rounded border border-purple-200 mb-2">
                  <p className="text-xs font-semibold text-purple-800">🎯 Objetivo:</p>
                  <p className="text-xs text-slate-700">{conteudo.objetivo}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800">Tom:</p>
                    <p className="text-xs text-slate-700">{conteudo.tom_voz}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800">CTA:</p>
                    <p className="text-xs text-slate-700">{conteudo.cta}</p>
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-blue-200 mb-2">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Mensagens Principais:</p>
                  {conteudo.mensagens_principais?.map((msg, j) => (
                    <p key={j} className="text-xs text-slate-700">• {msg}</p>
                  ))}
                </div>

                <div className="p-2 bg-white rounded border border-orange-200 mb-2">
                  <p className="text-xs font-semibold text-orange-800 mb-1">Objeções:</p>
                  {conteudo.objecoes?.map((obj, j) => (
                    <p key={j} className="text-xs text-slate-700">• {obj}</p>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="p-2 bg-white rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-1">📧 Email:</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{conteudo.exemplo_email}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-1">📱 WhatsApp:</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{conteudo.exemplo_whatsapp}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-1">📞 Telefone:</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{conteudo.exemplo_telefone}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="testes" className="space-y-3">
            <div className="space-y-3">
              {optimization.testes_ab?.map((teste, i) => (
                <Card key={i} className="p-4 bg-orange-50 border-2 border-orange-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube className="w-5 h-5 text-orange-600" />
                    <h5 className="font-bold text-orange-900">Teste A/B #{i + 1}</h5>
                  </div>

                  <div className="p-2 bg-white rounded border border-orange-200 mb-2">
                    <p className="text-xs font-semibold text-orange-800">Hipótese:</p>
                    <p className="text-xs text-slate-700">{teste.hipotese}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-blue-100 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Variante A (Controle):</p>
                      <p className="text-xs text-slate-700">{teste.variante_a}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded border border-green-200">
                      <p className="text-xs font-semibold text-green-800 mb-1">Variante B (Teste):</p>
                      <p className="text-xs text-slate-700">{teste.variante_b}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-xs text-slate-600">Variável: {teste.variavel}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-xs text-slate-600">Métrica: {teste.metrica}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-xs text-slate-600">Amostra: {teste.amostra}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-xs text-slate-600">Duração: {teste.duracao}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-1">Como Medir:</p>
                    <p className="text-xs text-slate-700">{teste.como_medir}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Plano de Ação */}
      {optimization?.plano_acao && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Plano de Ação Prioritizado
          </h4>

          <div className="mb-3 p-3 bg-white rounded-lg border border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">⚡ Quick Wins (0-7 dias):</p>
            {optimization.plano_acao.quick_wins?.map((item, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">• {item}</p>
            ))}
          </div>

          <div className="mb-3 p-3 bg-white rounded-lg border border-yellow-300">
            <p className="text-xs font-semibold text-yellow-800 mb-2">📅 Médio Prazo (8-30 dias):</p>
            {optimization.plano_acao.medio_prazo?.map((item, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">• {item}</p>
            ))}
          </div>

          <div className="mb-3 p-3 bg-white rounded-lg border border-blue-300">
            <p className="text-xs font-semibold text-blue-800 mb-2">🎯 Longo Prazo (30+ dias):</p>
            {optimization.plano_acao.longo_prazo?.map((item, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">• {item}</p>
            ))}
          </div>

          <div className="mb-3 p-3 bg-white rounded-lg border border-purple-300">
            <p className="text-xs font-semibold text-purple-800 mb-2">📊 KPIs para Monitorar:</p>
            {optimization.plano_acao.kpis?.map((kpi, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">• {kpi}</p>
            ))}
          </div>

          <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-400">
            <p className="text-sm font-bold text-green-900 text-center">
              🎯 Meta de Melhoria: {optimization.plano_acao.meta_melhoria}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}