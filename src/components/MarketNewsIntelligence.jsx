import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, TrendingUp, Newspaper, AlertTriangle, Zap, 
  RefreshCw, ChevronDown, ChevronUp, Target, Users, Package
} from 'lucide-react';
import { toast } from 'sonner';

const SEAMATY_PRODUCTS = [
  'VBC-50A (Hematológico 5 partes)', 'SMT-120VP (Bioquímico 120t/h)', 
  'QT3 (Bioquímico rotores portátil)', 'VG1 (Gasometria portátil)', 
  'VG2 (Gasometria + Imunofluorescência)', 'Vi1 (Imunofluorescência)', 'VQ1 (PCR quantitativo)'
];

export default function MarketNewsIntelligence() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState({});

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-market'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    staleTime: 120000
  });

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      // Montar contexto de clientes
      const clientSummary = clients.slice(0, 30).map(c => ({
        nome: c.first_name,
        clinica: c.clinic_name,
        tipo: c.client_type,
        status: c.status,
        equipamento: c.current_equipment,
        interesse: c.equipment_interest,
        pipeline: c.pipeline_stage,
        cidade: c.city
      }));

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em inteligência de mercado para equipamentos de diagnóstico veterinário no Brasil.

PORTFÓLIO SEAMATY: ${SEAMATY_PRODUCTS.join(', ')}
DIFERENCIAIS: 25 meses garantia, manutenção vitalícia, bonificação em insumos, ISO 13485:2016

CLIENTES NO CRM (amostra de ${clientSummary.length}):
${JSON.stringify(clientSummary, null, 2)}

Sua missão é gerar um relatório COMPLETO e ATUAL de inteligência de mercado veterinário com:

1. NOTÍCIAS E TENDÊNCIAS DO SETOR veterinário brasileiro (últimos 60 dias)
   - Regulamentações CFMV recentes
   - Expansão de clínicas e hospitais veterinários
   - Adoção de diagnóstico in-house
   - Tendências de medicina veterinária preventiva e especializada

2. ANÁLISE DE CONCORRENTES
   - Movimentos de IDEXX, Zoetis, Mindray, Heska no mercado brasileiro
   - Preços e promoções detectadas
   - Novos produtos lançados por concorrentes

3. IMPACTO NOS CLIENTES DO CRM
   - Quais clientes se beneficiam mais das tendências atuais
   - Oportunidades de abordagem baseadas no cenário atual
   - Alertas para clientes em risco (concorrentes agressivos na região)

4. OPORTUNIDADES EMERGENTES
   - Segmentos veterinários em crescimento (pets, equinos, bovinos, exóticos)
   - Regiões com alta demanda não atendida
   - Produtos Seamaty mais alinhados com tendências

5. ALERTAS ESTRATÉGICOS
   - Riscos para o negócio
   - Janelas de oportunidade imediatas
   - Recomendações para a equipe de vendas

