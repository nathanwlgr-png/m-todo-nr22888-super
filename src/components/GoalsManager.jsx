import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Loader2, TrendingUp, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    goal_type: 'individual',
    metric_type: 'sales_value',
    target_value: 0,
    end_date: '',
    reward_points: 100
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.SalesGoal.list()
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

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('Meta criada!');
      setDialogOpen(false);
      setNewGoal({ title: '', goal_type: 'individual', metric_type: 'sales_value', target_value: 0, end_date: '', reward_points: 100 });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalesGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  // Calculate current value for each goal
  const calculateCurrentValue = (goal) => {
    const now = new Date();
    const startDate = goal.start_date ? new Date(goal.start_date) : new Date(0);
    const endDate = new Date(goal.end_date);

    const isMyGoal = goal.goal_type === 'individual' && goal.assigned_to === user?.email;
    const isTeamGoal = goal.goal_type === 'team';

    if (!isMyGoal && !isTeamGoal) return 0;

    const relevantSales = sales.filter(s => {
      const saleDate = new Date(s.created_date);
      const dateMatch = saleDate >= startDate && saleDate <= endDate;
      if (goal.goal_type === 'individual') {
        return dateMatch && s.created_by === user?.email;
      }
      return dateMatch;
    });

    const relevantVisits = visits.filter(v => {
      const visitDate = new Date(v.created_date);
      const dateMatch = visitDate >= startDate && visitDate <= endDate;
      if (goal.goal_type === 'individual') {
        return dateMatch && v.created_by === user?.email;
      }
      return dateMatch;
    });

    const relevantTasks = tasks.filter(t => {
      const taskDate = new Date(t.created_date);
      const dateMatch = taskDate >= startDate && taskDate <= endDate;
      if (goal.goal_type === 'individual') {
        return dateMatch && t.created_by === user?.email;
      }
      return dateMatch;
    });

    switch (goal.metric_type) {
      case 'sales_value':
        return relevantSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      case 'sales_count':
        return relevantSales.filter(s => s.status === 'fechada').length;
      case 'visits_count':
        return relevantVisits.filter(v => v.status === 'realizada').length;
      case 'tasks_count':
        return relevantTasks.filter(t => t.status === 'concluida').length;
      case 'conversion_rate':
        const converted = relevantSales.filter(s => s.status === 'fechada').length;
        return relevantVisits.length > 0 ? (converted / relevantVisits.length) * 100 : 0;
      default:
        return 0;
    }
  };

  const myGoals = goals.filter(g => 
    (g.goal_type === 'individual' && g.assigned_to === user?.email) ||
    (g.goal_type === 'team')
  ).filter(g => g.status === 'active');

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.target_value || !newGoal.end_date) {
      toast.error('Preencha todos os campos');
      return;
    }

    createGoalMutation.mutate({
      ...newGoal,
      assigned_to: newGoal.goal_type === 'individual' ? user.email : null,
      start_date: new Date().toISOString().split('T')[0],
      current_value: 0,
      status: 'active'
    });
  };

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h4 className="font-bold">Minhas Metas</h4>
          </div>
          <Badge className="bg-white text-purple-700">{myGoals.length} ativas</Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-white text-purple-700 hover:bg-white/90 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Ex: Fechar 10 vendas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Equipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Métrica *</Label>
                  <Select value={newGoal.metric_type} onValueChange={(v) => setNewGoal({ ...newGoal, metric_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_value">Receita (R$)</SelectItem>
                      <SelectItem value="sales_count">Nº Vendas</SelectItem>
                      <SelectItem value="visits_count">Nº Visitas</SelectItem>
                      <SelectItem value="tasks_count">Nº Tarefas</SelectItem>
                      <SelectItem value="conversion_rate">Taxa Conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor Alvo *</Label>
                  <Input
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Pontos Recompensa</Label>
                  <Input
                    type="number"
                    value={newGoal.reward_points}
                    onChange={(e) => setNewGoal({ ...newGoal, reward_points: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Data Término *</Label>
                <Input
                  type="date"
                  value={newGoal.end_date}
                  onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                />
              </div>

              <Button
                onClick={handleCreateGoal}
                disabled={createGoalMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {createGoalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Criar Meta'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Active Goals */}
      {myGoals.map(goal => {
        const currentValue = calculateCurrentValue(goal);
        const progress = (currentValue / goal.target_value) * 100;
        const isCompleted = progress >= 100;

        return (
          <Card key={goal.id} className={`p-4 ${isCompleted ? 'bg-green-50 border-2 border-green-300' : 'bg-white'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900">{goal.title}</p>
                  {goal.goal_type === 'team' && (
                    <Badge className="bg-purple-600 text-white text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Equipe
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Até {new Date(goal.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {isCompleted && (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">Progresso</span>
                <span className="font-bold text-slate-900">
                  {goal.metric_type === 'sales_value' && 'R$ '}
                  {currentValue.toLocaleString('pt-BR')}
                  {goal.metric_type === 'conversion_rate' && '%'}
                  {' / '}
                  {goal.metric_type === 'sales_value' && 'R$ '}
                  {goal.target_value.toLocaleString('pt-BR')}
                  {goal.metric_type === 'conversion_rate' && '%'}
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            {isCompleted && (
              <div className="bg-green-100 rounded-lg p-2 border border-green-300">
                <p className="text-xs font-semibold text-green-800">
                  🎉 Meta concluída! +{goal.reward_points} pontos
                </p>
              </div>
            )}
          </Card>
        );
      })}

      {myGoals.length === 0 && (
        <Card className="p-6 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma meta ativa</p>
          <p className="text-xs text-slate-400 mt-1">Crie sua primeira meta para começar!</p>
        </Card>
      )}
    </div>
  );
}