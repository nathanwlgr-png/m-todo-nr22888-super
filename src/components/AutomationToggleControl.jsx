import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { 
  Zap, Power, AlertCircle, CheckCircle2, Settings, 
  MessageSquare, Clock, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationToggleControl() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const existingSettings = await base44.entities.AutomationSettings.filter({
        user_email: currentUser.email
      });

      if (existingSettings.length > 0) {
        setSettings(existingSettings[0]);
      } else {
        // Criar configurações padrão
        const newSettings = {
          user_email: currentUser.email,
          automation_enabled: false,
          message_types_enabled: {
            turbo_venda: false,
            follow_up: false,
            conquistar: false,
            reativacao: false,
            proposta: false,
            lembranca_visita: false
          },
          send_time: '09:00',
          max_messages_per_day: 20
        };
        const created = await base44.entities.AutomationSettings.create(newSettings);
        setSettings(created);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async () => {
    setToggling(true);
    try {
      const newState = !settings.automation_enabled;
      
      await base44.entities.AutomationSettings.update(settings.id, {
        automation_enabled: newState,
        last_updated: new Date().toISOString()
      });

      setSettings({ ...settings, automation_enabled: newState });
      
      toast.success(
        newState 
          ? '✅ Automação ATIVADA - Mensagens serão enviadas automaticamente'
          : '⏸️ Automação DESATIVADA - Nenhuma mensagem será enviada'
      );
    } catch (error) {
      toast.error('Erro ao alternar automação');
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  const toggleMessageType = async (messageType) => {
    try {
      const updated = {
        ...settings.message_types_enabled,
        [messageType]: !settings.message_types_enabled[messageType]
      };

      await base44.entities.AutomationSettings.update(settings.id, {
        message_types_enabled: updated
      });

      setSettings({
        ...settings,
        message_types_enabled: updated
      });

      toast.success(`Tipo de mensagem "${messageType}" ${updated[messageType] ? 'ativado' : 'desativado'}`);
    } catch (error) {
      toast.error('Erro ao atualizar tipo de mensagem');
    }
  };

  if (loading) {
    return <p className="text-slate-500">Carregando...</p>;
  }

  const messageTypes = [
    { key: 'turbo_venda', label: '⚡ Turbo Venda', desc: 'Mensagens de impacto para vender' },
    { key: 'follow_up', label: '📞 Follow-up', desc: 'Retomar contato após dias' },
    { key: 'conquistar', label: '🎯 Conquistar', desc: 'Primeira abordagem de novos' },
    { key: 'reativacao', label: '🔥 Reativação', desc: 'Reativar clientes inativos' },
    { key: 'proposta', label: '📄 Proposta', desc: 'Enviar proposta automática' },
    { key: 'lembranca_visita', label: '📅 Lembrança', desc: 'Lembrar visita agendada' }
  ];

  return (
    <div className="space-y-4">
      {/* Master Toggle */}
      <Card className={`p-6 border-2 transition-all ${
        settings?.automation_enabled 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-lg shadow-green-500/20' 
          : 'bg-slate-50 border-slate-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              settings?.automation_enabled
                ? 'bg-green-500 animate-pulse'
                : 'bg-slate-400'
            }`}>
              <Power className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {settings?.automation_enabled ? '✅ AUTOMAÇÃO ATIVA' : '⏸️ AUTOMAÇÃO DESATIVADA'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {settings?.automation_enabled 
                  ? `Enviando até ${settings?.max_messages_per_day} mensagens por dia automaticamente`
                  : 'Nenhuma mensagem será enviada. Ative para iniciar.'}
              </p>
            </div>
          </div>

          <Switch
            checked={settings?.automation_enabled}
            onCheckedChange={toggleAutomation}
            disabled={toggling}
            className="h-12 w-24"
          />
        </div>
      </Card>

      {settings?.automation_enabled && (
        <>
          {/* Tipos de Mensagem */}
          <Card className="p-5 bg-white border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Ativar Tipos de Mensagem Automática
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {messageTypes.map(type => (
                <Card
                  key={type.key}
                  className="p-3 border-slate-200 cursor-pointer hover:bg-slate-50 transition-all"
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.message_types_enabled?.[type.key] || false}
                      onChange={() => toggleMessageType(type.key)}
                      className="mt-1 w-5 h-5 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{type.label}</p>
                      <p className="text-xs text-slate-600">{type.desc}</p>
                    </div>
                    {settings?.message_types_enabled?.[type.key] && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </label>
                </Card>
              ))}
            </div>
          </Card>

          {/* Estatísticas */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-blue-600 font-semibold">Hoje</p>
                <p className="text-2xl font-bold text-blue-700">0/20</p>
                <p className="text-xs text-blue-600">mensagens</p>
              </div>
              <div>
                <p className="text-xs text-purple-600 font-semibold">Esta Semana</p>
                <p className="text-2xl font-bold text-purple-700">0</p>
                <p className="text-xs text-purple-600">enviadas</p>
              </div>
              <div>
                <p className="text-xs text-green-600 font-semibold">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-green-700">--</p>
                <p className="text-xs text-green-600">respostas</p>
              </div>
            </div>
          </Card>

          {/* Próximas Mensagens */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Próximas Mensagens Agendadas
            </h5>
            <p className="text-sm text-slate-600 mb-2">
              Mensagens serão enviadas automaticamente às <strong>09:00</strong> (seu horário preferido)
            </p>
            <Button variant="outline" size="sm">
              Ver Fila de Mensagens
            </Button>
          </Card>
        </>
      )}

      {!settings?.automation_enabled && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Automação Desativada</p>
              <p className="text-sm text-slate-700 mt-1">
                Nenhuma mensagem será enviada automaticamente. Teste alguns tipos de mensagem primeiro antes de ativar a automação global.
              </p>
              <Button 
                onClick={toggleAutomation}
                className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              >
                <Power className="w-4 h-4 mr-2" />
                Ativar Automação Agora
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}