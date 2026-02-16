import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Settings, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Calendar,
  Activity,
  Download,
  Plus,
  GripVertical,
  X,
  Eye,
  EyeOff,
  Share2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CustomizableDashboard() {
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : [
      { id: 'sales', type: 'sales_overview', visible: true, position: 0 },
      { id: 'clients', type: 'client_metrics', visible: true, position: 1 },
      { id: 'goals', type: 'goals_progress', visible: true, position: 2 },
      { id: 'trends', type: 'sales_trends', visible: true, position: 3 }
    ];
  });
  
  const [dateRange, setDateRange] = useState('30');
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['sales-goals'],
    queryFn: () => base44.entities.SalesGoal.list(),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list(),
  });

  const filteredData = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return {
      sales: sales.filter(s => new Date(s.sale_date) >= cutoffDate),
      interactions: interactions.filter(i => new Date(i.created_date) >= cutoffDate),
      visits: visits.filter(v => new Date(v.scheduled_date) >= cutoffDate)
    };
  }, [sales, interactions, visits, dateRange]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredData.sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgDealSize = filteredData.sales.length > 0 ? totalRevenue / filteredData.sales.length : 0;
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const conversionRate = clients.length > 0 ? (filteredData.sales.length / clients.length * 100) : 0;

    // Weekly trend
    const weeklyData = [];
    for (let i = 0; i < parseInt(dateRange) / 7; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      
      const weekSales = filteredData.sales.filter(s => {
        const date = new Date(s.sale_date);
        return date >= weekStart && date < weekEnd;
      });
      
      const weekInteractions = filteredData.interactions.filter(i => {
        const date = new Date(i.created_date);
        return date >= weekStart && date < weekEnd;
      });

      weeklyData.unshift({
        week: `Sem ${Math.floor(parseInt(dateRange) / 7) - i}`,
        vendas: weekSales.length,
        interacoes: weekInteractions.length,
        receita: weekSales.reduce((sum, s) => sum + (s.sale_value || 0), 0)
      });
    }

    // Client status distribution
    const statusData = [
      { name: 'Quentes', value: clients.filter(c => c.status === 'quente').length },
      { name: 'Mornos', value: clients.filter(c => c.status === 'morno').length },
      { name: 'Frios', value: clients.filter(c => c.status === 'frio').length }
    ];

    return {
      totalRevenue,
      avgDealSize,
      hotClients,
      conversionRate,
      totalSales: filteredData.sales.length,
      totalInteractions: filteredData.interactions.length,
      weeklyData,
      statusData
    };
  }, [clients, filteredData, dateRange]);

  const saveWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboard_widgets', JSON.stringify(newWidgets));
    toast.success('Layout salvo!');
  };

  const toggleWidget = (id) => {
    const updated = widgets.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    saveWidgets(updated);
  };

  const exportDashboard = async () => {
    const reportData = {
      period: `${dateRange} dias`,
      generated_at: new Date().toISOString(),
      metrics: {
        revenue: metrics.totalRevenue,
        sales: metrics.totalSales,
        conversion_rate: metrics.conversionRate.toFixed(1),
        hot_clients: metrics.hotClients
      },
      weekly_trend: metrics.weeklyData,
      status_distribution: metrics.statusData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${dateRange}dias_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Relatório exportado!');
  };

  const shareDashboard = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado para compartilhar!');
  };

  const renderWidget = (widget) => {
    if (!widget.visible) return null;

    switch (widget.type) {
      case 'sales_overview':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Visão Geral de Vendas</CardTitle>
              {editMode && (
                <Button size="icon" variant="ghost" onClick={() => toggleWidget(widget.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Vendas</p>
                  <p className="text-2xl font-bold text-indigo-600">{metrics.totalSales}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {metrics.avgDealSize.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'client_metrics':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Métricas de Clientes</CardTitle>
              {editMode && (
                <Button size="icon" variant="ghost" onClick={() => toggleWidget(widget.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={metrics.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <Badge className="bg-red-500">Quentes</Badge>
                  <p className="text-xl font-bold mt-1">{metrics.statusData[0]?.value || 0}</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-orange-500">Mornos</Badge>
                  <p className="text-xl font-bold mt-1">{metrics.statusData[1]?.value || 0}</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-blue-500">Frios</Badge>
                  <p className="text-xl font-bold mt-1">{metrics.statusData[2]?.value || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'goals_progress':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Progresso de Metas</CardTitle>
              {editMode && (
                <Button size="icon" variant="ghost" onClick={() => toggleWidget(widget.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {goals.filter(g => g.status === 'active').length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma meta ativa</p>
              ) : (
                <div className="space-y-3">
                  {goals.filter(g => g.status === 'active').map(goal => {
                    const progress = (goal.current_value / goal.target_value) * 100;
                    return (
                      <div key={goal.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{goal.title}</span>
                          <span className="font-semibold">
                            {goal.current_value} / {goal.target_value}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {progress.toFixed(0)}% completo
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'sales_trends':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tendências de Vendas</CardTitle>
              {editMode && (
                <Button size="icon" variant="ghost" onClick={() => toggleWidget(widget.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="vendas" stackId="1" stroke="#4f46e5" fill="#4f46e5" name="Vendas" />
                  <Area type="monotone" dataKey="interacoes" stackId="2" stroke="#10b981" fill="#10b981" name="Interações" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dashboard Interativo</h2>
                <p className="text-sm text-slate-600">Personalize seus indicadores</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {editMode ? 'Salvar' : 'Editar'}
              </Button>

              <Button variant="outline" size="sm" onClick={exportDashboard}>
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>

              <Button variant="outline" size="sm" onClick={shareDashboard}>
                <Share2 className="w-4 h-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </div>

          {editMode && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <p className="text-sm font-semibold mb-2">Widgets Disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {widgets.map(w => (
                  <Badge
                    key={w.id}
                    variant={w.visible ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleWidget(w.id)}
                  >
                    {w.visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {w.type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets
          .sort((a, b) => a.position - b.position)
          .map(widget => (
            <div key={widget.id}>
              {renderWidget(widget)}
            </div>
          ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto text-indigo-600 mb-2" />
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-xs text-slate-600">Total Clientes</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{metrics.totalSales}</p>
              <p className="text-xs text-slate-600">Vendas ({dateRange}d)</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Target className="w-6 h-6 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold">{metrics.hotClients}</p>
              <p className="text-xs text-slate-600">Clientes Quentes</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{metrics.totalInteractions}</p>
              <p className="text-xs text-slate-600">Interações ({dateRange}d)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}