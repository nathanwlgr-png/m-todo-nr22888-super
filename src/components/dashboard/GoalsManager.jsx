import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function GoalsManager() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    goal_type: 'individual',
    metric_type: 'sales_value',
    target_value: '',
    end_date: '',
    reward_points: 100
  });

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['sales-goals'],
    queryFn: () => base44.entities.SalesGoal.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-goals']);
      toast.success('Meta criada!');
      setOpen(false);
      setFormData({
        title: '',
        goal_type: 'individual',
        metric_type: 'sales_value',
        target_value: '',
        end_date: '',
        reward_points: 100
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.SalesGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-goals']);
      toast.success('Meta removida!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const goalData = {
      ...formData,
      target_value: parseFloat(formData.target_value),
      start_date: new Date().toISOString().split('T')[0],
      assigned_to: formData.goal_type === 'individual' ? user?.email : null
    };
    createGoalMutation.mutate(goalData);
  };

  const metricLabels = {
    sales_value: 'Valor de Vendas',
    sales_count: 'Número de Vendas',
    visits_count: 'Número de Visitas',
    tasks_count: 'Tarefas Concluídas',
    conversion_rate: 'Taxa de Conversão'
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-600" />
              <div>
                <CardTitle>Gerenciador de Metas</CardTitle>
                <p className="text-sm text-slate-600">Defina e acompanhe objetivos</p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Título da Meta</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Atingir 10 vendas no mês"
                      required
                    />
                  </div>

                  <div>
                    <Label>Tipo de Meta</Label>
                    <Select
                      value={formData.goal_type}
                      onValueChange={(value) => setFormData({...formData, goal_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="team">Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Métrica</Label>
                    <Select
                      value={formData.metric_type}
                      onValueChange={(value) => setFormData({...formData, metric_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_value">Valor de Vendas</SelectItem>
                        <SelectItem value="sales_count">Número de Vendas</SelectItem>
                        <SelectItem value="visits_count">Visitas Realizadas</SelectItem>
                        <SelectItem value="tasks_count">Tarefas Concluídas</SelectItem>
                        <SelectItem value="conversion_rate">Taxa de Conversão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Valor Alvo</Label>
                    <Input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                      placeholder="100000"
                      required
                    />
                  </div>

                  <div>
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label>Pontos de Recompensa</Label>
                    <Input
                      type="number"
                      value={formData.reward_points}
                      onChange={(e) => setFormData({...formData, reward_points: e.target.value})}
                      placeholder="100"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Criar Meta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metas Ativas ({activeGoals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhuma meta ativa. Crie sua primeira meta!
            </p>
          ) : (
            <div className="space-y-4">
              {activeGoals.map(goal => {
                const progress = (goal.current_value / goal.target_value) * 100;
                const daysLeft = Math.ceil((new Date(goal.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={goal.id} className="bg-gradient-to-r from-white to-slate-50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {metricLabels[goal.metric_type]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {goal.goal_type === 'individual' ? 'Individual' : 'Time'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Progresso</span>
                          <span className="font-semibold">
                            {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              progress >= 100 ? 'bg-green-600' :
                              progress >= 75 ? 'bg-indigo-600' :
                              progress >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>{progress.toFixed(0)}% completo</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo expirado'}
                          </span>
                        </div>
                      </div>

                      {goal.reward_points > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Recompensa: {goal.reward_points} pontos
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metas Concluídas ({completedGoals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGoals.map(goal => (
                <div key={goal.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-green-900">{goal.title}</p>
                      <p className="text-xs text-green-700">
                        {goal.current_value} / {goal.target_value} - {metricLabels[goal.metric_type]}
                      </p>
                    </div>
                    <Badge className="bg-green-600">Concluída ✓</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}