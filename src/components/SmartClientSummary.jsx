import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartClientSummary({ client, interactions = [], sales = [], visits = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const recentInteractions = interactions.slice(0, 5);
      const recentSales = sales.slice(0, 3);
      const recentVisits = visits.slice(0, 3);

      const prompt = `Gere um RESUMO EXECUTIVO INTELIGENTE deste cliente em formato acionável.

CLIENTE: ${client.first_name}
${client.clinic_name || ''} | ${client.city || ''}

SITUAÇÃO ATUAL:
- Status: ${client.status} | Score: ${client.purchase_score}%
- Health Score: ${client.health_score || 50}% | Engagement: ${client.engagement_score || 0}%
- Pipeline: ${client.pipeline_stage || 'lead'}
- LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}

HISTÓRICO:
- Vendas: ${sales.length} (Total: R$ ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')})
- Visitas: ${visits.length}
- Interações: ${interactions.length}

ÚLTIMAS INTERAÇÕES:
${recentInteractions.map(i => `- ${i.type}: ${i.subject} (${new Date(i.created_date).toLocaleDateString('pt-BR')})`).join('\n')}

ANÁLISE:
1. RESUMO EXECUTIVO (2-3 frases sobre quem é o cliente)
2. MOMENTO ATUAL DA VENDA (onde estamos no processo)
3. PRINCIPAIS INSIGHTS (3 pontos-chave)
4. OPORTUNIDADES (o que pode ser explorado)
5. RISCOS/ALERTAS (se houver)

Seja DIRETO, ACIONÁVEL e ESTRATÉGICO.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            current_moment: { type: "string" },
            key_insights: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            risks_alerts: { type: "array", items: { type: "string" } },
            overall_health: { type: "string" },
            priority_level: { type: "string" }
          }
        }
      });

      setSummary(result);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar resumo');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">📄 Resumo Inteligente</h3>
            <p className="text-xs text-white/80">Histórico + Interações + Insights IA</p>
          </div>
        </div>
        <Button
          onClick={generateSummary}
          disabled={loading}
          className="w-full h-10 bg-white text-indigo-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Resumo'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-lg border-2 border-indigo-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Resumo Executivo IA
        </h3>
        <Badge className={
          summary.priority_level === 'alta' ? 'bg-red-500 text-white' :
          summary.priority_level === 'média' ? 'bg-orange-500 text-white' :
          'bg-blue-500 text-white'
        }>
          {summary.priority_level}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Executive Summary */}
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-sm text-slate-700 leading-relaxed">{summary.executive_summary}</p>
        </div>

        {/* Current Moment */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-semibold text-blue-800 mb-1">📍 Momento Atual:</p>
          <p className="text-sm text-slate-700">{summary.current_moment}</p>
        </div>

        {/* Key Insights */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs font-semibold text-green-800 mb-2">💡 Insights Principais:</p>
          {summary.key_insights.map((insight, i) => (
            <p key={i} className="text-xs text-slate-700 mb-1">✓ {insight}</p>
          ))}
        </div>

        {/* Opportunities */}
        {summary.opportunities.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Oportunidades:
            </p>
            {summary.opportunities.map((opp, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">→ {opp}</p>
            ))}
          </div>
        )}

        {/* Risks/Alerts */}
        {summary.risks_alerts.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Riscos/Alertas:
            </p>
            {summary.risks_alerts.map((risk, i) => (
              <p key={i} className="text-xs text-red-700 mb-1">⚠ {risk}</p>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => setSummary(null)}
        variant="outline"
        className="w-full mt-3"
        size="sm"
      >
        Atualizar Resumo
      </Button>
    </Card>
  );
}