import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Target,
  Plus,
  Users,
  User,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  Loader2,
  Save
} from 'lucide-react';

const metricLabels = {
  sales_value: 'Valor de Vendas',
  sales_count: 'Número de Vendas',
  visits_count: 'Número de Visitas',
  tasks_count: 'Tarefas Concluídas',
  conversion_rate: 'Taxa de Conversão'
};

export default function Goals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'individual',
    metric_type: 'sales_value',
    target_value: 0,
    start_date: '',
    end_date: '',
    reward_points: 100
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.SalesGoal.list('-created_date', 100)
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goal_type: 'individual',
      metric_type: 'sales_value',
      target_value: 0,
      start_date: '',
      end_date: '',
      reward_points: 100
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.end_date) {
      alert('Preencha título e data final');
      return;
    }

    const goalData = {
      ...formData,
      assigned_to: formData.goal_type === 'individual' ? currentUser?.email : null
    };

    createMutation.mutate(goalData);
  };

  const myGoals = useMemo(() => {
    if (!currentUser) return [];
    return goals.filter(g => 
      (g.goal_type === 'individual' && g.assigned_to === currentUser.email) ||
      g.goal_type === 'team'
    );
  }, [goals, currentUser]);

  const activeGoals = myGoals.filter(g => g.status === 'active');
  const completedGoals = myGoals.filter(g => g.status === 'completed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Metas</h1>
            <p className="text-sm text-indigo-200">Individuais e equipe</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{activeGoals.length}</p>
            <p className="text-xs text-indigo-200">Metas Ativas</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{completedGoals.length}</p>
            <p className="text-xs text-indigo-200">Completadas</p>
          </Card>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Active Goals */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Metas Ativas</h3>
          {activeGoals.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Nenhuma meta ativa</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGoals.map(goal => {
                const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
                const isTeam = goal.goal_type === 'team';

                return (
                  <Card key={goal.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800">{goal.title}</h4>
                          <Badge variant="outline" className={isTeam ? 'text-purple-600' : 'text-indigo-600'}>
                            {isTeam ? <Users className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                            {isTeam ? 'Equipe' : 'Individual'}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-slate-600">{goal.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">{metricLabels[goal.metric_type]}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {goal.current_value} / {goal.target_value}
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <p className="text-xs text-slate-500 mt-1">{progress.toFixed(0)}% completo</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Até {new Date(goal.end_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        +{goal.reward_points} pontos
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Metas Completadas
            </h3>
            <div className="space-y-2">
              {completedGoals.map(goal => (
                <Card key={goal.id} className="p-3 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{goal.title}</p>
                      <p className="text-xs text-slate-600">{metricLabels[goal.metric_type]}</p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      +{goal.reward_points} pts
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Fechar 5 vendas este mês"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
                >
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
                <Label>Métrica</Label>
                <Select
                  value={formData.metric_type}
                  onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(metricLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Valor Alvo *</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Recompensa (pontos)</Label>
              <Input
                type="number"
                value={formData.reward_points}
                onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) })}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Meta
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}