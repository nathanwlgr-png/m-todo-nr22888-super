import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ScheduledMessagesWidget from '@/components/ScheduledMessagesWidget';

const priorityColors = {
  alta: 'bg-red-100 text-red-700 border-red-300',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  baixa: 'bg-blue-100 text-blue-700 border-blue-300'
};

const typeIcons = {
  follow_up: Clock,
  ligacao: AlertCircle,
  visita: CalendarIcon,
  outro: CheckCircle2
};

export default function TaskCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 200)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.Task.update(id, { status: status === 'pendente' ? 'concluida' : 'pendente' }),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentMonth), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Tasks by date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = task.due_date;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  // Stats
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const pending = tasks.filter(t => t.status === 'pendente').length;
    const overdue = tasks.filter(t => 
      t.status === 'pendente' && t.due_date && t.due_date < today
    ).length;
    const todayTasks = tasksByDate[today]?.filter(t => t.status === 'pendente').length || 0;

    return { pending, overdue, todayTasks };
  }, [tasks, tasksByDate]);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.first_name || 'Cliente';
  };

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
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Calendário de Tarefas</h1>
            <p className="text-sm text-indigo-200">Organize seu dia</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{stats.todayTasks}</p>
            <p className="text-xs text-indigo-200">Hoje</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-xs text-indigo-200">Pendentes</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{stats.overdue}</p>
            <p className="text-xs text-indigo-200">Atrasadas</p>
          </Card>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Mensagens Estruturadas */}
        <ScheduledMessagesWidget />
        
        {/* Month Navigation */}
        <Card className="p-4 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-800">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[dateKey] || [];
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 rounded-lg text-xs transition-all
                    ${isSelected ? 'bg-indigo-600 text-white font-bold' : 
                      isToday ? 'bg-orange-100 border-2 border-orange-500 font-semibold' :
                      'hover:bg-slate-100'}
                    ${!isCurrentMonth && 'text-slate-300'}
                  `}
                >
                  <div>{day.getDate()}</div>
                  {dayTasks.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-indigo-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tasks for Selected Date */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            <Badge variant="outline">{selectedDateTasks.length} tarefas</Badge>
          </h3>

          {selectedDateTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Nenhuma tarefa para este dia</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {selectedDateTasks.map(task => {
                const Icon = typeIcons[task.type] || CheckCircle2;
                const isOverdue = task.status === 'pendente' && task.due_date < format(new Date(), 'yyyy-MM-dd');

                return (
                  <Card
                    key={task.id}
                    className={`p-4 ${task.status === 'concluida' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.status === 'concluida'}
                        onCheckedChange={() => toggleTaskMutation.mutate({ 
                          id: task.id, 
                          status: task.status 
                        })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <h4 className={`font-semibold text-slate-800 ${
                            task.status === 'concluida' ? 'line-through' : ''
                          }`}>
                            {task.title}
                          </h4>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(createPageUrl(`ClientProfile?id=${task.client_id}`))}
                            className="h-auto p-0 text-xs text-indigo-600"
                          >
                            {getClientName(task.client_id)}
                          </Button>
                          {isOverdue && (
                            <Badge variant="outline" className="text-red-600 border-red-300">
                              Atrasada
                            </Badge>
                          )}
                          {task.auto_created && (
                            <Badge variant="outline" className="text-purple-600">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}