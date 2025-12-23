import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Loader2, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function BodyLanguageAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeBodyLanguage = async (videoFile) => {
    setAnalyzing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um EXPERT em linguagem corporal para VENDAS e negociação.

Analise este vídeo e avalie:

1. POSTURA: Confiante, curvado, rígido, relaxado?
2. GESTOS: Abertos (confiança) ou fechados (defensivo)?
3. CONTATO VISUAL: Direto, evasivo, intimidador?
4. EXPRESSÕES FACIAIS: Autênticas ou forçadas?
5. ESPELHAMENTO: Capacidade de se adaptar ao cliente?
6. PODER: Ocupa espaço ou se encolhe?
7. MICROEXPRESSÕES: Sinais de nervosismo, insegurança?

TÉCNICAS DE VENDAS - LINGUAGEM CORPORAL:
- Abertura: Braços abertos = receptividade
- Inclinação: Lean in = interesse genuíno
- Espelhamento: Copiar sutilmente = rapport
- Pausas: Silêncio estratégico = autoridade
- Triangulação: Posicionamento ideal na mesa

CORRELACIONE com técnicas persuasivas:
- Ancoragem: Gestos específicos para conceitos
- Reciprocidade: Linguagem corporal acolhedora
- Autoridade: Postura e movimentos decididos

RETORNE análise completa:`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            overall_confidence_score: { type: "number" },
            posture_analysis: {
              type: "object",
              properties: {
                description: { type: "string" },
                score: { type: "number" },
                impact_on_sales: { type: "string" }
              }
            },
            gestures_analysis: {
              type: "object",
              properties: {
                open_vs_closed: { type: "string" },
                frequency: { type: "string" },
                coordination_with_speech: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            eye_contact: {
              type: "object",
              properties: {
                quality: { type: "string" },
                frequency: { type: "string" },
                impact: { type: "string" }
              }
            },
            facial_expressions: {
              type: "object",
              properties: {
                authenticity: { type: "string" },
                smile_quality: { type: "string" },
                micro_expressions_detected: { type: "array", items: { type: "string" } }
              }
            },
            mirroring_ability: {
              type: "object",
              properties: {
                score: { type: "number" },
                natural_or_forced: { type: "string" },
                improvement_tips: { type: "array", items: { type: "string" } }
              }
            },
            power_dynamics: {
              type: "object",
              properties: {
                space_occupation: { type: "string" },
                dominance_level: { type: "string" },
                recommendation: { type: "string" }
              }
            },
            sales_techniques_correlation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  technique: { type: "string" },
                  current_execution: { type: "string" },
                  how_to_improve: { type: "string" }
                }
              }
            },
            critical_mistakes: { type: "array", items: { type: "string" } },
            top_strengths: { type: "array", items: { type: "string" } },
            neuroscience_insights: { type: "string" },
            practice_exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exercise: { type: "string" },
                  why: { type: "string" },
                  duration: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise de linguagem corporal completa!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar vídeo');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">📹 Análise de Linguagem Corporal</h3>
          <p className="text-xs text-slate-700">Técnicas de vendas + neurociência</p>
        </div>
      </div>

      {!analysis ? (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
            <p className="text-sm text-slate-800 font-medium mb-2">📝 Instruções:</p>
            <ol className="text-xs text-slate-600 space-y-1">
              <li>1. Grave vídeo de 30-60s simulando venda</li>
              <li>2. IA analisa postura, gestos, olhar, expressões</li>
              <li>3. Correlaciona com técnicas persuasivas</li>
              <li>4. Receba feedback + exercícios práticos</li>
            </ol>
          </div>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) analyzeBodyLanguage(file);
            }}
            className="hidden"
            id="video-upload"
          />

          <Button
            onClick={() => document.getElementById('video-upload')?.click()}
            disabled={analyzing}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando vídeo...
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Upload de Vídeo
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Score Geral */}
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">Confiança Corporal</span>
              <Badge className={
                analysis.overall_confidence_score >= 80 ? 'bg-green-500' :
                analysis.overall_confidence_score >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }>
                {analysis.overall_confidence_score}/100
              </Badge>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                style={{ width: `${analysis.overall_confidence_score}%` }}
              />
            </div>
          </div>

          {/* Erros Críticos */}
          {analysis.critical_mistakes?.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <h4 className="font-semibold text-red-900 text-sm">CRÍTICO - Corrigir AGORA</h4>
              </div>
              {analysis.critical_mistakes.map((m, i) => (
                <p key={i} className="text-xs text-red-700 mb-1 font-medium">❌ {m}</p>
              ))}
            </div>
          )}

          {/* Técnicas de Vendas */}
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-2">🎯 Técnicas de Vendas</h4>
            {analysis.sales_techniques_correlation?.map((tech, i) => (
              <div key={i} className="p-3 bg-white rounded-lg mb-2 border border-slate-200">
                <p className="font-semibold text-slate-800 text-sm">{tech.technique}</p>
                <p className="text-xs text-slate-600 mb-1">Execução atual: {tech.current_execution}</p>
                <p className="text-xs text-blue-700">💡 {tech.how_to_improve}</p>
              </div>
            ))}
          </div>

          {/* Exercícios */}
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-2">🏋️ Exercícios Práticos</h4>
            {analysis.practice_exercises?.map((ex, i) => (
              <div key={i} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-2">
                <p className="font-semibold text-green-900 text-sm mb-1">{ex.exercise}</p>
                <p className="text-xs text-green-700 mb-1">{ex.why}</p>
                <Badge variant="outline" className="text-xs">{ex.duration}</Badge>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setAnalysis(null)}
            variant="outline"
            className="w-full"
          >
            Nova Análise
          </Button>
        </div>
      )}
    </Card>
  );
}