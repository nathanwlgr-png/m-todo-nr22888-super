import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Zap, MessageSquare, Clock, Settings, Play, PowerOff,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function AutomationSettings() {
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [sendTime, setSendTime] = useState('09:00');
  const [maxMessages, setMaxMessages] = useState(20);
  const [enabledTypes, setEnabledTypes] = useState({
    turbo_venda: true,
    follow_up: true,
    conquistar: false,
    reativacao: false,
    proposta: false,
    lembranca_visita: false
  });

  // Get automation status
  const statusQuery = useQuery({
    queryKey: ['automation-status'],
    queryFn: async () => {
      const response = await base44.functions.invoke('automaticMessageScheduler', {
        action: 'get_status'
      });
      return response.data;
    }
  });

  // Enable automation
  const enableMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automaticMessageScheduler', {
        action: 'enable',
        automationConfig: {
          message_types_enabled: enabledTypes,
          send_time: sendTime,
          max_messages_per_day: maxMessages
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setAutomationEnabled(true);
    },
    onError: () => toast.error('Erro ao ativar')
  });

  // Disable automation
  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automaticMessageScheduler', {
        action: 'disable'
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setAutomationEnabled(false);
    },
    onError: () => toast.error('Erro ao desativar')
  });

  // Execute now
  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automaticMessageScheduler', {
        action: 'execute_now'
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => toast.error('Erro ao executar')
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Automação de Mensagens</h1>
              <p className="text-sm text-slate-600">Ative mensagens automáticas para seus clientes</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {statusQuery.data && (
          <Card className={`p-4 mb-6 border-2 ${
            automationEnabled ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {automationEnabled ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">
                    {automationEnabled ? '✅ Automação Ativa' : '⏸️ Automação Desativada'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {automationEnabled 
                      ? `Próximo envio: ${sendTime}` 
                      : 'Configure e ative para começar'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => automationEnabled ? disableMutation.mutate() : enableMutation.mutate()}
                disabled={enableMutation.isPending || disableMutation.isPending}
                className={automationEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {automationEnabled ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Configuration */}
        <Card className="p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração
          </h2>

          <div className="space-y-4">
            {/* Send Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário de Envio
              </label>
              <Input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Horário em que as mensagens serão enviadas</p>
            </div>

            {/* Max Messages */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Máximo de Mensagens por Dia
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={maxMessages}
                onChange={(e) => setMaxMessages(parseInt(e.target.value))}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Quantidade máxima de mensagens automáticas por dia</p>
            </div>
          </div>
        </Card>

        {/* Message Types */}
        <Card className="p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Tipos de Mensagens
          </h2>

          <div className="space-y-3">
            {[
              { key: 'turbo_venda', label: '🚀 Turbo Venda', desc: 'Para clientes quentes' },
              { key: 'follow_up', label: '📞 Follow-up', desc: 'Para clientes sem contato há dias' },
              { key: 'conquistar', label: '🎯 Conquistar', desc: 'Para leads novos' },
              { key: 'reativacao', label: '💪 Reativação', desc: 'Para clientes inativos' },
              { key: 'proposta', label: '💼 Envio de Proposta', desc: 'Quando há proposta pendente' },
              { key: 'lembranca_visita', label: '📅 Lembrança Visita', desc: 'Antes de agendamentos' }
            ].map(type => (
              <div
                key={type.key}
                onClick={() => setEnabledTypes(prev => ({ ...prev, [type.key]: !prev[type.key] }))}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-semibold text-slate-800">{type.label}</p>
                  <p className="text-xs text-slate-600">{type.desc}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-none"
                >
                  {enabledTypes[type.key] ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Manual Execution */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Executar Agora
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Envie mensagens automáticas imediatamente para clientes qualificados
          </p>
          <Button
            onClick={() => executeMutation.mutate()}
            disabled={executeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {executeMutation.isPending ? 'Enviando...' : 'Executar Automação'}
          </Button>
        </Card>

        {/* Guide */}
        <Card className="p-6 mt-6 bg-amber-50 border-amber-200">
          <h3 className="font-bold text-lg mb-3">📖 Como Ativar</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <p>✅ <strong>1. Configure os parâmetros:</strong> Horário e tipo de mensagens</p>
            <p>✅ <strong>2. Ative a automação:</strong> Clique no botão verde "Ativar"</p>
            <p>✅ <strong>3. Teste agora:</strong> Use "Executar Automação" para testar</p>
            <p>✅ <strong>4. Agende:</strong> Configure uma tarefa agendada via dashboard</p>
            <p className="mt-3 font-semibold">💡 <strong>Dica:</strong> Use IA Follow-up no WhatsApp Hub para mensagens ainda mais personalizadas!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}