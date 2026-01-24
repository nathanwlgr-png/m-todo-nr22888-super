import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Sparkles, Trophy, Award, Zap, Crown, Medal, Star, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SalesPerformanceDashboard() {
  const [dateRange, setDateRange] = useState('30d');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: salesPoints = [] } = useQuery({
    queryKey: ['salesPoints'],
    queryFn: () => base44.entities.SalesPoints.list()
  });

  const { data: salesGoals = [] } = useQuery({
    queryKey: ['salesGoals'],
    queryFn: () => base44.entities.SalesGoal.filter({ status: 'active' })
  });

  // Calcular métricas agregadas
  const totalLTV = clients.reduce((sum, c) => sum + (c.ai_sales_intelligence?.ltv_24_months || 0), 0);
  const avgAdoptionRate = clients.length > 0 
    ? clients.reduce((sum, c) => sum + (c.ai_sales_intelligence?.product_adoption_rate || 0), 0) / clients.length 
    : 0;

  const totalCrossSellOpps = clients.reduce((sum, c) => 
    sum + (c.ai_sales_intelligence?.cross_sell_opportunities?.length || 0), 0
  );

  const totalUpsellOpps = clients.reduce((sum, c) => 
    sum + (c.ai_sales_intelligence?.upsell_opportunities?.length || 0), 0
  );

  // Clientes por segmento
  const segmentData = [
    { name: 'VIP', value: clients.filter(c => c.ai_segment === 'VIP').length },
    { name: 'Champions', value: clients.filter(c => c.ai_segment === 'Champions').length },
    { name: 'Potential', value: clients.filter(c => c.ai_segment === 'Potential').length },
    { name: 'Nurture', value: clients.filter(c => c.ai_segment === 'Nurture').length },
    { name: 'At Risk', value: clients.filter(c => c.ai_segment === 'At Risk').length },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Top clientes por LTV
  const topClients = [...clients]
    .filter(c => c.ai_sales_intelligence?.ltv_24_months)
    .sort((a, b) => (b.ai_sales_intelligence?.ltv_24_months || 0) - (a.ai_sales_intelligence?.ltv_24_months || 0))
    .slice(0, 10);

  // Oportunidades de maior valor
  const allOpportunities = [];
  clients.forEach(client => {
    const intel = client.ai_sales_intelligence;
    if (intel?.cross_sell_opportunities) {
      intel.cross_sell_opportunities.forEach(opp => {
        allOpportunities.push({
          ...opp,
          client_name: client.first_name,
          client_id: client.id,
          type: 'Cross-Sell'
        });
      });
    }
    if (intel?.upsell_opportunities) {
      intel.upsell_opportunities.forEach(opp => {
        allOpportunities.push({
          ...opp,
          client_name: client.first_name,
          client_id: client.id,
          type: 'Upsell'
        });
      });
    }
  });

  const topOpportunities = allOpportunities
    .sort((a, b) => (b.expected_value * b.probability) - (a.expected_value * a.probability))
    .slice(0, 10);

  // Gamification: Leaderboard
  const leaderboard = [...salesPoints]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 10);

  // Badge definitions
  const badgeIcons = {
    'Novato': { icon: Star, color: 'text-gray-400' },
    'Explorador': { icon: Target, color: 'text-blue-500' },
    'Conquistador': { icon: Award, color: 'text-green-500' },
    'Mestre': { icon: Medal, color: 'text-purple-500' },
    'Lenda': { icon: Crown, color: 'text-yellow-500' },
    'Sequência 7 dias': { icon: Flame, color: 'text-orange-500' },
    'Primeira Venda': { icon: DollarSign, color: 'text-green-600' },
    'Vendedor do Mês': { icon: Trophy, color: 'text-yellow-600' },
    '10 Vendas': { icon: Zap, color: 'text-blue-600' },
    '50 Vendas': { icon: Sparkles, color: 'text-purple-600' }
  };

  // Active goals progress
  const goalsWithProgress = salesGoals.map(goal => ({
    ...goal,
    progress: (goal.current_value / goal.target_value) * 100
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Performance de Vendas</h1>
              <p className="text-gray-600">Insights de IA sobre LTV, oportunidades e conversão</p>
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>

        {/* Gamification: Leaderboard */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                🏆 Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((seller, idx) => (
                  <div key={seller.id} className={`flex items-center gap-4 p-3 rounded-lg ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-400' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-400' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-center w-8 h-8">
                      {idx === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                      {idx === 1 && <Medal className="w-6 h-6 text-gray-500" />}
                      {idx === 2 && <Medal className="w-6 h-6 text-orange-500" />}
                      {idx > 2 && <span className="font-bold text-gray-600">#{idx + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{seller.user_name || seller.user_email}</p>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>📊 {seller.sales_closed || 0} vendas</span>
                        <span>✅ {seller.tasks_completed || 0} tarefas</span>
                        <span>👥 {seller.visits_completed || 0} visitas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{seller.total_points || 0}</p>
                      <p className="text-xs text-gray-500">pontos</p>
                      <Badge className="mt-1">Nível {seller.level || 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badges Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(badgeIcons).map(([name, { icon: Icon, color }]) => {
                  const earned = leaderboard.some(s => s.badges?.includes(name));
                  return (
                    <div key={name} className={`flex items-center gap-3 p-2 rounded-lg ${
                      earned ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200 opacity-50'
                    }`}>
                      <Icon className={`w-5 h-5 ${earned ? color : 'text-gray-400'}`} />
                      <span className={`text-sm ${earned ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        {goalsWithProgress.length > 0 && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Metas Ativas - Progresso do Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goalsWithProgress.map(goal => (
                  <div key={goal.id} className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{goal.title}</p>
                        <p className="text-xs text-gray-600">{goal.description}</p>
                      </div>
                      <Badge className={
                        goal.progress >= 100 ? 'bg-green-600' :
                        goal.progress >= 70 ? 'bg-blue-600' :
                        goal.progress >= 40 ? 'bg-yellow-600' : 'bg-gray-600'
                      }>
                        {goal.progress.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Atual: {goal.current_value.toLocaleString('pt-BR')}</span>
                      <span>Meta: {goal.target_value.toLocaleString('pt-BR')}</span>
                    </div>
                    {goal.reward_points > 0 && (
                      <p className="text-xs text-purple-600 mt-1 font-semibold">
                        🎁 Recompensa: {goal.reward_points} pontos
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas Principais */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">LTV Total (24m)</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalLTV.toLocaleString('pt-BR')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa Adoção Média</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {avgAdoptionRate.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cross-Sell Opps</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalCrossSellOpps}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upsell Opps</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalUpsellOpps}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Distribuição por Segmento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clientes por Segmento IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Clientes por LTV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Top 10 Clientes por LTV (24 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClients.map(c => ({
                  name: c.first_name,
                  ltv: c.ai_sales_intelligence?.ltv_24_months || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ltv" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 10 Oportunidades de Maior Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOpportunities.map((opp, idx) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{opp.client_name}</p>
                        <Badge className={opp.type === 'Cross-Sell' ? 'bg-green-600' : 'bg-blue-600'}>
                          {opp.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{opp.product}</p>
                      <p className="text-xs text-gray-600 mt-1">{opp.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">
                        R$ {opp.expected_value.toLocaleString('pt-BR')}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {opp.probability}% prob
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{opp.timing}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}