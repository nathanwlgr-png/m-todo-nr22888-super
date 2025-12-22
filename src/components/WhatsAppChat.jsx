import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, CheckCheck, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function WhatsAppChat({ contactId, contactName, contactPhone }) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', contactId],
    queryFn: () => base44.entities.WhatsAppMessage.filter({ contact_id: contactId }),
    refetchInterval: 5000 // Refetch a cada 5s
  });

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      // Simular envio via API do WhatsApp Business
      // Na produção, chamaria API real do WhatsApp
      const msg = await base44.entities.WhatsAppMessage.create({
        contact_id: contactId,
        contact_name: contactName,
        contact_phone: contactPhone,
        direction: 'sent',
        message: messageText,
        status: 'sent',
        sent_by: currentUser.email,
        sent_by_name: currentUser.full_name,
        automated: false
      });

      // Simular entrega após 1s
      setTimeout(async () => {
        await base44.entities.WhatsAppMessage.update(msg.id, { status: 'delivered' });
        queryClient.invalidateQueries(['whatsapp-messages', contactId]);
      }, 1000);

      // Simular leitura após 3s
      setTimeout(async () => {
        await base44.entities.WhatsAppMessage.update(msg.id, { status: 'read' });
        queryClient.invalidateQueries(['whatsapp-messages', contactId]);
      }, 3000);

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-messages', contactId]);
      setMessage('');
      toast.success('Mensagem enviada!');
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">Nenhuma mensagem ainda</p>
            <p className="text-slate-400 text-xs mt-1">Envie uma mensagem para iniciar</p>
          </div>
        ) : (
          messages.map(msg => {
            const isSent = msg.direction === 'sent';
            const isAutomated = msg.automated;

            return (
              <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isSent ? 'bg-green-500' : 'bg-white'} rounded-2xl px-4 py-2 shadow-sm`}>
                  {isAutomated && (
                    <p className="text-xs text-green-100 mb-1">🤖 Automático</p>
                  )}
                  <p className={`text-sm ${isSent ? 'text-white' : 'text-slate-800'}`}>
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${isSent ? 'text-green-100' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </span>
                    {isSent && (
                      <>
                        {msg.status === 'sent' && <Check className="w-3 h-3 text-green-100" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-green-100" />}
                        {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-200" />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sendMutation.isPending && handleSend()}
            placeholder="Digite uma mensagem..."
            className="flex-1"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
            className="bg-green-500 hover:bg-green-600"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}