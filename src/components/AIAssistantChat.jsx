import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AIAssistantChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente virtual. Como posso ajudar você hoje?\n\nPosso responder sobre:\n• Produtos e equipamentos\n• Preços e propostas\n• Status de clientes\n• Agendamento de visitas\n• Dúvidas gerais'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Buscar contexto relevante
      const [clients, equipments] = await Promise.all([
        base44.entities.Client.list('-updated_date', 10),
        base44.entities.Equipment.list().catch(() => [])
      ]);

      const conversationHistory = messages.map(m => 
        `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`
      ).join('\n');

      const prompt = `
Você é um assistente virtual especializado em vendas de equipamentos veterinários.

CONTEXTO DA CONVERSA:
${conversationHistory}

NOVA PERGUNTA DO USUÁRIO:
${userMessage}

DADOS DISPONÍVEIS:
- Últimos clientes: ${JSON.stringify(clients.slice(0, 5).map(c => ({ nome: c.first_name, cidade: c.city, status: c.status })))}
- Equipamentos: ${JSON.stringify(equipments.slice(0, 5).map(e => ({ nome: e.name, preco: e.price })))}

INSTRUÇÕES:
- Responda de forma amigável, clara e objetiva
- Use os dados disponíveis quando relevante
- Se não tiver informação específica, sugira como o usuário pode encontrar
- Mantenha o tom profissional mas acessível
- Use emojis ocasionalmente para humanizar

Responda à pergunta do usuário:
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua mensagem');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Assistente Virtual
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`p-3 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50'
              }`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-3 bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating button component
export function AIAssistantButton() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      <AIAssistantChat isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  );
}