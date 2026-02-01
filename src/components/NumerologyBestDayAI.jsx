import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, Star, Moon } from 'lucide-react';
import { toast } from 'sonner';

export default function NumerologyBestDayAI({ client }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeBestDay = async () => {
    if (!client?.numerology_number && !client?.life_path_number) {
      toast.error('Cliente precisa ter número numerológico calculado');
      return;
    }
    
    setAnalyzing(true);
    try {
      const today = new Date();
      const next30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const prompt = `Você é um mestre em Numerologia Pitagórica e Ciclos Energéticos.

PERFIL NUMEROLÓGICO COMPLETO DO CLIENTE:
- Nome: ${client.first_name}
- Nome Completo: ${client.full_name || 'Não informado'}
- Data Nascimento: ${client.birthdate || 'Não informada'}
- Número do Nome: ${client.numerology_number}
- Caminho de Vida: ${client.life_path_number || 'Não calculado'}
- Perfil: ${client.behavioral_profile}
- Estilo Decisão: ${client.decision_style}

CONHECIMENTO NUMEROLÓGICO:
- Cada dia tem uma vibração numerológica (soma dos dígitos da data)
- Números pessoais do cliente criam ressonância com certos dias
- Ciclos de 9 dias (1 = início, 5 = mudança, 9 = conclusão)
- Compatibilidade entre número pessoal e número do dia
- Dias universais (soma global da data)
- Dias pessoais (aniversário + dia atual)

DADOS ATUAIS:
- Data de hoje: ${today.toLocaleDateString('pt-BR')}
- Próximos 30 dias para análise: ${next30Days[0]} até ${next30Days[29]}

TAREFA:
Calcule os MELHORES DIAS para este cliente fechar uma compra importante nos próximos 30 dias.

Considere:
1. Ressonância do número do dia com o número pessoal
2. Ciclos numerológicos pessoais
3. Dias universais favoráveis
4. Compatibilidade energética
5. Fases da lua (nova/crescente = início, cheia = conclusão)
6. Dias de poder (11, 22) se aplicável

Retorne JSON:
{
  "best_day": "2025-01-15",
  "best_day_score": 95,
  "best_day_reasoning": "Explicação detalhada",
  "alternative_days": [
    {
      "date": "2025-01-18",
      "score": 88,
      "reason": "Segunda melhor opção"
    },
    {
      "date": "2025-01-22",
      "score": 85,
      "reason": "Terceira opção"
    }
  ],
  "next_7_days": [
    {
      "date": "2025-01-10",
      "day_number": 3,
      "compatibility": 75,
      "energy": "criatividade",
      "recommendation": "bom/medio/evitar"
    }
  ],
  "numerology_cycles": {
    "current_personal_year": 5,
    "current_personal_month": 7,
    "best_cycle_phase": "expansão"
  },
  "moon_phase_influence": "Lua crescente favorece início de novos projetos",
  "power_days": ["2025-01-11", "2025-01-22"],
  "avoid_days": ["2025-01-13"],
  "general_advice": "Conselho geral sobre timing baseado no perfil"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            best_day: { type: "string" },
            best_day_score: { type: "number" },
            best_day_reasoning: { type: "string" },
            alternative_days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            next_7_days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  day_number: { type: "number" },
                  compatibility: { type: "number" },
                  energy: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            numerology_cycles: {
              type: "object",
              properties: {
                current_personal_year: { type: "number" },
                current_personal_month: { type: "number" },
                best_cycle_phase: { type: "string" }
              }
            },
            moon_phase_influence: { type: "string" },
            power_days: {
              type: "array",
              items: { type: "string" }
            },
            avoid_days: {
              type: "array",
              items: { type: "string" }
            },
            general_advice: { type: "string" }
          }
        }
      });

      if (result?.best_day) {
        setAnalysis(result);

        // Salvar melhores dias no cliente
        const bestDays = [
          result.best_day,
          ...(result.alternative_days || []).map(d => d.date)
        ].filter(Boolean);

        await base44.entities.Client.update(client.id, {
          melhores_dias_venda: bestDays
        });
        
        toast.success('Melhores dias calculados!');
      } else {
        toast.error('Erro ao processar análise numerológica');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao calcular melhor dia');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'bom': return 'bg-green-100 text-green-700 border-green-300';
      case 'medio': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'evitar': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-300 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
          <Moon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">🌙 Melhor Dia para Comprar</h3>
          <p className="text-xs text-slate-600">Numerologia completa + ciclos energéticos</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={analyzeBestDay}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Calculando Ciclos Numerológicos...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Calcular Melhor Dia
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Melhor Dia */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" />
              <p className="text-sm font-semibold">MELHOR DIA PARA FECHAR</p>
            </div>
            <p className="text-3xl font-bold mb-1">
              {new Date(analysis.best_day).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long' 
              })}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                Score: {analysis.best_day_score}/100
              </Badge>
            </div>
          </div>

          {/* Explicação */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">✨ Por que este dia?</p>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.best_day_reasoning}</p>
          </div>

          {/* Dias Alternativos */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-700">Alternativas:</p>
            {analysis.alternative_days.map((alt, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-slate-800">
                    {new Date(alt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                  <Badge variant="outline" className="text-purple-600">
                    {alt.score}/100
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{alt.reason}</p>
              </div>
            ))}
          </div>

          {/* Próximos 7 dias */}
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">📅 Próximos 7 Dias</p>
            <div className="space-y-2">
              {analysis.next_7_days.slice(0, 7).map((day, i) => (
                <div key={i} className={`rounded-lg p-2 border ${getRecommendationColor(day.recommendation)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold">
                      {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Nº {day.day_number} • {day.compatibility}%
                    </Badge>
                  </div>
                  <p className="text-xs capitalize">Energia: {day.energy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ciclos Atuais */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">🔄 Ciclos Numerológicos</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div>
                <p className="text-slate-500">Ano Pessoal</p>
                <p className="text-lg font-bold text-purple-600">{analysis.numerology_cycles.current_personal_year}</p>
              </div>
              <div>
                <p className="text-slate-500">Mês Pessoal</p>
                <p className="text-lg font-bold text-purple-600">{analysis.numerology_cycles.current_personal_month}</p>
              </div>
              <div>
                <p className="text-slate-500">Fase</p>
                <p className="text-xs font-bold text-purple-600 capitalize mt-1">{analysis.numerology_cycles.best_cycle_phase}</p>
              </div>
            </div>
          </div>

          {/* Influência Lunar */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">Fase da Lua</p>
            </div>
            <p className="text-sm text-slate-700">{analysis.moon_phase_influence}</p>
          </div>

          {/* Dias de Poder e Evitar */}
          <div className="grid grid-cols-2 gap-2">
            {analysis.power_days?.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-700 mb-1">⚡ Dias de Poder</p>
                {analysis.power_days.map((day, i) => (
                  <p key={i} className="text-xs text-yellow-600">
                    {new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                ))}
              </div>
            )}

            {analysis.avoid_days?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Evitar</p>
                {analysis.avoid_days.map((day, i) => (
                  <p key={i} className="text-xs text-red-600">
                    {new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Conselho Geral */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 border border-pink-200">
            <p className="text-xs font-semibold text-pink-700 mb-1">💫 Conselho Geral</p>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.general_advice}</p>
          </div>

          <Button
            onClick={analyzeBestDay}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={analyzing}
          >
            Recalcular
          </Button>
        </div>
      )}
    </Card>
  );
}