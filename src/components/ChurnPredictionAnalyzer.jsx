import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, TrendingDown } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function ChurnPredictionAnalyzer({ client, interactions = [], visits = [] }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeChurnRisk = async () => {
    setLoading(true);
    try {
      const lastInteraction = interactions[0];
      const lastVisit = visits.find(v => v.status === 'realizada');
      
      const daysSinceLastContact = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      const prompt = `Analise o risco de CHURN (desistência/abandono) deste cliente:

PERFIL:
- Nome: ${client.first_name}
- Status: ${client.status}
- Score: ${client.purchase_score}%
- Engajamento: ${client.engagement_score || 0}%
- Health Score: ${client.health_score || 0}%

HISTÓRICO:
- Interações: ${interactions.length} (última: ${daysSinceLastContact} dias)
- Visitas: ${visits.length}
- Última visita: ${lastVisit ? lastVisit.scheduled_date : 'Nunca'}
- Vendas: ${client.equipment_sold ? 'SIM' : 'NÃO'}

COMPORTAMENTO:
- Tempo no funil: ${client.total_visits_count || 0} visitas
- Resposta: ${daysSinceLastContact <= 7 ? 'Rápida' : daysSinceLastContact <= 30 ? 'Média' : 'Lenta'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

TAREFA:
Calcule o risco de churn (0-100%) e:
1. Identifique os principais sinais de alerta
2. Fatores de retenção positivos
3. Ações urgentes recomendadas
4. Melhor timing para contato

Considere: inatividade, objeções não resolvidas, tempo sem resposta, interesse decrescente.`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              churn_risk_percentage: { type: "number" },
              risk_level: { type: "string", enum: ["Baixo", "Médio", "Alto", "Crítico"] },
              warning_signals: { type: "array", items: { type: "string" } },
              positive_factors: { type: "array", items: { type: "string" } },
              urgent_actions: { type: "array", items: { type: "string" } },
              best_contact_timing: { type: "string" },
              retention_message: { type: "string" }
            }
          }
        });
      }, 'high');

      setAnalysis(result);
      toast.success('Análise de churn concluída!');
    } catch (error) {
      toast.error('Erro ao analisar churn');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'Baixo': return 'bg-green-100 text-green-700';
      case 'Médio': return 'bg-yellow-100 text-yellow-700';
      case 'Alto': return 'bg-red-100 text-red-700';
      case 'Crítico': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">⚠️ Predição de Churn</h3>
          <p className="text-xs text-slate-600">Análise de risco de abandono</p>
        </div>
      </div>

      {!analysis ? (
        <Button
          onClick={analyzeChurnRisk}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            'Analisar Risco de Churn'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-orange-600 font-semibold">Risco de Churn</p>
              <p className="text-2xl font-bold text-orange-700">{analysis.churn_risk_percentage}%</p>
            </div>
            <div className={`rounded-lg p-3 border ${getRiskColor(analysis.risk_level)}`}>
              <p className="text-xs font-semibold">Nível</p>
              <p className="text-lg font-bold">{analysis.risk_level}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-2">⚠️ Sinais de Alerta</p>
            <div className="space-y-1">
              {analysis.warning_signals?.map((signal, i) => (
                <p key={i} className="text-xs text-slate-700">• {signal}</p>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-2">✓ Fatores Positivos</p>
            <div className="space-y-1">
              {analysis.positive_factors?.map((factor, i) => (
                <p key={i} className="text-xs text-slate-700">• {factor}</p>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-2">🚨 Ações Urgentes</p>
            <div className="space-y-1">
              {analysis.urgent_actions?.map((action, i) => (
                <p key={i} className="text-xs text-red-800 font-medium">• {action}</p>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">📞 Melhor Timing</p>
            <p className="text-sm text-blue-900">{analysis.best_contact_timing}</p>
          </div>

          <Button
            size="sm"
            onClick={() => setAnalysis(null)}
            variant="outline"
          >
            Nova Análise
          </Button>
        </div>
      )}
    </Card>
  );
}