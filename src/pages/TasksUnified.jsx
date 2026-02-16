import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertCircle,
  List, LayoutGrid, Zap, Search, Filter, TrendingUp, Brain, X
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function TasksUnified() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ 
    status: 'all',
    client: '',
    vendedor: '',
    priority: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPriority, setAiPriority] = useState(true);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    client_id: '',
    client_name: '',
    due_date: '',
    priority: 'media',
    status: 'pendente',
    type: 'follow_up'
  });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const calculateAIPriority = (task) => {
    let score = 0;
    const client = clients.find(c => c.id === task.client_id);
    const lead = leads.find(l => l.id === task.client_id);
    const entity = client || lead;
    
    if (!entity) return 50;
    if (entity.status === 'quente' || entity.ai_score > 70) score += 30;
    if (task.priority === 'alta') score += 20;
    if (task.due_date && new Date(task.due_date) < new Date()) score += 25;
    const today = new Date().toISOString().split('T')[0];
    if (task.due_date === today) score += 15;
    if (task.auto_created) score += 10;
    
    return Math.min(score, 100);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesClient = !filters.client || task.client_name?.toLowerCase().includes(filters.client.toLowerCase());
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesSearch = !searchTerm || 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (filters.dateRange !== 'all' && task.due_date) {
        const taskDate = new Date(task.due_date);
        const now = new Date();
        if (filters.dateRange === 'overdue') matchesDate = taskDate < now;
        else if (filters.dateRange === 'today') matchesDate = taskDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
        else if (filters.dateRange === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDate = taskDate >= now && taskDate <= weekFromNow;
        }
      }
      
      return matchesStatus && matchesClient && matchesPriority && matchesSearch && matchesDate;
    });
    
    if (aiPriority) {
      filtered = filtered.map(task => ({
        ...task,
        ai_priority_score: calculateAIPriority(task)
      })).sort((a, b) => b.ai_priority_score - a.ai_priority_score);
    }
    
    return filtered;
  }, [tasks, filters, searchTerm, aiPriority, clients, leads]);

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowForm(false);
      setEditingTask(null);
      toast.success('Tarefa criada!');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa atualizada!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
    }
  };

  const TaskCard = ({ task, showScore = false }) => (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm">{task.title}</h4>
          {showScore && aiPriority && task.ai_priority_score > 70 && (
            <Badge className="bg-red-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              {task.ai_priority_score}
            </Badge>
          )}
        </div>
        {task.client_name && <p className="text-xs text-slate-600">{task.client_name}</p>}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString('pt-BR')}
            </div>
          )}
          <Badge className={
            task.priority === 'alta' ? 'bg-red-500' :
            task.priority === 'media' ? 'bg-yellow-500' : 'bg-blue-500'
          }>{task.priority}</Badge>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setEditingTask(task);
            setTaskData(task);
            setShowForm(true);
          }}
        >
          Ver Detalhes
        </Button>
      </div>
    </Card>
  );

  const KanbanColumn = ({ status, title, tasks }) => (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-slate-100 rounded-lg p-3 mb-3">
        <h3 className="font-semibold flex items-center justify-between">
          {title}
          <Badge>{tasks.length}</Badge>
        </h3>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[500px]">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <TaskCard task={task} showScore={true} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  const CalendarView = () => {
    const tasksByDate = {};
    filteredAndSortedTasks.forEach(task => {
      if (task.due_date) {
        if (!tasksByDate[task.due_date]) tasksByDate[task.due_date] = [];
        tasksByDate[task.due_date].push(task);
      }
    });
    
    const today = new Date();
    const dates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {dates.map(date => (
          <Card key={date} className="p-3">
            <div className="text-center mb-2">
              <p className="text-xs text-slate-600">
                {new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })}
              </p>
              <p className="text-lg font-bold">{new Date(date).getDate()}</p>
            </div>
            <div className="space-y-1">
              {(tasksByDate[date] || []).map(task => (
                <div 
                  key={task.id}
                  className="text-xs p-1 bg-indigo-100 rounded cursor-pointer hover:bg-indigo-200"
                  onClick={() => {
                    setEditingTask(task);
                    setTaskData(task);
                    setShowForm(true);
                  }}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Gerenciamento de Tarefas
              </CardTitle>
              <p className="text-sm text-slate-600">
                {filteredAndSortedTasks.length} tarefas
                {aiPriority && ' • Priorização IA ativa'}
              </p>
            </div>
            <Button onClick={() => {
              setShowForm(true);
              setEditingTask(null);
              setTaskData({
                title: '', description: '', client_id: '', client_name: '',
                due_date: '', priority: 'media', status: 'pendente', type: 'follow_up'
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Input placeholder="Cliente..." value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} />
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
              <option value="all">Todos Status</option>
              <option value="pendente">Pendente</option>
              <option value="concluida">Concluída</option>
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
              <option value="all">Prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            <select value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
              <option value="all">Prazos</option>
              <option value="overdue">Atrasadas</option>
              <option value="today">Hoje</option>
              <option value="week">Próximos 7 dias</option>
            </select>
            <Button variant={aiPriority ? "default" : "outline"} onClick={() => setAiPriority(!aiPriority)} className="gap-2">
              <Brain className="w-4 h-4" />
              IA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="list"><List className="w-4 h-4 mr-2" />Lista</TabsTrigger>
              <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4 mr-2" />Kanban</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2" />Calendário</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="list" className="mt-0 space-y-2">
                {filteredAndSortedTasks.map(task => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          {aiPriority && task.ai_priority_score > 70 && (
                            <Badge className="bg-red-500"><Zap className="w-3 h-3 mr-1" />Prioridade IA</Badge>
                          )}
                        </div>
                        {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
                        <div className="flex items-center gap-3 text-sm">
                          {task.client_name && <div className="flex items-center gap-1"><User className="w-4 h-4" />{task.client_name}</div>}
                          {task.due_date && <div className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" />{new Date(task.due_date).toLocaleDateString('pt-BR')}</div>}
                          <Badge className={task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-yellow-500' : 'bg-blue-500'}>{task.priority}</Badge>
                          <Badge className={task.status === 'concluida' ? 'bg-green-600' : 'bg-orange-600'}>{task.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'pendente' && (
                          <Button size="sm" onClick={() => updateTaskMutation.mutate({ id: task.id, data: { status: 'concluida' }})}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setEditingTask(task); setTaskData(task); setShowForm(true); }}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="kanban" className="mt-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    <KanbanColumn status="pendente" title="Pendentes" tasks={filteredAndSortedTasks.filter(t => t.status === 'pendente')} />
                    <KanbanColumn status="concluida" title="Concluídas" tasks={filteredAndSortedTasks.filter(t => t.status === 'concluida')} />
                    <KanbanColumn status="cancelada" title="Canceladas" tasks={filteredAndSortedTasks.filter(t => t.status === 'cancelada')} />
                  </div>
                </DragDropContext>
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                <CalendarView />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} required />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={taskData.description} onChange={(e) => setTaskData({...taskData, description: e.target.value})} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Input value={taskData.client_name} onChange={(e) => setTaskData({...taskData, client_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input type="date" value={taskData.due_date} onChange={(e) => setTaskData({...taskData, due_date: e.target.value})} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridade</Label>
                    <select value={taskData.priority} onChange={(e) => setTaskData({...taskData, priority: e.target.value})} className="w-full border rounded-md px-3 py-2">
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select value={taskData.status} onChange={(e) => setTaskData({...taskData, status: e.target.value})} className="w-full border rounded-md px-3 py-2">
                      <option value="pendente">Pendente</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingTask ? 'Atualizar' : 'Criar'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}