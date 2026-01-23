import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, CheckCircle, TrendingUp, 
  AlertTriangle, Clock, Target, Plus,
  BarChart3, Activity, Zap, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];

  // Buscar dados
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: []
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list(),
    initialData: []
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: []
  });

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    
    const visitsToday = visits.filter(v => 
      v.scheduled_date?.startsWith(today)
    ).length;

    const completedVisits = visits.filter(v => 
      v.status === 'realizada'
    ).length;

    const pendingTasks = tasks.filter(t => 
      t.status === 'pendente'
    ).length;

    // Clientes por status
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const warmClients = clients.filter(c => c.status === 'morno').length;
    const coldClients = clients.filter(c => c.status === 'frio').length;

    // Taxa de sucesso de visitas (últimos 30 dias)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentVisits = visits.filter(v => 
      new Date(v.scheduled_date) >= last30Days
    );
    const successfulVisits = recentVisits.filter(v => 
      v.result_notes?.toLowerCase().includes('sucesso') || v.status === 'realizada'
    ).length;
    const successRate = recentVisits.length > 0 
      ? Math.round((successfulVisits / recentVisits.length) * 100) 
      : 0;

    return {
      totalClients,
      visitsToday,
      completedVisits,
      pendingTasks,
      hotClients,
      warmClients,
      coldClients,
      successRate
    };
  }, [clients, visits, tasks, today]);

  // Gráfico de visitas por dia (últimos 7 dias)
  const visitsChartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayVisits = visits.filter(v => 
        v.scheduled_date?.startsWith(dateStr)
      );
      
      last7Days.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        realizadas: dayVisits.filter(v => v.status === 'realizada').length,
        agendadas: dayVisits.filter(v => v.status === 'agendada').length,
        canceladas: dayVisits.filter(v => v.status === 'cancelada').length
      });
    }
    return last7Days;
  }, [visits]);

  // Gráfico de clientes por status
  const clientsStatusData = [
    { name: 'Quente', value: metrics.hotClients, color: '#ef4444' },
    { name: 'Morno', value: metrics.warmClients, color: '#f59e0b' },
    { name: 'Frio', value: metrics.coldClients, color: '#3b82f6' }
  ];

  // Alertas de clientes com baixo engajamento
  const lowEngagementAlerts = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return clients
      .filter(c => {
        const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
        const lastVisit = c.last_visit_date ? new Date(c.last_visit_date) : null;
        
        const noRecentContact = !lastContact || lastContact < thirtyDaysAgo;
        const noRecentVisit = !lastVisit || lastVisit < thirtyDaysAgo;
        
        return (noRecentContact || noRecentVisit) && c.status !== 'frio';
      })
      .slice(0, 5);
  }, [clients]);

  // Clientes com follow-up pendente
  const followUpAlerts = useMemo(() => {
    const todayDate = new Date();
    
    return clients
      .filter(c => {
        if (!c.next_contact_date) return false;
        const nextDate = new Date(c.next_contact_date);
        return nextDate <= todayDate;
      })
      .slice(0, 5);
  }, [clients]);

  const isLoading = loadingClients || loadingVisits || loadingTasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Dashboard Principal
          </h1>
          <p className="text-slate-600">
            Visão geral do seu CRM e atividades
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700">
                  Total
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {metrics.totalClients}
              </p>
              <p className="text-sm text-slate-600">Clientes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-green-600" />
                <Badge className="bg-green-100 text-green-700">
                  Hoje
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {metrics.visitsToday}
              </p>
              <p className="text-sm text-slate-600">Visitas Agendadas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700">
                  Realizadas
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {metrics.completedVisits}
              </p>
              <p className="text-sm text-slate-600">Visitas Completas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-700">
                  30 dias
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {metrics.successRate}%
              </p>
              <p className="text-sm text-slate-600">Taxa de Sucesso</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Visitas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance de Visitas (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visitsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="realizadas" fill="#10b981" name="Realizadas" />
                  <Bar dataKey="agendadas" fill="#3b82f6" name="Agendadas" />
                  <Bar dataKey="canceladas" fill="#ef4444" name="Canceladas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Status de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Clientes por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientsStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Alertas de Baixo Engajamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Clientes com Baixo Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowEngagementAlerts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum alerta no momento
                </p>
              ) : (
                <div className="space-y-3">
                  {lowEngagementAlerts.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {client.first_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Último contato: {client.last_contact_date || 'Nunca'}
                        </p>
                      </div>
                      <Link to={createPageUrl('ClientProfile') + `?id=${client.id}`}>
                        <Button size="sm" variant="outline">
                          Ver <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas de Follow-up Pendente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Follow-up Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followUpAlerts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum follow-up pendente
                </p>
              ) : (
                <div className="space-y-3">
                  {followUpAlerts.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {client.first_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Próximo contato: {new Date(client.next_contact_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Link to={createPageUrl('ClientProfile') + `?id=${client.id}`}>
                        <Button size="sm" variant="outline">
                          Contactar <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={createPageUrl('VisitWorkflow')}>
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Nova Visita</span>
                </Button>
              </Link>
              
              <Link to={createPageUrl('Clients')}>
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Ver Clientes</span>
                </Button>
              </Link>
              
              <Link to={createPageUrl('Tasks')}>
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700">
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Minhas Tarefas</span>
                </Button>
              </Link>
              
              <Link to={createPageUrl('ScheduledAgenda')}>
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Agenda</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Analytics AI */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Analytics AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Análise inteligente de vendas, previsões e insights acionáveis
            </p>
            <Link to={createPageUrl('SalesAnalyticsDashboard')}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <BarChart3 className="w-5 h-5 mr-2" />
                Ver Analytics Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}