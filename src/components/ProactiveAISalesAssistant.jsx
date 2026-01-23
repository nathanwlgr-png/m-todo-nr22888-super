import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function ProactiveAISalesAssistant({ client, interactions = [], visits = [], sales = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateNextSteps = async () => {
    setLoading(true);
    try {
      const lastInteraction = interactions?.[0];
      const lastVisit = visits?.filter(v => v.status === 'realizada')?.[0];
      const pendingTasks = visits?.filter(v => v.status === 'agendada') || [];

      const prompt = `Analise cliente e SUGIRA próximos passos estratégicos:

CLIENTE:
- Nome: ${client.first_name}
- Status: ${client.status}
- Pipeline: ${client.pipeline_stage}
- Score: ${client.purchase_score}%
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Equipamento interesse: ${client.equipment_interest}

HISTÓRICO:
- Última interação: ${lastInteraction?.type} (${lastInteraction?.subject})
- Última visita: ${lastVisit?.visit_type || 'nenhuma'}
- Próximas agendadas: ${pendingTasks.length}
- Total interações: ${interactions.length}
- Total visitas: ${visits.length}
- Vendas: ${sales.length}

OBJEÇÕES/PAINS:
- Pains: ${client.main_pains?.join(', ') || 'não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'nenhuma'}

TAREFA:
Recomende 3-5 próximos passos ESPECÍFICOS e ACIONÁVEIS:
1. Ação imediata (24h)
2. Ação semana
3. Ação longa prazo
4. Possíveis armadilhas
5. Métrica de sucesso

Retorne JSON:
{
  "urgencia": "imediata/alta/media/baixa",
  "proximo_passo_numero1": {
    "titulo": "",
    "acao": "",
    "tempo": "horas/dias",
    "canal": "whatsapp/email/visita/call",
    "argumentacao": ""
  },
  "proximo_passo_numero2": {...},
  "proximo_passo_numero3": {...},
  "armadilhas": ["", ""],
  "metrica_sucesso": "",
  "probabilidade_fechamento": 0,
  "recomendacao_final": ""
}`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              urgencia: { type: "string" },
              proximo_passo_numero1: { type: "object" },
              proximo_passo_numero2: { type: "object" },
              proximo_passo_numero3: { type: "object" },
              armadilhas: { type: "array", items: { type: "string" } },
              metrica_sucesso: { type: "string" },
              probabilidade_fechamento: { type: "number" },
              recomendacao_final: { type: "string" }
            }
          }
        });
      }, 'high');

      setSuggestions(result);
      toast.success('Próximos passos gerados!');
    } catch (error) {
      toast.error('Erro ao gerar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">⚡ Assistente de Vendas Proativo</h3>
          <p className="text-xs text-slate-600">Próximos melhores passos baseados em perfil & histórico</p>
        </div>
      </div>

      {!suggestions ? (
        <Button
          onClick={generateNextSteps}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            'Gerar Próximos Passos'
          )}
        </Button>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Urgência & Probabilidade */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded-lg border-l-4 ${
              suggestions.urgencia === 'imediata' ? 'bg-red-50 border-l-red-500' :
              suggestions.urgencia === 'alta' ? 'bg-orange-50 border-l-orange-500' :
              suggestions.urgencia === 'media' ? 'bg-yellow-50 border-l-yellow-500' :
              'bg-green-50 border-l-green-500'
            }`}>
              <p className="text-xs font-semibold text-slate-600">Urgência</p>
              <Badge className={`text-xs ${
                suggestions.urgencia === 'imediata' ? 'bg-red-200 text-red-800' :
                suggestions.urgencia === 'alta' ? 'bg-orange-200 text-orange-800' :
                suggestions.urgencia === 'media' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {suggestions.urgencia}
              </Badge>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg border-l-4 border-l-purple-500">
              <p className="text-xs font-semibold text-slate-600">Probabilidade</p>
              <p className="text-xl font-bold text-purple-700">{suggestions.probabilidade_fechamento}%</p>
            </div>
          </div>

          {/* Próximos Passos */}
          {[1, 2, 3].map(num => {
            const paso = suggestions[`proximo_passo_numero${num}`];
            if (!paso) return null;
            return (
              <div key={num} className="bg-white rounded-lg border-l-4 border-l-purple-500 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-purple-700">Passo {num}</p>
                    <p className="text-sm font-bold text-slate-800">{paso.titulo}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{paso.tempo}</Badge>
                </div>
                <p className="text-xs text-slate-700 mb-2"><strong>Ação:</strong> {paso.acao}</p>
                <p className="text-xs text-slate-600"><strong>Canal:</strong> {paso.canal}</p>
                <p className="text-xs text-slate-600 mt-1 italic">💡 {paso.argumentacao}</p>
              </div>
            );
          })}

          {/* Armadilhas */}
          {suggestions.armadilhas && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Armadilhas a Evitar
              </p>
              <ul className="text-xs text-slate-700 space-y-1">
                {suggestions.armadilhas.map((trap, i) => (
                  <li key={i}>• {trap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Métrica de Sucesso */}
          {suggestions.metrica_sucesso && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Métrica de Sucesso
              </p>
              <p className="text-xs text-slate-700">{suggestions.metrica_sucesso}</p>
            </div>
          )}

          {/* Recomendação Final */}
          {suggestions.recomendacao_final && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg border-2 border-purple-300">
              <p className="text-xs font-semibold text-purple-700 mb-1">🎯 Recomendação Final</p>
              <p className="text-sm text-slate-800">{suggestions.recomendacao_final}</p>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setSuggestions(null)}
            variant="outline"
            className="w-full"
          >
            Gerar Novo
          </Button>
        </div>
      )}
    </Card>
  );
}