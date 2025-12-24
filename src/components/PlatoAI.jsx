import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function PlatoAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🏛️ *Χαῖρε* (Salve), viajante do conhecimento.

Sou Platão, filho de Atenas, discípulo de Sócrates e mestre de Aristóteles. Venho dos tempos da Academia, onde a busca pela verdade era nossa maior virtude.

**"A sabedoria começa na reflexão."**

Posso guiar-te através das sombras da caverna até a luz do conhecimento. Fala comigo sobre tua jornada, teus clientes, tuas estratégias de vendas - e aplicaremos a filosofia à praxis comercial.

O que te perturba a alma nesta jornada?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedTopics = [
    "💭 Como convencer um cliente difícil?",
    "🎯 Qual a essência de uma boa venda?",
    "🏛️ Como aplicar ética nas vendas?",
    "⚖️ Justiça vs Lucro: como equilibrar?",
    "🧠 Como conhecer melhor meu cliente?",
    "💡 Estratégia para fechar negócio"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = [...messages, userMessage]
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Platão'}: ${m.content}`)
        .join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é Platão, o filósofo grego (427-347 a.C.), fundador da Academia de Atenas, discípulo de Sócrates e autor de "A República", "O Banquete", "Fédon" e outros diálogos.

PERSONALIDADE E ESTILO:
• Use linguagem elegante, profunda e filosófica
• Cite suas próprias obras e conceitos (Teoria das Ideias, Mundo das Formas, Alegoria da Caverna, etc)
• Faça perguntas socráticas para provocar reflexão
• Use metáforas e analogias filosóficas
• Seja sábio, paciente e reflexivo
• Inicie respostas ocasionalmente com frases em grego antigo (transliterado)
• Conecte vendas e negócios com virtudes: justiça, temperança, coragem, sabedoria

CONTEXTO: Você está aconselhando um vendedor moderno do ramo veterinário que usa um CRM chamado "Método NR22". Ele te pergunta sobre estratégias de vendas, relacionamento com clientes, ética nos negócios.

CONVERSAÇÃO ANTERIOR:
${conversationHistory}

Responda como Platão responderia, aplicando filosofia clássica aos desafios modernos de vendas. Use markdown para formatação. Seja profundo mas prático. Máximo 200 palavras.`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao consultar Platão');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ *As Musas me abandonaram momentaneamente.* Tenta novamente, jovem aprendiz.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-amber-200"
        style={{ boxShadow: '0 8px 32px rgba(217, 119, 6, 0.5)' }}
      >
        <div className="text-center">
          <span className="text-2xl">🏛️</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4">
      <Card className="w-full max-w-2xl h-[90vh] sm:h-[600px] bg-gradient-to-b from-amber-50 to-orange-50 border-4 border-amber-400 shadow-2xl flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-orange-700 p-4 flex items-center justify-between border-b-4 border-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-2xl border-2 border-amber-900">
              🏛️
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Platão</h2>
              <p className="text-xs text-amber-100">Filósofo da Academia de Atenas</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 ${
                msg.role === 'user' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-white border-2 border-amber-300 shadow-md'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-amber-900 prose-strong:text-amber-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-sm text-amber-800 italic">Platão reflete...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Topics */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-amber-800 mb-2">💡 Temas para reflexão:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic, idx) => (
                <Badge
                  key={idx}
                  className="cursor-pointer bg-amber-200 text-amber-900 hover:bg-amber-300 border border-amber-400"
                  onClick={() => sendMessage(topic.replace(/^[^\s]+ /, ''))}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-amber-100 border-t-4 border-amber-300">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Compartilha teus pensamentos, jovem aprendiz..."
              className="resize-none border-2 border-amber-300 focus:border-amber-500 bg-white"
              rows={2}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="bg-amber-600 hover:bg-amber-700 h-auto"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-amber-700 mt-2 italic text-center">
            "Conhece-te a ti mesmo" - Inscrito no Templo de Apolo
          </p>
        </div>
      </Card>
    </div>
  );
}