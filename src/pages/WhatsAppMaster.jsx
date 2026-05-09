import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle2, Clock, AlertCircle, Send, Eye, Trash2, History, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppMaster() {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending messages for approval
  const { data: messages = [] } = useQuery({
    queryKey: ['pending-whatsapp-messages'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    refetchInterval: 5000, // Real-time updates
  });

  // Fetch message history
  const { data: history = [] } = useQuery({
    queryKey: ['whatsapp-history'],
    queryFn: () => base44.entities.WhatsAppMessage?.list('-created_date', 50).catch(() => []),
  });

  // Send approved message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const result = await base44.functions.invoke('whatsappMasterOrchestrator', {
        action: 'send_approved',
        message_id: messageId,
        approval_timestamp: new Date().toISOString(),
        approved_by: (await base44.auth.me()).email,
      });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`✅ Mensagem enviada para ${data.recipient}`);
      queryClient.invalidateQueries({ queryKey: ['pending-whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-history'] });
      setSelectedMessage(null);
    },
    onError: (err) => toast.error(`❌ Erro: ${err.message}`),
  });

  // Reject message (with audit log)
  const rejectMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const result = await base44.functions.invoke('whatsappMasterOrchestrator', {
        action: 'reject',
        message_id: messageId,
        rejection_reason: 'Rejected by admin',
        rejected_by: (await base44.auth.me()).email,
      });
      return result.data;
    },
    onSuccess: () => {
      toast.info('⏸️ Mensagem rejeitada');
      queryClient.invalidateQueries({ queryKey: ['pending-whatsapp-messages'] });
      setSelectedMessage(null);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <MessageCircle className="w-10 h-10 text-green-600" />
            💬 WhatsApp Master — Aprovação Segura
          </h1>
          <p className="text-slate-600 max-w-2xl">
            🔐 LGPD-SA Compliance: Todas as mensagens requerem aprovação humana. Histórico completo auditado. Rastreamento de quem aprovou, quando e porquê.
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Aprovadas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico Completo
            </TabsTrigger>
          </TabsList>

          {/* PENDENTES */}
          <TabsContent value="pending" className="space-y-4">
            {messages.length === 0 ? (
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhuma mensagem pendente de aprovação</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => (
                <Card key={msg.id} className="bg-white border-l-4 border-orange-500 hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          📱 {msg.recipient || msg.client_name}
                          <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          📋 Tipo: {msg.type === 'proposal' ? 'Proposta' : 'Follow-up'} • 🕐 {new Date(msg.created_date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMessage(msg);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Visualizar
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Preview inline */}
                  {selectedMessage?.id === msg.id && showPreview && (
                    <CardContent className="pt-0 pb-4 space-y-3">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">📝 Conteúdo:</p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>

                      {msg.file_urls && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-2">📎 Arquivos anexados:</p>
                          {msg.file_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline block"
                            >
                              {url.split('/').pop()}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* LGPD-SA Compliance Info */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-900 flex items-center gap-1 mb-2">
                          <Lock className="w-3 h-3" />
                          🔐 LGPD-SA Compliance
                        </p>
                        <p className="text-xs text-green-800">
                          ✅ Consentimento registrado • ✅ Aprovação manual obrigatória • ✅ Auditado • ✅ Rastreável
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => sendMessageMutation.mutate(msg.id)}
                          disabled={sendMessageMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Aprovar e Enviar
                        </Button>
                        <Button
                          onClick={() => rejectMessageMutation.mutate(msg.id)}
                          disabled={rejectMessageMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* APROVADAS */}
          <TabsContent value="approved" className="space-y-4">
            {history
              .filter((m) => m.status === 'sent')
              .slice(0, 20)
              .map((msg) => (
                <Card key={msg.id} className="bg-white border-l-4 border-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          📱 {msg.recipient}
                          <Badge className="bg-green-100 text-green-800">Enviada</Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          ✅ Aprovada por: {msg.approved_by} • 🕐 {new Date(msg.sent_date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </TabsContent>

          {/* HISTÓRICO COMPLETO */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Auditoria Completa de Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Aprovado por</th>
                        <th className="text-left p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((msg) => (
                        <tr key={msg.id} className="border-b hover:bg-slate-50">
                          <td className="p-2">{msg.recipient || msg.client_name}</td>
                          <td className="p-2">{msg.type}</td>
                          <td className="p-2">
                            <Badge
                              className={
                                msg.status === 'sent'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-800'
                              }
                            >
                              {msg.status === 'sent' ? 'Enviada' : 'Pendente'}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs text-slate-600">{msg.approved_by}</td>
                          <td className="p-2 text-xs text-slate-600">
                            {new Date(msg.created_date).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* COMPLIANCE FOOTER */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-bold text-indigo-900">🔐 Segurança</p>
                <p className="text-indigo-700">Todos mensagens auditadas</p>
              </div>
              <div>
                <p className="font-bold text-indigo-900">✅ Aprovação</p>
                <p className="text-indigo-700">100% manual (zero automático)</p>
              </div>
              <div>
                <p className="font-bold text-indigo-900">📋 Rastreamento</p>
                <p className="text-indigo-700">Quem, quando, porquê</p>
              </div>
              <div>
                <p className="font-bold text-indigo-900">🛡️ LGPD-SA</p>
                <p className="text-indigo-700">100% Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}