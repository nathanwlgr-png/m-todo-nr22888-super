import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { 
  Loader2, TrendingDown, AlertTriangle, Calendar, 
  MessageSquare, Activity, Target, Zap, Brain, ThumbsUp,
  ThumbsDown, Meh, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedClientAnalytics({ client, interactions, visits, sales }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const generateAdvancedAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Preparar histórico de interações e mensagens
      const interactionHistory = interactions.map(i => ({
        type: i.type,
        date: i.created_date,
        outcome: i.outcome,
        notes: i.notes,
        subject: i.subject
      }));

      const visitHistory = visits.map(v => ({
        date: v.scheduled_date,
        status: v.status,
        notes: v.result_notes || v.notes
      }));

      const prompt = `Você é um analista de Customer Success e Retenção especializado. Analise profundamente este cliente:

**CLIENTE:** ${client.first_name}
**STATUS:** ${client.status}
**SCORE:** ${client.purchase_score}%
**ÚLTIMA VISITA:** ${client.last_visit_date || 'Nunca'}
**TOTAL DE VISITAS:** ${client.total_visits_count || 0}
**TOTAL DE INTERAÇÕES:** ${interactions.length}
**VENDAS FECHADAS:** ${sales.filter(s => s.status === 'fechada').length}

**HISTÓRICO DE INTERAÇÕES (últimos 30 dias):**
${JSON.stringify(interactionHistory.slice(0, 10), null, 2)}

**HISTÓRICO DE VISITAS:**
${JSON.stringify(visitHistory.slice(0, 5), null, 2)}

**PERFIL:**
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Orçamento: ${client.available_budget || 'Não informado'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

---

**ANÁLISE COMPLETA REQUERIDA:**

1. **RESUMO SEMANAL/MENSAL:**
   - Quantas interações nos últimos 7 dias
   - Quantas interações nos últimos 30 dias
   - Padrão de engajamento (crescente, estável, decrescente)
   - Principais marcos do mês

2. **ANÁLISE DE SENTIMENTO:**
   - Analise o tom das interações (positivo, neutro, negativo)
   - Tendência de sentimento ao longo do tempo
   - Alertas de mudanças bruscas de sentimento

3. **PREVISÃO DE CHURN:**
   - Probabilidade de churn (0-100%)
   - Fatores de risco identificados
   - Sinais de alerta precoce
   - Timeline previsto de risco

4. **AÇÕES PROATIVAS DE RETENÇÃO:**
   - 3-5 ações imediatas recomendadas
   - Prioridade de cada ação (alta, média, baixa)
   - Justificativa de cada ação
   - Melhor timing para execução

Retorne JSON estruturado com todas as análises.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            weekly_summary: {
              type: "object",
              properties: {
                interactions_last_7_days: { type: "number" },
                interactions_last_30_days: { type: "number" },
                engagement_trend: { type: "string" },
                key_milestones: { type: "array", items: { type: "string" } }
              }
            },
            sentiment_analysis: {
              type: "object",
              properties: {
                overall_sentiment: { type: "string" },
                sentiment_score: { type: "number" },
                sentiment_trend: { type: "string" },
                recent_changes: { type: "array", items: { type: "string" } }
              }
            },
            churn_prediction: {
              type: "object",
              properties: {
                churn_probability: { type: "number" },
                risk_level: { type: "string" },
                risk_factors: { type: "array", items: { type: "string" } },
                early_warning_signs: { type: "array", items: { type: "string" } },
                estimated_timeline: { type: "string" }
              }
            },
            retention_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string" },
                  justification: { type: "string" },
                  best_timing: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise completa gerada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment?.toLowerCase().includes('positiv')) return <ThumbsUp className="w-5 h-5 text-green-600" />;
    if (sentiment?.toLowerCase().includes('negativ')) return <ThumbsDown className="w-5 h-5 text-red-600" />;
    return <Meh className="w-5 h-5 text-yellow-600" />;
  };

  const getRiskColor = (level) => {
    if (level === 'alto' || level === 'high') return 'bg-red-500';
    if (level === 'médio' || level === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'alta' || priority === 'high') return 'bg-red-100 text-red-700 border-red-300';
    if (priority === 'média' || priority === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Análise Avançada IA</h3>
          <p className="text-xs text-slate-600">Resumo, Sentimento, Churn e Retenção</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={generateAdvancedAnalysis}
          disabled={analyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-700 mb-3"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Gerar Análise Completa
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* 1. RESUMO SEMANAL/MENSAL */}
          <div className="p-4 bg-white rounded-xl border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-slate-800">Resumo de Atividade</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600 mb-1">Últimos 7 Dias</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {analysis.weekly_summary?.interactions_last_7_days || 0}
                </p>
                <p className="text-xs text-slate-600">interações</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Últimos 30 Dias</p>
                <p className="text-2xl font-bold text-purple-700">
                  {analysis.weekly_summary?.interactions_last_30_days || 0}
                </p>
                <p className="text-xs text-slate-600">interações</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
              <p className="text-xs text-slate-600 mb-1">📊 Tendência de Engajamento</p>
              <p className="font-semibold text-slate-800">{analysis.weekly_summary?.engagement_trend}</p>
            </div>

            {analysis.weekly_summary?.key_milestones?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">🎯 Marcos do Período</p>
                <div className="space-y-1">
                  {analysis.weekly_summary.key_milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{milestone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. ANÁLISE DE SENTIMENTO */}
          <div className="p-4 bg-white rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-slate-800">Análise de Sentimento</h4>
            </div>

            <div className="flex items-center gap-3 mb-3">
              {getSentimentIcon(analysis.sentiment_analysis?.overall_sentiment)}
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{analysis.sentiment_analysis?.overall_sentiment}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        analysis.sentiment_analysis?.sentiment_score >= 70 ? 'bg-green-500' :
                        analysis.sentiment_analysis?.sentiment_score >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${analysis.sentiment_analysis?.sentiment_score || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {analysis.sentiment_analysis?.sentiment_score}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-2">
              <p className="text-xs text-purple-600 mb-1">📈 Tendência</p>
              <p className="text-sm text-slate-700">{analysis.sentiment_analysis?.sentiment_trend}</p>
            </div>

            {analysis.sentiment_analysis?.recent_changes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Mudanças Recentes</p>
                <div className="space-y-1">
                  {analysis.sentiment_analysis.recent_changes.map((change, idx) => (
                    <p key={idx} className="text-sm text-slate-700 pl-3 border-l-2 border-red-300">
                      {change}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. PREVISÃO DE CHURN */}
          <div className="p-4 bg-white rounded-xl border-2 border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-slate-800">Previsão de Churn</h4>
            </div>

            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-300 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-700">RISCO DE PERDA</span>
                <Badge className={`${getRiskColor(analysis.churn_prediction?.risk_level)} text-white`}>
                  {analysis.churn_prediction?.risk_level?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {analysis.churn_prediction?.churn_probability}%
                  </p>
                  <p className="text-xs text-slate-600">Probabilidade de Churn</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-2">
              <p className="text-xs text-red-600 mb-1">⏱️ Timeline Previsto</p>
              <p className="text-sm font-semibold text-slate-800">
                {analysis.churn_prediction?.estimated_timeline}
              </p>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">🔴 Fatores de Risco</p>
              <div className="space-y-1">
                {analysis.churn_prediction?.risk_factors?.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{factor}</p>
                  </div>
                ))}
              </div>
            </div>

            {analysis.churn_prediction?.early_warning_signs?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-orange-700 mb-2">⚠️ Sinais de Alerta Precoce</p>
                <div className="space-y-1">
                  {analysis.churn_prediction.early_warning_signs.map((sign, idx) => (
                    <p key={idx} className="text-sm text-slate-700 pl-3 border-l-2 border-orange-400">
                      {sign}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. AÇÕES PROATIVAS DE RETENÇÃO */}
          <div className="p-4 bg-white rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-slate-800">Ações de Retenção Recomendadas</h4>
            </div>

            <div className="space-y-3">
              {analysis.retention_actions?.map((action, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${getPriorityColor(action.priority)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <Badge className="text-xs">{action.priority?.toUpperCase()}</Badge>
                    </div>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>

                  <p className="font-semibold text-slate-800 mb-2">{action.action}</p>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-slate-600 min-w-[60px]">Por quê:</span>
                      <p className="text-slate-700">{action.justification}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-slate-600 min-w-[60px]">Quando:</span>
                      <p className="text-slate-700">{action.best_timing}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Atualizar */}
          <Button
            onClick={generateAdvancedAnalysis}
            disabled={analyzing}
            variant="outline"
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Atualizando...
              </>
            ) : (
              'Atualizar Análise'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}