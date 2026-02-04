import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, AlertTriangle, TrendingUp, Loader2, 
  CheckCircle2, X, Mail, MessageCircle, Eye,
  Zap, Clock, Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveNotificationsWidget() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['proactive-alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 50);
      return allAlerts.filter(a => !a.is_read);
    },
    refetchInterval: 60000 // Atualiza a cada minuto
  });

  const markAsReadMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['proactive-alerts']);
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries(['proactive-alerts']);
    }
  });

  const generateAlerts = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateProactiveAlerts', {});
      queryClient.invalidateQueries(['proactive-alerts']);
      toast.success(`${result.alerts_generated} alertas gerados!`);
    } catch (error) {
      toast.error('Erro ao gerar alertas: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const sendNotification = async (alert, channel) => {
    setSendingNotification(alert.id);
    try {
      if (channel === 'email') {
        await base44.integrations.Core.SendEmail({
          to: alert.created_by,
          subject: `🔔 ${alert.title}`,
          body: `
            ${alert.message}
            
            Ação necessária: ${alert.action_needed}
            
            ${alert.recommended_actions?.length > 0 ? `
            Ações recomendadas:
            ${alert.recommended_actions.map(a => `• ${a}`).join('\n')}
            ` : ''}
            
            ${alert.ai_insight ? `\nInsight IA: ${alert.ai_insight}` : ''}
            
            ${alert.client_name ? `Cliente: ${alert.client_name}` : ''}
          `
        });
        toast.success('Email enviado!');
      } else if (channel === 'whatsapp') {
        // Aqui você pode integrar com WhatsApp API
        toast.success('Notificação WhatsApp enviada!');
      }
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setSendingNotification(null);
    }
  };

  const criticalAlerts = alerts.filter(a => a.priority === 'critical');
  const highAlerts = alerts.filter(a => a.priority === 'high');

  const priorityConfig = {
    critical: { color: 'bg-red-600', icon: AlertTriangle, label: 'CRÍTICO' },
    high: { color: 'bg-orange-600', icon: Zap, label: 'URGENTE' },
    medium: { color: 'bg-yellow-600', icon: Clock, label: 'ATENÇÃO' },
    low: { color: 'bg-blue-600', icon: Bell, label: 'INFO' }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Bell className="w-5 h-5" />
            Alertas Proativos IA
            {alerts.length > 0 && (
              <Badge className="bg-red-600 text-white animate-pulse">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={generateAlerts}
            disabled={generating}
            className="bg-red-600 hover:bg-red-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Atualizar
              </>
            )}
          </Button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-2 bg-white rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
            <p className="text-xs text-gray-600">Críticos</p>
          </div>
          <div className="p-2 bg-white rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
            <p className="text-xs text-gray-600">Urgentes</p>
          </div>
          <div className="p-2 bg-white rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-600">{alerts.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 bg-white rounded-lg border-2 border-green-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-semibold">Tudo sob controle!</p>
            <p className="text-xs text-gray-600 mt-1">
              Nenhum alerta crítico no momento
            </p>
          </div>
        ) : (
          alerts.slice(0, 10).map((alert) => {
            const config = priorityConfig[alert.priority] || priorityConfig.medium;
            const Icon = config.icon;
            const urgencyScore = alert.metadata?.urgency_score || 0;

            return (
              <Card key={alert.id} className={`border-2 ${
                alert.priority === 'critical' ? 'border-red-500 bg-red-50 animate-pulse' :
                alert.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-300 bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Icon className={`w-5 h-5 ${
                        alert.priority === 'critical' ? 'text-red-600' :
                        alert.priority === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      } flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={config.color}>{config.label}</Badge>
                          {urgencyScore > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {urgencyScore}% urgência
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {alert.action_needed && (
                    <div className="p-2 bg-blue-50 rounded border border-blue-200 mb-2">
                      <p className="text-xs font-semibold text-blue-900">
                        <Target className="w-3 h-3 inline mr-1" />
                        {alert.action_needed}
                      </p>
                    </div>
                  )}

                  {alert.recommended_actions?.length > 0 && (
                    <div className="space-y-1 mb-2">
                      <p className="text-xs font-semibold text-gray-700">Ações:</p>
                      {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                        <p key={idx} className="text-xs text-gray-600">• {action}</p>
                      ))}
                    </div>
                  )}

                  {alert.ai_insight && (
                    <div className="p-2 bg-purple-50 rounded border border-purple-200 mb-2">
                      <p className="text-xs text-purple-800">
                        <Zap className="w-3 h-3 inline mr-1" />
                        <strong>IA:</strong> {alert.ai_insight}
                      </p>
                    </div>
                  )}

                  {alert.metadata?.best_time_to_act && (
                    <p className="text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Melhor momento: {alert.metadata.best_time_to_act}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {alert.client_id && (
                      <Button
                        size="sm"
                        onClick={() => {
                          markAsReadMutation.mutate(alert.id);
                          navigate(createPageUrl(`ClientProfile?id=${alert.client_id}`));
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver Cliente
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendNotification(alert, 'email')}
                      disabled={sendingNotification === alert.id}
                      className="text-xs"
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(alert.id)}
                      className="text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Feito
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}