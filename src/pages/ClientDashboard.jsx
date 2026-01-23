import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MessageSquare, CheckSquare, FileText, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedClientSearch from '@/components/AdvancedClientSearch';
import ClientScoreCard from '@/components/ClientScoreCard';
import { format } from 'date-fns';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client } = useQuery({
    queryKey: ['dashboard-client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const result = await base44.entities.Client.filter({ id: clientId });
      return result?.[0] || null;
    },
    enabled: !!clientId,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['dashboard-visits', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Visit.filter({ client_id: clientId });
    },
    enabled: !!clientId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboard-tasks', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Task.filter({ client_id: clientId });
    },
    enabled: !!clientId,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['dashboard-sales', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Sale.filter({ client_id: clientId });
    },
    enabled: !!clientId,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['dashboard-interactions', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Interaction.filter({ client_id: clientId });
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard de Clientes</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <AdvancedClientSearch />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Cliente não encontrado</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pendente');
  const completedVisits = visits.filter(v => v.status === 'realizada');
  const closedSales = sales.filter(s => s.status === 'fechada');
  const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.first_name}</h1>
              <p className="text-sm text-slate-600">{client.clinic_name} • {client.city}</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(createPageUrl(`ClientProfile?id=${clientId}`))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Ver Perfil Completo
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Score */}
        <ClientScoreCard clientId={clientId} />

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Visitas</p>
                <p className="text-3xl font-bold text-slate-900">{completedVisits.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Tarefas</p>
                <p className="text-3xl font-bold text-slate-900">{pendingTasks.length}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Vendas</p>
                <p className="text-3xl font-bold text-slate-900">{closedSales.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Receita</p>
                <p className="text-2xl font-bold text-slate-900">R$ {(totalRevenue / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Abas */}
        <Tabs defaultValue="visits" className="bg-white rounded-lg shadow-sm p-4">
          <TabsList>
            <TabsTrigger value="visits">
              <Calendar className="w-4 h-4 mr-2" />
              Visitas ({visits.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tarefas ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="sales">
              <DollarSign className="w-4 h-4 mr-2" />
              Vendas ({sales.length})
            </TabsTrigger>
            <TabsTrigger value="interactions">
              <MessageSquare className="w-4 h-4 mr-2" />
              Interações ({interactions.length})
            </TabsTrigger>
          </TabsList>

          {/* Visitas */}
          <TabsContent value="visits" className="space-y-2 mt-4">
            {visits.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma visita registrada</p>
            ) : (
              visits.map(visit => (
                <Card key={visit.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{visit.visit_type}</p>
                      <p className="text-xs text-slate-600">{visit.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {format(new Date(visit.scheduled_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                      <p className={`text-xs font-semibold ${
                        visit.status === 'realizada' ? 'text-green-700' :
                        visit.status === 'cancelada' ? 'text-red-700' :
                        'text-blue-700'
                      }`}>
                        {visit.status}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tarefas */}
          <TabsContent value="tasks" className="space-y-2 mt-4">
            {tasks.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma tarefa</p>
            ) : (
              tasks.map(task => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-600">{task.description}</p>
                    </div>
                    <p className={`text-xs font-semibold ${
                      task.status === 'concluida' ? 'text-green-700' :
                      task.priority === 'alta' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {task.status} {task.priority && `• ${task.priority}`}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="sales" className="space-y-2 mt-4">
            {sales.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma venda</p>
            ) : (
              sales.map(sale => (
                <Card key={sale.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{sale.equipment_name}</p>
                      <p className="text-xs text-slate-600">{sale.payment_terms}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-700">
                        R$ {(sale.sale_value || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-600">{sale.status}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Interações */}
          <TabsContent value="interactions" className="space-y-2 mt-4">
            {interactions.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma interação</p>
            ) : (
              interactions.map(interaction => (
                <Card key={interaction.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{interaction.subject}</p>
                      <p className="text-xs text-slate-600">{interaction.type} • {interaction.duration_minutes}min</p>
                    </div>
                    <p className={`text-xs font-semibold ${
                      interaction.outcome === 'positive' ? 'text-green-700' :
                      interaction.outcome === 'negative' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {interaction.outcome}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}