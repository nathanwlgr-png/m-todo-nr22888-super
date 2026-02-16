import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, Check, TrendingUp, Users, Calendar, FileText, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const ICON_MAP = {
  high_score_lead: TrendingUp,
  lead_inactive: AlertTriangle,
  task_overdue: Calendar,
  client_cold: Users,
  goal_achieved: TrendingUp,
  goal_near_deadline: Calendar,
  hot_client_inactive: Users,
  visit_reminder: Calendar,
  proposal_viewed: FileText
};

const COLOR_MAP = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baixa: 'bg-blue-500'
};

export default function NotificationCenter({ onSettingsClick }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['alerts', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Alert.filter({ user_email: user.email });
    },
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Notificação dispensada');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const promises = unreadAlerts.map(a => 
        base44.entities.Alert.update(a.id, { read: true })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Todas marcadas como lidas');
    }
  });

  useEffect(() => {
    if (unreadAlerts.length > 0) {
      const latestAlert = unreadAlerts[0];
      if (latestAlert.created_date && new Date(latestAlert.created_date) > new Date(Date.now() - 5000)) {
        toast.info(latestAlert.title, {
          description: latestAlert.message,
          duration: 5000
        });
      }
    }
  }, [alerts]);

  const getIcon = (type) => {
    const Icon = ICON_MAP[type] || Bell;
    return Icon;
  };

  const formatTime = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diff = now - alertDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </DialogTitle>
              <div className="flex items-center gap-2">
                {onSettingsClick && (
                  <Button size="icon" variant="ghost" onClick={() => {
                    setOpen(false);
                    onSettingsClick();
                  }}>
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
                {unreadAlerts.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => markAllAsReadMutation.mutate()}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map(alert => {
                    const Icon = getIcon(alert.type);
                    return (
                      <Card 
                        key={alert.id}
                        className={`${alert.read ? 'bg-slate-50' : 'bg-white border-l-4 border-l-indigo-500'}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${COLOR_MAP[alert.priority]} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold ${alert.read ? 'text-slate-600' : 'text-slate-900'}`}>
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {formatTime(alert.created_date)}
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => dismissMutation.mutate(alert.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>

                              {alert.link_to && (
                                <Link 
                                  to={createPageUrl(alert.link_to)}
                                  onClick={() => {
                                    markAsReadMutation.mutate(alert.id);
                                    setOpen(false);
                                  }}
                                >
                                  <Button size="sm" variant="link" className="h-auto p-0 mt-2 text-xs">
                                    Ver detalhes →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}