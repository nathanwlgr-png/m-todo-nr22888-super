import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Heart, ShoppingCart, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const CACHE_KEY = 'ai_insights_';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export default function ClientAIInsightsDashboard({ client, interactions = [], visits = [], sales = [] }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY + client?.id);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch { return null; }
    return null;
  };

  const analyze = async () => {
    const cached = getCached();
    if (cached) { setInsights(cached); setExpanded(true); return; }

    setLoading(true);
    try {
      const interactionSummary = interactions.slice(0, 10).map(i =>
        `[${i.type}] ${i.subject || ''}: ${i.notes?.substring(0, 80) || ''} | sentimento: ${i.sentiment || 'neutro'}`
      ).join('\n');

      const visitSummary = visits.slice(0, 5).map(v =>
        `Visita ${v.visit_type} em ${v.scheduled_date?.substring(0, 10)}: ${v.result_notes?.substring(0, 80) || v.notes?.substring(0, 80) || ''}`
      ).join('\n');

      const salesSummary = sales.map(s =>
        `Venda: ${s.equipment_name} R$${s.sale_value} status=${s.status}`
      ).join('\n');

      const daysSinceContact = client.last_contact_date
        ? Math.floor((Date.now() - new Date(client.last_contact_date)) / 86400000)
        : 999;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de CRM especializado em vendas de equipamentos veterinários.

CLIENTE: ${client.first_name} | Status: ${client.status} | Score: ${client.purchase_score || 0}% | Pipeline: ${client.pipeline_stage || 'lead'}
Dias sem contato: ${daysSinceContact} | Total visitas: ${visits.length} | Total vendas: ${sales.length} | Total interações: ${interactions.length}
Perfil numerológico: ${client.numerology_number} - ${client.behavioral_profile || ''}
Orçamento: R$${client.available_budget || 'N/A'} | Equip. interesse: ${client.equipment_interest || 'N/A'}

INTERAÇÕES RECENTES:
${interactionSummary || 'Nenhuma'}

VISITAS:
${visitSummary || 'Nenhuma'}

VENDAS:
${salesSummary || 'Nenhuma'}

Com base nesses dados, analise e retorne JSON com:
1. sentiment: sentimento geral do cliente ("positivo", "neutro", "negativo")
2. sentiment_score: 0-100
3. sentiment_reason: 1 frase explicando
4. churn_risk: risco de perda ("baixo", "medio", "alto", "critico")
5. churn_risk_score: 0-100
6. churn_risk_reason: 1 frase
7. buying_pattern: padrão de compra detectado (1-2 frases)
8. momentum: tendência atual ("crescendo", "estavel", "decaindo")
9. top_insight: insight mais importante (1 frase acionável)
10. recommended_action: ação imediata recomendada (1 frase)
11. urgency_level: urgência ("baixa", "media", "alta", "critica")
12. predicted_close_days: estimativa em dias para fechamento (número)`,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            sentiment_score: { type: "number" },
            sentiment_reason: { type: "string" },
            churn_risk: { type: "string" },
            churn_risk_score: { type: "number" },
            churn_risk_reason: { type: "string" },
            buying_pattern: { type: "string" },
            momentum: { type: "string" },
            top_insight: { type: "string" },
            recommended_action: { type: "string" },
            urgency_level: { type: "string" },
            predicted_close_days: { type: "number" }
          }
        }
      });

      sessionStorage.setItem(CACHE_KEY + client.id, JSON.stringify({ data: result, ts: Date.now() }));
      setInsights(result);
      setExpanded(true);
    } catch (e) {
      toast.error('Erro ao analisar insights');
    } finally {
      setLoading(false);
    }
  };

  const sentimentConfig = {
    positivo: { color: 'bg-green-100 text-green-700 border-green-300', icon: Heart, bar: 'bg-green-500' },
    neutro:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: TrendingUp, bar: 'bg-yellow-500' },
    negativo: { color: 'bg-red-100 text-red-700 border-red-300', icon: TrendingDown, bar: 'bg-red-500' },
  };

  const churnConfig = {
    baixo:   { color: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
    medio:   { color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500' },
    alto:    { color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
    critico: { color: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
  };

  const momentumConfig = {
    crescendo: { icon: '📈', color: 'text-green-600' },
    estavel:   { icon: '➡️', color: 'text-yellow-600' },
    decaindo:  { icon: '📉', color: 'text-red-600' },
  };

  const urgencyConfig = {
    baixa:   { color: 'bg-slate-100 text-slate-600' },
    media:   { color: 'bg-blue-100 text-blue-700' },
    alta:    { color: 'bg-orange-100 text-orange-700' },
    critica: { color: 'bg-red-100 text-red-700 animate-pulse' },
  };

  const sc = sentimentConfig[insights?.sentiment] || sentimentConfig.neutro;
  const cc = churnConfig[insights?.churn_risk] || churnConfig.medio;
  const mc = momentumConfig[insights?.momentum] || momentumConfig.estavel;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-800">AI Insights — Análise Comportamental</p>
              <p className="text-[10px] text-indigo-500">Sentimento • Padrão de Compra • Risco de Churn</p>
            </div>
          </div>
          {insights && (
            <button onClick={() => setExpanded(!expanded)} className="text-indigo-400 hover:text-indigo-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* CTA or Refresh */}
        {!insights && !loading && (
          <Button onClick={analyze} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-sm h-9">
            <Sparkles className="w-4 h-4 mr-2" /> Analisar Interações com IA
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm text-indigo-600">Analisando {interactions.length} interações, {visits.length} visitas, {sales.length} vendas...</span>
          </div>
        )}

        {/* Results */}
        {insights && expanded && (
          <div className="space-y-3 mt-1">
            {/* Top Insight - destaque */}
            <div className="bg-white rounded-xl p-3 border border-indigo-200 shadow-sm">
              <p className="text-[10px] font-bold text-indigo-500 mb-1">💡 INSIGHT PRINCIPAL</p>
              <p className="text-sm text-slate-800 font-medium">{insights.top_insight}</p>
            </div>

            {/* 3 Métricas Principais */}
            <div className="grid grid-cols-3 gap-2">
              {/* Sentimento */}
              <div className={`rounded-lg p-2.5 border ${sc.color}`}>
                <p className="text-[9px] font-bold uppercase mb-1">Sentimento</p>
                <p className="text-sm font-bold capitalize">{insights.sentiment}</p>
                <div className="h-1.5 bg-white/50 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full ${sc.bar} rounded-full`} style={{ width: `${insights.sentiment_score}%` }} />
                </div>
                <p className="text-[9px] mt-1 opacity-80">{insights.sentiment_score}%</p>
              </div>

              {/* Churn Risk */}
              <div className={`rounded-lg p-2.5 ${cc.color}`}>
                <p className="text-[9px] font-bold uppercase mb-1">Risco Churn</p>
                <p className="text-sm font-bold capitalize">{insights.churn_risk}</p>
                <div className="h-1.5 bg-white/50 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full ${cc.bar} rounded-full`} style={{ width: `${insights.churn_risk_score}%` }} />
                </div>
                <p className="text-[9px] mt-1 opacity-80">{insights.churn_risk_score}%</p>
              </div>

              {/* Momentum */}
              <div className="rounded-lg p-2.5 bg-white border border-slate-200">
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Momentum</p>
                <p className={`text-sm font-bold capitalize ${mc.color}`}>{mc.icon} {insights.momentum}</p>
                {insights.predicted_close_days > 0 && (
                  <p className="text-[9px] text-slate-500 mt-1.5">~{insights.predicted_close_days}d p/ fechar</p>
                )}
              </div>
            </div>

            {/* Urgência + Ação */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                <p className="text-[9px] font-bold text-slate-500 mb-1">URGÊNCIA</p>
                <Badge className={`text-[10px] ${urgencyConfig[insights.urgency_level]?.color}`}>
                  {insights.urgency_level?.toUpperCase()}
                </Badge>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                <p className="text-[9px] font-bold text-slate-500 mb-1">PADRÃO DE COMPRA</p>
                <p className="text-[10px] text-slate-700 leading-tight">{insights.buying_pattern?.substring(0, 60)}...</p>
              </div>
            </div>

            {/* Ação Recomendada */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-orange-700 mb-0.5">AÇÃO RECOMENDADA AGORA</p>
                  <p className="text-xs text-orange-800">{insights.recommended_action}</p>
                </div>
              </div>
            </div>

            {/* Razões */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-[10px] text-slate-600">
                <span className="shrink-0 font-semibold">Sentimento:</span>
                <span>{insights.sentiment_reason}</span>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-600">
                <span className="shrink-0 font-semibold">Churn:</span>
                <span>{insights.churn_risk_reason}</span>
              </div>
            </div>

            {/* Refresh */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-indigo-500 h-7 text-xs"
              onClick={() => { sessionStorage.removeItem(CACHE_KEY + client.id); setInsights(null); setExpanded(false); }}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Reanalisar
            </Button>
          </div>
        )}

        {/* Collapsed summary */}
        {insights && !expanded && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={`text-[10px] ${sc.color} border`}>{insights.sentiment}</Badge>
            <Badge className={`text-[10px] ${cc.color}`}>Churn: {insights.churn_risk}</Badge>
            <span className={`text-xs font-medium ${mc.color}`}>{mc.icon} {insights.momentum}</span>
            {insights.urgency_level === 'critica' || insights.urgency_level === 'alta' ? (
              <Badge className={`text-[10px] ${urgencyConfig[insights.urgency_level]?.color}`}>⚠️ {insights.urgency_level}</Badge>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}