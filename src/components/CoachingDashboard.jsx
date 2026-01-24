import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Award, TrendingUp, Target, Sparkles, Calendar,
  MessageSquare, BarChart3, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function CoachingDashboard({ compact = false }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['coaching-sessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 20)
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const stats = useMemo(() => {
    const total = sessions.length;
    const avgScore = total > 0 
      ? sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / total 
      : 0;

    const last7Days = sessions.filter(s => 
      new Date(s.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const avgLast7Days = last7Days.length > 0
      ? last7Days.reduce((sum, s) => sum + (s.overall_score || 0), 0) / last7Days.length
      : 0;

    const avgTechniques = {
      spin: total > 0 ? sessions.reduce((sum, s) => sum + (s.technique_scores?.spin_selling || 0), 0) / total : 0,
      numerology: total > 0 ? sessions.reduce((sum, s) => sum + (s.technique_scores?.numerology_adaptation || 0), 0) / total : 0,
      cialdini: total > 0 ? sessions.reduce((sum, s) => sum + (s.technique_scores?.cialdini_triggers || 0), 0) / total : 0,
      emotional: total > 0 ? sessions.reduce((sum, s) => sum + (s.technique_scores?.emotional_intelligence || 0), 0) / total : 0,
      objections: total > 0 ? sessions.reduce((sum, s) => sum + (s.technique_scores?.objection_handling || 0), 0) / total : 0
    };

    const outcomes = sessions.reduce((acc, s) => {
      acc[s.outcome] = (acc[s.outcome] || 0) + 1;
      return acc;
    }, {});

    return { total, avgScore, avgLast7Days, avgTechniques, outcomes };
  }, [sessions]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">Coaching</h3>
            </div>
            <Badge className="bg-purple-600 text-white">
              {stats.avgScore.toFixed(0)}/100
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded text-center">
              <p className="text-xs text-gray-500">Sessões</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div className="p-2 bg-white rounded text-center">
              <p className="text-xs text-gray-500">Últimos 7d</p>
              <p className="text-lg font-bold">{stats.avgLast7Days.toFixed(0)}</p>
            </div>
            <div className="p-2 bg-white rounded text-center">
              <p className="text-xs text-gray-500">Melhor</p>
              <p className="text-lg font-bold">{Math.max(...sessions.map(s => s.overall_score || 0))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Award className="w-5 h-5" />
            Dashboard de Coaching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-500">Score Médio</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.avgScore.toFixed(0)}</p>
              <Progress value={stats.avgScore} className="mt-2 h-1" />
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500">Últimos 7 Dias</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.avgLast7Days.toFixed(0)}</p>
              {stats.avgLast7Days > stats.avgScore && (
                <p className="text-xs text-green-600 mt-1">↑ Melhorando!</p>
              )}
            </div>
          </div>

          {/* Técnicas */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-700">PERFORMANCE POR TÉCNICA</p>
            {Object.entries(stats.avgTechniques).map(([key, score]) => {
              const labels = {
                spin: 'SPIN',
                numerology: 'Numerologia',
                cialdini: 'Persuasão',
                emotional: 'Int. Emocional',
                objections: 'Objeções'
              };
              return (
                <div key={key} className="p-2 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{labels[key]}</span>
                    <span className="text-sm font-bold text-purple-600">{score.toFixed(1)}/10</span>
                  </div>
                  <Progress value={score * 10} className="h-1" />
                </div>
              );
            })}
          </div>

          {/* Últimas Sessões */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-700">ÚLTIMAS SESSÕES</p>
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{session.client_name || 'Cliente não identificado'}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(session.created_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge className={
                    session.overall_score >= 80 ? 'bg-green-600' :
                    session.overall_score >= 60 ? 'bg-blue-600' :
                    session.overall_score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                  }>
                    {session.overall_score}
                  </Badge>
                </div>
                {session.outcome && (
                  <Badge variant="outline" className="text-xs">
                    {session.outcome === 'venda_fechada' ? '✅ Venda fechada' :
                     session.outcome === 'agendou_proxima' ? '📅 Agendou próxima' :
                     session.outcome === 'enviou_proposta' ? '📧 Enviou proposta' : session.outcome}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}