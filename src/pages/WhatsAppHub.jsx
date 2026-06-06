import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, Send, Search, Phone, User, Clock,
  Bot, ChevronRight, CheckCircle2, AlertCircle, Loader2,
  Zap, Copy, Check, ExternalLink, RefreshCw, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import AgentStatusBar from '@/components/whatsapp/AgentStatusBar';
import PushNotificationManager from '@/components/whatsapp/PushNotificationManager';
import ConversationLog from '@/components/whatsapp/ConversationLog';
import WhatsAppMaterialsIntegration from '@/components/WhatsAppMaterialsIntegration';
import { OfflineDataSync } from '@/lib/OfflineDataSync';

export default function WhatsAppHub() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Auto-sync on mount
  useEffect(() => {
    const syncData = async () => {
      try {
        await OfflineDataSync.cacheForOffline();
      } catch (error) {
        console.warn('Auto-sync error:', error);
      }
    };
    syncData();
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients-whatsapp'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => base44.entities.WhatsAppMessage.list('-created_date', 200),
    refetchInterval: 15000,
  });

  const { data: pendingMessages = [] } = useQuery({
    queryKey: ['pending-messages'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    refetchInterval: 30000,
  });

  const filteredClients = clients.filter(c =>
    !search ||
    c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  ).filter(c => c.phone);

  const handleSendMessage = async () => {
    if (!selectedClient || !message.trim()) {
      toast.error('Selecione um cliente e escreva uma mensagem');
      return;
    }

    // ── APROVAÇÃO OBRIGATÓRIA ANTES DO ENVIO ──
    const confirmed = window.confirm(
      `✅ PODE ENVIAR?\n\nDestinatário: ${selectedClient.first_name} (${selectedClient.clinic_name || selectedClient.phone})\n\nMensagem:\n"${message.trim().substring(0, 200)}${message.length > 200 ? '...' : ''}"\n\nClique OK para confirmar e enviar.`
    );
    if (!confirmed) {
      toast.info('Envio cancelado. Mensagem não enviada.');
      return;
    }

    setSending(true);
    try {
      const result = await base44.functions.invoke('sendWhatsAppMessage', {
        client_id: selectedClient.id,
        client_phone: selectedClient.phone,
        message: message.trim(),
        auto_log: true,
      });

      if (result.data?.success) {
        toast.success('✅ Mensagem aprovada e enviada!');
        setMessage('');
        queryClient.invalidateQueries(['whatsapp-messages']);
      }
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsApp = (client) => {
    if (!client.phone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-blue-100 text-blue-700',
      delivered: 'bg-green-100 text-green-700',
      read: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-green-600" />
            WhatsApp Hub
          </h1>
          <p className="text-slate-500 text-sm">Central de mensagens e automação</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationManager messages={messages} />
          <a
            href={base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-green-600 hover:bg-green-700">
              <Bot className="w-4 h-4 mr-2" />
              Nathan NR22888
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </a>
        </div>
      </div>

      {/* Real-time agent status */}
      <AgentStatusBar />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-700">{messages.length}</p>
            <p className="text-xs text-green-600">Mensagens enviadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{pendingMessages.length}</p>
            <p className="text-xs text-orange-600">Pendentes aprovação</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{filteredClients.length}</p>
            <p className="text-xs text-blue-600">Clientes c/ WhatsApp</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="enviar">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="enviar">Mensagem</TabsTrigger>
          <TabsTrigger value="materiais" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="contatos">
            Contatos
            <Badge className="ml-2 bg-green-600 text-xs">{filteredClients.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico
            {messages.length > 0 && <Badge className="ml-2 text-xs">{messages.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Enviar Mensagem */}
        <TabsContent value="enviar" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nova Mensagem WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso aprovação obrigatória */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-200">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-700 font-medium">
                  Todas as mensagens requerem <strong>aprovação manual</strong> antes do envio. Clique "✅ Pode Enviar" para confirmar.
                </p>
              </div>
              {/* Busca de cliente */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Destinatário</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar cliente por nome, clínica ou telefone..."
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {search && filteredClients.length > 0 && !selectedClient && (
                  <div className="mt-2 border rounded-lg overflow-hidden shadow-sm">
                    {filteredClients.slice(0, 5).map(client => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedClient(client);
                          setSearch('');
                        }}
                      >
                        <div>
                          <p className="font-semibold text-sm">{client.first_name}</p>
                          <p className="text-xs text-slate-500">{client.clinic_name} • {client.phone}</p>
                        </div>
                        <Badge className={
                          client.status === 'quente' ? 'bg-red-500' :
                          client.status === 'morno' ? 'bg-orange-500' : 'bg-blue-500'
                        }>
                          {client.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800">{selectedClient.first_name}</p>
                      <p className="text-xs text-green-600">{selectedClient.clinic_name} • {selectedClient.phone}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedClient(null)}>✕</Button>
                  </div>
                )}
              </div>

              {/* Mensagem */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Mensagem</label>
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-slate-400 mt-1">{message.length} caracteres</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedClient || !message.trim() || sending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />✅ Pode Enviar</>
                  )}
                </Button>
                {selectedClient && (
                  <Button
                    variant="outline"
                    onClick={() => handleOpenWhatsApp(selectedClient)}
                    className="border-green-500 text-green-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir WhatsApp
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Templates rápidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Apresentação', text: `Olá! Sou Nathan, Consultor Técnico da CMAT Brasil. Gostaria de apresentar nossos equipamentos laboratoriais de última geração para sua clínica. Posso agendar uma demonstração?` },
                { label: 'Follow-up', text: `Olá! Passando para verificar se surgiu alguma dúvida sobre os equipamentos que apresentamos. Fico à disposição! 😊` },
                { label: 'Proposta enviada', text: `Acabei de enviar uma proposta personalizada para você. Assim que tiver oportunidade, dê uma olhada e me retorne com qualquer dúvida!` },
                { label: 'Aniversário', text: `Parabéns pelo seu dia especial! 🎂 Desejo muito sucesso e saúde! Um abraço da equipe CMAT Brasil.` },
              ].map(template => (
                <div key={template.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 mr-3">
                    <p className="text-sm font-medium">{template.label}</p>
                    <p className="text-xs text-slate-500 truncate">{template.text.substring(0, 60)}...</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleCopyMessage(template.text)}>
                      {copied === template.text ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setMessage(template.text)}>
                      Usar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Contatos */}
        <TabsContent value="contatos" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingClients ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
          ) : (
            <div className="space-y-2">
              {filteredClients.slice(0, 50).map(client => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{client.first_name}</p>
                          <Badge className={
                            client.status === 'quente' ? 'bg-red-500 text-white' :
                            client.status === 'morno' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'
                          }>
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{client.clinic_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleOpenWhatsApp(client)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client);
                            document.querySelector('[data-state="active"]')?.click();
                          }}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Materiais */}
        <TabsContent value="materiais" className="mt-4">
          <div className="space-y-4">
            {selectedClient ? (
              <WhatsAppMaterialsIntegration client={selectedClient} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-500 text-sm mb-4">
                    Selecione um cliente na aba "Contatos" para acessar seus materiais
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.querySelector('[data-state="contatos"]')?.click()}
                  >
                    Ir para Contatos
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="historico" className="mt-4">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={async () => {
                setSyncing(true);
                try {
                  const result = await OfflineDataSync.syncAllEntities();
                  toast.success(`Sincronizado: ${result.synced} registros`);
                  queryClient.invalidateQueries(['whatsapp-messages']);
                } catch (error) {
                  toast.error('Erro ao sincronizar');
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar Offline
                </>
              )}
            </Button>
            <ConversationLog
              messages={messages}
              loading={loadingMessages}
              onRefresh={() => queryClient.invalidateQueries(['whatsapp-messages'])}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}