import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, StopCircle, Loader2, Volume2, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SpeechTrainingModule() {
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await analyzeVoice(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.success('Gravando... Fale naturalmente por 20-30 segundos');

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const analyzeVoice = async (audioBlob) => {
    setAnalyzing(true);
    try {
      // Upload do áudio
      const audioFile = new File([audioBlob], 'voice_sample.wav', { type: 'audio/wav' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      // Análise profunda com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um COACH EXPERT em oratória, dicção e comunicação persuasiva para VENDAS.

Analise este áudio e forneça avaliação COMPLETA:

REFERÊNCIAS DE EXCELÊNCIA:
- Tony Robbins: energia, ritmo, pausas estratégicas
- Leandro Karnal: clareza, vocabulário, tom professoral
- Flávio Augusto: autenticidade, histórias, conexão emocional
- Barack Obama: pausas, ênfase, variação tonal
- Camila Farani: assertividade, firmeza, confiança

AVALIE:
1. Clareza: Palavras compreensíveis? Dicção boa?
2. Tom: Qual emoção transmite? (confiança, insegurança, empolgação, monotonia)
3. Ritmo: Muito rápido? Muito lento? Pausas?
4. Energia: Alto, médio, baixo?
5. Entonação: Variação ou monotonia?
6. Problemas: Vícios de linguagem, gagueira, respiração
7. Comparação: Qual referência você se parece mais?
8. Impacto em vendas: Esse tom gera confiança? Fecha vendas?

RETORNE análise detalhada com:
- Score geral (0-100)
- Pontos fortes
- Pontos fracos críticos
- 5 exercícios específicos para melhorar
- O que seu tom CAUSA no cliente (exemplo: "causa insegurança" ou "causa empolgação")
- O que DEVERIA causar para vender mais
- Comparação com referências (% de similaridade)`,
        file_urls: [file_url],
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            clarity_score: { type: "number" },
            tone_analysis: {
              type: "object",
              properties: {
                current_emotion: { type: "string" },
                causes_in_client: { type: "string" },
                should_cause: { type: "string" },
                confidence_level: { type: "number" }
              }
            },
            rhythm_analysis: {
              type: "object",
              properties: {
                speed: { type: "string" },
                pauses_quality: { type: "string" },
                recommendation: { type: "string" }
              }
            },
            energy_level: { type: "number" },
            intonation_variety: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            critical_weaknesses: { type: "array", items: { type: "string" } },
            speech_problems: { type: "array", items: { type: "string" } },
            reference_comparison: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  similarity: { type: "number" },
                  what_to_learn: { type: "string" }
                }
              }
            },
            sales_impact: {
              type: "object",
              properties: {
                closes_sales: { type: "boolean" },
                generates_trust: { type: "boolean" },
                main_issue: { type: "string" },
                improvement_potential: { type: "string" }
              }
            },
            specific_exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exercise: { type: "string" },
                  why: { type: "string" },
                  how: { type: "string" },
                  duration: { type: "string" }
                }
              }
            },
            neuroscience_insights: { type: "string" },
            body_language_correlation: { type: "string" }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise completa!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar voz');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Mic className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">🎤 Treinamento de Oratória IA</h3>
          <p className="text-xs text-slate-700">Análise profunda de dicção e persuasão</p>
        </div>
      </div>

      {!analysis ? (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-sm text-slate-800 font-medium mb-2">📝 Como funciona:</p>
            <ol className="text-xs text-slate-600 space-y-1">
              <li>1. Grave 20-30 segundos falando naturalmente</li>
              <li>2. IA compara com Tony Robbins, Leandro Karnal, Obama</li>
              <li>3. Receba análise completa + exercícios personalizados</li>
              <li>4. Descubra o que seu tom causa no cliente</li>
            </ol>
          </div>

          {!recording && !analyzing && (
            <Button
              onClick={startRecording}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Mic className="w-5 h-5 mr-2" />
              Iniciar Gravação
            </Button>
          )}

          {recording && (
            <Button
              onClick={stopRecording}
              className="w-full h-14 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-pulse"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Parar Gravação
            </Button>
          )}

          {analyzing && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-700">Analisando sua voz com IA...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Score Geral */}
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-800">Score de Oratória</span>
              <Badge className={
                analysis.overall_score >= 80 ? 'bg-green-500' :
                analysis.overall_score >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }>
                {analysis.overall_score}/100
              </Badge>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
                style={{ width: `${analysis.overall_score}%` }}
              />
            </div>
          </div>

          {/* Tom e Impacto */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">🎯 Impacto do seu Tom</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Emoção atual: {analysis.tone_analysis?.current_emotion}</p>
                  <p className="text-blue-700">Causa no cliente: {analysis.tone_analysis?.causes_in_client}</p>
                  <p className="text-blue-600">❌ Deveria causar: {analysis.tone_analysis?.should_cause}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparação com Referências */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-purple-900 text-sm mb-2">🏆 Comparação com Experts</h4>
            {analysis.reference_comparison?.slice(0, 3).map((ref, i) => (
              <div key={i} className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-800">{ref.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${ref.similarity}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-purple-900">{ref.similarity}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pontos Fortes */}
          {analysis.strengths?.length > 0 && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-900 text-sm mb-2">✅ Pontos Fortes</h4>
              {analysis.strengths.map((s, i) => (
                <p key={i} className="text-xs text-green-700 mb-1">• {s}</p>
              ))}
            </div>
          )}

          {/* Pontos Fracos CRÍTICOS */}
          {analysis.critical_weaknesses?.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300">
              <h4 className="font-semibold text-red-900 text-sm mb-2">⚠️ CRÍTICO - Melhorar AGORA</h4>
              {analysis.critical_weaknesses.map((w, i) => (
                <p key={i} className="text-xs text-red-700 mb-1 font-medium">❌ {w}</p>
              ))}
            </div>
          )}

          {/* Impacto em Vendas */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
            <h4 className="font-semibold text-orange-900 text-sm mb-2">💰 Impacto em Vendas</h4>
            <div className="space-y-1 text-xs">
              <p className="text-orange-800">
                Fecha vendas? {analysis.sales_impact?.closes_sales ? '✅ Sim' : '❌ Não'}
              </p>
              <p className="text-orange-800">
                Gera confiança? {analysis.sales_impact?.generates_trust ? '✅ Sim' : '❌ Não'}
              </p>
              <p className="text-orange-700 font-medium mt-2">
                Problema principal: {analysis.sales_impact?.main_issue}
              </p>
            </div>
          </div>

          {/* Exercícios Específicos */}
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-2">🎯 Exercícios Personalizados</h4>
            {analysis.specific_exercises?.map((ex, i) => (
              <div key={i} className="p-3 bg-white rounded-lg mb-2 border border-slate-200">
                <p className="font-semibold text-slate-800 text-sm mb-1">{i + 1}. {ex.exercise}</p>
                <p className="text-xs text-slate-600 mb-1">Por quê: {ex.why}</p>
                <p className="text-xs text-slate-700 mb-1">Como: {ex.how}</p>
                <Badge variant="outline" className="text-xs">{ex.duration}</Badge>
              </div>
            ))}
          </div>

          {/* Neurociência */}
          {analysis.neuroscience_insights && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 text-sm mb-2">🧠 Neurociência da Comunicação</h4>
              <p className="text-xs text-indigo-800">{analysis.neuroscience_insights}</p>
            </div>
          )}

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