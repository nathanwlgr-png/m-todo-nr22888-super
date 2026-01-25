import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy,
  AlertTriangle,
  Target,
  Brain,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Análise de Performance da Equipe de Vendas com IA
 * Ingere dados de vendas, coaching e interações para identificar padrões e gerar insights
 */
export default function SalesTeamPerformanceAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [teamAnalysis, setTeamAnalysis] = useState(null);
  const [individualAnalysis, setIndividualAnalysis] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // dias

  // Fetch all data
  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-all'],
    queryFn: () => base44.entities.Sale.list('-sale_date')
  });

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coaching-sessions-all'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date')
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-all'],
    queryFn: () => base44.entities.Interaction.list('-created_date')
  });

  const analyzeTeamPerformance = async () => {
    if (users.length === 0) {
      toast.error('Nenhum usuário encontrado');
      return;
    }

    setAnalyzing(true);
    try {
      // Filtrar dados do período selecionado
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - selectedPeriod);
      
      const recentSales = sales.filter(s => new Date(s.sale_date) >= periodStart);
      const recentCoaching = coachingSessions.filter(c => new Date(c.created_date) >= periodStart);
      const recentInteractions = interactions.filter(i => new Date(i.created_date) >= periodStart);

      // Análise da equipe geral
      const teamPrompt = `ANÁLISE DE PERFORMANCE DA EQUIPE DE VENDAS - PRIMORI

═══════════════════════════════════════
📊 DADOS DA EQUIPE (${selectedPeriod} DIAS)
═══════════════════════════════════════

**VENDEDORES:**
${users.filter(u => u.role !== 'admin').map(u => `- ${u.full_name} (${u.email})`).join('\n')}

**VENDAS FECHADAS:** ${recentSales.length}
- Valor Total: R$ ${recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}
- Ticket Médio: R$ ${recentSales.length > 0 ? (recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / recentSales.length).toFixed(2) : 0}

**SESSÕES DE COACHING:** ${recentCoaching.length}
- Score Médio: ${recentCoaching.length > 0 ? (recentCoaching.reduce((sum, c) => sum + (c.overall_score || 0), 0) / recentCoaching.length).toFixed(1) : 0}/100

**INTERAÇÕES COM CLIENTES:** ${recentInteractions.length}
- Chamadas: ${recentInteractions.filter(i => i.type === 'call').length}
- Emails: ${recentInteractions.filter(i => i.type === 'email').length}
- Reuniões: ${recentInteractions.filter(i => i.type === 'meeting').length}
- WhatsApp: ${recentInteractions.filter(i => i.type === 'whatsapp').length}

═══════════════════════════════════════
🎯 SUA MISSÃO - ANÁLISE ESTRATÉGICA
═══════════════════════════════════════

Analise a performance da equipe e forneça:

**1. TENDÊNCIAS IDENTIFICADAS**
Liste 3-5 tendências principais (positivas e negativas):
- [Tendência 1]: Descrição + Impacto
- [Tendência 2]: Descrição + Impacto

**2. PONTOS FORTES DA EQUIPE**
3-4 áreas onde a equipe está performando bem

**3. ÁREAS CRÍTICAS DE MELHORIA**
3-4 áreas que precisam de atenção imediata

**4. ADERÊNCIA AOS FRAMEWORKS PRIMORI**
Avalie aderência geral (0-100%) a:
- SPIN Selling: [%] - Análise
- Numerologia: [%] - Análise
- Cialdini: [%] - Análise
- Inteligência Emocional: [%] - Análise

**5. EFETIVIDADE DA COMUNICAÇÃO**
- Canal mais efetivo: [qual?]
- Padrões de sucesso: [descrever]
- Gaps de comunicação: [identificar]

**6. RECOMENDAÇÕES ESTRATÉGICAS**
5 ações prioritárias para melhorar performance da equipe

**7. META DE CRESCIMENTO**
Baseado nos dados, qual crescimento é realista para próximo mês?

Seja ESPECÍFICO e ACIONÁVEL.`;

      const teamAnalysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: teamPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            tendencias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tendencia: { type: "string" },
                  impacto: { type: "string" },
                  tipo: { type: "string" }
                }
              }
            },
            pontos_fortes: { type: "array", items: { type: "string" } },
            areas_melhoria: { type: "array", items: { type: "string" } },
            aderencia_frameworks: {
              type: "object",
              properties: {
                spin: { type: "number" },
                spin_analise: { type: "string" },
                numerologia: { type: "number" },
                numerologia_analise: { type: "string" },
                cialdini: { type: "number" },
                cialdini_analise: { type: "string" },
                inteligencia_emocional: { type: "number" },
                ie_analise: { type: "string" }
              }
            },
            comunicacao: {
              type: "object",
              properties: {
                canal_efetivo: { type: "string" },
                padroes_sucesso: { type: "string" },
                gaps: { type: "string" }
              }
            },
            recomendacoes: { type: "array", items: { type: "string" } },
            meta_crescimento: { type: "string" }
          }
        }
      });

      setTeamAnalysis(teamAnalysisResult);

      // Análise individual de cada vendedor
      const individualPromises = users.filter(u => u.role !== 'admin').map(async (user) => {
        const userSales = recentSales.filter(s => s.created_by === user.email);
        const userCoaching = recentCoaching.filter(c => c.created_by === user.email);
        const userInteractions = recentInteractions.filter(i => i.created_by === user.email);

        const individualPrompt = `ANÁLISE INDIVIDUAL - ${user.full_name}

**PERFORMANCE (${selectedPeriod} DIAS):**
- Vendas: ${userSales.length}
- Valor Total: R$ ${userSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}
- Coaching: ${userCoaching.length} sessões (Score médio: ${userCoaching.length > 0 ? (userCoaching.reduce((sum, c) => sum + (c.overall_score || 0), 0) / userCoaching.length).toFixed(1) : 0})
- Interações: ${userInteractions.length}

Forneça análise concisa:

**PONTOS FORTES** (2-3)
**ÁREAS DE MELHORIA** (2-3)
**RECOMENDAÇÃO PRINCIPAL** (1 ação específica)
**POTENCIAL DE CRESCIMENTO** (baixo/médio/alto + justificativa)`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: individualPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              pontos_fortes: { type: "array", items: { type: "string" } },
              areas_melhoria: { type: "array", items: { type: "string" } },
              recomendacao_principal: { type: "string" },
              potencial: { type: "string" },
              justificativa_potencial: { type: "string" }
            }
          }
        });

        return {
          user,
          sales_count: userSales.length,
          total_value: userSales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
          coaching_count: userCoaching.length,
          avg_coaching_score: userCoaching.length > 0 ? (userCoaching.reduce((sum, c) => sum + (c.overall_score || 0), 0) / userCoaching.length) : 0,
          interactions_count: userInteractions.length,
          ...result
        };
      });

      const individualResults = await Promise.all(individualPromises);
      setIndividualAnalysis(individualResults.sort((a, b) => b.total_value - a.total_value));

      toast.success('Análise de performance concluída!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao analisar performance');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Análise de Performance da Equipe</h3>
              <p className="text-xs text-blue-700">Powered by Primori AI</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700">
            <Users className="w-3 h-3 mr-1" />
            {users.filter(u => u.role !== 'admin').length} Vendedores
          </Badge>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={60}>Últimos 60 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <Button
            onClick={analyzeTeamPerformance}
            disabled={analyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analisar Performance
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Team Analysis */}
      {teamAnalysis && (
        <>
          {/* Tendências */}
          <Card className="p-4">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tendências Identificadas
            </h4>
            <div className="space-y-2">
              {teamAnalysis.tendencias.map((t, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg border-l-4 ${
                    t.tipo === 'positiva' ? 'bg-green-50 border-green-500' :
                    t.tipo === 'negativa' ? 'bg-red-50 border-red-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {t.tipo === 'positiva' ? 
                      <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" /> :
                      <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                    }
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800">{t.tendencia}</p>
                      <p className="text-xs text-slate-600 mt-1">{t.impacto}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pontos Fortes & Áreas de Melhoria */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Pontos Fortes
              </h4>
              <ul className="space-y-2">
                {teamAnalysis.pontos_fortes.map((pf, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>{pf}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4 bg-red-50 border-red-200">
              <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Áreas Críticas
              </h4>
              <ul className="space-y-2">
                {teamAnalysis.areas_melhoria.map((am, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span>{am}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Aderência aos Frameworks */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Aderência aos Frameworks Primori
            </h4>
            <div className="space-y-3">
              {[
                { name: 'SPIN Selling', score: teamAnalysis.aderencia_frameworks.spin, feedback: teamAnalysis.aderencia_frameworks.spin_analise },
                { name: 'Numerologia', score: teamAnalysis.aderencia_frameworks.numerologia, feedback: teamAnalysis.aderencia_frameworks.numerologia_analise },
                { name: 'Cialdini', score: teamAnalysis.aderencia_frameworks.cialdini, feedback: teamAnalysis.aderencia_frameworks.cialdini_analise },
                { name: 'Int. Emocional', score: teamAnalysis.aderencia_frameworks.inteligencia_emocional, feedback: teamAnalysis.aderencia_frameworks.ie_analise }
              ].map((framework, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">{framework.name}</span>
                    <Badge className={
                      framework.score >= 70 ? 'bg-green-100 text-green-700' :
                      framework.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {framework.score}%
                    </Badge>
                  </div>
                  <Progress value={framework.score} className="h-2 mb-2" />
                  <p className="text-xs text-slate-600">{framework.feedback}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Comunicação */}
          <Card className="p-4 bg-cyan-50 border-cyan-200">
            <h4 className="font-bold text-cyan-800 mb-3">💬 Efetividade da Comunicação</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-slate-700">Canal Mais Efetivo:</span>
                <span className="ml-2 text-slate-600">{teamAnalysis.comunicacao.canal_efetivo}</span>
              </div>
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-slate-700">Padrões de Sucesso:</span>
                <p className="text-slate-600 mt-1">{teamAnalysis.comunicacao.padroes_sucesso}</p>
              </div>
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-slate-700">Gaps de Comunicação:</span>
                <p className="text-slate-600 mt-1">{teamAnalysis.comunicacao.gaps}</p>
              </div>
            </div>
          </Card>

          {/* Recomendações */}
          <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300">
            <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recomendações Estratégicas
            </h4>
            <ol className="space-y-2">
              {teamAnalysis.recomendacoes.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <span className="font-bold text-orange-600 text-lg">{i + 1}</span>
                  <p className="text-sm text-slate-800 flex-1">{rec}</p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Meta de Crescimento */}
          <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300">
            <h4 className="font-bold text-emerald-800 mb-2">🎯 Meta de Crescimento</h4>
            <p className="text-sm text-slate-700">{teamAnalysis.meta_crescimento}</p>
          </Card>
        </>
      )}

      {/* Individual Analysis */}
      {individualAnalysis.length > 0 && (
        <Card className="p-4">
          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Performance Individual
          </h4>
          <div className="space-y-3">
            {individualAnalysis.map((rep, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-bold text-slate-800">{rep.user.full_name}</h5>
                    <p className="text-xs text-slate-500">{rep.user.email}</p>
                  </div>
                  <Badge className={
                    rep.potencial.includes('alto') ? 'bg-green-100 text-green-700' :
                    rep.potencial.includes('médio') ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {rep.potencial}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-xs text-slate-600">Vendas</p>
                    <p className="text-lg font-bold text-blue-600">{rep.sales_count}</p>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-xs text-slate-600">Valor</p>
                    <p className="text-sm font-bold text-green-600">
                      {rep.total_value > 1000 ? `${(rep.total_value / 1000).toFixed(0)}k` : rep.total_value}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-xs text-slate-600">Coaching</p>
                    <p className="text-lg font-bold text-purple-600">{rep.avg_coaching_score.toFixed(0)}</p>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-xs text-slate-600">Interações</p>
                    <p className="text-lg font-bold text-orange-600">{rep.interactions_count}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1">✅ Pontos Fortes:</p>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {rep.pontos_fortes.map((pf, j) => (
                        <li key={j}>• {pf}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">🔧 Áreas de Melhoria:</p>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {rep.areas_melhoria.map((am, j) => (
                        <li key={j}>• {am}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800">💡 Recomendação Principal:</p>
                    <p className="text-xs text-slate-700 mt-1">{rep.recomendacao_principal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}