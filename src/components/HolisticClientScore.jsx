import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function HolisticClientScore({ client, interactions = [], sales = [], visits = [] }) {
  const [calculating, setCalculating] = useState(false);
  const [holisticScore, setHolisticScore] = useState(null);

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const daysSinceLastContact = client.last_contact_date 
        ? Math.floor((Date.now() - new Date(client.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const daysSinceCreated = Math.floor((Date.now() - new Date(client.created_date).getTime()) / (1000 * 60 * 60 * 24));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SCORE HOLÍSTICO DO CLIENTE - ANÁLISE 360° - PRIMORI

═══════════════════════════════════════
📊 DADOS COMPLETOS DO CLIENTE
═══════════════════════════════════════

IDENTIFICAÇÃO:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Tipo: ${client.client_type || 'N/A'}
- Decisor: ${client.decision_role || 'N/A'}

PIPELINE & ENGAJAMENTO:
- Pipeline: ${client.pipeline_stage || 'lead'}
- Status: ${client.status}
- Score compra atual: ${client.purchase_score || 50}%
- Engagement score: ${client.engagement_score || 0}
- Segmento IA: ${client.ai_segment || 'N/A'}

HISTÓRICO DE COMPRAS:
- Total vendas: ${sales.length}
- Vendas fechadas: ${sales.filter(s => s.status === 'fechada').length}
- Receita total: R$ ${sales.reduce((acc, s) => acc + (s.sale_value || 0), 0).toLocaleString('pt-BR')}
- Equipamento vendido: ${client.equipment_sold || 'Nenhum'}

INTERAÇÕES:
- Total interações: ${interactions.length}
- Última interação: ${interactions[0]?.type || 'Nenhuma'} (${daysSinceLastContact} dias atrás)
- Interações últimos 30 dias: ${interactions.filter(i => {
  const days = Math.floor((Date.now() - new Date(i.created_date).getTime()) / (1000 * 60 * 60 * 24));
  return days <= 30;
}).length}
- Tipos: ${[...new Set(interactions.map(i => i.type))].join(', ') || 'Nenhuma'}

VISITAS:
- Total visitas: ${visits.length}
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Última visita: ${client.last_visit_date || 'Nunca'}

RISCO DE CHURN:
- Dias sem contato: ${daysSinceLastContact}
- Dias desde criação: ${daysSinceCreated}
- Risco IA: ${client.ai_sales_intelligence?.churn_risk || 'N/A'}%

INTELIGÊNCIA IA:
- Prob. conversão IA: ${client.ai_sales_intelligence?.conversion_probability || 'N/A'}%
- LTV 12m: ${client.ai_sales_intelligence?.ltv_12_months || 'N/A'}
- LTV 24m: ${client.ai_sales_intelligence?.ltv_24_months || 'N/A'}
- Prioridade atenção: ${client.attention_priority || 'N/A'}/10

═══════════════════════════════════════
🎯 CALCULAR SCORE HOLÍSTICO
═══════════════════════════════════════

Calcule um SCORE HOLÍSTICO ÚNICO (0-100) que sintetize TODOS os aspectos do cliente:

**COMPONENTES DO SCORE:**

1. **Purchase History Score (0-25 pontos)**
   - Número de compras
   - Valor total gasto
   - Recência das compras
   - Equipamento vendido (bonus)

2. **Engagement Score (0-25 pontos)**
   - Frequência de interações
   - Variedade de canais
   - Qualidade das interações
   - Responsividade

3. **Pipeline Health (0-20 pontos)**
   - Estágio atual no funil
   - Tempo no estágio (muito tempo = penalidade)
   - Score de compra
   - Probabilidade IA de conversão

4. **Recency & Activity (0-15 pontos)**
   - Dias desde último contato (quanto menos, melhor)
   - Visitas recentes
   - Interações últimos 30 dias
   - Tarefas concluídas

5. **Churn Risk (0-15 pontos - inverso)**
   - Quanto MENOR o risco, MAIOR a pontuação
   - Considere inatividade, status frio, etc.

**CLASSIFICAÇÃO FINAL:**
- 90-100: Cliente VIP 👑
- 75-89: Cliente Excelente 🏆
- 60-74: Cliente Bom ⭐
- 45-59: Cliente Regular 📊
- 30-44: Cliente em Risco ⚠️
- 0-29: Cliente Crítico 🚨

**FORNEÇA:**
1. Score final (0-100)
2. Classificação
3. Breakdown detalhado de cada componente
4. Top 3 fatores que aumentam o score
5. Top 3 fatores que diminuem o score
6. Ações específicas para melhorar (+10-20 pontos)
7. Tendência (crescendo/estável/declinando)
8. Comparação com média geral (acima/na média/abaixo)`,
        response_json_schema: {
          type: "object",
          properties: {
            score_final: { type: "number" },
            classificacao: { type: "string" },
            componentes: {
              type: "object",
              properties: {
                purchase_history: { type: "number" },
                engagement: { type: "number" },
                pipeline_health: { type: "number" },
                recency_activity: { type: "number" },
                churn_risk_inverse: { type: "number" }
              }
            },
            breakdown_detalhado: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  componente: { type: "string" },
                  pontos: { type: "number" },
                  max_pontos: { type: "number" },
                  justificativa: { type: "string" }
                }
              }
            },
            fatores_positivos: { type: "array", items: { type: "string" } },
            fatores_negativos: { type: "array", items: { type: "string" } },
            acoes_melhoria: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  impacto_pontos: { type: "string" },
                  urgencia: { type: "string" }
                }
              }
            },
            tendencia: { type: "string" },
            comparacao_media: { type: "string" },
            insights: { type: "string" }
          }
        }
      });

      setHolisticScore(result);
      toast.success('Score holístico calculado!');
    } catch (error) {
      toast.error('Erro ao calcular score');
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-purple-600 to-pink-600';
    if (score >= 75) return 'from-green-600 to-emerald-600';
    if (score >= 60) return 'from-blue-600 to-cyan-600';
    if (score >= 45) return 'from-yellow-600 to-orange-600';
    if (score >= 30) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-red-800';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return '👑';
    if (score >= 75) return '🏆';
    if (score >= 60) return '⭐';
    if (score >= 45) return '📊';
    if (score >= 30) return '⚠️';
    return '🚨';
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Score Holístico 360°</h3>
          <p className="text-xs text-indigo-700">Síntese completa do cliente</p>
        </div>
      </div>

      {!holisticScore && (
        <Button
          onClick={calculateScore}
          disabled={calculating}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {calculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Calculando score 360°...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Calcular Score Holístico
            </>
          )}
        </Button>
      )}

      {holisticScore && (
        <div className="space-y-3">
          {/* Score Principal */}
          <div className={`p-4 bg-gradient-to-r ${getScoreColor(holisticScore.score_final)} rounded-xl`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getScoreIcon(holisticScore.score_final)}</span>
                <div>
                  <p className="text-xs text-white/80">Score Holístico</p>
                  <p className="text-sm font-bold text-white">{holisticScore.classificacao}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-white">{holisticScore.score_final}</p>
                <p className="text-xs text-white/80">de 100</p>
              </div>
            </div>
            <Progress value={holisticScore.score_final} className="h-2 bg-white/30" />
          </div>

          {/* Componentes do Score */}
          <Card className="p-3 bg-white">
            <p className="text-xs font-semibold text-slate-700 mb-2">📊 Componentes do Score:</p>
            <div className="space-y-2">
              {holisticScore.breakdown_detalhado?.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-700">{item.componente}</p>
                    <Progress 
                      value={(item.pontos / item.max_pontos) * 100} 
                      className="h-1 mt-1"
                    />
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {item.pontos}/{item.max_pontos}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Insights */}
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">💡 Insights:</p>
            <p className="text-xs text-slate-700">{holisticScore.insights}</p>
          </Card>

          {/* Fatores */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Positivos
              </p>
              {holisticScore.fatores_positivos?.map((f, i) => (
                <p key={i} className="text-xs text-green-700">• {f}</p>
              ))}
            </Card>
            <Card className="p-3 bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Negativos
              </p>
              {holisticScore.fatores_negativos?.map((f, i) => (
                <p key={i} className="text-xs text-red-700">• {f}</p>
              ))}
            </Card>
          </div>

          {/* Tendência e Comparação */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 bg-white">
              <p className="text-xs text-slate-600 mb-1">Tendência</p>
              <div className="flex items-center gap-2">
                {holisticScore.tendencia?.toLowerCase().includes('crescendo') ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : holisticScore.tendencia?.toLowerCase().includes('declinando') ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                )}
                <p className="text-sm font-semibold text-slate-800">{holisticScore.tendencia}</p>
              </div>
            </Card>
            <Card className="p-3 bg-white">
              <p className="text-xs text-slate-600 mb-1">vs Média</p>
              <p className="text-sm font-semibold text-slate-800">{holisticScore.comparacao_media}</p>
            </Card>
          </div>

          {/* Ações de Melhoria */}
          <Card className="p-3 bg-purple-50 border border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-2">🎯 Ações para Melhorar Score:</p>
            <div className="space-y-2">
              {holisticScore.acoes_melhoria?.map((acao, i) => (
                <div key={i} className="p-2 bg-white rounded border border-purple-200">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-800 flex-1">{acao.acao}</p>
                    <Badge className={
                      acao.urgencia === 'Alta' ? 'bg-red-500' :
                      acao.urgencia === 'Média' ? 'bg-yellow-500' : 'bg-blue-500'
                    }>
                      {acao.urgencia}
                    </Badge>
                  </div>
                  <p className="text-xs text-green-600">+ {acao.impacto_pontos}</p>
                </div>
              ))}
            </div>
          </Card>

          <Button
            onClick={calculateScore}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Recalcular Score
          </Button>
        </div>
      )}
    </Card>
  );
}