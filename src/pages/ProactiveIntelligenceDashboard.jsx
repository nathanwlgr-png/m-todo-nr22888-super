import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Zap, Brain, Globe, Camera, Mic, TrendingUp, AlertTriangle,
  CheckCircle, Play, RefreshCw, Target, BarChart2, Search, Upload
} from 'lucide-react';

export default function ProactiveIntelligenceDashboard() {
  const [tab, setTab] = useState('actions');
  const [loading, setLoading] = useState(false);
  const [actionPackages, setActionPackages] = useState([]);
  const [marketScan, setMarketScan] = useState(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState('IDEXX');
  const [imageUrl, setImageUrl] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [marketQuery, setMarketQuery] = useState('');
  const [executingId, setExecutingId] = useState(null);
  const [feedbackClientId, setFeedbackClientId] = useState('');
  const [feedbackResult, setFeedbackResult] = useState('positivo');

  // ===================== AÇÕES PROATIVAS =====================
  const generatePackages = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('proactiveActionsEngine', { action: 'generate_packages' });
      setActionPackages(res.data.packages || []);
      toast.success(`${res.data.total} pacotes de ação gerados!`);
    } catch (e) {
      toast.error('Erro ao gerar pacotes');
    } finally {
      setLoading(false);
    }
  };

  const executePackage = async (pkg) => {
    setExecutingId(pkg.client_id);
    try {
      await base44.functions.invoke('proactiveActionsEngine', {
        action: 'execute_package',
        client_id: pkg.client_id,
        package_data: pkg.package
      });
      toast.success(`✅ Ação executada para ${pkg.client_name}!`);
      setActionPackages(prev => prev.filter(p => p.client_id !== pkg.client_id));
    } catch (e) {
      toast.error('Erro ao executar ação');
    } finally {
      setExecutingId(null);
    }
  };

  const sendFeedback = async () => {
    if (!feedbackClientId) return toast.error('Informe o ID do cliente');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('proactiveActionsEngine', {
        action: 'submit_feedback',
        client_id: feedbackClientId,
        result: feedbackResult,
        action_taken: 'Contato WhatsApp',
        client_response: 'Feedback manual do vendedor'
      });
      toast.success('Feedback registrado! Scores atualizados.');
    } catch (e) {
      toast.error('Erro ao registrar feedback');
    } finally {
      setLoading(false);
    }
  };

  // ===================== INTELIGÊNCIA DE MERCADO =====================
  const runMarketScan = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('marketIntelligenceMonitor', { action: 'market_scan' });
      setMarketScan(res.data.scan);
      toast.success('Scan de mercado concluído!');
    } catch (e) {
      toast.error('Erro no scan');
    } finally {
      setLoading(false);
    }
  };

  const runCompetitorAnalysis = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('marketIntelligenceMonitor', {
        action: 'competitor_deep_dive',
        competitor: selectedCompetitor
      });
      setCompetitorAnalysis(res.data.analysis);
      toast.success('Análise competitiva concluída!');
    } catch (e) {
      toast.error('Erro na análise');
    } finally {
      setLoading(false);
    }
  };

  const runMarketSearch = async () => {
    if (!marketQuery) return toast.error('Digite uma consulta');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('marketIntelligenceMonitor', {
        action: 'market_search',
        query: marketQuery
      });
      toast.success('Pesquisa concluída!');
      setMarketScan(res.data.result ? { top_news: res.data.result.key_findings, sales_recommendation: res.data.result.summary, opportunities: res.data.result.sales_implications, market_sentiment: 'analisado' } : null);
    } catch (e) {
      toast.error('Erro');
    } finally {
      setLoading(false);
    }
  };

  // ===================== MULTIMODAL =====================
  const analyzeImage = async () => {
    if (!imageUrl) return toast.error('Informe a URL da imagem');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('multimodalAnalysis', {
        action: 'analyze_clinic_image',
        image_url: imageUrl
      });
      setImageAnalysis(res.data.analysis);
      toast.success('Imagem analisada!');
    } catch (e) {
      toast.error('Erro na análise de imagem');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAudio = async () => {
    if (!audioTranscript) return toast.error('Cole a transcrição ou texto da conversa');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('multimodalAnalysis', {
        action: 'analyze_audio',
        transcript_text: audioTranscript
      });
      setAudioAnalysis(res.data.analysis);
      toast.success('Análise de conversa concluída!');
    } catch (e) {
      toast.error('Erro na análise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Inteligência Proativa 360°</h1>
              <p className="text-slate-400">IA Preditiva + Mercado em Tempo Real + Visão Computacional</p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger value="actions" className="data-[state=active]:bg-indigo-600 text-white">
              <Zap className="w-4 h-4 mr-2" /> Ações Proativas
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-indigo-600 text-white">
              <Globe className="w-4 h-4 mr-2" /> Mercado & Concorrência
            </TabsTrigger>
            <TabsTrigger value="multimodal" className="data-[state=active]:bg-indigo-600 text-white">
              <Camera className="w-4 h-4 mr-2" /> Visão & Áudio
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-indigo-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Autoaprendizagem
            </TabsTrigger>
          </TabsList>

          {/* ===================== ABA AÇÕES PROATIVAS ===================== */}
          <TabsContent value="actions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Pacotes de Ação Inteligente</h2>
              <Button onClick={generatePackages} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Gerar Pacotes IA
              </Button>
            </div>

            {actionPackages.length === 0 && !loading && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-8 pb-8 text-center">
                  <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">Clique em "Gerar Pacotes IA" para analisar seus clientes</p>
                  <p className="text-slate-500 text-sm mt-1">A IA irá priorizar os clientes com maior potencial de conversão</p>
                </CardContent>
              </Card>
            )}

            {actionPackages.map((pkg) => (
              <Card key={pkg.client_id} className={`border ${pkg.package?.auto_executable ? 'border-green-500 bg-slate-800' : 'border-slate-700 bg-slate-800'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{pkg.client_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${pkg.client_status === 'quente' ? 'bg-red-600' : pkg.client_status === 'morno' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                          {pkg.client_status}
                        </Badge>
                        <Badge className="bg-indigo-600">#{pkg.numerology_number}</Badge>
                        {pkg.package?.auto_executable && (
                          <Badge className="bg-green-600 animate-pulse">⚡ Auto-exec</Badge>
                        )}
                        <span className="text-slate-400 text-xs">Conversão: {pkg.conversion_probability}% | Health: {pkg.health_score}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-400">{pkg.package?.confidence_score || 0}%</p>
                      <p className="text-xs text-slate-400">confiança</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pkg.package?.whatsapp_message && (
                    <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                      <p className="text-xs font-bold text-green-400 mb-1">📱 Mensagem WhatsApp Sugerida:</p>
                      <p className="text-green-100 text-sm whitespace-pre-wrap">{pkg.package.whatsapp_message}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-700 rounded p-2">
                      <p className="text-slate-400">Gatilho</p>
                      <p className="text-white font-medium">{pkg.package?.trigger_to_use || '-'}</p>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <p className="text-slate-400">Melhor Horário</p>
                      <p className="text-white font-medium">{pkg.package?.best_time || '-'}</p>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <p className="text-slate-400">Resultado Esperado</p>
                      <p className="text-white font-medium">{pkg.package?.expected_outcome || '-'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => executePackage(pkg)}
                    disabled={executingId === pkg.client_id}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {executingId === pkg.client_id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Executar Pacote de Ação
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ===================== ABA MERCADO ===================== */}
          <TabsContent value="market" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scan Geral */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" /> Scan de Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400 text-sm">Análise em tempo real do mercado veterinário + concorrência</p>
                  <div className="flex gap-2">
                    <input
                      value={marketQuery}
                      onChange={e => setMarketQuery(e.target.value)}
                      placeholder="Ex: mercado PCR veterinário 2026..."
                      className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    />
                    <Button onClick={runMarketSearch} disabled={loading} size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={runMarketScan} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                    Scan Completo do Mercado
                  </Button>
                </CardContent>
              </Card>

              {/* Análise Competitiva */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-400" /> Análise Competitiva
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    value={selectedCompetitor}
                    onChange={e => setSelectedCompetitor(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                  >
                    {['IDEXX', 'Mindray', 'Heska', 'Mobivet', 'Primori', 'Hemograma.net', 'Biovet', 'VETSCAN'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Button onClick={runCompetitorAnalysis} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Analisar {selectedCompetitor}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Resultado Scan */}
            {marketScan && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">📊 Resultado do Scan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Sentimento do mercado:</span>
                    <Badge className="bg-indigo-600">{marketScan.market_sentiment}</Badge>
                  </div>
                  {marketScan.top_news?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs font-bold mb-2 uppercase">📰 Notícias / Achados</p>
                      <ul className="space-y-1">
                        {marketScan.top_news.map((n, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2"><span className="text-indigo-400">•</span>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {marketScan.opportunities?.length > 0 && (
                    <div>
                      <p className="text-green-400 text-xs font-bold mb-2 uppercase">✅ Oportunidades</p>
                      <ul className="space-y-1">
                        {marketScan.opportunities.map((o, i) => (
                          <li key={i} className="text-green-300 text-sm flex gap-2"><span>→</span>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {marketScan.sales_recommendation && (
                    <div className="bg-indigo-900/40 border border-indigo-700 rounded p-3">
                      <p className="text-indigo-400 text-xs font-bold mb-1">💡 RECOMENDAÇÃO</p>
                      <p className="text-white text-sm">{marketScan.sales_recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resultado Análise Competitiva */}
            {competitorAnalysis && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">⚔️ {competitorAnalysis.competitor_name} - Análise Completa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-red-400 text-xs font-bold mb-2">❌ Pontos Fracos Deles</p>
                      <ul className="space-y-1">
                        {competitorAnalysis.weaknesses?.map((w, i) => (
                          <li key={i} className="text-slate-300 text-sm">• {w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-green-400 text-xs font-bold mb-2">✅ Nossas Vantagens</p>
                      <ul className="space-y-1">
                        {competitorAnalysis.our_advantages?.map((a, i) => (
                          <li key={i} className="text-green-300 text-sm">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {competitorAnalysis.objection_scripts?.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-xs font-bold mb-2">🗣️ Scripts de Objeção</p>
                      <div className="space-y-2">
                        {competitorAnalysis.objection_scripts.map((s, i) => (
                          <div key={i} className="bg-slate-700 rounded p-3">
                            <p className="text-red-400 text-xs">"{s.objection}"</p>
                            <p className="text-green-300 text-sm mt-1">→ {s.response}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== ABA MULTIMODAL ===================== */}
          <TabsContent value="multimodal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Análise de Imagem */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-400" /> Análise de Imagem da Clínica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400 text-sm">Cole a URL de uma foto da clínica para análise de equipamentos e potencial</p>
                  <input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://... URL da imagem"
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                  />
                  <Button onClick={analyzeImage} disabled={loading || !imageUrl} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                    Analisar Imagem
                  </Button>
                </CardContent>
              </Card>

              {/* Análise de Áudio/Conversa */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-green-400" /> Análise de Conversa / Áudio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400 text-sm">Cole a transcrição da conversa/chamada para análise de sentimento e insights</p>
                  <textarea
                    value={audioTranscript}
                    onChange={e => setAudioTranscript(e.target.value)}
                    placeholder="Cole aqui a transcrição da conversa..."
                    rows={4}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm resize-none"
                  />
                  <Button onClick={analyzeAudio} disabled={loading || !audioTranscript} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    Analisar Conversa
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Resultado imagem */}
            {imageAnalysis && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">🔬 Análise Visual - Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Porte</p>
                      <p className="text-white font-bold">{imageAnalysis.clinic_size || '-'}</p>
                    </div>
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Score Infraestrutura</p>
                      <p className="text-indigo-400 font-bold text-2xl">{imageAnalysis.infrastructure_score || 0}</p>
                    </div>
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Potencial Compra</p>
                      <p className="text-green-400 font-bold text-2xl">{imageAnalysis.purchase_potential || 0}%</p>
                    </div>
                  </div>
                  {imageAnalysis.equipment_suggestion && (
                    <div className="bg-indigo-900/40 border border-indigo-700 rounded p-3">
                      <p className="text-indigo-400 text-xs font-bold mb-1">💡 EQUIPAMENTO SUGERIDO</p>
                      <p className="text-white font-semibold">{imageAnalysis.equipment_suggestion}</p>
                      <p className="text-slate-400 text-sm mt-1">{imageAnalysis.equipment_suggestion_reason}</p>
                    </div>
                  )}
                  {imageAnalysis.approach_recommendation && (
                    <div className="bg-green-900/30 border border-green-700 rounded p-3">
                      <p className="text-green-400 text-xs font-bold mb-1">🎯 ABORDAGEM RECOMENDADA</p>
                      <p className="text-green-100 text-sm">{imageAnalysis.approach_recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resultado áudio */}
            {audioAnalysis && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">🎙️ Análise de Conversa - Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Sentimento</p>
                      <p className={`font-bold ${audioAnalysis.sentiment === 'positive' ? 'text-green-400' : audioAnalysis.sentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {audioAnalysis.sentiment}
                      </p>
                    </div>
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Emoção</p>
                      <p className="text-white font-bold">{audioAnalysis.emotion_detected || '-'}</p>
                    </div>
                    <div className="bg-slate-700 rounded p-3 text-center">
                      <p className="text-slate-400 text-xs">Engajamento</p>
                      <p className="text-indigo-400 font-bold text-2xl">{audioAnalysis.engagement_score || 0}%</p>
                    </div>
                  </div>
                  {audioAnalysis.summary && (
                    <div className="bg-slate-700 rounded p-3">
                      <p className="text-slate-400 text-xs font-bold mb-1">📋 RESUMO</p>
                      <p className="text-white text-sm">{audioAnalysis.summary}</p>
                    </div>
                  )}
                  {audioAnalysis.objections_found?.length > 0 && (
                    <div>
                      <p className="text-red-400 text-xs font-bold mb-1">⚠️ OBJEÇÕES DETECTADAS</p>
                      {audioAnalysis.objections_found.map((o, i) => <Badge key={i} variant="outline" className="mr-1 border-red-500 text-red-400">{o}</Badge>)}
                    </div>
                  )}
                  {audioAnalysis.buying_signals?.length > 0 && (
                    <div>
                      <p className="text-green-400 text-xs font-bold mb-1">✅ SINAIS DE COMPRA</p>
                      {audioAnalysis.buying_signals.map((s, i) => <Badge key={i} className="mr-1 bg-green-700">{s}</Badge>)}
                    </div>
                  )}
                  {audioAnalysis.next_action && (
                    <div className="bg-indigo-900/40 border border-indigo-700 rounded p-3">
                      <p className="text-indigo-400 text-xs font-bold mb-1">🎯 PRÓXIMA AÇÃO</p>
                      <p className="text-white text-sm">{audioAnalysis.next_action}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== ABA FEEDBACK / AUTOAPRENDIZAGEM ===================== */}
          <TabsContent value="feedback" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-yellow-400" /> Loop de Autoaprendizagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Registre o resultado de uma ação para o sistema aprender e ajustar os scores automaticamente</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">ID do Cliente</label>
                    <input
                      value={feedbackClientId}
                      onChange={e => setFeedbackClientId(e.target.value)}
                      placeholder="ID do cliente"
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Resultado da Ação</label>
                    <select
                      value={feedbackResult}
                      onChange={e => setFeedbackResult(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="positivo">✅ Positivo - Cliente respondeu bem</option>
                      <option value="neutro">😐 Neutro - Sem resposta clara</option>
                      <option value="negativo">❌ Negativo - Cliente rejeitou</option>
                    </select>
                  </div>
                  <Button onClick={sendFeedback} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Registrar Feedback e Atualizar Scores
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" /> Como Funciona
                </h3>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>🔹 Cada ação executada é monitorada pelo sistema</p>
                  <p>🔹 Você registra o resultado real (positivo/neutro/negativo)</p>
                  <p>🔹 A IA ajusta automaticamente o <strong className="text-white">health_score</strong> e <strong className="text-white">conversion_probability</strong></p>
                  <p>🔹 As próximas recomendações ficam mais precisas com o tempo</p>
                  <p>🔹 O sistema aprende quais gatilhos funcionam para cada perfil numerológico</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}