import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartScheduler({ client, visits }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista em agendamento inteligente. Sugira OS MELHORES HORÁRIOS para visita.

**CLIENTE:** ${client.first_name}
**CIDADE:** ${client.city}
**PERFIL:** ${client.behavioral_profile}
**ÚLTIMA VISITA:** ${client.last_visit_date || 'Nenhuma'}
**TOTAL VISITAS:** ${client.total_visits_count || 0}

**PREFERÊNCIAS DE COMUNICAÇÃO:**
${JSON.stringify(client.communication_preferences || {}, null, 2)}

**HISTÓRICO DE VISITAS:**
${JSON.stringify(visits.slice(0, 5).map(v => ({
  date: v.scheduled_date,
  status: v.status
})), null, 2)}

**TAREFA:**
Sugira 3 melhores horários para visita considerando:
1. Perfil comportamental do cliente (numerologia)
2. Histórico de visitas anteriores
3. Preferências de comunicação
4. Dia da semana ideal
5. Horário ideal do dia
6. Duração recomendada

Para cada sugestão, explique:
- Por que este horário é ideal
- Probabilidade de aceite
- Preparação necessária`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  time: { type: "string" },
                  duration: { type: "number" },
                  reasoning: { type: "string" },
                  acceptance_probability: { type: "number" },
                  preparation: { type: "string" }
                }
              }
            },
            optimal_days: { type: "array", items: { type: "string" } },
            avoid_times: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(result);
      toast.success('Sugestões geradas!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar sugestões');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Agendamento Inteligente IA</h3>
          <p className="text-xs text-slate-600">Melhores horários baseados em dados</p>
        </div>
      </div>

      {!suggestions && (
        <Button
          onClick={generateSchedule}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Sugerir Melhores Horários
            </>
          )}
        </Button>
      )}

      {suggestions && (
        <div className="space-y-3">
          {/* Dicas Gerais */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white rounded border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">📅 Dias Ideais</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.optimal_days?.map((day, idx) => (
                  <Badge key={idx} className="bg-purple-100 text-purple-700 text-xs">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-2 bg-white rounded border border-red-200">
              <p className="text-xs text-red-600 mb-1">⛔ Evitar</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.avoid_times?.map((time, idx) => (
                  <Badge key={idx} className="bg-red-100 text-red-700 text-xs">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Sugestões de Horários */}
          <div className="space-y-2">
            {suggestions.suggestions?.map((suggestion, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border-2 border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{suggestion.date}</p>
                      <p className="text-sm text-slate-600">{suggestion.time}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {suggestion.acceptance_probability}% Aceite
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-700">{suggestion.duration} minutos</span>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-2">
                  <p className="text-xs font-semibold text-purple-700 mb-1">💡 Por que este horário?</p>
                  <p className="text-sm text-slate-700">{suggestion.reasoning}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📋 Preparação</p>
                  <p className="text-sm text-slate-700">{suggestion.preparation}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={generateSchedule}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Gerar Novas Sugestões
          </Button>
        </div>
      )}
    </Card>
  );
}