import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsCenter() {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        return await base44.entities.Alert?.list() || [];
      } catch {
        return [];
      }
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert?.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Notificação removida');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert?.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Central de Notificações</h1>
        </div>
        <p className="text-blue-100">Gerenciar alertas e notificações do sistema</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
              <p className="text-sm text-slate-600 mt-1">Não Lidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{alerts.filter(a => a.read).length}</div>
              <p className="text-sm text-slate-600 mt-1">Lidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600">{alerts.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma notificação no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 20).map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    !alert.read ? 'bg-blue-50 border-l-blue-500' : 'bg-slate-50 border-l-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : alert.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600" />
                        )}
                        <p className="font-semibold text-sm">{alert.title || 'Notificação'}</p>
                        {!alert.read && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Novo</span>}
                      </div>
                      {alert.message && <p className="text-sm text-slate-600">{alert.message}</p>}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(alert.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!alert.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(alert.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}