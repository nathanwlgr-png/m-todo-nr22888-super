import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, Target, DollarSign, Calendar, Zap } from 'lucide-react';
import SalesAIAnalytics from '../components/SalesAIAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function SalesAnalyticsDashboard() {
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  // Métricas
  const totalRevenue = sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const avgDealSize = sales.length > 0 ? totalRevenue / sales.filter(s => s.status === 'fechada').length : 0;
  const conversionRate = clients.length > 0 ? (sales.filter(s => s.status === 'fechada').length / clients.length * 100) : 0;
  
  const hotClients = clients.filter(c => c.status === 'quente').length;
  const warmClients = clients.filter(c => c.status === 'morno').length;
  const coldClients = clients.filter(c => c.status === 'frio').length;

  // Vendas por mês
  const salesByMonth = sales
    .filter(s => s.status === 'fechada' && s.sale_date)
    .reduce((acc, sale) => {
      const month = new Date(sale.sale_date).toLocaleDateString('pt-BR', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

  const chartData = Object.entries(salesByMonth).map(([month, count]) => ({
    month,
    vendas: count
  }));

  // Status dos clientes
  const statusData = [
    { name: 'Quente', value: hotClients, color: '#ef4444' },
    { name: 'Morno', value: warmClients, color: '#f59e0b' },
    { name: 'Frio', value: coldClients, color: '#3b82f6' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Analytics de Vendas</h1>
            <p className="text-sm text-purple-100">Powered by AI</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs text-slate-500">Receita Total</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-500">Taxa Conversão</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {conversionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-500">Ticket Médio</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                R$ {avgDealSize.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-slate-500">Clientes</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {clients.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status dos Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vendas por Mês */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance por Equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividades do Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{visits.length}</p>
                <p className="text-xs text-slate-600">Visitas</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'concluida').length}</p>
                <p className="text-xs text-slate-600">Tarefas OK</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{sales.filter(s => s.status === 'fechada').length}</p>
                <p className="text-xs text-slate-600">Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics AI */}
        <SalesAIAnalytics />
      </div>
    </div>
  );
}