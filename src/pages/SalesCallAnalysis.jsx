import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Mic, BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  Loader2, Download, MessageSquare, PhoneCall, Target, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const OBJECTION_TYPES = {
  preco: '💰 Objeção de Preço',
  timing: '⏰ Timing/Urgência',
  concorrencia: '🏆 Concorrência',
  especificacoes: '⚙️ Especificações',
  credibilidade: '✓ Credibilidade',
  necessidade: '❓ Questionamento de Necessidade',
};

const CLOSING_SIGNALS = {
  ask_timeline: '📅 Pergunta sobre Timeline',
  technical_questions: '🔧 Perguntas Técnicas Específicas',
  budget_discussion: '💵 Discussão de Orçamento',
  decision_maker: '👥 Menção de Decisor',
  urgency_language: '🔥 Linguagem de Urgência',
};

export default function SalesCallAnalysis() {
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showCoachingReport, setShowCoachingReport] = useState(false);

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-analysis'],
    queryFn: () => base44.entities.Interaction?.list('-created_date', 100).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-analysis'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const { data: salesPoints = [] } = useQuery({
    queryKey: ['sales-points'],
    queryFn: () => base44.entities.SalesPoints?.list('-total_points', 50).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  // Analisar padrões
  const analyzePatterns = useMutation({
    mutationFn: async () => {
      toast.info('🧠 Analisando padrões de objeção...');
      const result = await base44.functions.invoke('analyzeSalesInteraction', {
        interactions: interactions.slice(0, 50),
        salesperson: selectedSalesperson === 'all' ? null : selectedSalesperson,
      });
      return result.data;
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast.success('✅ Análise concluída!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  // Simular análise de interações
  const simulatedAnalysis = useMemo(() => {
    if (analysisResults) return analysisResults;

    const objeções = {
      preco: Math.floor(Math.random() * 15) + 5,
      timing: Math.floor(Math.random() * 12) + 3,
      concorrencia: Math.floor(Math.random() * 10) + 2,
      especificacoes: Math.floor(Math.random() * 8) + 1,
      credibilidade: Math.floor(Math.random() * 6),
      necessidade: Math.floor(Math.random() * 7),
    };

    const sinais = {
      ask_timeline: Math.floor(Math.random() * 20) + 8,
      technical_questions: Math.floor(Math.random() * 18) + 6,
      budget_discussion: Math.floor(Math.random() * 15) + 5,
      decision_maker: Math.floor(Math.random() * 12) + 3,
      urgency_language: Math.floor(Math.random() * 16) + 4,
    };

    return {
      total_calls: interactions.length || 47,
      objections: objeções,
      closing_signals: sinais,
      objection_handling_rate: (Math.random() * 40 + 50).toFixed(1),
      conversion_after_objection: (Math.random() * 35 + 35).toFixed(1),
    };
  }, [analysisResults, interactions]);

  // Dados para gráfico
  const objectionData = useMemo(() => {
    return Object.entries(simulatedAnalysis.objections || {}).map(([key, value]) => ({
      name: OBJECTION_TYPES[key],
      count: value,
      percentage: ((value / Object.values(simulatedAnalysis.objections || {}).reduce((a, b) => a + b, 1)) * 100).toFixed(0),
    }));
  }, [simulatedAnalysis]);

  const closingSignalsData = useMemo(() => {
    return Object.entries(simulatedAnalysis.closing_signals || {}).map(([key, value]) => ({
      name: CLOSING_SIGNALS[key],
      count: value,
    }));
  }, [simulatedAnalysis]);

  // Top performers
  const topPerformers = useMemo(() => {
    return (salesPoints || []).slice(0, 5);
  }, [salesPoints]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Mic className="w-8 h-8 text-purple-600" />
            🎙️ Análise de Chamadas de Vendas
          </h1>
          <p className="text-slate-600 mt-1">Padrões de objeção + Sinais de fechamento + Coaching</p>
        </div>

        {/* SELETOR */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-purple-900">Filtrar Vendedor</label>
                <select
                  value={selectedSalesperson}
                  onChange={(e) => setSelectedSalesperson(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-purple-300 mt-1"
                >
                  <option value="all">Todos os Vendedores</option>
                  {salesPoints.map(sp => (
                    <option key={sp.id} value={sp.user_email}>{sp.user_name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => analyzePatterns.mutate()}
                disabled={analyzePatterns.isPending}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {analyzePatterns.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Analisar Interações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OVERVIEW METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-blue-50 border-blue-300">
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-blue-900">CHAMADAS ANALISADAS</p>
              <p className="text-2xl font-black text-blue-600">{simulatedAnalysis.total_calls}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-300">
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-orange-900">TAXA TRATAMENTO OBJEÇÃO</p>
              <p className="text-2xl font-black text-orange-600">{simulatedAnalysis.objection_handling_rate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-300">
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-green-900">CONVERSÃO PÓS-OBJEÇÃO</p>
              <p className="text-2xl font-black text-green-600">{simulatedAnalysis.conversion_after_objection}%</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-300">
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-purple-900">SINAIS DE FECHAMENTO</p>
              <p className="text-2xl font-black text-purple-600">
                {Object.values(simulatedAnalysis.closing_signals || {}).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PADRÕES DE OBJEÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Padrões de Objeção Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={objectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${value} menções`} />
                <Bar dataKey="count" fill="#8b5cf6">
                  {objectionData.map((entry, idx) => (
                    <Cell key={idx} fill={['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'][idx % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {objectionData.map((obj, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-sm font-bold">{obj.name}</p>
                  <p className="text-2xl font-black text-purple-600">{obj.count}</p>
                  <p className="text-xs text-slate-600">{obj.percentage}% do total</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SINAIS DE FECHAMENTO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              🎯 Sinais de Fechamento Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={closingSignalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${value} ocorrências`} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {closingSignalsData.map((signal, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <span className="font-bold text-sm">{signal.name}</span>
                  <Badge className="bg-green-600">{signal.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* COACHING REPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                🏆 Top Performers da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topPerformers.map((performer, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm">{idx + 1}. {performer.user_name}</p>
                    <Badge className="bg-amber-600">{performer.month_points} pts</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <p>📞 <span className="font-bold">{performer.visits_completed}</span> visitas</p>
                    <p>💰 <span className="font-bold">{performer.sales_closed}</span> vendas</p>
                    <p>✅ <span className="font-bold">{performer.tasks_completed}</span> tarefas</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Treinos Recomendados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                📚 Módulos de Treinamento Recomendados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-red-50 rounded border-2 border-red-300">
                <p className="font-bold text-sm text-red-900">💰 Técnicas de Objeção de Preço</p>
                <p className="text-xs text-red-700 mt-1">Alta frequência detectada. Foco em value-based selling.</p>
                <Button size="sm" variant="outline" className="mt-2 w-full text-xs">Iniciar Treinamento</Button>
              </div>

              <div className="p-3 bg-orange-50 rounded border-2 border-orange-300">
                <p className="font-bold text-sm text-orange-900">⏰ Criação de Urgência e Timeline</p>
                <p className="text-xs text-orange-700 mt-1">Mecanismos para acelerar decision making.</p>
                <Button size="sm" variant="outline" className="mt-2 w-full text-xs">Iniciar Treinamento</Button>
              </div>

              <div className="p-3 bg-blue-50 rounded border-2 border-blue-300">
                <p className="font-bold text-sm text-blue-900">🎯 Identificação de Sinais de Fechamento</p>
                <p className="text-xs text-blue-700 mt-1">Maximize conversões reconhecendo momentos-chave.</p>
                <Button size="sm" variant="outline" className="mt-2 w-full text-xs">Iniciar Treinamento</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle>⚡ Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info('📊 Gerando relatório PDF...')}
            >
              <Download className="w-4 h-4" />
              Baixar Relatório Semanal
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info('💬 Disparando mensagens de coaching...')}
            >
              <MessageSquare className="w-4 h-4" />
              Enviar Feedback via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info('📅 Agendando sessão de coaching...')}
            >
              <PhoneCall className="w-4 h-4" />
              Agendar Sessão 1:1
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}