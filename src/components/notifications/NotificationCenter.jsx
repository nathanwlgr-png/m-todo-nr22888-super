import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Settings, Check, X, Calendar, TrendingUp, Users, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Alert.filter({ user_email: user.email });
    },
    refetchInterval: 30000 // Atualiza a cada 30s
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { dismissed: true, read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Notificação dispensada');
    }
  });

  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed);
  const readAlerts = alerts.filter(a => a.read && !a.dismissed).slice(0, 10);

  const getIcon = (type) => {
    switch (type) {
      case 'high_score_lead': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'lead_inactive': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'task_overdue': return <Calendar className="w-4 h-4 text-red-600" />;
      case 'client_cold': return <Users className="w-4 h-4 text-blue-600" />;
      case 'goal_achieved': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'visit_reminder': return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'proposal_viewed': return <FileText className="w-4 h-4 text-teal-600" />;
      default: return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const handleAlertClick = (alert) => {
    markAsReadMutation.mutate(alert.id);
    if (alert.link_to) {
      navigate(createPageUrl(alert.link_to));
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="w-5 h-5" />
        {unreadAlerts.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
            {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Central de Notificações
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('NotificationSettings'))}
              >
                <Settings className="w-4 h-4 mr-1" />
                Configurar
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Unread Alerts */}
            {unreadAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-2">
                  Não Lidas ({unreadAlerts.length})
                </h3>
                <div className="space-y-2">
                  {unreadAlerts.map(alert => (
                    <Card
                      key={alert.id}
                      className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
                        alert.priority === 'alta' ? 'border-l-red-500' :
                        alert.priority === 'media' ? 'border-l-yellow-500' : 'border-l-blue-500'
                      }`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">{getIcon(alert.type)}</div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-slate-900">{alert.title}</p>
                              <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                                  {alert.priority}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {new Date(alert.created_date).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlertMutation.mutate(alert.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Read Alerts */}
            {readAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-2">
                  Lidas Recentemente
                </h3>
                <div className="space-y-2">
                  {readAlerts.map(alert => (
                    <Card
                      key={alert.id}
                      className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getIcon(alert.type)}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-700">{alert.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                          </div>
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {unreadAlerts.length === 0 && readAlerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}