Seja específico, cite dados reais do mercado brasileiro veterinário em 2024-2025.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            generated_at: { type: "string" },
            executive_summary: { type: "string" },
            market_score: { type: "number", description: "Score do momento de mercado 0-100" },
            news_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  impact: { type: "string", enum: ["alto", "medio", "baixo"] },
                  opportunity: { type: "string" },
                  source_context: { type: "string" }
                }
              }
            },
            competitor_moves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  competitor: { type: "string" },
                  action: { type: "string" },
                  threat_level: { type: "string", enum: ["alto", "medio", "baixo"] },
                  seamaty_response: { type: "string" }
                }
              }
            },
            crm_client_impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_type: { type: "string" },
                  impact: { type: "string" },
                  action_recommended: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            emerging_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  opportunity: { type: "string" },
                  description: { type: "string" },
                  seamaty_product: { type: "string" },
                  potential_value: { type: "string" }
                }
              }
            },
            strategic_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["risco", "oportunidade", "acao_imediata"] },
                  alert: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            market_outlook_30_days: { type: "string" },
            top_actions_for_sales_team: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReport(res);
      toast.success('Relatório de inteligência de mercado gerado!');
    } catch (e) {
      toast.error('Erro ao gerar relatório: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const impactColor = {
    alto: 'bg-red-100 text-red-700 border-red-200',
    medio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    baixo: 'bg-green-100 text-green-700 border-green-200'
  };

  const threatColor = {
    alto: 'border-l-red-500',
    medio: 'border-l-yellow-500',
    baixo: 'border-l-green-500'
  };

  const alertIcon = {
    risco: '⚠️',
    oportunidade: '💡',
    acao_imediata: '🚀'
  };

  const alertBg = {
    risco: 'bg-red-50 border-red-200',
    oportunidade: 'bg-blue-50 border-blue-200',
    acao_imediata: 'bg-emerald-50 border-emerald-200'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-lg font-bold">Inteligência de Mercado Veterinário</h2>
          </div>
          {report?.market_score && (
            <div className="text-center">
              <div className="text-3xl font-bold">{report.market_score}</div>
              <div className="text-[10px] text-emerald-200">Score Mercado</div>
            </div>
          )}
        </div>
        <p className="text-emerald-100 text-sm">Notícias, tendências e impacto nos seus clientes — análise com IA + internet em tempo real</p>

        <Button
          onClick={generateReport}
          disabled={loading}
          className="mt-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando mercado veterinário...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> {report ? 'Atualizar Análise' : 'Gerar Análise de Mercado'}</>
          )}
        </Button>
      </div>

      {/* Empty state */}
      {!report && !loading && (
        <Card className="border-dashed border-2 border-emerald-200">
          <CardContent className="p-8 text-center">
            <Newspaper className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 mb-1">Análise de Mercado IA</p>
            <p className="text-sm text-slate-400 mb-2">Clique em "Gerar Análise" para receber:</p>
            <ul className="text-xs text-slate-500 space-y-1 text-left max-w-xs mx-auto">
              <li>📰 Notícias e tendências do setor veterinário</li>
              <li>🏆 Movimentos de concorrentes (IDEXX, Zoetis, Mindray)</li>
              <li>🎯 Impacto direto nos clientes do CRM</li>
              <li>💡 Oportunidades emergentes para Seamaty</li>
              <li>⚡ Alertas estratégicos e ações recomendadas</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="font-medium text-slate-600">Pesquisando mercado veterinário em tempo real...</p>
            <p className="text-xs text-slate-400 mt-1">Analisando notícias, concorrentes e oportunidades</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <Tabs defaultValue="resumo">
          <TabsList className="grid grid-cols-5 h-9">
            <TabsTrigger value="resumo" className="text-[10px]">📋 Resumo</TabsTrigger>
            <TabsTrigger value="noticias" className="text-[10px]">📰 Notícias</TabsTrigger>
            <TabsTrigger value="concorrentes" className="text-[10px]">⚔️ Concorr.</TabsTrigger>
            <TabsTrigger value="clientes" className="text-[10px]">👥 Clientes</TabsTrigger>
            <TabsTrigger value="acoes" className="text-[10px]">🚀 Ações</TabsTrigger>
          </TabsList>

          {/* RESUMO */}
          <TabsContent value="resumo" className="space-y-3">
            {report.executive_summary && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2">📋 RESUMO EXECUTIVO</p>
                  <p className="text-sm text-emerald-800 leading-relaxed">{report.executive_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Alertas estratégicos */}
            {report.strategic_alerts?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alertas Estratégicos</p>
                {report.strategic_alerts.map((alert, i) => (
                  <Card key={i} className={`border ${alertBg[alert.type] || 'bg-slate-50 border-slate-200'}`}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-slate-700 mb-1">
                        {alertIcon[alert.type]} {alert.alert}
                      </p>
                      <p className="text-xs text-slate-600">{alert.recommendation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {report.market_outlook_30_days && (
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-indigo-700 mb-1">🔮 Perspectiva 30 Dias</p>
                  <p className="text-xs text-indigo-800">{report.market_outlook_30_days}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* NOTÍCIAS */}
          <TabsContent value="noticias" className="space-y-3">
            <p className="text-xs text-slate-500">Tendências e notícias do setor veterinário</p>
            {report.news_trends?.map((news, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpand(`news_${i}`)}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{news.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={`text-[10px] border ${impactColor[news.impact] || 'bg-slate-100 text-slate-600'}`}>
                            Impacto {news.impact}
                          </Badge>
                          {news.source_context && (
                            <span className="text-[10px] text-slate-400">{news.source_context}</span>
                          )}
                        </div>
                      </div>
                      {expanded[`news_${i}`] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </div>
                  </button>
                  {expanded[`news_${i}`] && (
                    <div className="border-t p-3 space-y-2 bg-slate-50">
                      <p className="text-xs text-slate-700">{news.summary}</p>
                      {news.opportunity && (
                        <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                          <p className="text-[10px] font-bold text-emerald-700">💡 OPORTUNIDADE SEAMATY</p>
                          <p className="text-xs text-emerald-800 mt-0.5">{news.opportunity}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* CONCORRENTES */}
          <TabsContent value="concorrentes" className="space-y-3">
            <p className="text-xs text-slate-500">Movimentos de IDEXX, Zoetis, Mindray e outros</p>
            {report.competitor_moves?.map((comp, i) => (
              <Card key={i} className={`border-l-4 ${threatColor[comp.threat_level] || 'border-l-slate-300'}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">{comp.competitor}</p>
                    <Badge className={`text-[10px] border ${impactColor[comp.threat_level]}`}>
                      Ameaça {comp.threat_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">{comp.action}</p>
                  {comp.seamaty_response && (
                    <div className="bg-blue-50 rounded p-2 border border-blue-200">
                      <p className="text-[10px] font-bold text-blue-700">🛡️ RESPOSTA SEAMATY</p>
                      <p className="text-xs text-blue-800 mt-0.5">{comp.seamaty_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* IMPACTO NOS CLIENTES */}
          <TabsContent value="clientes" className="space-y-3">
            <p className="text-xs text-slate-500">Como as tendências afetam cada segmento do CRM</p>
            {report.crm_client_impacts?.map((impact, i) => (
              <Card key={i}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <p className="font-semibold text-sm text-slate-800">{impact.client_type}</p>
                    </div>
                    {impact.urgency && (
                      <Badge className="text-[10px] bg-orange-100 text-orange-700">{impact.urgency}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">{impact.impact}</p>
                  {impact.action_recommended && (
                    <div className="bg-indigo-50 rounded p-2">
                      <p className="text-[10px] font-bold text-indigo-600">🎯 Ação Recomendada</p>
                      <p className="text-xs text-indigo-800 mt-0.5">{impact.action_recommended}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Oportunidades emergentes */}
            {report.emerging_opportunities?.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-4">Oportunidades Emergentes</p>
                {report.emerging_opportunities.map((opp, i) => (
                  <Card key={i} className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <p className="font-semibold text-sm text-emerald-800">{opp.opportunity}</p>
                      </div>
                      <p className="text-xs text-slate-700">{opp.description}</p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {opp.seamaty_product && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700">📦 {opp.seamaty_product}</Badge>
                        )}
                        {opp.potential_value && (
                          <Badge className="text-[10px] bg-blue-100 text-blue-700">💰 {opp.potential_value}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* AÇÕES */}
          <TabsContent value="acoes" className="space-y-3">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700">
              <CardContent className="p-4">
                <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Top Ações para a Equipe de Vendas
                </p>
                <ul className="space-y-2">
                  {report.top_actions_for_sales_team?.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-indigo-100">
                      <span className="font-bold text-yellow-300 shrink-0">{i + 1}.</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Alertas de ação imediata */}
            {report.strategic_alerts?.filter(a => a.type === 'acao_imediata').map((alert, i) => (
              <Card key={i} className="border-emerald-300 bg-emerald-50">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-emerald-700 mb-1">🚀 AÇÃO IMEDIATA: {alert.alert}</p>
                  <p className="text-xs text-emerald-800">{alert.recommendation}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}