import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TeamChat({ contextType, contextId, contextName, compact = false }) {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(!compact);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['team-messages', contextType, contextId],
    queryFn: () => base44.entities.TeamMessage.filter({ 
      context_type: contextType, 
      context_id: contextId 
    }),
    refetchInterval: 3000, // Poll a cada 3s para "tempo real"
    enabled: !!contextId,
  });

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['active-users', contextType, contextId],
    queryFn: async () => {
      const all = await base44.entities.UserActivity.filter({ 
        context_type: contextType, 
        context_id: contextId 
      });
      // Filtrar apenas usuários ativos nos últimos 30s
      const now = new Date();
      return all.filter(u => {
        const lastSeen = new Date(u.last_seen || u.updated_date);
        return (now - lastSeen) < 30000;
      });
    },
    refetchInterval: 5000,
    enabled: !!contextId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-messages']);
      setMessage('');
      scrollToBottom();
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async (action) => {
      const existing = await base44.entities.UserActivity.filter({
        user_email: currentUser.email,
        context_type: contextType,
        context_id: contextId
      });

      const data = {
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        context_type: contextType,
        context_id: contextId,
        action,
        last_seen: new Date().toISOString()
      };

      if (existing.length > 0) {
        return base44.entities.UserActivity.update(existing[0].id, data);
      } else {
        return base44.entities.UserActivity.create(data);
      }
    },
  });

  useEffect(() => {
    if (currentUser && contextId) {
      updateActivityMutation.mutate('viewing');
      const interval = setInterval(() => {
        updateActivityMutation.mutate('viewing');
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, contextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      context_type: contextType,
      context_id: contextId,
      context_name: contextName,
      message: message.trim(),
      sender_email: currentUser.email,
      sender_name: currentUser.full_name
    });
  };

  const otherUsers = activeUsers.filter(u => u.user_email !== currentUser?.email);

  if (compact && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg bg-indigo-600 hover:bg-indigo-700 z-40"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs">
            {messages.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className={compact ? "fixed bottom-20 right-4 w-80 shadow-2xl z-40" : "w-full"}>
      <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Chat da Equipe</h3>
            {otherUsers.length > 0 && (
              <p className="text-xs text-slate-600">
                <Users className="w-3 h-3 inline mr-1" />
                {otherUsers.map(u => u.user_name?.split(' ')[0]).join(', ')} online
              </p>
            )}
          </div>
        </div>
        {compact && (
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhuma mensagem ainda</p>
            <p className="text-xs text-slate-400">Inicie a conversa com sua equipe</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === currentUser?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-white'} rounded-lg p-3 shadow-sm`}>
                  {!isMe && (
                    <p className="text-xs font-semibold text-indigo-600 mb-1">
                      {msg.sender_name?.split(' ')[0]}
                    </p>
                  )}
                  <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>
                    {msg.message}
                  </p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim()} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}