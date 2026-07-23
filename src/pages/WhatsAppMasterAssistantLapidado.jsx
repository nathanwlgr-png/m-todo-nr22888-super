import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, Send, Zap, TrendingUp, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { splitWhatsAppMessage } from '@/components/utils/whatsappChunks';

/**
 * WhatsApp Master Assistant — Lapidação
 * Conversão em tempo real via WhatsApp
 * IA manual (clique, não automático)
 */

export default function WhatsAppMasterAssistantLapidado() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [suggestedMessages, setSuggestedMessages] = useState([]);

  // Buscar clientes com telefone + última interação
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['whatsapp-clients'],
    queryFn: () => base44.entities.Client?.list().then(c => 
      c.filter(x => x.phone && x.status !== 'perdido').slice(0, 50)
    ).catch(() => []),
  });

  // Gerar sugestões de mensagem (IA manual)
  const suggestMessageMutation = useMutation({
    mutationFn: async (clientId) => {
      toast.info('🧠 Analisando cliente...');
      const client = clients.find(c => c.id === clientId);
      const result = await base44.functions.invoke('generatePersonalizedProposal', {
        client_id: clientId,
        strategy: 'whatsapp_message',
        intensity: 4, // Persuasivo
        mode: 'manual'
      });
      return result.data;
    },
    onSuccess: (data) => {
      setSuggestedMessages([
        data.message_1,
        data.message_2,
        data.message_3,
      ].filter(Boolean));
      toast.success('✅ 3 abordagens prontas');
    },
    onError: () => toast.error('Erro ao gerar sugestões'),
  });

  // Enviar mensagem, dividindo textos longos em partes sequenciais identificadas
  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      if (!selectedClient?.phone) throw new Error('Cliente sem WhatsApp');

      const rawChunks = splitWhatsAppMessage(message, 1400);
      const chunks = rawChunks.length > 1
        ? rawChunks.map((chunk, index) => `[${index + 1}/${rawChunks.length}] ${chunk}`)
        : rawChunks;

      toast.info(chunks.length > 1 ? `📤 Enviando ${chunks.length} partes em sequência...` : '📤 Enviando...');
      for (const chunk of chunks) {
        await base44.functions.invoke('sendWhatsAppMessage', {
          phone: selectedClient.phone,
          message: chunk,
          client_id: selectedClient.id,
        });
      }
      return chunks;
    },
    onSuccess: (chunks) => {
      const time = new Date().toLocaleTimeString('pt-BR');
      setConversationHistory(prev => [
        ...prev,
        ...chunks.map(text => ({ role: 'sent', text, time }))
      ]);
      setMessageInput('');
      setSuggestedMessages([]);
      toast.success(chunks.length > 1 ? `✅ ${chunks.length} partes enviadas em sequência` : '✅ Mensagem enviada');
    },
    onError: (error) => toast.error(error.message || 'Erro ao enviar'),
  });

  const handleQuickMessage = (msg) => {
    setMessageInput(msg);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  // Filtrar clientes "quentes"
  const hotClients = clients.filter(c => c.status === 'quente').slice(0, 10);
  const messageChunks = splitWhatsAppMessage(messageInput, 1400);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-green-900 flex items-center gap-2">
              <MessageCircle className="w-10 h-10" />
              💬 WhatsApp Master Assistant
            </h1>
            <p className="text-slate-600 mt-2">Conversão direta no WhatsApp — IA manual, máxima controle</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{hotClients.length}</p>
            <p className="text-xs text-slate-500">clientes quentes</p>
          </div>
        </div>

        {/* LAYOUT: Cliente + Chat */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* LISTA DE CLIENTES */}
          <div className="md:col-span-1">
            <Card className="bg-white h-[600px] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Clientes Quentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clientsLoading ? (
                  <p className="text-xs text-slate-500">Carregando...</p>
                ) : hotClients.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem clientes quentes no CRM</p>
                ) : (
                  hotClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedClient?.id === client.id
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="font-bold text-sm">{client.first_name}</p>
                      <p className="text-xs opacity-70">{client.clinic_name}</p>
                      {client.phone && (
                        <p className="text-xs mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone.slice(-4)}
                        </p>
                      )}
                      {client.last_contact_date && (
                        <p className="text-xs opacity-60 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(client.last_contact_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* CHAT + SUGESTÕES */}
          <div className="md:col-span-2 space-y-4">

            {!selectedClient ? (
              <Card className="bg-white p-8 text-center h-[600px] flex items-center justify-center">
                <div>
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Selecione um cliente para iniciar conversa</p>
                </div>
              </Card>
            ) : (
              <>
                {/* HISTÓRICO DE CONVERSA */}
                <Card className="bg-white h-80 overflow-y-auto">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-slate-500 text-center mb-2">--- Início da conversa ---</p>
                    {conversationHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        Nenhuma mensagem enviada ainda
                      </p>
                    ) : (
                      conversationHistory.map((msg, i) => (
                        <div key={i} className={`text-xs ${msg.role === 'sent' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-2 rounded-lg ${
                            msg.role === 'sent'
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          } max-w-xs`}>
                            {msg.text}
                          </div>
                          <p className="text-slate-400 mt-1">{msg.time}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* SUGESTÕES IA */}
                {suggestedMessages.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-blue-900 mb-3">💡 Sugestões de Abordagem</p>
                      <div className="space-y-2">
                        {suggestedMessages.map((msg, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickMessage(msg)}
                            className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:border-blue-400 text-xs text-slate-700 hover:bg-blue-50 transition-all"
                          >
                            {msg.substring(0, 80)}...
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* INPUT + BOTÕES */}
                <Card className="bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Escreva ou cole seu roteiro SPIN completo..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 min-h-20 text-sm focus:ring-2 focus:ring-green-600"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </Button>
                    </div>

                    {messageChunks.length > 1 && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2" role="status" aria-live="polite">
                        <p className="text-xs font-bold text-green-900">
                          A mensagem será enviada em {messageChunks.length} partes sequenciais:
                        </p>
                        {messageChunks.map((chunk, index) => (
                          <div key={index} className="rounded border border-green-200 bg-white p-2 text-xs text-slate-700">
                            <span className="font-bold text-green-700">[{index + 1}/{messageChunks.length}]</span>{' '}
                            {chunk.slice(0, 120)}{chunk.length > 120 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => suggestMessageMutation.mutate(selectedClient.id)}
                      disabled={suggestMessageMutation.isPending}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      {suggestMessageMutation.isPending ? 'Analisando...' : 'Gerar Sugestões IA'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-xs opacity-90">Clientes com WhatsApp</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{conversationHistory.length}</p>
              <p className="text-xs opacity-90">Mensagens enviadas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{hotClients.length}</p>
              <p className="text-xs opacity-90">Oportunidades quentes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">IA Manual</p>
              <p className="text-xs opacity-90">100% sob controle</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}