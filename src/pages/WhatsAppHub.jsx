import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AIFollowUpAutomation from '@/components/AIFollowUpAutomation';
import WhatsAppAIProposalGenerator from '@/components/WhatsAppAIProposalGenerator';
import WhatsAppChunkedSender from '@/components/WhatsAppChunkedSender';
import {
  MessageSquare, Phone, Send, Calendar, FileText, MessageCircle,
  Settings, Bot, Users, Zap, Copy, CheckCircle2, Clock, Sparkles,
  Search, Flame, ChevronRight, ExternalLink, RefreshCw, Star
} from 'lucide-react';

const MAIN_PHONE = '5514991676428';

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Unified data fetch
  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['whatsapp-hub-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const clients = useMemo(() => allClients.filter(c => c.phone), [allClients]);

  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => base44.entities.AutomatedMessageLog.filter({ message_type: 'whatsapp_incoming' }).catch(() => []),
    refetchInterval: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendWhatsAppMessage', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Mensagem enviada');
      queryClient.invalidateQueries(['whatsapp-messages']);
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => toast.success('✅ Tarefa criada'),
  });

  // Filtered clients for search
  const filteredClients = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(c =>
      c.first_name?.toLowerCase().includes(lower) ||
      c.clinic_name?.toLowerCase().includes(lower) ||
      c.city?.toLowerCase().includes(lower) ||
      c.phone?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const metrics = useMemo(() => ({
    total: clients.length,
    hot: clients.filter(c => c.status === 'quente').length,
    messages: messages.length,
  }), [clients, messages]);

  const whatsappAgentUrl = base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant');

  const templates = [
    { key: 'boas-vindas', label: '👋 Boas-vindas', text: 'Olá! Aqui é da CMAT Brasil. Tudo bem? Tenho uma novidade que pode transformar seu laboratório. Posso falar?' },
    { key: 'followup', label: '📞 Follow-up', text: 'Olá! Vi que ainda não tivemos retorno. Entendo que sua agenda é corrida. Quando seria um bom momento para conversar?' },
    { key: 'proposta', label: '💼 Solicitar info', text: 'Olá! Para gerar sua proposta personalizada, me diga:\n- Qual equipamento interessa?\n- Volume mensal de exames?\n- Orçamento disponível?' },
    { key: 'urgencia', label: '⏳ Urgência', text: 'Olá! Nossa condição especial encerra nesta semana. Separei uma proposta exclusiva para você. Quer ver?' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-800 px-4 pt-4 pb-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">WhatsApp Hub</h1>
              <p className="text-xs text-green-200">Central de mensagens e automações</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
            <span className="w-2 h-2 bg-green-300 rounded-full inline-block mr-1 animate-pulse" />
            Ativo
          </Badge>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl font-black text-white">{metrics.total}</p>
            <p className="text-[10px] text-green-200 font-medium">Contatos</p>
          </div>
          <div className="bg-red-500/30 rounded-xl p-2.5 text-center border border-red-400/30">
            <p className="text-xl font-black text-orange-200">{metrics.hot}</p>
            <p className="text-[10px] text-red-200 font-medium">🔥 Quentes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl font-black text-white">{metrics.messages}</p>
            <p className="text-[10px] text-green-200 font-medium">Mensagens</p>
          </div>
        </div>
      </div>

      {/* WHATSAPP MASTER AGENT - ACESSO RÁPIDO */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl p-4 shadow-lg mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Assistente Master IA</p>
              <p className="text-xs text-green-100">Acesso total ao CRM via WhatsApp</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => { window.open(whatsappAgentUrl, '_blank'); }}
              className="bg-white text-green-700 hover:bg-green-50 font-bold text-xs h-9"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Abrir no WhatsApp
            </Button>
            <Button
              onClick={() => { navigator.clipboard.writeText(whatsappAgentUrl); toast.success('Link copiado!'); }}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs h-9"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copiar Link
            </Button>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4 bg-white shadow-sm border border-slate-100 h-10">
            <TabsTrigger value="contacts" className="text-xs gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="text-xs gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </TabsTrigger>
            <TabsTrigger value="followup" className="text-xs gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTATOS */}
          <TabsContent value="contacts">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, cidade, telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white text-sm"
              />
            </div>

            {selectedClient && (
              <div className="mb-3 p-3 bg-green-50 border border-green-300 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {selectedClient.first_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-green-900 truncate">{selectedClient.first_name}</p>
                  <p className="text-xs text-green-700 truncate">{selectedClient.phone}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                    onClick={() => setActiveTab('send')}>
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </Button>
                  <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">×</button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Carregando contatos...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum contato encontrado</p>
                </div>
              ) : filteredClients.map(client => (
                <div
                  key={client.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedClient?.id === client.id
                      ? 'bg-green-50 border-green-400 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    client.status === 'quente' ? 'bg-red-500' : client.status === 'morno' ? 'bg-orange-400' : 'bg-blue-400'
                  }`}>
                    {client.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{client.first_name}</p>
                    <p className="text-xs text-slate-500 truncate">{client.phone} · {client.city}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-[10px] ${
                      client.status === 'quente' ? 'bg-red-100 text-red-700' :
                      client.status === 'morno' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                    </Badge>
                    <a
                      href={`https://wa.me/${client.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ENVIAR */}
          <TabsContent value="send">
            {!selectedClient ? (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-100">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">Selecione um contato</p>
                <p className="text-xs text-slate-400 mt-1">Vá em Contatos e selecione um cliente</p>
                <Button onClick={() => setActiveTab('contacts')} size="sm" variant="outline" className="mt-3">
                  Ir para Contatos
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <WhatsAppChunkedSender client={selectedClient} />
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => {
                    createTaskMutation.mutate({
                      title: `Follow-up - ${selectedClient.first_name}`,
                      client_id: selectedClient.id,
                      client_name: selectedClient.first_name,
                      status: 'pendente',
                      type: 'follow_up',
                      priority: 'media',
                    });
                  }} variant="outline" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Criar Tarefa
                  </Button>
                  <Button onClick={() => navigate(createPageUrl(`ScheduledAgenda?clientId=${selectedClient.id}`))} variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Visita
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* IA */}
          <TabsContent value="followup">
            <div className="space-y-3">
              <AIFollowUpAutomation clientId={selectedClient?.id} />
              {selectedClient && (
                <WhatsAppAIProposalGenerator
                  client={selectedClient}
                  conversationHistory={messages.filter(m => m.client_id === selectedClient?.id)}
                />
              )}
              {!selectedClient && (
                <div className="text-center py-6 bg-white rounded-xl border border-slate-100">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-slate-500">Selecione um cliente para usar IA</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates">
            <div className="space-y-3">
              {templates.map(({ key, label, text }) => (
                <Card key={key} className="p-4 border-l-4 border-green-400">
                  <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                  <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap leading-relaxed">{text}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { navigator.clipboard.writeText(text); toast.success('Copiado!'); }}
                      size="sm" variant="outline" className="flex-1 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                    {selectedClient && (
                      <Button
                        onClick={() => sendMutation.mutate({ phone: selectedClient.phone, message: text, clientId: selectedClient.id })}
                        size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                        disabled={sendMutation.isPending}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CONFIG */}
          <TabsContent value="settings">
            <div className="space-y-3">
              <Card className="p-4">
                <p className="text-sm font-bold mb-3">⚙️ Configurações</p>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Número Principal</p>
                    <div className="flex gap-2">
                      <Input value={MAIN_PHONE} readOnly className="text-sm bg-white" />
                      <Button onClick={() => { navigator.clipboard.writeText(MAIN_PHONE); toast.success('Copiado!'); }} size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs font-semibold text-green-800">Webhook Ativo</p>
                    </div>
                    <p className="text-xs text-green-700 font-mono break-all">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/functions/whatsappHub
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-800 mb-2">🤖 Agente WhatsApp Master</p>
                    <p className="text-xs text-indigo-700 break-all font-mono">{whatsappAgentUrl.slice(0, 60)}...</p>
                    <Button
                      onClick={() => { navigator.clipboard.writeText(whatsappAgentUrl); toast.success('Link do agente copiado!'); }}
                      size="sm" variant="outline" className="mt-2 w-full text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar link do agente
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}