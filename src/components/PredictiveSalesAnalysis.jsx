import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export default function PredictiveSalesAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('predictiveSalesAnalysis', {});
      setData(response.data);
    } catch (error) {
      toast.error('Erro ao gerar análise');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const { historical, pipeline, forecast } = data;
  const colors = ['#4f46e5', '#8b5cf6', '#ec4899'];

  // Dados para gráfico de tendência
  const trendData = [
    { month: 'Últimos 3m', revenue: (historical.last3MonthsRevenue / 3).toFixed(0) },
    { month: 'Mês passado', revenue: historical.lastMonthRevenue.toFixed(0) },
    { month: 'Este mês', revenue: historical.thisMonthRevenue.toFixed(0) },
    { month: 'Previsão +30d', revenue: forecast.forecast30Days ? forecast.forecast30Days.toFixed(0) : 0 }
  ];

  // Dados para pipeline
  const pipelineData = [
    { name: '🔥 Quentes', value: pipeline.hotLeads, fill: '#ef4444' },
    { name: '🌡️ Mornos', value: pipeline.warmLeads, fill: '#f59e0b' },
    { name: '❄️ Frios', value: pipeline.coldLeads, fill: '#3b82f6' }
  ];

  const goalProbability = forecast.forecast30Days && forecast.goalAttainmentProbability ? forecast.goalAttainmentProbability : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Análise Preditiva de Vendas
              </h2>
              <p className="text-indigo-100 mt-1">Previsões baseadas em histórico e pipeline atual</p>
            </div>
            <Button
              onClick={loadAnalysis}
              disabled={loading}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receita Este Mês */}
        <Card className="bg-white border-2 border-indigo-200 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 font-semibold mb-2">Receita Este Mês</p>
            <p className="text-3xl font-black text-indigo-600">R$ {(historical.thisMonthRevenue / 1000).toFixed(1)}K</p>
            <p className={`text-xs mt-2 font-bold ${historical.growthPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {historical.growthPercentage > 0 ? '📈' : '📉'} {historical.growthPercentage}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Previsão +30 dias */}
        <Card className="bg-white border-2 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 font-semibold mb-2">Previsão Próximos 30 Dias</p>
            <p className="text-3xl font-black text-purple-600">R$ {(forecast.forecast30Days / 1000).toFixed(1)}K</p>
            <p className="text-xs mt-2 text-slate-600">Meta: R$ 100K</p>
          </CardContent>
        </Card>

        {/* Probabilidade de Meta */}
        <Card className={`border-2 shadow-lg ${goalProbability >= 70 ? 'border-green-200 bg-green-50' : goalProbability >= 40 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 font-semibold mb-2">Probabilidade de Atingir Meta</p>
            <p className={`text-3xl font-black ${goalProbability >= 70 ? 'text-green-600' : goalProbability >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {goalProbability}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${goalProbability >= 70 ? 'bg-green-600' : goalProbability >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${goalProbability}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tendência de Receita */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Tendência de Receita
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => `R$ ${v / 1000}K`} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição do Pipeline */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Distribuição do Pipeline
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações, Riscos e Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recomendações */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg border-l-4 border-green-500">
          <CardContent className="p-6">
            <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Recomendações
            </h4>
            <ul className="space-y-2">
              {forecast.recommendations?.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                  • {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Riscos */}
        <Card className="border-0 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg border-l-4 border-red-500">
          <CardContent className="p-6">
            <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Riscos
            </h4>
            <ul className="space-y-2">
              {forecast.risks?.map((risk, idx) => (
                <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                  ⚠️ {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg border-l-4 border-purple-500">
          <CardContent className="p-6">
            <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Oportunidades
            </h4>
            <ul className="space-y-2">
              {forecast.opportunities?.map((opp, idx) => (
                <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                  ✨ {opp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Tendências */}
      {forecast.trendAnalysis && (
        <Card className="border-0 bg-slate-50 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-black text-slate-900 mb-3">Análise de Tendências</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{forecast.trendAnalysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}