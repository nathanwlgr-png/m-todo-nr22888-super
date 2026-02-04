import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Award, Target, Zap,
  BarChart3, Calendar, CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function ProgressTracker() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['my-coaching-sessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 50),
  });

  const { data: rolePlaySessions = [] } = useQuery({
    queryKey: ['my-roleplay-sessions'],
    queryFn: () => base44.entities.RolePlaySession.list('-created_date', 50),
  });

  const metrics = useMemo(() => {
    if (!sessions.length) return null;

    const totalSessions = sessions.length;
    const avgOverallScore = sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalSessions;
    
    // Últimos 10 vs 10 anteriores
    const recent10 = sessions.slice(0, 10);
    const previous10 = sessions.slice(10, 20);
    
    const recentAvg = recent10.length > 0 
      ? recent10.reduce((sum, s) => sum + (s.overall_score || 0), 0) / recent10.length
      : 0;
    const previousAvg = previous10.length > 0
      ? previous10.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previous10.length
      : 0;
    
    const trend = recentAvg - previousAvg;

    // Média por técnica
    const techniqueAverages = {};
    const techniqueKeys = ['spin_selling', 'numerology_adaptation', 'cialdini_triggers', 'emotional_intelligence', 'objection_handling'];
    
    techniqueKeys.forEach(key => {
      const scores = sessions
        .map(s => s.technique_scores?.[key])
        .filter(score => score != null);
      
      if (scores.length > 0) {
        techniqueAverages[key] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      }
    });

    // Pontos fortes e fracos recorrentes
    const allStrengths = sessions.flatMap(s => s.strengths || []);
    const allWeaknesses = sessions.flatMap(s => s.weaknesses || []);
    
    const strengthFrequency = {};
    const weaknessFrequency = {};
    
    allStrengths.forEach(str => {
      const key = str.toLowerCase().substring(0, 30);
      strengthFrequency[key] = (strengthFrequency[key] || 0) + 1;
    });
    
    allWeaknesses.forEach(weak => {
      const key = weak.toLowerCase().substring(0, 30);
      weaknessFrequency[key] = (weaknessFrequency[key] || 0) + 1;
    });

    const topStrengths = Object.entries(strengthFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const topWeaknesses = Object.entries(weaknessFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Dados para gráfico de linha (últimas 20 sessões)
    const chartData = sessions.slice(0, 20).reverse().map((s, idx) => ({
      session: idx + 1,
      score: s.overall_score || 0,
      date: new Date(s.created_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
    }));

    // Dados para gráfico radar
    const radarData = techniqueKeys.map(key => ({
      technique: key === 'spin_selling' ? 'SPIN' :
                 key === 'numerology_adaptation' ? 'Numerologia' :
                 key === 'cialdini_triggers' ? 'Persuasão' :
                 key === 'emotional_intelligence' ? 'Int. Emocional' :
                 'Objeções',
      value: (techniqueAverages[key] || 0) * 10
    }));

    return {
      totalSessions,
      avgOverallScore,
      recentAvg,
      previousAvg,
      trend,
      techniqueAverages,
      topStrengths,
      topWeaknesses,
      chartData,
      radarData,
      rolePlayCount: rolePlaySessions.length
    };
  }, [sessions, rolePlaySessions]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Carregando progresso...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <CardContent className="p-6 text-center">
          <Award className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-2">Nenhuma sessão de coaching ainda</p>
          <p className="text-sm text-gray-600">Analise sua primeira conversa para começar a acompanhar seu progresso</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo de Performance */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Score Médio</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.avgOverallScore.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Sessões</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendência */}
      <Card className={`border-2 ${metrics.trend >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {metrics.trend >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-orange-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {metrics.trend >= 0 ? '📈 Evoluindo!' : '📉 Atenção'}
                </p>
                <p className="text-xs text-gray-600">
                  Últimas 10 sessões: {metrics.recentAvg.toFixed(0)} 
                  {metrics.previousAvg > 0 && ` (antes: ${metrics.previousAvg.toFixed(0)})`}
                </p>
              </div>
            </div>
            <Badge className={metrics.trend >= 0 ? 'bg-green-600' : 'bg-orange-600'}>
              {metrics.trend >= 0 ? '+' : ''}{metrics.trend.toFixed(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Evolução do Score (Últimas 20 Sessões)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico Radar de Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Performance por Técnica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={metrics.radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="technique" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pontos Fortes Recorrentes */}
      <Card className="bg-green-50 border-2 border-green-300">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-green-900">
            <CheckCircle2 className="w-4 h-4" />
            Seus Pontos Fortes Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.topStrengths.map(([strength, count], idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <p className="text-sm text-gray-700">{strength.substring(0, 50)}...</p>
                <Badge className="bg-green-600">{count}x</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Áreas para Desenvolvimento */}
      <Card className="bg-orange-50 border-2 border-orange-300">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-orange-900">
            <Target className="w-4 h-4" />
            Foco de Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.topWeaknesses.map(([weakness, count], idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <p className="text-sm text-gray-700">{weakness.substring(0, 50)}...</p>
                <Badge className="bg-orange-600">{count}x</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Técnicas Individuais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scores por Técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(metrics.techniqueAverages).map(([key, value]) => {
            const labels = {
              spin_selling: 'SPIN Selling',
              numerology_adaptation: 'Adaptação Numerológica',
              cialdini_triggers: 'Gatilhos de Persuasão',
              emotional_intelligence: 'Inteligência Emocional',
              objection_handling: 'Controle de Objeções'
            };
            
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700">{labels[key]}</p>
                  <span className="text-sm font-bold text-purple-600">{value.toFixed(1)}/10</span>
                </div>
                <Progress value={value * 10} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Gamificação */}
      {metrics.rolePlayCount > 0 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Treinos Role-Play</p>
                <p className="text-sm text-amber-700">{metrics.rolePlayCount} sessões completas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}