import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Save, TrendingUp, Users, Calendar, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [settings, setSettings] = useState({
    goal_near_completion: user?.notification_settings?.goal_near_completion ?? true,
    goal_near_completion_threshold: user?.notification_settings?.goal_near_completion_threshold ?? 90,
    goal_achieved: user?.notification_settings?.goal_achieved ?? true,
    hot_client_no_contact: user?.notification_settings?.hot_client_no_contact ?? true,
    hot_client_days_threshold: user?.notification_settings?.hot_client_days_threshold ?? 7,
    visit_reminder: user?.notification_settings?.visit_reminder ?? true,
    visit_reminder_hours: user?.notification_settings?.visit_reminder_hours ?? 24,
    proposal_viewed: user?.notification_settings?.proposal_viewed ?? true,
    task_overdue: user?.notification_settings?.task_overdue ?? true,
    lead_high_score: user?.notification_settings?.lead_high_score ?? true,
    lead_high_score_threshold: user?.notification_settings?.lead_high_score_threshold ?? 80,
    client_becoming_cold: user?.notification_settings?.client_becoming_cold ?? true,
    cold_client_days_threshold: user?.notification_settings?.cold_client_days_threshold ?? 30
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ notification_settings: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Configurações salvas!');
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const notificationTypes = [
    {
      id: 'goal_achieved',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      title: 'Meta Atingida',
      description: 'Notificar quando uma meta for completamente atingida',
      hasThreshold: false
    },
    {
      id: 'goal_near_completion',
      icon: <TrendingUp className="w-5 h-5 text-yellow-600" />,
      title: 'Meta Próxima do Fim',
      description: 'Notificar quando meta estiver próxima de ser atingida',
      hasThreshold: true,
      thresholdField: 'goal_near_completion_threshold',
      thresholdLabel: 'Porcentagem (%)',
      thresholdMin: 50,
      thresholdMax: 99
    },
    {
      id: 'hot_client_no_contact',
      icon: <Users className="w-5 h-5 text-red-600" />,
      title: 'Cliente Quente Sem Contato',
      description: 'Alertar sobre clientes quentes sem interação há X dias',
      hasThreshold: true,
      thresholdField: 'hot_client_days_threshold',
      thresholdLabel: 'Dias sem contato',
      thresholdMin: 1,
      thresholdMax: 30
    },
    {
      id: 'client_becoming_cold',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: 'Cliente Esfriando',
      description: 'Notificar sobre clientes sem contato há muito tempo',
      hasThreshold: true,
      thresholdField: 'cold_client_days_threshold',
      thresholdLabel: 'Dias sem contato',
      thresholdMin: 15,
      thresholdMax: 90
    },
    {
      id: 'visit_reminder',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      title: 'Lembrete de Visita',
      description: 'Lembrar sobre visitas agendadas próximas',
      hasThreshold: true,
      thresholdField: 'visit_reminder_hours',
      thresholdLabel: 'Horas antes',
      thresholdMin: 1,
      thresholdMax: 72
    },
    {
      id: 'proposal_viewed',
      icon: <FileText className="w-5 h-5 text-teal-600" />,
      title: 'Proposta Visualizada',
      description: 'Notificar quando cliente visualizar proposta enviada',
      hasThreshold: false
    },
    {
      id: 'task_overdue',
      icon: <Calendar className="w-5 h-5 text-red-600" />,
      title: 'Tarefa Atrasada',
      description: 'Alertar sobre tarefas que passaram do prazo',
      hasThreshold: false
    },
    {
      id: 'lead_high_score',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      title: 'Lead com Score Alto',
      description: 'Notificar sobre leads altamente qualificados',
      hasThreshold: true,
      thresholdField: 'lead_high_score_threshold',
      thresholdLabel: 'Score mínimo',
      thresholdMin: 50,
      thresholdMax: 100
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-indigo-600" />
              <div>
                <CardTitle>Configurações de Notificações</CardTitle>
                <p className="text-sm text-slate-600">Personalize seus alertas e lembretes</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map(notif => (
              <Card key={notif.id} className="bg-slate-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{notif.icon}</div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-600">{notif.description}</p>
                        </div>
                        <Switch
                          checked={settings[notif.id]}
                          onCheckedChange={(checked) => 
                            setSettings({ ...settings, [notif.id]: checked })
                          }
                        />
                      </div>

                      {notif.hasThreshold && settings[notif.id] && (
                        <div className="pl-2 border-l-2 border-indigo-200">
                          <Label className="text-xs text-slate-600">
                            {notif.thresholdLabel}
                          </Label>
                          <Input
                            type="number"
                            min={notif.thresholdMin}
                            max={notif.thresholdMax}
                            value={settings[notif.thresholdField]}
                            onChange={(e) => setSettings({
                              ...settings,
                              [notif.thresholdField]: parseInt(e.target.value)
                            })}
                            className="w-32 mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={saveSettingsMutation.isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}