import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartGoalsAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200),
  });

  const analyzeGoals = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE DIÁRIA DE METAS E ESTRATÉGIA DE VENDAS

DADOS DO CRM:
- Total de clientes: ${clients.length}
- Clientes quentes: ${clients.filter(c => c.status === 'quente').length}
- Clientes mornos: ${clients.filter(c => c.status === 'morno').length}
- Vendas fechadas: ${sales.filter(s => s.status === 'fechada').length}

TOP 10 CLIENTES MAIS PROPENSOS:
${clients.slice(0, 10).map(c => `
- ${c.first_name} (${c.city})
  Score: ${c.purchase_score}%
  Status: ${c.status}
  Tipo: ${c.client_type}
  Equipamento interesse: ${c.equipment_interest || 'N/A'}
  Última visita: ${c.last_visit_date || 'Nunca'}
`).join('\n')}

TAREFA:
Analise o perfil completo de cada cliente e sugira:
1. Os 5 clientes com maior chance de fechar hoje/esta semana
2. Equipamento ideal para oferecer a cada um
3. Melhor abordagem estratégica
4. Ações prioritárias para cada cliente

Retorne JSON estruturado:`,
        response_json_schema: {
          type: "object",
          properties: {
            top_prospects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  closing_probability: { type: "number" },
                  recommended_equipment: { type: "string" },
                  strategy: { type: "string" },
                  next_action: { type: "string" },
                  best_contact_time: { type: "string" }
                }
              }
            },
            daily_goal_suggestion: { type: "string" },
            weekly_revenue_projection: { type: "number" }
          }
        }
      });

      setSuggestions(result);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Metas Inteligentes</h3>
          <p className="text-xs text-slate-600">Sugestões diárias com IA</p>
        </div>
      </div>

      <Button
        onClick={analyzeGoals}
        disabled={analyzing}
        className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
      >
        {analyzing ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analisando...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Gerar Sugestões Hoje</>
        )}
      </Button>

      {suggestions && (
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-lg border-2 border-purple-300">
            <p className="text-xs font-semibold text-purple-700 mb-1">Meta do Dia:</p>
            <p className="text-sm text-slate-800">{suggestions.daily_goal_suggestion}</p>
            <p className="text-xs text-purple-600 mt-2">
              💰 Projeção Semanal: R$ {(suggestions.weekly_revenue_projection / 1000).toFixed(0)}k
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">🎯 Top 5 Clientes para Contatar:</p>
            {suggestions.top_prospects?.slice(0, 5).map((prospect, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-slate-800">{prospect.client_name}</p>
                  <Badge className="bg-green-100 text-green-700">
                    {prospect.closing_probability}%
                  </Badge>
                </div>
                <p className="text-xs text-indigo-600 mb-1">
                  📦 {prospect.recommended_equipment}
                </p>
                <p className="text-xs text-slate-700 mb-1">
                  💡 {prospect.strategy}
                </p>
                <p className="text-xs text-orange-600 font-semibold">
                  ⏰ {prospect.best_contact_time}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}