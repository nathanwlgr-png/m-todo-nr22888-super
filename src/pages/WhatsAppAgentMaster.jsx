import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Zap, MessageCircle, Sparkles, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp Master Assistant - Acesso total via WhatsApp
export default function WhatsAppAgentMaster() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [commands, setCommands] = useState([]);
  const messagesEndRef = useRef(null);

  const agentName = 'whatsapp_nr22888_turbo';

  // Carregar comandos disponíveis
  useEffect(() => {
    const loadCommands = async () => {
      try {
        const result = await base44.functions.invoke('whatsappMasterOrchestrator', {
          action: 'getQuickCommands'
        });
        setCommands(result.data?.commands || []);
      } catch (e) {
        console.error('Erro ao carregar comandos');
      }
    };
    loadCommands();
  }, []);

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

  const sendMessage = async (text = input) => {
    if (!text.trim() || !conversation) return;

    setLoading(true);
    try {
      // Processa comando se for um dos rápidos
      const cmdResult = await base44.functions.invoke('whatsappMasterOrchestrator', {
        action: 'processCommand',
        data: { cmd: text.toLowerCase(), context: 'whatsapp' }
      });

      // Se houver resultado de comando, mostra; senão envia para o agente
      if (cmdResult.data?.success && cmdResult.data?.hotClients) {
        const cmdMsg = `🔥 Clientes Quentes:\n${cmdResult.data.hotClients.join('\n')}`;
        await base44.agents.addMessage(conversation, {
          role: 'assistant',
          content: cmdMsg
        });
      } else {
        await base44.agents.addMessage(conversation, {
          role: 'user',
          content: text.trim()
        });
      }
      setInput('');
    } catch (e) {
      toast.error('Erro ao processar');
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
      {commands.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-2.5">
            <p className="text-xs font-bold text-purple-700 mb-2">⚡ COMANDOS RÁPIDOS NR22888</p>
            <div className="grid grid-cols-2 gap-1">
              {commands.map((cmd, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(cmd.cmd)}
                  disabled={loading}
                  className="text-xs h-7 justify-start text-purple-700 hover:bg-purple-100"
                >
                  <span>{cmd.emoji}</span>
                  <span className="ml-1 truncate text-[10px]">{cmd.desc}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}