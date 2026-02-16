import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Loader, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppConversationView({ clientId, clientName, clientPhone }) {
  const [message, setMessage] = useState('');
  const [suggestedReply, setSuggestedReply] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Buscar histórico de mensagens
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-history', clientId],
    queryFn: () => base44.entities.AutomatedMessageLog?.filter({ 
      client_id: clientId 
    }, '-sent_at', 50).catch(() => []),
    refetchInterval: 5000
  });

  // Enviar mensagem
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const response = await base44.functions.invoke('sendWhatsAppMessage', {
        client_id: clientId,
        client_phone: clientPhone,
        message: content,
        auto_log: true
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
      setSuggestedReply('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-history', clientId] });
      toast.success('✅ Mensagem enviada!');
      refetch();
    },
    onError: () => {
      toast.error('❌ Erro ao enviar mensagem');
    }
  });

  // Gerar sugestão de resposta (quando há última mensagem)
  const lastMessageFromClient = messages.find(m => m.role === 'user');
  
  useEffect(() => {
    const generateSuggestion = async () => {
      if (lastMessageFromClient?.message_content && !suggestedReply) {
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Você é um assistente de vendas. Um cliente enviou a seguinte mensagem: "${lastMessageFromClient.message_content}". 
                    Contexto do cliente: ${clientName}.
                    Gere uma resposta profissional, amigável e concisa (máximo 2 linhas) que poderia ser enviada como resposta. Apenas a resposta, sem explicações.`,
            response_json_schema: {
              type: 'object',
              properties: {
                reply: { type: 'string' }
              }
            }
          });
          setSuggestedReply(response.reply);
        } catch (error) {
          console.error('Erro ao gerar sugestão:', error);
        }
      }
    };
    generateSuggestion();
  }, [lastMessageFromClient?.id]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  const userMessages = messages.filter(m => m.role !== 'assistant');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <CardTitle>WhatsApp - {clientName}</CardTitle>
          {clientPhone && <span className="text-xs text-gray-500">{clientPhone}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {/* Histórico de Mensagens */}
        <ScrollArea className="flex-1 border rounded-lg p-4 bg-gray-50">
          <div className="space-y-3">
            {userMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhuma conversa iniciada</p>
              </div>
            ) : (
              userMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sent_status === 'enviada' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      msg.sent_status === 'enviada'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message_content}</p>
                    <p className={`text-xs mt-1 ${msg.sent_status === 'enviada' ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {msg.sent_at && new Date(msg.sent_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Sugestão de Resposta */}
        {suggestedReply && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-900 mb-1">Sugestão de Resposta IA:</p>
                <p className="text-sm text-blue-800 mb-2">{suggestedReply}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => {
                    setMessage(suggestedReply);
                    setSuggestedReply('');
                  }}
                >
                  Usar Sugestão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Campo de Envio */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
                sendMutation.mutate(message);
              }
            }}
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={() => sendMutation.mutate(message)}
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {sendMutation.isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}