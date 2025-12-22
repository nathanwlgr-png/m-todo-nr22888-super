import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, TrendingUp } from 'lucide-react';

export default function GamificationWidget() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: myPoints } = useQuery({
    queryKey: ['my-sales-points', currentUser?.email],
    queryFn: async () => {
      const points = await base44.entities.SalesPoints.filter({ user_email: currentUser.email });
      return points[0];
    },
    enabled: !!currentUser
  });

  const { data: myGoals = [] } = useQuery({
    queryKey: ['my-goals', currentUser?.email],
    queryFn: async () => {
      const goals = await base44.entities.SalesGoal.filter({ assigned_to: currentUser.email, status: 'active' });
      return goals;
    },
    enabled: !!currentUser
  });

  if (!myPoints) return null;

  const levelProgress = ((myPoints.total_points % 500) / 500) * 100;
  const nextLevelPoints = Math.ceil(myPoints.total_points / 500) * 500;

  return (
    <div className="space-y-3">
      {/* Points Card */}
      <Link to={createPageUrl('Leaderboard')}>
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Seus Pontos</p>
              <p className="text-3xl font-bold text-orange-600">{myPoints.month_points}</p>
              <p className="text-xs text-slate-500">este mês</p>
            </div>
            <div className="text-right">
              <Trophy className="w-10 h-10 text-yellow-500 mb-1" />
              <Badge className="bg-orange-600 text-white">Nível {myPoints.level}</Badge>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Progresso do Nível</span>
              <span className="font-semibold text-slate-700">{nextLevelPoints - myPoints.total_points} pts</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          {myPoints.streak_days > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-center gap-2">
              <span className="text-2xl">🔥</span>
              <p className="text-sm font-semibold text-slate-700">
                {myPoints.streak_days} dias consecutivos
              </p>
            </div>
          )}
        </Card>
      </Link>

      {/* Active Goals Preview */}
      {myGoals.length > 0 && (
        <Link to={createPageUrl('Goals')}>
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{myGoals[0].title}</p>
                <p className="text-xs text-slate-600">Meta ativa</p>
              </div>
            </div>
            <div>
              <Progress 
                value={Math.min((myGoals[0].current_value / myGoals[0].target_value) * 100, 100)} 
                className="h-2 mb-1" 
              />
              <p className="text-xs text-slate-600">
                {myGoals[0].current_value} / {myGoals[0].target_value}
              </p>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}