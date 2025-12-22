import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, X, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TaskNotifications() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 100),
    refetchInterval: 60000 // Atualiza a cada minuto
  });

  // Filtrar tarefas próximas ao vencimento (3 dias ou menos)
  const upcomingTasks = tasks.filter(task => {
    if (task.status !== 'pendente') return false;
    if (dismissed.includes(task.id)) return false;
    if (task.assigned_to && task.assigned_to !== user?.email) return false;

    const daysUntilDue = differenceInDays(parseISO(task.due_date), new Date());
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  });

  // Filtrar tarefas vencidas
  const overdueTasks = tasks.filter(task => {
    if (task.status !== 'pendente') return false;
    if (dismissed.includes(task.id)) return false;
    if (task.assigned_to && task.assigned_to !== user?.email) return false;

    const daysUntilDue = differenceInDays(parseISO(task.due_date), new Date());
    return daysUntilDue < 0;
  });

  const allNotifications = [...overdueTasks, ...upcomingTasks];

  const handleDismiss = (taskId) => {
    setDismissed(prev => [...prev, taskId]);
  };

  if (allNotifications.length === 0) return null;

  return (
    <>
      {/* Floating notification bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-orange-600 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-all"
      >
        <Bell className="w-5 h-5 text-white" />
        {allNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {allNotifications.length}
          </span>
        )}
      </button>

      {/* Notifications panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-40 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-slate-800">Notificações</h3>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="p-3 space-y-2">
            {overdueTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-2">🔴 Vencidas</p>
                {overdueTasks.map(task => (
                  <Card key={task.id} className="p-3 mb-2 border-red-200 bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800">{task.title}</p>
                        <p className="text-xs text-slate-600">{task.client_name}</p>
                      </div>
                      <button
                        onClick={() => handleDismiss(task.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-red-700">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(createPageUrl(`ClientProfile?id=${task.client_id}`));
                        }}
                        className="h-6 text-xs bg-red-600 hover:bg-red-700"
                      >
                        Ver
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 mb-2">⚠️ Próximas</p>
                {upcomingTasks.map(task => {
                  const daysLeft = differenceInDays(parseISO(task.due_date), new Date());
                  return (
                    <Card key={task.id} className="p-3 mb-2 border-amber-200 bg-amber-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-600">{task.client_name}</p>
                        </div>
                        <button
                          onClick={() => handleDismiss(task.id)}
                          className="p-1 hover:bg-amber-100 rounded"
                        >
                          <X className="w-3 h-3 text-amber-500" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-amber-700">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(createPageUrl(`ClientProfile?id=${task.client_id}`));
                          }}
                          className="h-6 text-xs bg-amber-600 hover:bg-amber-700"
                        >
                          Ver
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}