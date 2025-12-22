import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Tasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 100)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Task.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa atualizada!');
    }
  });

  const pendingTasks = tasks.filter(t => t.status === 'pendente');
  const completedTasks = tasks.filter(t => t.status === 'concluida');

  const priorityColors = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-yellow-100 text-yellow-700',
    baixa: 'bg-blue-100 text-blue-700'
  };

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
            <p className="text-sm text-indigo-100">{pendingTasks.length} pendentes</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
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
            <h3 className="font-semibold text-slate-700 mb-3">Pendentes</h3>
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => updateMutation.mutate({ id: task.id, status: 'concluida' })}
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
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(createPageUrl(`ClientProfile?id=${task.client_id}`))}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {task.client_name}
                        </button>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(task.due_date), 'dd/MM/yyyy')}
                        </span>
                        <Badge className={priorityColors[task.priority]} variant="outline">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Concluídas</h3>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map(task => (
                <Card key={task.id} className="p-3 bg-slate-50 opacity-60">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 line-through">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.client_name}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Nenhuma tarefa cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}