import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Plus, Settings, Download, RefreshCw,
  TrendingUp, Users, CheckSquare, Target, DollarSign,
  Calendar, Award, Zap, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function SortableWidget({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function CustomDashboard() {
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState([
    'kpi_cards',
    'sales_funnel',
    'revenue_chart',
    'client_status',
    'priority_leads',
    'tasks_summary'
  ]);
  const queryClient = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor));

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: config } = useQuery({
    queryKey: ['dashboard-config', user?.email],
    queryFn: () => base44.entities.DashboardConfig?.filter({ 
      user_email: user.email, 
      is_default: true 
    }).then(r => r[0]).catch(() => null),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities'],
    queryFn: () => base44.entities.LeadPriority?.list().catch(() => []),
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (widgetOrder) => {
      if (config) {
        return base44.entities.DashboardConfig.update(config.id, {
          widgets_enabled: widgetOrder
        });
      } else {
        return base44.entities.DashboardConfig.create({
          user_email: user.email,
          dashboard_name: 'Dashboard Principal',
          is_default: true,
          widgets_enabled: widgetOrder
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-config']);
      toast.success('Dashboard salvo!');
    }
  });

  const exportMutation = useMutation({
    mutationFn: async ({ format, data_type }) => {
      const response = await base44.functions.invoke('exportDashboardData', {
        format,
        data_type,
        filters: {}
      });
      return { data: response.data, format, data_type };
    },
    onSuccess: ({ data, format, data_type }) => {
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data_type}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      toast.success('Exportado com sucesso!');
    }
  });

  useEffect(() => {
    if (config?.widgets_enabled) {
      setWidgets(config.widgets_enabled);
    }
  }, [config]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || !active) return;
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveLayout = () => {
    saveConfigMutation.mutate(widgets);
    setEditMode(false);
  };

  // KPIs
  const kpis = {
    totalClients: clients.length,
    hotClients: clients.filter(c => c.status === 'quente').length,
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => l.ai_score > 70).length,
    totalSales: sales.filter(s => s.status === 'fechada').length,
    revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
    pendingTasks: tasks.filter(t => t.status === 'pendente').length,
    conversionRate: leads.length > 0 ? ((sales.length / leads.length) * 100).toFixed(1) : 0
  };

  // Funil de vendas em tempo real
  const funnelData = [
    { stage: 'Leads Novos', value: leads.filter(l => l.stage === 'novo').length, color: '#3b82f6' },
    { stage: 'Em Contato', value: leads.filter(l => l.stage === 'em_contato').length, color: '#8b5cf6' },
    { stage: 'Qualificados', value: leads.filter(l => l.stage === 'qualificado').length, color: '#06b6d4' },
    { stage: 'Negociação', value: leads.filter(l => l.stage === 'negociacao').length, color: '#f59e0b' },
    { stage: 'Fechados', value: sales.filter(s => s.status === 'fechada').length, color: '#10b981' }
  ];

  const clientStatusData = [
    { name: 'Quentes', value: clients.filter(c => c.status === 'quente').length, color: '#ef4444' },
    { name: 'Mornos', value: clients.filter(c => c.status === 'morno').length, color: '#f59e0b' },
    { name: 'Frios', value: clients.filter(c => c.status === 'frio').length, color: '#3b82f6' }
  ];

  const revenueData = sales
    .reduce((acc, sale) => {
      const month = new Date(sale.sale_date).toLocaleDateString('pt-BR', { month: 'short' });
      const existing = acc.find(a => a.month === month);
      if (existing) {
        existing.value += sale.sale_value || 0;
      } else {
        acc.push({ month, value: sale.sale_value || 0 });
      }
      return acc;
    }, [])
    .slice(-6);

  const renderWidget = (widgetType) => {
    switch (widgetType) {
      case 'kpi_cards':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Total Clientes</p>
                    <p className="text-3xl font-bold text-indigo-600">{kpis.totalClients}</p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Clientes Quentes</p>
                    <p className="text-3xl font-bold text-red-600">{kpis.hotClients}</p>
                  </div>
                  <Target className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Vendas Fechadas</p>
                    <p className="text-3xl font-bold text-green-600">{kpis.totalSales}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Receita Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                      R$ {(kpis.revenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'sales_funnel':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Funil de Vendas em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-15} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'revenue_chart':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Receita por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'client_status':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Status dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={clientStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'priority_leads':
        const topLeads = [...leads]
          .filter(l => l.ai_score > 0)
          .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
          .slice(0, 5);

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Leads Prioritários (IA)</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => base44.functions.invoke('autoLeadScoring', {}).then(() => {
                    queryClient.invalidateQueries(['leads']);
                    toast.success('Scores atualizados!');
                  })}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Recalcular
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topLeads.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum lead com score. Clique em "Recalcular".
                  </p>
                ) : (
                  topLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{lead.full_name}</p>
                        <p className="text-xs text-slate-600">{lead.company || lead.interest}</p>
                        <div className="flex gap-1 mt-1">
                          {lead.urgency === 'imediata' && (
                            <Badge className="bg-red-500 text-xs">🔥 Urgente</Badge>
                          )}
                          {lead.ai_score_breakdown?.engagement_score > 70 && (
                            <Badge className="bg-green-500 text-xs">Alto Engajamento</Badge>
                          )}
                          {lead.score_reasons?.some(r => r.impact === 'positive' && r.weight > 0.3) && (
                            <Badge className="bg-purple-500 text-xs">Alta Intenção</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          lead.ai_score >= 80 ? 'bg-red-500' :
                          lead.ai_score >= 60 ? 'bg-orange-500' : 'bg-blue-500'
                        }>
                          {Math.round(lead.ai_score)}
                        </Badge>
                        {lead.ai_score_breakdown && (
                          <p className="text-xs text-slate-500 mt-1">
                            Intent: {Math.round(lead.ai_score_breakdown.intent_score)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'tasks_summary':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pendentes</span>
                  <Badge className="bg-orange-500">{tasks.filter(t => t.status === 'pendente').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Concluídas</span>
                  <Badge className="bg-green-500">{tasks.filter(t => t.status === 'concluida').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Alta Prioridade</span>
                  <Badge className="bg-red-500">
                    {tasks.filter(t => t.priority === 'alta' && t.status === 'pendente').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Dashboard Customizável</CardTitle>
              <p className="text-indigo-100">Organize e visualize seus dados</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries()}
                className="bg-white/10 border-white/20 text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editMode ? handleSaveLayout() : setEditMode(true)}
                className="bg-white/10 border-white/20 text-white"
              >
                {editMode ? 'Salvar' : <Settings className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {editMode && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800">
              🎨 Modo de Edição: Arraste os widgets para reorganizar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Export Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold mr-2">Exportar:</p>
            {['clients', 'leads', 'sales', 'tasks'].map(type => (
              <div key={type} className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMutation.mutate({ format: 'csv', data_type: type })}
                >
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMutation.mutate({ format: 'excel', data_type: type })}
                >
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMutation.mutate({ format: 'pdf', data_type: type })}
                >
                  PDF
                </Button>
                <span className="text-xs text-slate-500 self-center ml-1">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div className="space-y-4">
            {widgets.map((widgetId) => (
              <SortableWidget key={widgetId} id={widgetId}>
                {renderWidget(widgetId)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}