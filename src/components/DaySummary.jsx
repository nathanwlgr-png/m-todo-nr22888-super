import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckSquare, Calendar, Users, AlertTriangle, Clock } from 'lucide-react';

export default function DaySummary() {
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [] } = useQuery({
    queryKey: ['day-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }),
    staleTime: 60000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['day-visits'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
    staleTime: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['day-alerts'],
    queryFn: () => base44.entities.Alert?.filter({ read: false }).catch(() => []),
    staleTime: 60000,
  });

  const overdueToday = tasks.filter(t => t.due_date && t.due_date <= today);
  const visitsToday = visits.filter(v => v.scheduled_date && v.scheduled_date.startsWith(today));
  const hotTasks = tasks.filter(t => t.priority === 'alta');

  const items = [
    {
      to: 'TasksUnified',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      count: overdueToday.length,
      label: 'Tarefas vencidas',
    },
    {
      to: 'ScheduledAgenda',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
      count: visitsToday.length,
      label: 'Visitas hoje',
    },
    {
      to: 'TasksUnified',
      icon: CheckSquare,
      color: 'text-orange-600 bg-orange-50',
      count: hotTasks.length,
      label: 'Tarefas urgentes',
    },
    {
      to: 'NotificationSettings',
      icon: AlertTriangle,
      color: 'text-purple-600 bg-purple-50',
      count: alerts.length,
      label: 'Alertas novos',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map(({ to, icon: Icon, color, count, label }) => (
        <Link key={label} to={createPageUrl(to)}>
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 leading-tight">{label}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}