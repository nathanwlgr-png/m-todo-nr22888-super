import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Filter,
  X,
  UserPlus,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function Tasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 200)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa atualizada!');
    }
  });

  const handleAssignTask = () => {
    if (!selectedTask || !selectedUser) return;

    const user = users.find(u => u.email === selectedUser);
    updateMutation.mutate({
      id: selectedTask.id,
      data: {
        assigned_to: user.email,
        assigned_to_name: user.full_name
      }
    });
    setAssignDialogOpen(false);
    setSelectedTask(null);
    setSelectedUser('');
  };

  const openAssignDialog = (task) => {
    setSelectedTask(task);
    setSelectedUser(task.assigned_to || '');
    setAssignDialogOpen(true);
  };

  // Aplicar filtros
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status
      if (filters.status !== 'all' && task.status !== filters.status) return false;

      // Prioridade
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

      // Responsável
      if (filters.assignee === 'me' && task.assigned_to !== currentUser?.email) return false;
      if (filters.assignee === 'unassigned' && task.assigned_to) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'me' && filters.assignee !== 'unassigned' && task.assigned_to !== filters.assignee) return false;

      // Data inicial
      if (filters.dateFrom && task.due_date < filters.dateFrom) return false;

      // Data final
      if (filters.dateTo && task.due_date > filters.dateTo) return false;

      // Busca por texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title?.toLowerCase().includes(searchLower) ||
          task.client_name?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [tasks, filters, currentUser]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'pendente');
  const completedTasks = filteredTasks.filter(t => t.status === 'concluida');

  const priorityColors = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-yellow-100 text-yellow-700',
    baixa: 'bg-blue-100 text-blue-700'
  };

  const getTaskUrgency = (dueDate) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { label: 'Vencida', color: 'text-red-600', icon: AlertCircle };
    if (days === 0) return { label: 'Hoje', color: 'text-orange-600', icon: Clock };
    if (days <= 3) return { label: `${days}d`, color: 'text-amber-600', icon: Clock };
    return { label: format(parseISO(dueDate), 'dd/MM'), color: 'text-slate-500', icon: CalendarIcon };
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.priority !== 'all' || 
    filters.assignee !== 'all' || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.search;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Tarefas</h1>
            <p className="text-sm text-indigo-100">
              {pendingTasks.length} pendentes de {filteredTasks.length} total
            </p>
          </div>
          <Link to={createPageUrl('TaskCalendar')}>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Calendário
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-800">Filtros</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {/* Busca */}
            <div>
              <Label className="text-xs">Buscar</Label>
              <Input
                placeholder="Título, cliente ou descrição..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="h-9"
              />
            </div>

            {/* Filtros em linha */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Prioridade</Label>
                <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">De</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-xs">Até</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Responsável</Label>
              <Select value={filters.assignee} onValueChange={(v) => setFilters({ ...filters, assignee: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="me">Minhas tarefas</SelectItem>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Auto Tasks Notice */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Automações Ativas</p>
              <p className="text-xs text-slate-600">Tarefas criadas automaticamente após visitas</p>
            </div>
          </div>
        </Card>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Pendentes ({pendingTasks.length})</h3>
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const urgency = getTaskUrgency(task.due_date);
                const UrgencyIcon = urgency.icon;

                return (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => updateMutation.mutate({ id: task.id, data: { status: 'concluida' } })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800">{task.title}</p>
                          {task.auto_created && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => navigate(createPageUrl(`ClientProfile?id=${task.client_id}`))}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {task.client_name}
                          </button>
                          <span className="text-slate-300">•</span>
                          <div className={`flex items-center gap-1 text-xs ${urgency.color}`}>
                            <UrgencyIcon className="w-3 h-3" />
                            {urgency.label}
                          </div>
                          <Badge className={priorityColors[task.priority]} variant="outline">
                            {task.priority}
                          </Badge>
                          {task.assigned_to_name && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {task.assigned_to_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignDialog(task)}
                        className="shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Concluídas ({completedTasks.length})</h3>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map(task => (
                <Card key={task.id} className="p-3 bg-slate-50 opacity-60">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 line-through">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{task.client_name}</p>
                        {task.assigned_to_name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <p className="text-xs text-slate-500">{task.assigned_to_name}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">Nenhuma tarefa encontrada</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTask && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-800 mb-1">{selectedTask.title}</p>
                <p className="text-sm text-slate-600">{selectedTask.client_name}</p>
              </div>
            )}

            <div>
              <Label>Responsável</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem responsável</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAssignTask}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Atribuir
              </Button>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}