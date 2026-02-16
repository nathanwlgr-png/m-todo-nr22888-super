import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PREFERENCES = {
  goal_achieved: true,
  goal_near_deadline: true,
  hot_client_inactive: true,
  hot_client_inactive_days: 7,
  visit_reminder: true,
  visit_reminder_hours: 24,
  proposal_viewed: true,
  task_overdue: true,
  lead_inactive: true,
  lead_inactive_days: 5,
  client_cold: true,
  high_score_lead: true
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    const saved = localStorage.getItem(`notification_prefs_${user?.email}`);
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, [user]);

  const savePreferences = () => {
    localStorage.setItem(`notification_prefs_${user?.email}`, JSON.stringify(preferences));
    toast.success('Preferências salvas!');
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateValue = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-indigo-600" />
            <div>
              <CardTitle>Configurações de Notificações</CardTitle>
              <p className="text-sm text-slate-600">Configure quais alertas você deseja receber</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metas de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Meta atingida</Label>
              <p className="text-sm text-slate-600">Notificar quando uma meta for concluída</p>
            </div>
            <Switch
              checked={preferences.goal_achieved}
              onCheckedChange={() => togglePreference('goal_achieved')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Meta próxima do prazo</Label>
              <p className="text-sm text-slate-600">Alerta quando faltar pouco tempo para o deadline</p>
            </div>
            <Switch
              checked={preferences.goal_near_deadline}
              onCheckedChange={() => togglePreference('goal_near_deadline')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-semibold">Cliente quente sem contato</Label>
                <p className="text-sm text-slate-600">Alerta para clientes quentes inativos</p>
              </div>
              <Switch
                checked={preferences.hot_client_inactive}
                onCheckedChange={() => togglePreference('hot_client_inactive')}
              />
            </div>
            {preferences.hot_client_inactive && (
              <div className="ml-4 flex items-center gap-2">
                <Label className="text-sm">Dias sem contato:</Label>
                <Input
                  type="number"
                  value={preferences.hot_client_inactive_days}
                  onChange={(e) => updateValue('hot_client_inactive_days', parseInt(e.target.value))}
                  className="w-20"
                  min="1"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Cliente ficou frio</Label>
              <p className="text-sm text-slate-600">Notificar quando status mudar para frio</p>
            </div>
            <Switch
              checked={preferences.client_cold}
              onCheckedChange={() => togglePreference('client_cold')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Lead com alto score</Label>
              <p className="text-sm text-slate-600">Alerta para leads qualificados (score > 70)</p>
            </div>
            <Switch
              checked={preferences.high_score_lead}
              onCheckedChange={() => togglePreference('high_score_lead')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-semibold">Lead inativo</Label>
                <p className="text-sm text-slate-600">Notificar leads sem interação</p>
              </div>
              <Switch
                checked={preferences.lead_inactive}
                onCheckedChange={() => togglePreference('lead_inactive')}
              />
            </div>
            {preferences.lead_inactive && (
              <div className="ml-4 flex items-center gap-2">
                <Label className="text-sm">Dias sem interação:</Label>
                <Input
                  type="number"
                  value={preferences.lead_inactive_days}
                  onChange={(e) => updateValue('lead_inactive_days', parseInt(e.target.value))}
                  className="w-20"
                  min="1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visitas e Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visitas e Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-semibold">Lembrete de visita</Label>
                <p className="text-sm text-slate-600">Notificar antes das visitas agendadas</p>
              </div>
              <Switch
                checked={preferences.visit_reminder}
                onCheckedChange={() => togglePreference('visit_reminder')}
              />
            </div>
            {preferences.visit_reminder && (
              <div className="ml-4 flex items-center gap-2">
                <Label className="text-sm">Horas de antecedência:</Label>
                <Input
                  type="number"
                  value={preferences.visit_reminder_hours}
                  onChange={(e) => updateValue('visit_reminder_hours', parseInt(e.target.value))}
                  className="w-20"
                  min="1"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Tarefa atrasada</Label>
              <p className="text-sm text-slate-600">Alerta para tarefas vencidas</p>
            </div>
            <Switch
              checked={preferences.task_overdue}
              onCheckedChange={() => togglePreference('task_overdue')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-semibold">Proposta visualizada</Label>
              <p className="text-sm text-slate-600">Notificar quando cliente abrir proposta</p>
            </div>
            <Switch
              checked={preferences.proposal_viewed}
              onCheckedChange={() => togglePreference('proposal_viewed')}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={savePreferences} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Salvar Preferências
      </Button>
    </div>
  );
}