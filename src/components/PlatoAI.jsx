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
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🏛️ *Χαῖρε* (Salve), viajante do conhecimento.

Sou Platão, filho de Atenas, discípulo de Sócrates e mestre de Aristóteles. Venho dos tempos da Academia, onde a busca pela verdade era nossa maior virtude.

**"A sabedoria começa na reflexão."**

Posso guiar-te através das sombras da caverna até a luz do conhecimento. Fala comigo sobre tua jornada, teus clientes, tuas estratégias de vendas - e aplicaremos a filosofia à praxis comercial.

**Agora estou sempre à escuta.** Fala, e responderei.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Reconhecimento de voz contínuo
  useEffect(() => {
    if (!open) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Reconhecimento de voz não suportado');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript.trim()) {
        sendMessage(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Ignorar silêncio
        return;
      }
      console.error('Erro reconhecimento de voz:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Reiniciar automaticamente
      if (open && isListening) {
        try {
          recognition.start();
        } catch (error) {
          console.warn('Não foi possível reiniciar reconhecimento');
        }
      }
    };

    recognitionRef.current = recognition;

    // Iniciar reconhecimento após 1s
    const timeout = setTimeout(() => {
      try {
        recognition.start();
        setIsListening(true);
        toast.success('🎤 Platão está te ouvindo', { duration: 2000 });
      } catch (error) {
        console.warn('Não foi possível iniciar reconhecimento de voz');
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [open]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Aguardar 2s antes de chamar (evitar rate limit)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      let errorMessage = '⚠️ *As Musas me abandonaram momentaneamente.* Tenta novamente, jovem aprendiz.';
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = '⏳ *Paciência, jovem aprendiz.* As estrelas nos pedem que aguardemos alguns instantes antes de continuar nossa conversa filosófica. Tenta novamente em 1 minuto.';
        toast.error('Limite de IA atingido. Aguarde 1 minuto.');
      } else if (error.message?.includes('Network')) {
        errorMessage = '🌐 *Os ventos de Éolo impedem nossa comunicação.* Verifica tua conexão com a rede e tenta novamente.';
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        toast.error('Erro ao consultar Platão');
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="bg-gradient-to-b from-amber-50 to-orange-50 border-4 border-amber-400 shadow-2xl flex flex-col rounded-3xl overflow-hidden max-h-[500px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-orange-700 p-3 flex items-center justify-between border-b-4 border-amber-900">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-xl border-2 border-amber-900">
              🏛️
            </div>
            <div>
              <h2 className="font-bold text-white">Platão</h2>
              <p className="text-xs text-amber-100 flex items-center gap-1">
                {isListening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                {isListening ? 'Ouvindo...' : 'Filósofo'}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
            }}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[300px]">
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
          <div className="px-3 pb-2">
            <p className="text-xs font-semibold text-amber-800 mb-2">💡 Ou digite/fale:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedTopics.slice(0, 4).map((topic, idx) => (
                <Badge
                  key={idx}
                  className="cursor-pointer bg-amber-200 text-amber-900 hover:bg-amber-300 border border-amber-400 text-xs"
                  onClick={() => sendMessage(topic.replace(/^[^\s]+ /, ''))}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-amber-100 border-t-4 border-amber-300">
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
              placeholder={isListening ? "🎤 Fale ou digite..." : "Digite sua pergunta..."}
              className="resize-none border-2 border-amber-300 focus:border-amber-500 bg-white text-sm"
              rows={2}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="bg-amber-600 hover:bg-amber-700 h-auto px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-amber-700 mt-1 italic text-center flex items-center justify-center gap-1">
            {isListening && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
            {isListening ? 'Ouvindo continuamente' : '"Conhece-te a ti mesmo"'}
          </p>
        </div>
      </Card>
    </div>
  );
}