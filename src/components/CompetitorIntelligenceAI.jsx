import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Zap } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function CompetitorIntelligenceAI({ client }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCompetitors = async () => {
    setLoading(true);
    try {
      const prompt = `Analise os CONCORRENTES DIRETOS desta clínica/laboratório:

CLIENTE:
- Nome: ${client.clinic_name}
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Serviços: ${client.lab_needs?.join(', ') || 'Não informados'}
- Website: ${client.website}

TAREFA:
Identifique 3-5 concorrentes diretos SIMILARES em:
1. Tamanho/capacidade
2. Serviços oferecidos
3. Localização (mesma cidade/região)

Para CADA concorrente, analise:
- Serviços oferecidos
- Preços/modelos comerciais (se disponível)
- Diferenciais competitivos
- Pontos fracos identificáveis

Forneça:
- Posicionamento competitivo do cliente
- Gaps de mercado não explorados
- Estratégias para se diferenciar
- Vantagens únicas a oferecer`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              competitive_position: { type: "string" },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    services: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    pricing_model: { type: "string" }
                  }
                }
              },
              market_gaps: { type: "array", items: { type: "string" } },
              differentiation_strategy: { type: "string" },
              competitive_advantages: { type: "array", items: { type: "string" } }
            }
          }
        });
      }, 'normal');

      setAnalysis(result);
      toast.success('Análise de concorrentes concluída!');
    } catch (error) {
      toast.error('Erro ao analisar concorrentes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">🎯 Inteligência Competitiva</h3>
          <p className="text-xs text-slate-600">Análise de concorrentes diretos</p>
        </div>
      </div>

      {!analysis ? (
        <Button
          onClick={analyzeCompetitors}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            'Analisar Concorrentes'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-1">Posição Competitiva</p>
            <p className="text-sm text-slate-700">{analysis.competitive_position}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">👥 Concorrentes Identificados</p>
            {analysis.competitors?.map((comp, idx) => (
              <Card key={idx} className="p-2 bg-slate-50 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-800">{comp.name}</h4>
                  <Badge variant="outline" className="text-xs">{comp.pricing_model}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-1"><strong>Serviços:</strong> {comp.services}</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="bg-green-50 p-1 rounded">
                    <p className="font-semibold text-green-700">✓ Forças</p>
                    {comp.strengths?.map((s, i) => (
                      <p key={i} className="text-slate-600">• {s}</p>
                    ))}
                  </div>
                  <div className="bg-red-50 p-1 rounded">
                    <p className="font-semibold text-red-700">✗ Fraquezas</p>
                    {comp.weaknesses?.map((w, i) => (
                      <p key={i} className="text-slate-600">• {w}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {analysis.market_gaps && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-2">🔍 Gaps de Mercado</p>
              <div className="space-y-1">
                {analysis.market_gaps.map((gap, i) => (
                  <p key={i} className="text-xs text-slate-700">• {gap}</p>
                ))}
              </div>
            </div>
          )}

          {analysis.competitive_advantages && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-2">⭐ Vantagens Competitivas</p>
              <div className="space-y-1">
                {analysis.competitive_advantages.map((adv, i) => (
                  <p key={i} className="text-xs text-slate-700">• {adv}</p>
                ))}
              </div>
            </div>
          )}

          {analysis.differentiation_strategy && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">🚀 Estratégia de Diferenciação</p>
              <p className="text-sm text-slate-700">{analysis.differentiation_strategy}</p>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setAnalysis(null)}
            variant="outline"
          >
            Atualizar
          </Button>
        </div>
      )}
    </Card>
  );
}