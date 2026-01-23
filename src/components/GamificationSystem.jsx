import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Trophy, Target, Zap, Star, Crown, TrendingUp, Users, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const BADGES = [
  { id: 'primeira_venda', name: 'Primeira Venda', icon: '🎯', threshold: 1, type: 'sales' },
  { id: 'vendedor_mes', name: 'Vendedor do Mês', icon: '👑', threshold: 5, type: 'sales' },
  { id: 'streak_7', name: 'Sequência 7 Dias', icon: '🔥', threshold: 7, type: 'streak' },
  { id: 'dez_visitas', name: '10 Visitas', icon: '🚀', threshold: 10, type: 'visits' },
  { id: 'cem_pontos', name: '100 Pontos', icon: '💯', threshold: 100, type: 'points' },
  { id: 'cliente_quente', name: '10 Clientes Quentes', icon: '🔥', threshold: 10, type: 'hot_clients' },
  { id: 'fechador', name: 'Fechador Expert', icon: '🏆', threshold: 3, type: 'closed_this_month' }
];

export default function GamificationSystem({ compact = false }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.email],
    queryFn: async () => {
      const points = await base44.entities.SalesPoints.filter({ user_email: user.email });
      return points[0] || null;
    },
    enabled: !!user
  });

  const { data: allPoints = [] } = useQuery({
    queryKey: ['all-points'],
    queryFn: () => base44.entities.SalesPoints.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const updatePointsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalesPoints.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-points']);
      queryClient.invalidateQueries(['all-points']);
    }
  });

  const createPointsMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesPoints.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-points']);
      queryClient.invalidateQueries(['all-points']);
    }
  });

  // Check and award badges
  useEffect(() => {
    if (!userPoints || !user) return;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mySales = sales.filter(s => s.created_by === user.email);
    const myVisits = visits.filter(v => v.created_by === user.email);
    const myClients = clients.filter(c => c.created_by === user.email);
    const salesThisMonth = mySales.filter(s => new Date(s.created_date) >= thisMonth);
    const closedThisMonth = salesThisMonth.filter(s => s.status === 'fechada').length;
    const hotClients = myClients.filter(c => c.status === 'quente').length;

    const newBadges = [];
    
    BADGES.forEach(badge => {
      if (userPoints.badges?.includes(badge.id)) return;

      let shouldAward = false;
      if (badge.type === 'sales' && mySales.length >= badge.threshold) shouldAward = true;
      if (badge.type === 'visits' && myVisits.length >= badge.threshold) shouldAward = true;
      if (badge.type === 'points' && userPoints.total_points >= badge.threshold) shouldAward = true;
      if (badge.type === 'streak' && userPoints.streak_days >= badge.threshold) shouldAward = true;
      if (badge.type === 'hot_clients' && hotClients >= badge.threshold) shouldAward = true;
      if (badge.type === 'closed_this_month' && closedThisMonth >= badge.threshold) shouldAward = true;

      if (shouldAward) {
        newBadges.push(badge.id);
      }
    });

    if (newBadges.length > 0) {
      updatePointsMutation.mutate({
        id: userPoints.id,
        data: {
          badges: [...(userPoints.badges || []), ...newBadges]
        }
      });
      
      newBadges.forEach(badgeId => {
        const badge = BADGES.find(b => b.id === badgeId);
        toast.success(`🎉 Nova conquista: ${badge.icon} ${badge.name}!`, { duration: 5000 });
      });
    }
  }, [sales.length, visits.length, userPoints?.total_points]);

  // Calculate level
  const calculateLevel = (points) => {
    return Math.floor(points / 1000) + 1;
  };

  // Leaderboard
  const leaderboard = allPoints
    .sort((a, b) => b.month_points - a.month_points)
    .slice(0, 5);

  const myRank = leaderboard.findIndex(p => p.user_email === user?.email) + 1;

  if (compact) {
    return (
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-purple-900">Level {calculateLevel(userPoints?.total_points || 0)}</p>
              <p className="text-xs text-purple-600">{userPoints?.total_points || 0} pontos</p>
            </div>
          </div>
          <Badge className="bg-purple-600 text-white">
            #{myRank || '-'}
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* User Stats */}
      <Card className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-80">Seu Nível</p>
              <p className="text-2xl font-black">{calculateLevel(userPoints?.total_points || 0)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Ranking</p>
            <p className="text-2xl font-black">#{myRank || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-white/80" />
            <p className="text-lg font-bold">{userPoints?.sales_closed || 0}</p>
            <p className="text-xs opacity-80">Vendas</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-white/80" />
            <p className="text-lg font-bold">{userPoints?.visits_completed || 0}</p>
            <p className="text-xs opacity-80">Visitas</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <MessageSquare className="w-4 h-4 mx-auto mb-1 text-white/80" />
            <p className="text-lg font-bold">{userPoints?.tasks_completed || 0}</p>
            <p className="text-xs opacity-80">Tarefas</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-white/80" />
            <p className="text-lg font-bold">{userPoints?.streak_days || 0}</p>
            <p className="text-xs opacity-80">Sequência</p>
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-4">
        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-600" />
          Conquistas ({userPoints?.badges?.length || 0}/{BADGES.length})
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map(badge => {
            const unlocked = userPoints?.badges?.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-2 rounded-lg text-center ${unlocked ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-slate-100 opacity-40'}`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="text-xs font-semibold text-slate-700">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
        <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-orange-600" />
          Ranking do Mês
        </h4>
        <div className="space-y-2">
          {leaderboard.map((player, index) => {
            const isMe = player.user_email === user?.email;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-orange-100 border-2 border-orange-400' : 'bg-white'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-slate-300 text-slate-700' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{player.user_name || player.user_email}</p>
                  <p className="text-xs text-slate-600">{player.month_points} pontos</p>
                </div>
                <Badge className={`${isMe ? 'bg-orange-600' : 'bg-slate-600'} text-white`}>
                  Lv {calculateLevel(player.total_points)}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}