import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp Master Assistant - Acesso total via WhatsApp
export default function WhatsAppAgentMaster() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const agentName = 'whatsapp_nr22888_turbo';

  // Criar ou recuperar conversa
  useEffect(() => {
    const initConversation = async () => {
      try {
        const conversations = await base44.agents.listConversations({ agent_name: agentName });
        if (conversations.length > 0) {
          const conv = conversations[0];
          setConversation(conv);
          setMessages(conv.messages || []);
        } else {
          const newConv = await base44.agents.createConversation({
            agent_name: agentName,
            metadata: {
              name: 'WhatsApp Master NR22888',
              description: 'Assistente de vendas via WhatsApp'
            }
          });
          setConversation(newConv);
          setMessages([]);
        }
      } catch (e) {
        toast.error('Erro ao iniciar conversa');
      }
    };
    initConversation();
  }, []);

  // Subscribe para atualizações em tempo real
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [conversation?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;

    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: input.trim()
      });
      setInput('');
    } catch (e) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL(agentName);

  return (
    <div className="space-y-3 h-screen flex flex-col">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-green-600 to-green-700">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Master NR22888 TURBO
              </h1>
              <p className="text-xs text-green-100">Assistente de vendas com acesso total • IA avançada</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-green-600 px-3 py-2 rounded font-semibold text-xs hover:bg-green-50 flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Conectar WhatsApp
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Conversa */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-3 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-slate-500 mt-6">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-[10px] mt-1">Digite uma mensagem para começar</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 space-y-2">
          <Textarea
            placeholder="Envie comandos, análises, ou qualquer requisição de vendas..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) sendMessage();
            }}
            className="min-h-20 text-xs resize-none"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
            {loading ? 'Processando...' : 'Enviar'}
          </Button>
        </div>
      </Card>

      {/* Comandos Rápidos */}
      <Card>
        <CardContent className="p-2.5">
          <p className="text-xs font-bold text-slate-700 mb-2">⚡ COMANDOS RÁPIDOS</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { emoji: '📊', text: 'Relatório Vendas', cmd: 'Gere relatório de vendas do período' },
              { emoji: '🎯', text: 'Leads Quentes', cmd: 'Mostre os top 5 leads mais quentes' },
              { emoji: '🗺️', text: 'Rota Otimizada', cmd: 'Otimize minha rota de visitas hoje' },
              { emoji: '💼', text: 'Proposta IA', cmd: 'Gere proposta personalizada' },
            ].map((cmd, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(cmd.cmd);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="text-xs h-8 justify-start"
              >
                <span>{cmd.emoji}</span>
                <span className="ml-1">{cmd.text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}