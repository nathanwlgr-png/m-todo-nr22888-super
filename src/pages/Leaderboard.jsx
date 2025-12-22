import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Zap,
  Award,
  Crown,
  Loader2
} from 'lucide-react';

const levelConfig = {
  1: { name: 'Iniciante', color: 'text-slate-500', minPoints: 0 },
  2: { name: 'Vendedor', color: 'text-blue-500', minPoints: 100 },
  3: { name: 'Especialista', color: 'text-purple-500', minPoints: 500 },
  4: { name: 'Mestre', color: 'text-orange-500', minPoints: 1000 },
  5: { name: 'Lenda', color: 'text-yellow-500', minPoints: 2500 }
};

const badgeIcons = {
  first_sale: '🎯',
  speed_demon: '⚡',
  closer: '💰',
  marathon: '🏃',
  perfect_week: '⭐',
  hot_streak: '🔥'
};

export default function Leaderboard() {
  const navigate = useNavigate();

  const { data: salesPoints = [], isLoading } = useQuery({
    queryKey: ['sales-points'],
    queryFn: () => base44.entities.SalesPoints.list('-month_points', 100)
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const topPerformers = useMemo(() => {
    return salesPoints.slice(0, 10);
  }, [salesPoints]);

  const myRank = useMemo(() => {
    if (!currentUser) return null;
    const index = salesPoints.findIndex(sp => sp.user_email === currentUser.email);
    return index >= 0 ? index + 1 : null;
  }, [salesPoints, currentUser]);

  const myStats = useMemo(() => {
    if (!currentUser) return null;
    return salesPoints.find(sp => sp.user_email === currentUser.email);
  }, [salesPoints, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Ranking de Vendas</h1>
            <p className="text-sm text-orange-100">Competição do mês</p>
          </div>
          <Trophy className="w-8 h-8 text-yellow-300" />
        </div>

        {/* My Stats */}
        {myStats && (
          <Card className="p-4 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm mb-1">Minha Posição</p>
                <p className="text-3xl font-bold text-white">#{myRank}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm mb-1">Pontos do Mês</p>
                <p className="text-3xl font-bold text-yellow-300">{myStats.month_points}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {topPerformers.slice(0, 3).map((performer, index) => {
            const icons = [Crown, Trophy, Medal];
            const Icon = icons[index];
            const colors = [
              'from-yellow-400 to-orange-500',
              'from-slate-300 to-slate-400',
              'from-orange-400 to-orange-600'
            ];
            const sizes = ['h-28', 'h-24', 'h-24'];

            return (
              <Card key={performer.id} className={`${sizes[index]} ${index === 1 ? 'order-first' : ''}`}>
                <div className={`h-full bg-gradient-to-br ${colors[index]} rounded-xl p-3 flex flex-col items-center justify-center text-white`}>
                  <Icon className="w-6 h-6 mb-1" />
                  <p className="text-xs font-medium text-center">{performer.user_name || performer.user_email}</p>
                  <p className="text-lg font-bold">{performer.month_points}</p>
                  <p className="text-[10px]">pts</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {topPerformers.map((performer, index) => {
            const level = Object.entries(levelConfig)
              .reverse()
              .find(([_, config]) => performer.total_points >= config.minPoints);
            
            const isCurrentUser = performer.user_email === currentUser?.email;

            return (
              <Card 
                key={performer.id} 
                className={`p-4 ${isCurrentUser ? 'border-2 border-indigo-500 bg-indigo-50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-8 text-center">
                    <p className={`text-xl font-bold ${index < 3 ? 'text-orange-600' : 'text-slate-600'}`}>
                      {index + 1}
                    </p>
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {(performer.user_name || performer.user_email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">
                        {performer.user_name || performer.user_email.split('@')[0]}
                      </p>
                      {isCurrentUser && (
                        <Badge className="bg-indigo-600 text-white text-xs">Você</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={level?.[1].color}>
                        Nível {performer.level} - {level?.[1].name}
                      </Badge>
                      {performer.streak_days > 0 && (
                        <Badge variant="outline" className="text-orange-600">
                          🔥 {performer.streak_days} dias
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{performer.month_points}</p>
                    <p className="text-xs text-slate-500">pontos</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{performer.sales_closed}</p>
                    <p className="text-xs text-slate-500">Vendas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{performer.visits_completed}</p>
                    <p className="text-xs text-slate-500">Visitas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{performer.tasks_completed}</p>
                    <p className="text-xs text-slate-500">Tarefas</p>
                  </div>
                </div>

                {/* Badges */}
                {performer.badges && performer.badges.length > 0 && (
                  <div className="flex gap-1 mt-3">
                    {performer.badges.slice(0, 6).map((badge, i) => (
                      <div key={i} className="text-lg">
                        {badgeIcons[badge] || '🏆'}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}