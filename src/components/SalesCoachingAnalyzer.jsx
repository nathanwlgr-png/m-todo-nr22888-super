import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Loader2, Upload, MessageSquare, TrendingUp, 
  TrendingDown, AlertCircle, CheckCircle2, Target, Award,
  ThumbsUp, ThumbsDown, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesCoachingAnalyzer({ client, compact = false }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedMoments, setExpandedMoments] = useState(false);

  const analyzeConversation = async (text = transcript) => {
    if (!text.trim()) {
      toast.error('Digite ou faça upload da conversa');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await base44.functions.invoke('analyzeCoachingSession', {
        transcript: text,
        client_id: client?.id,
        conversation_type: 'chat'
      });

      setAnalysis(result.analysis);
      queryClient.invalidateQueries(['coaching-sessions']);
      toast.success('Análise completa!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      setTranscript(text);
      await analyzeConversation(text);
    };
    reader.readAsText(file);
  };

  const ratingColors = {
    excellent: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: CheckCircle2 },
    good: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: ThumbsUp },
    needs_improvement: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', icon: AlertCircle },
    critical_error: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: TrendingDown }
  };

  if (compact && !analysis) {
    return (
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="w-full border-2 border-purple-300"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Analisar Conversa
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.doc,.docx"
          className="hidden"
          onChange={handleFileUpload}
        />
      </Button>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Award className="w-5 h-5" />
          Coaching de Vendas IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <>
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Cole a transcrição da conversa ou faça upload de arquivo
              </p>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Cole aqui a conversa completa com o cliente..."
                rows={8}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => analyzeConversation()}
                disabled={analyzing || !transcript.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Analisar
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </>
        ) : (
          <div className="space-y-4">
            {/* Score Geral */}
            <div className="p-4 bg-white rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-700">PERFORMANCE GERAL</p>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">{analysis.overall_score}</p>
                  <p className="text-xs text-gray-500">/100</p>
                </div>
              </div>
              <Progress value={analysis.overall_score} className="h-2" />
              
              {analysis.overall_score >= avgPreviousScore && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>Acima da sua média ({avgPreviousScore.toFixed(0)})</span>
                </div>
              )}
              {analysis.overall_score < avgPreviousScore && (
                <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
                  <TrendingDown className="w-3 h-3" />
                  <span>Abaixo da sua média ({avgPreviousScore.toFixed(0)})</span>
                </div>
              )}
            </div>

            {/* Scores por Técnica */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-purple-700">TÉCNICAS APLICADAS</p>
              {Object.entries(analysis.technique_scores || {}).map(([key, score]) => {
                const labels = {
                  spin_selling: 'SPIN Selling',
                  numerology_adaptation: 'Numerologia',
                  cialdini_triggers: 'Persuasão (Cialdini)',
                  emotional_intelligence: 'Inteligência Emocional',
                  objection_handling: 'Controle de Objeções'
                };
                return (
                  <div key={key} className="p-2 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{labels[key]}</span>
                      <span className="text-sm font-bold text-purple-600">{score}/10</span>
                    </div>
                    <Progress value={score * 10} className="h-1" />
                  </div>
                );
              })}
            </div>

            {/* Tom de Voz */}
            {analysis.tone_analysis && (
              <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-2">🎭 ANÁLISE DE TOM</p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-500">Tom Usado:</p>
                    <p className="font-semibold text-gray-800">{analysis.tone_analysis.detected_tone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tom Ideal:</p>
                    <p className="font-semibold text-gray-800">{analysis.tone_analysis.ideal_tone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600">Match:</span>
                  <Progress value={analysis.tone_analysis.tone_match_score * 10} className="flex-1 h-1" />
                  <span className="text-xs font-bold">{analysis.tone_analysis.tone_match_score}/10</span>
                </div>
                {analysis.tone_analysis.adjustments_needed?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {analysis.tone_analysis.adjustments_needed.map((adj, idx) => (
                      <p key={idx} className="text-xs text-blue-700">• {adj}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pontos Fortes */}
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                PONTOS FORTES
              </p>
              <ul className="space-y-1">
                {analysis.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Áreas de Melhoria */}
            <div className="p-3 bg-red-50 rounded-lg border-2 border-red-300">
              <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                ÁREAS DE MELHORIA
              </p>
              <ul className="space-y-1">
                {analysis.weaknesses?.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Análise Momento a Momento */}
            {analysis.moments_analysis?.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedMoments(!expandedMoments)}
                  className="w-full p-3 bg-purple-100 rounded-lg border-2 border-purple-300 flex items-center justify-between"
                >
                  <p className="text-xs font-semibold text-purple-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    ANÁLISE MOMENTO A MOMENTO ({analysis.moments_analysis.length})
                  </p>
                  {expandedMoments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedMoments && (
                  <div className="mt-2 space-y-2">
                    {analysis.moments_analysis.map((moment, idx) => {
                      const ratingConfig = ratingColors[moment.rating] || ratingColors.good;
                      const RatingIcon = ratingConfig.icon;
                      
                      return (
                        <div key={idx} className={`p-3 ${ratingConfig.bg} rounded-lg border ${ratingConfig.border}`}>
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-600">{moment.timestamp}</span>
                            <RatingIcon className={`w-4 h-4 ${ratingConfig.text}`} />
                          </div>
                          <p className="text-sm font-semibold text-gray-800 mb-1">{moment.what_happened}</p>
                          <p className="text-xs text-gray-700 mb-2">{moment.feedback}</p>
                          {moment.better_approach && (
                            <div className="p-2 bg-white/50 rounded border border-gray-200">
                              <p className="text-xs font-semibold text-purple-700">Melhor Abordagem:</p>
                              <p className="text-xs text-gray-700 italic">"{moment.better_approach}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Oportunidades Perdidas */}
            {analysis.missed_opportunities?.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border-2 border-orange-300">
                <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4" />
                  OPORTUNIDADES PERDIDAS
                </p>
                <ul className="space-y-1">
                  {analysis.missed_opportunities.map((opp, idx) => (
                    <li key={idx} className="text-sm text-gray-700">⚠️ {opp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas Próxima Conversa */}
            <div className="p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300">
              <p className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                PRÓXIMA CONVERSA - DICAS
              </p>
              <ul className="space-y-1">
                {analysis.next_conversation_tips?.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback Detalhado */}
            <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-2">📋 FEEDBACK DETALHADO</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {analysis.ai_detailed_feedback}
              </p>
            </div>

            <Button
              onClick={() => {
                setAnalysis(null);
                setTranscript('');
                toast.info('Analise nova conversa');
              }}
              variant="outline"
              className="w-full"
            >
              Nova Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}