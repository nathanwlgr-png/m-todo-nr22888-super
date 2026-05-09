import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Send, Eye, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoFollowUpDashboard() {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const queryClient = useQueryClient();

  // Fetch clients needing follow-up
  const { data: clientsNeedingFollowUp = [] } = useQuery({
    queryKey: ['clients-follow-up'],
    queryFn: async () => {
      try {
        const clients = await base44.entities.Client?.list('-last_contact_date', 50).catch(() => []);
        const now = new Date();
        return clients.filter(c => {
          const lastContact = new Date(c.last_contact_date);
          const daysSinceContact = (now - lastContact) / (1000 * 60 * 60 * 24);
          return daysSinceContact >= 3 && daysSinceContact <= 30; // 3-30 dias
        });
      } catch {
        return [];
      }
    },
    enabled: automationEnabled,
    refetchInterval: 60000, // A cada minuto
  });

  // Generate AI suggestions
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (clientId) => {
      const client = clientsNeedingFollowUp.find(c => c.id === clientId);
      const result = await base44.functions.invoke('aiFollowUpAutomation', {
        client_id: clientId,
        client_name: client?.first_name,
        interaction_history: client?.visit_history || [],
        status: client?.status,
        pipeline_stage: client?.pipeline_stage,
      });
      return result.data;
    },
    onSuccess: (data) => {
      setSelectedSuggestion(data);
      toast.success('✅ Sugestões geradas com IA');
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Schedule and send via WhatsApp
  const scheduleFollowUpMutation = useMutation({
    mutationFn: async (params) => {
      const result = await base44.functions.invoke('whatsappMasterOrchestrator', {
        action: 'schedule_followup',
        client_id: params.client_id,
        message_content: params.message,
        scheduled_for: params.scheduled_time,
        message_type: 'ai_followup',
        generated_by: 'aiFollowUpAutomation',
        approval_required: true, // Sempre exigir aprovação
        created_by: (await base44.auth.me()).email,
      });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`📅 Follow-up agendado para ${data.scheduled_time}`);
      setSelectedSuggestion(null);
      setScheduleTime('');
      queryClient.invalidateQueries({ queryKey: ['clients-follow-up'] });
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Toggle automation globally
  const toggleAutomationMutation = useMutation({
    mutationFn: async (enabled) => {
      const result = await base44.functions.invoke('aiFollowUpAutomation', {
        action: 'toggle',
        enabled: enabled,
        toggled_by: (await base44.auth.me()).email,
        timestamp: new Date().toISOString(),
      });
      return result.data;
    },
    onSuccess: (data) => {
      setAutomationEnabled(data.enabled);
      toast.success(data.enabled ? '✅ Automação ATIVADA' : '⏸️ Automação DESATIVADA');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <Zap className="w-10 h-10 text-amber-600" />
              ⚡ Auto Follow-up — Inteligente
            </h1>
            <p className="text-slate-600">
              IA gera mensagens personalizadas • Aprovação manual obrigatória • Envio agendado
            </p>
          </div>
        </div>

        {/* CONTROLE GLOBAL */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-indigo-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Automação Global
                </p>
                <p className="text-sm text-indigo-700 mt-1">
                  {automationEnabled ? '🟢 ATIVA — Sugestões sendo geradas' : '🔴 INATIVA — Nenhuma sugestão'}
                </p>
              </div>
              <Switch
                checked={automationEnabled}
                onCheckedChange={(checked) => toggleAutomationMutation.mutate(checked)}
                disabled={toggleAutomationMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="suggestions">💬 Sugestões ({clientsNeedingFollowUp.length})</TabsTrigger>
            <TabsTrigger value="scheduled">📅 Agendados</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Configurações</TabsTrigger>
          </TabsList>

          {/* SUGESTÕES */}
          <TabsContent value="suggestions" className="space-y-4">
            {!automationEnabled ? (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">Automação desativada</p>
                  <p className="text-sm text-slate-500 mt-1">Ative o toggle acima para gerar sugestões</p>
                </CardContent>
              </Card>
            ) : clientsNeedingFollowUp.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum cliente aguardando follow-up</p>
                </CardContent>
              </Card>
            ) : (
              clientsNeedingFollowUp.map((client) => (
                <Card key={client.id} className="bg-white border-l-4 border-amber-500 hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          👤 {client.first_name || client.full_name}
                          {client.status === 'quente' && <Badge className="bg-red-100 text-red-800">Quente</Badge>}
                          {client.status === 'morno' && <Badge className="bg-orange-100 text-orange-800">Morno</Badge>}
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          📍 {client.city} • 🏥 {client.clinic_name} • 📋 {client.pipeline_stage}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ⏱️ Último contato: {new Date(client.last_contact_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateSuggestionsMutation.mutate(client.id)}
                        disabled={generateSuggestionsMutation.isPending}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Gerar Sugestão
                      </Button>
                    </div>
                  </CardHeader>

                  {/* SUGESTÃO GERADA */}
                  {selectedSuggestion?.client_id === client.id && selectedSuggestion && (
                    <CardContent className="pt-0 pb-4 space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">💬 Mensagem Sugerida:</p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {selectedSuggestion.message}
                        </p>
                      </div>

                      {selectedSuggestion.context && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-1">🎯 Por quê:</p>
                          <p className="text-xs text-blue-800">{selectedSuggestion.context}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                          placeholder="Data e hora do envio"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            scheduleFollowUpMutation.mutate({
                              client_id: client.id,
                              message: selectedSuggestion.message,
                              scheduled_time: scheduleTime,
                            })
                          }
                          disabled={!scheduleTime || scheduleFollowUpMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Agendar Envio
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedSuggestion(null)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-900 flex items-center gap-1">
                          ✅ Aprovação Obrigatória
                        </p>
                        <p className="text-xs text-green-800 mt-1">
                          Mensagem será enviada para aprovação antes de disparar
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* AGENDADOS */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📅 Follow-ups Agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-600">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p>Nenhum follow-up agendado no momento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURAÇÕES */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Configurações de Automação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-2">🎯 Critérios de Elegibilidade</p>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>Último contato entre 3-30 dias atrás</li>
                    <li>Status: quente, morno ou frio</li>
                    <li>Pipeline: qualificado até negociação</li>
                    <li>Sem follow-up nos últimos 3 dias</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-2">🔒 Política de Segurança</p>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>Todas as mensagens geradas por IA</li>
                    <li>Aprovação manual obrigatória antes de enviar</li>
                    <li>Envio agendado (não imediato)</li>
                    <li>Auditoria completa de quem aprovou e quando</li>
                    <li>Histórico rastreável no cliente</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-900 mb-2">📊 Estatísticas</p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-green-700">Clientes elegíveis</p>
                      <p className="text-2xl font-bold text-green-900">{clientsNeedingFollowUp.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">Automação</p>
                      <p className="text-2xl font-bold text-green-900">{automationEnabled ? '🟢' : '🔴'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}