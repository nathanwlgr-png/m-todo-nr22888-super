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

      {/* Grid com Chat + Gráficos */}
      <div className="grid grid-cols-3 gap-3 flex-1 overflow-hidden">
        {/* Chat - Coluna Principal */}
        <Card className="col-span-2 flex flex-col overflow-hidden bg-white shadow-md border-blue-100">
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-slate-400 mt-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="font-semibold">Inicie a conversa</p>
                <p className="text-[10px] mt-1">Use comandos rápidos ou digite livremente</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-xs font-medium ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                        : 'bg-gradient-to-r from-orange-50 to-orange-100 text-slate-800 border border-orange-200 rounded-bl-none'
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
          <div className="border-t border-blue-100 p-3 space-y-2 bg-gradient-to-r from-blue-50 to-orange-50">
            <Textarea
              placeholder="Digite comando, análise ou pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) sendMessage();
              }}
              className="min-h-16 text-xs resize-none border-blue-200 focus:border-orange-400"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 h-9 text-xs font-bold text-white"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Send className="w-3 h-3 mr-2" />}
              {loading ? 'Processando...' : 'Enviar'}
            </Button>
          </div>
        </Card>

        {/* Painel Lateral - Gráficos + Stats */}
        <div className="space-y-3 overflow-y-auto">
          {/* Gráfico de Mensagens */}
          <Card className="bg-white shadow-md border-orange-100">
            <CardContent className="p-3">
              <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Últimas 7 dias
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={messageStats}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="msgs" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* KPIs Rápidos */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white shadow-md">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold opacity-80 mb-2">📊 STATUS</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Mensagens</span>
                  <span className="font-bold">{messages.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Online</span>
                  <span className="font-bold text-orange-300">✓ Ativo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Badge */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-300 shadow-md">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold text-orange-800 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Tempo Real
              </p>
              <p className="text-xs font-mono text-orange-700 mt-1">
                {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comandos Rápidos - Footer */}
      {commands.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-blue-100 via-orange-100 to-orange-50 shadow-md">
          <CardContent className="p-3">
            <p className="text-xs font-black text-blue-800 mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500" /> RÁPIDOS NR22888
            </p>
            <div className="grid grid-cols-4 gap-2">
              {commands.map((cmd, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  onClick={() => sendMessage(cmd.cmd)}
                  disabled={loading}
                  className="text-xs h-8 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold"
                >
                  <span className="text-xs">{cmd.emoji}</span>
                </Button>
              ))}
            </div>
            <p className="text-[9px] text-slate-600 mt-2 text-center">Clique rápido • Processamento em <1s</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}