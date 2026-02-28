import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  CheckCircle, XCircle, Edit, Send, Clock, 
  MessageSquare, Mail, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function MessageApproval() {
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const queryClient = useQueryClient();

  const { data: automatedMessages = [], isLoading: loadingAuto } = useQuery({
    queryKey: ['pending-messages-auto'],
    queryFn: () => base44.entities.AutomatedMessageLog?.filter({ sent_status: 'pendente' }).catch(() => []),
    refetchInterval: 5000
  });

  const { data: pendingMsgs = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pending-messages-queue'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    refetchInterval: 5000
  });

  // Normaliza ambas as fontes para um formato unificado
  const pendingMessages = [
    ...automatedMessages.map(m => ({ ...m, _source: 'auto' })),
    ...pendingMsgs.map(m => ({
      id: m.id,
      _source: 'pending',
      client_name: m.client_name || m.contact_name || 'Contato',
      message_type: m.channel || 'whatsapp',
      message_content: m.message_content || m.content || '',
      trigger_reason: m.trigger_reason || m.reason || '',
      ai_reasoning: m.ai_reasoning || '',
      email_subject: m.email_subject || '',
      context: m.context || '',
      suggested_send_time: m.suggested_send_time || null,
    }))
  ];

  const isLoading = loadingAuto && loadingPending;

  const approveMutation = useMutation({
    mutationFn: async ({ id, content, source }) => {
      if (source === 'pending') {
        await base44.entities.PendingMessage.update(id, {
          status: 'approved',
          message_content: content,
          approved_at: new Date().toISOString()
        });
      } else {
        await base44.entities.AutomatedMessageLog.update(id, {
          sent_status: 'enviada',
          message_content: content,
          sent_at: new Date().toISOString()
        });
        await base44.functions.invoke('sendApprovedMessages', { message_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-messages-auto'] });
      queryClient.invalidateQueries({ queryKey: ['pending-messages-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pending-messages-count'] });
      toast.success('✅ Mensagem aprovada e enviada!');
      setEditingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, source }) => {
      if (source === 'pending') {
        await base44.entities.PendingMessage.update(id, { status: 'rejected' });
      } else {
        await base44.entities.AutomatedMessageLog.update(id, { sent_status: 'bloqueado' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-messages-auto'] });
      queryClient.invalidateQueries({ queryKey: ['pending-messages-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pending-messages-count'] });
      toast.success('❌ Mensagem bloqueada.');
    }
  });

  const handleApprove = (msg) => {
    const finalContent = editingId === msg.id ? editedContent : msg.message_content;
    approveMutation.mutate({ id: msg.id, content: finalContent, source: msg._source });
  };

  const handleEdit = (msg) => {
    setEditingId(msg.id);
    setEditedContent(msg.message_content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p>Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Aprovação de Mensagens Automáticas</CardTitle>
          <p className="text-indigo-100">
            {pendingMessages.length} mensagem(ns) aguardando sua aprovação
          </p>
        </CardHeader>
      </Card>

      {pendingMessages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tudo em dia! 🎉</h3>
            <p className="text-slate-600">Não há mensagens pendentes de aprovação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingMessages.map((msg) => (
            <Card key={msg.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {msg.message_type?.includes('whatsapp') ? (
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    ) : (
                      <Mail className="w-6 h-6 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {msg.client_name}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {msg.message_type} • {msg.trigger_reason || 'Sem motivo especificado'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-orange-500">
                    Pendente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {msg.ai_reasoning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Por que enviar esta mensagem:
                        </p>
                        <p className="text-sm text-blue-800">{msg.ai_reasoning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {msg.email_subject && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Assunto:</p>
                    <p className="font-semibold">{msg.email_subject}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-600 mb-2">Mensagem Preparada pela IA:</p>
                  {editingId === msg.id ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="bg-slate-50 border rounded-lg p-4 whitespace-pre-wrap font-mono text-sm">
                      {msg.message_content}
                    </div>
                  )}
                </div>

                {msg.context && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-600">
                      Ver contexto da conversa
                    </summary>
                    <div className="mt-2 bg-slate-50 p-2 rounded text-slate-700">
                      {msg.context}
                    </div>
                  </details>
                )}

                {msg.suggested_send_time && (
                  <p className="text-xs text-slate-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Melhor horário: {new Date(msg.suggested_send_time).toLocaleString('pt-BR')}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  {editingId === msg.id ? (
                    <>
                      <Button
                        onClick={() => handleApprove(msg)}
                        className="flex-1 bg-green-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Aprovar Editada
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleApprove(msg)}
                        className="flex-1 bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar & Enviar
                      </Button>
                      <Button
                        onClick={() => handleEdit(msg)}
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate({ id: msg.id, source: msg._source })}
                        variant="outline"
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}