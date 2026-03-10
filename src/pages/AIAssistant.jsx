import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Sparkles, MessageSquare, User, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAssistant() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (client) {
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou o Assistente Master de Vendas da Seamaty. Estou aqui para te ajudar a fechar negócio com **${client.first_name}**.\n\nPosso te ajudar com:\n- Mensagens personalizadas para WhatsApp\n- Estratégias de abordagem baseadas em numerologia\n- Análise de objeções e como contorná-las\n- Sugestões de próximas ações\n- Criação de propostas comerciais\n\nO que você precisa hoje?`
      }]);
    }
  }, [client]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const contextPrompt = `Você é o Assistente Master de Vendas da Seamaty, especialista em equipamentos veterinários.

CONTEXTO DO CLIENTE:
- Nome: ${client.first_name}
- Status: ${client.status}
- Score: ${client.purchase_score}%
- Perfil Numerológico: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Equipamento de Interesse: ${client.equipment_interest || 'Não definido'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Orçamento: ${client.available_budget || 'Não informado'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

HISTÓRICO DA CONVERSA:
${messages.slice(-3).map(m => `${m.role === 'user' ? 'Vendedor' : 'Assistente'}: ${m.content}`).join('\n')}

PERGUNTA DO VENDEDOR:
${userMessage}

INSTRUÇÕES:
- Seja prático e direto
- Sugira ações concretas
- Use numerologia quando relevante
- Forneça textos prontos quando solicitado
- Seja consultivo e estratégico

Responda de forma útil e acionável:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error('Erro ao processar mensagem');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Assistente Master de Vendas
            </h1>
            <p className="text-xs text-orange-100">Cliente: {client.first_name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </Card>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                <span className="text-sm text-slate-600">Pensando...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta ou solicite ajuda..."
            className="resize-none"
            rows={2}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 px-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          💡 Pressione Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}