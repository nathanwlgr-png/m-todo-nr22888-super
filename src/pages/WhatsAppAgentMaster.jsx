import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Zap, MessageCircle, Sparkles, TrendingUp, FileText, Clock, BarChart3, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

  // Gráficos de dados
  const messageStats = useMemo(() => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toLocaleDateString('pt-BR', { weekday: 'short' });
      stats.push({
        date,
        msgs: Math.floor(Math.random() * 15) + 5,
        respostas: Math.floor(Math.random() * 10) + 2
      });
    }
    return stats;
  }, []);

  return (
    <div className="space-y-3 h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header com cores NR22888 */}
      <Card className="border-0 bg-gradient-to-r from-blue-700 via-blue-600 to-orange-600 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-300 animate-pulse" />
                NR22888 MASTER
              </h1>
              <p className="text-xs text-blue-100 mt-1">WhatsApp • Vendas • IA Completa</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-400 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-orange-500 flex items-center gap-2 shadow-lg"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
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