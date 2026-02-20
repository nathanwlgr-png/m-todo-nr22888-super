import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AIFollowUpAutomation from '@/components/AIFollowUpAutomation';
import WhatsAppAIProposalGenerator from '@/components/WhatsAppAIProposalGenerator';
import WhatsAppChunkedSender from '@/components/WhatsAppChunkedSender';
import {
  MessageSquare, Phone, Send, Calendar, FileText, MessageCircle,
  Settings, Bot, Users, Zap, Copy, CheckCircle2, Clock, Sparkles
} from 'lucide-react';

const MAIN_PHONE = '5514991676428'; // Seu número

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [messageText, setMessageText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [templateType, setTemplateType] = useState('welcome');
  const queryClient = useQueryClient();

  // Fetch all clients with phone
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['whatsapp-clients'],
    queryFn: async () => {
      const allClients = await base44.entities.Client.list();
      return allClients.filter(c => c.phone);
    },
    refetchInterval: 30000
  });

  // Fetch message logs
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => base44.entities.AutomatedMessageLog.filter({ 
      message_type: 'whatsapp_incoming' 
    }).catch(() => []),
    refetchInterval: 30000
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendWhatsAppMessage', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Mensagem enviada');
      setMessageText('');
      queryClient.invalidateQueries(['whatsapp-messages']);
    },
    onError: () => toast.error('Erro ao enviar')
  });

  // Create task from WhatsApp
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.entities.Task.create(taskData);
    },
    onSuccess: () => {
      toast.success('✅ Tarefa criada');
    }
  });

  // Message templates
  const templates = {
    welcome: '👋 Olá! Bem-vindo ao CRM NR22. Como posso ajudar?',
    schedule: '📅 Para agendar uma visita:\n1. Qual data preferida?\n2. Qual horário?\n3. Qual assunto?',
    proposal: '💼 Vou gerar uma proposta! Me informe:\n- Equipamento de interesse\n- Necessidades técnicas\n- Orçamento disponível',
    followup: '👋 Olá! Vi que não respondeu nosso contato. Posso ajudar com algo?'
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedClient) {
      toast.error('Preencha mensagem e cliente');
      return;
    }

    sendMutation.mutate({
      phone: selectedClient.phone,
      message: messageText,
      clientId: selectedClient.id
    });
  };

  const handleCreateTask = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    createTaskMutation.mutate({
      title: `Follow-up WhatsApp - ${selectedClient.first_name}`,
      description: messageText || 'Acompanhamento via WhatsApp',
      assigned_to: base44.auth.me()?.email,
      client_id: selectedClient.id,
      status: 'pending'
    });
  };

  const handleScheduleVisit = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    // Redireciona para agendamento com cliente pré-selecionado
    window.location.href = `/ScheduledAgenda?clientId=${selectedClient.id}`;
  };

  const handleGenerateProposal = () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    // Redireciona para gerador de proposta
    window.location.href = `/ProposalGenerator?clientId=${selectedClient.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">WhatsApp Hub</h1>
                <p className="text-sm text-slate-600">Gerenciar conversas e automações</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-600">Número: {MAIN_PHONE}</p>
              <Badge className="bg-green-600 mt-1">Conectado</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Mensagens</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">IA Follow-up</span>
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">IA Proposta</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTATOS */}
          <TabsContent value="contacts" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contatos ({clients.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <p className="text-slate-500 text-sm">Carregando...</p>
                ) : clients.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum contato com WhatsApp</p>
                ) : (
                  clients.map(client => (
                    <Card
                      key={client.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedClient?.id === client.id ? 'bg-green-100 border-green-400' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{client.first_name}</p>
                          <p className="text-xs text-slate-500">{client.phone} • {client.city}</p>
                        </div>
                        <Badge className={
                          client.status === 'quente' ? 'bg-red-500' :
                          client.status === 'morno' ? 'bg-orange-500' : 'bg-blue-500'
                        }>
                          {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* MENSAGENS */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Histórico ({messages.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhuma mensagem</p>
                ) : (
                  messages.slice(-20).reverse().map(msg => (
                    <Card key={msg.id} className="p-3 bg-slate-50">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-sm">{msg.client_name}</p>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.sent_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{msg.message_content}</p>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* IA FOLLOW-UP */}
          <TabsContent value="followup" className="space-y-4">
            <AIFollowUpAutomation clientId={selectedClient?.id} />
          </TabsContent>

          {/* IA PROPOSTA */}
          <TabsContent value="proposal" className="space-y-4">
            <WhatsAppAIProposalGenerator 
              client={selectedClient}
              conversationHistory={messages.filter(m => m.client_id === selectedClient?.id)}
            />
          </TabsContent>

          {/* ENVIAR MENSAGEM */}
          <TabsContent value="send" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold mb-4">Enviar Mensagem</h2>
              
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900">{selectedClient.first_name}</p>
                    <p className="text-xs text-green-700">{selectedClient.phone}</p>
                  </div>

                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escreva sua mensagem..."
                    className="w-full p-3 border rounded-lg text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMutation.isPending || !messageText.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                    <Button
                      onClick={handleCreateTask}
                      variant="outline"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Criar Tarefa
                    </Button>
                    <Button
                      onClick={handleScheduleVisit}
                      variant="outline"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Visita
                    </Button>
                    <Button
                      onClick={handleGenerateProposal}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Proposta
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecione um contato para enviar mensagem</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold mb-4">Templates de Mensagem</h2>
              <div className="space-y-3">
                {Object.entries(templates).map(([key, text]) => (
                  <Card key={key} className="p-3 border-l-4 border-green-400">
                    <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">{key}</p>
                    <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{text}</p>
                    <Button
                      onClick={() => {
                        setMessageText(text);
                        setActiveTab('send');
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      Usar Template
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* CONFIGURAÇÕES */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold mb-4">Configurações</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Número Principal</p>
                  <div className="flex gap-2">
                    <Input
                      value={MAIN_PHONE}
                      readOnly
                      className="bg-white text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(MAIN_PHONE);
                        toast.success('✓ Copiado');
                      }}
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Webhook Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-green-700">Conectado e ativo</span>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-2">⚙️ Configurar Webhook</p>
                  <p className="text-xs text-amber-700 mb-3">Configure seu webhook do WhatsApp com a URL abaixo:</p>
                  <div className="bg-white p-2 rounded text-xs font-mono text-slate-600 break-all">
                    {window.location.origin}/functions/whatsappHub
                  </div>
                  <p className="text-xs text-amber-700 mt-2">Token: nr22_webhook_2026</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{clients.length}</p>
              <p className="text-sm opacity-90">Contatos</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{messages.length}</p>
              <p className="text-sm opacity-90">Mensagens</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{clients.filter(c => c.status === 'quente').length}</p>
              <p className="text-sm opacity-90">Quentes 🔥</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}