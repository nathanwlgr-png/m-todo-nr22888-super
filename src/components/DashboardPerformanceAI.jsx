import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

/**
 * IA de Dashboard de Performance
 * Análise profunda de métricas e insights acionáveis
 */
export default function DashboardPerformanceAI() {
  const [analyzing, setAnalyzing] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const analyzePerformance = async () => {
    setAnalyzing(true);
    try {
      const metrics = {
        total_clients: clients.length,
        hot_clients: clients.filter(c => c.status === 'quente').length,
        total_sales: sales.length,
        total_revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        avg_score: clients.length > 0 ? clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length : 0,
        pipeline_value: clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0),
        pending_tasks: tasks.filter(t => t.status === 'pendente').length,
        overdue_tasks: tasks.filter(t => t.status === 'pendente' && new Date(t.due_date) < new Date()).length
      };

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de performance de vendas expert. Analise as métricas e forneça insights profundos.

MÉTRICAS ATUAIS:
• Total de clientes: ${metrics.total_clients}
• Clientes quentes: ${metrics.hot_clients} (${((metrics.hot_clients / metrics.total_clients) * 100).toFixed(1)}%)
• Vendas fechadas: ${metrics.total_sales}
• Receita total: R$ ${metrics.total_revenue.toLocaleString()}
• Score médio: ${metrics.avg_score.toFixed(1)}%
• Valor do pipeline: R$ ${metrics.pipeline_value.toLocaleString()}
• Tarefas pendentes: ${metrics.pending_tasks} (${metrics.overdue_tasks} atrasadas)

ÚLTIMOS 30 DIAS:
• Vendas: ${sales.filter(s => new Date(s.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
• Novos clientes: ${clients.filter(c => new Date(c.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}

Retorne JSON com análise:
{
  "performance_grade": "A a F",
  "strengths": ["força 1", "força 2", "força 3"],
  "weaknesses": ["fraqueza 1", "fraqueza 2"],
  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "threats": ["ameaça 1", "ameaça 2"],
  "priority_actions": [
    {
      "action": "ação prioritária",
      "reason": "por que fazer agora",
      "expected_impact": "impacto esperado"
    }
  ],
  "forecast": {
    "next_30_days": {
      "expected_sales": 0,
      "expected_revenue": 0,
      "confidence": "alta|media|baixa",
      "reasoning": "explicação da previsão"
    }
  },
  "summary": "Resumo executivo (4 linhas)"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            performance_grade: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
            priority_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  reason: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            },
            forecast: {
              type: "object",
              properties: {
                next_30_days: {
                  type: "object",
                  properties: {
                    expected_sales: { type: "number" },
                    expected_revenue: { type: "number" },
                    confidence: { type: "string" },
                    reasoning: { type: "string" }
                  }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      toast.success(`Performance: Nota ${analysis.performance_grade}`, {
        description: analysis.summary,
        duration: 10000
      });

      // Mostrar ações prioritárias
      const actionsMsg = analysis.priority_actions.map((a, i) => 
        `${i + 1}. ${a.action}\n   ${a.expected_impact}`
      ).join('\n\n');

      setTimeout(() => {
        toast.info('🎯 Ações Prioritárias', {
          description: `${analysis.priority_actions.length} ações recomendadas`,
          duration: 8000
        });
      }, 2000);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar performance');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Dashboard Performance IA</h3>
          <p className="text-xs text-slate-600">Análise SWOT + Previsões</p>
        </div>
      </div>

      <Button
        onClick={analyzePerformance}
        disabled={analyzing}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Analisar Performance
          </>
        )}
      </Button>
    </Card>
  );
}