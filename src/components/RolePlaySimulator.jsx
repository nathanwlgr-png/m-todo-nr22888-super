import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Loader2, Send, Sparkles, Target, 
  AlertCircle, CheckCircle2, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function RolePlaySimulator() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [realtimeFeedback, setRealtimeFeedback] = useState([]);
  const messagesEndRef = useRef(null);

  const [objectionsMode, setObjectionsMode] = useState(false);
  const [objectionsQueue, setObjectionsQueue] = useState([]);
  
  const clientProfiles = [
    {
      id: 'cautious',
      name: 'Dr. Carlos Silva',
      type: 'Cauteloso/Analítico',
      difficulty: 'Difícil',
      objections: ['Preço muito alto', 'Preciso comparar com concorrentes', 'Não tenho tempo agora', 'Quero ver estudos de caso'],
      personality: 'Analítico, desconfiado, precisa de dados concretos e tempo para decidir',
      objection_frequency: 'high'
    },
    {
      id: 'enthusiast',
      name: 'Dra. Ana Costa',
      type: 'Entusiasta/Rápido',
      difficulty: 'Médio',
      objections: ['É compatível com meu sistema atual?', 'E o suporte técnico?', 'Quanto tempo de instalação?'],
      personality: 'Empolgada com tecnologia, decide rápido mas quer garantias técnicas',
      objection_frequency: 'medium'
    },
    {
      id: 'skeptical',
      name: 'Dr. Roberto Alves',
      type: 'Cético/Resistente',
      difficulty: 'Muito Difícil',
      objections: ['Já trabalho com meu fornecedor há 15 anos', 'Não confio em novidades', 'Sempre dá problema no começo', 'Minha equipe é resistente'],
      personality: 'Extremamente resistente a mudanças, tradicional, leal ao fornecedor atual',
      objection_frequency: 'very_high'
    },
    {
      id: 'budget',
      name: 'Dra. Juliana Santos',
      type: 'Focado em Orçamento',
      difficulty: 'Médio',
      objections: ['Muito caro', 'ROI não compensa', 'Orçamento apertado', 'Posso parcelar?'],
      personality: 'Focada em custos e retorno financeiro, quer soluções econômicas',
      objection_frequency: 'high'
    },
    {
      id: 'aggressive',
      name: 'Dr. Marcos Ferreira',
      type: 'Agressivo/Dominador',
      difficulty: 'Muito Difícil',
      objections: ['Sua proposta é ridícula', 'Vocês não entendem minha clínica', 'Tenho 3 ofertas melhores', 'Não me convenceu'],
      personality: 'Agressivo, dominador, gosta de negociar duramente e intimidar',
      objection_frequency: 'very_high'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSession = (profile, withObjections = false) => {
    setSelectedProfile(profile);
    setObjectionsMode(withObjections);
    setObjectionsQueue(withObjections ? [...profile.objections] : []);
    
    const greetings = {
      cautious: "Olá. Recebi sua ligação. Confesso que tenho muitas dúvidas sobre esses equipamentos modernos... Sou mais tradicional.",
      enthusiast: "Oi! Que legal você entrar em contato! Sempre adorei novas tecnologias. Mas me conte mais sobre esse equipamento.",
      skeptical: "Bom dia. Vou ser direto: trabalho com meu fornecedor atual há 15 anos e nunca tive problemas. Por que mudaria agora?",
      budget: "Olá. Meu orçamento está bem apertado esse ano. Preciso entender se isso realmente vale a pena financeiramente.",
      aggressive: "Fala aí. Recebi várias propostas melhores que a sua essa semana. Me convença rápido porque não tenho tempo a perder."
    };
    
    setMessages([
      {
        role: 'system',
        content: `Role-play iniciado: ${profile.name} (${profile.type})${withObjections ? ' - MODO OBJEÇÕES ATIVAS' : ''}`
      },
      {
        role: 'ai',
        content: greetings[profile.id] || greetings.cautious
      }
    ]);
    setSessionScore(50);
    setRealtimeFeedback([]);
  };

  const analyzeUserMessage = async (message, aiResponse) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um coach de vendas especialista. Analise esta mensagem do vendedor durante um role-play:

PERFIL DO CLIENTE: ${selectedProfile.personality}
MENSAGEM DO VENDEDOR: "${message}"
RESPOSTA DO CLIENTE (IA): "${aiResponse}"

Forneça feedback instantâneo sobre:
1. Identificar técnicas usadas (SPIN, gatilhos Cialdini, etc)
2. Pontos positivos
3. O que poderia melhorar
4. Score desta mensagem (0-10)

Seja CONCISO e ESPECÍFICO.`,
        response_json_schema: {
          type: "object",
          properties: {
            techniques_used: { type: "array", items: { type: "string" } },
            positive: { type: "string" },
            improvement: { type: "string" },
            message_score: { type: "number" },
            highlights: { 
              type: "object",
              properties: {
                spin_questions: { type: "boolean" },
                social_proof: { type: "boolean" },
                objection_handling: { type: "boolean" }
              }
            }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Erro ao analisar mensagem:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isAITyping) return;

    const userMessage = userInput;
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAITyping(true);

    try {
      // IA responde como o cliente
      const shouldInjectObjection = objectionsMode && 
                                    objectionsQueue.length > 0 && 
                                    messages.length % 3 === 0;
      
      const objectionToUse = shouldInjectObjection ? objectionsQueue[0] : null;
      
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Você está simulando o cliente "${selectedProfile.name}" em um role-play de vendas.

PERFIL: ${selectedProfile.personality}
OBJEÇÕES TÍPICAS: ${selectedProfile.objections.join(', ')}
${objectionToUse ? `\n⚠️ OBJEÇÃO OBRIGATÓRIA NESTA RESPOSTA: "${objectionToUse}"` : ''}

HISTÓRICO DA CONVERSA:
${messages.map(m => `${m.role === 'user' ? 'VENDEDOR' : 'CLIENTE'}: ${m.content}`).join('\n')}

ÚLTIMA MENSAGEM DO VENDEDOR: "${userMessage}"

Responda como ${selectedProfile.name}:
- Mantenha o perfil e personalidade consistentes
${objectionToUse ? `- IMPORTANTE: Use a objeção "${objectionToUse}" de forma natural e desafiadora` : '- Use objeções realistas quando apropriado'}
- Se o vendedor usar boas técnicas, mostre interesse gradual
- Se usar técnicas ruins, fique mais resistente
- Seja realista e desafiador

Responda em 1-3 frases CURTAS.`
      });
      
      if (shouldInjectObjection) {
        setObjectionsQueue(prev => prev.slice(1));
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

      // Análise em tempo real
      const feedback = await analyzeUserMessage(userMessage, aiResponse);
      
      if (feedback) {
        setRealtimeFeedback(prev => [
          ...prev.slice(-4), // mantém só as últimas 5
          {
            message: userMessage,
            ...feedback,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        // Atualiza score da sessão
        const newScore = Math.round((sessionScore * 0.8) + (feedback.message_score * 10 * 0.2));
        setSessionScore(newScore);

        if (feedback.message_score >= 8) {
          toast.success('Excelente! Continue assim!');
        } else if (feedback.message_score <= 4) {
          toast.error('Atenção: ' + feedback.improvement);
        }
      }

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar mensagem');
    } finally {
      setIsAITyping(false);
    }
  };

  const endSession = async () => {
    if (messages.length > 4) {
      // Salvar sessão
      try {
        await base44.entities.RolePlaySession.create({
          profile_id: selectedProfile.id,
          profile_name: selectedProfile.name,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: new Date().toISOString()
          })),
          final_score: sessionScore,
          duration_minutes: Math.round((messages.length * 2) / 60),
          techniques_identified: [...new Set(realtimeFeedback.flatMap(f => f.techniques_used || []))],
          feedback_summary: realtimeFeedback.length > 0 ? realtimeFeedback[realtimeFeedback.length - 1].improvement : '',
          completed: true
        });
      } catch (error) {
        console.error('Erro ao salvar sessão:', error);
      }
      toast.success(`Sessão finalizada! Score: ${sessionScore}/100`);
    }
    setSelectedProfile(null);
    setMessages([]);
    setRealtimeFeedback([]);
    setSessionScore(0);
  };

  if (!selectedProfile) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5" />
            Simulador de Role-Play
          </CardTitle>
          <p className="text-sm text-blue-700">
            Treine conversas de vendas com clientes virtuais IA
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {clientProfiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{profile.name}</p>
                  <p className="text-sm text-gray-600">{profile.type}</p>
                </div>
                <Badge className={
                  profile.difficulty === 'Fácil' ? 'bg-green-500' :
                  profile.difficulty === 'Médio' ? 'bg-yellow-500' :
                  profile.difficulty === 'Difícil' ? 'bg-orange-500' :
                  'bg-red-500'
                }>
                  {profile.difficulty}
                </Badge>
              </div>
              <div className="space-y-2 text-xs text-gray-600 mb-3">
                <p><strong>Personalidade:</strong> {profile.personality}</p>
                <p><strong>Objeções ({profile.objections.length}):</strong> {profile.objections.slice(0, 2).join(', ')}...</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startSession(profile, false)}
                  className="border-blue-300"
                >
                  Treino Livre
                </Button>
                <Button
                  size="sm"
                  onClick={() => startSession(profile, true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  🔥 Modo Objeções
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Users className="w-5 h-5" />
              Role-Play: {selectedProfile.name}
            </CardTitle>
            <p className="text-xs text-blue-600">{selectedProfile.type}</p>
          </div>
          <Button onClick={endSession} variant="outline" size="sm">
            Finalizar
          </Button>
        </div>
        
        {/* Score em Tempo Real */}
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">PERFORMANCE</span>
              <span className="text-lg font-bold text-blue-600">{sessionScore}/100</span>
            </div>
            <Progress value={sessionScore} className="h-2" />
          </div>
          
          {objectionsMode && (
            <div className="p-2 bg-red-50 rounded-lg border border-red-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800">🔥 OBJEÇÕES ATIVAS</span>
                <Badge className="bg-red-600">{objectionsQueue.length} restantes</Badge>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mensagens */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-4 h-64 overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'system' ? (
                <div className="w-full p-2 bg-gray-100 rounded text-center">
                  <p className="text-xs text-gray-600">{msg.content}</p>
                </div>
              ) : (
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              )}
            </div>
          ))}
          {isAITyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Feedback em Tempo Real */}
        {realtimeFeedback.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-800">💡 FEEDBACK EM TEMPO REAL</p>
            {realtimeFeedback.slice(-2).map((feedback, idx) => (
              <div key={idx} className="p-2 bg-white rounded border border-blue-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{feedback.timestamp}</span>
                  <Badge className={
                    feedback.message_score >= 8 ? 'bg-green-500' :
                    feedback.message_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }>
                    {feedback.message_score}/10
                  </Badge>
                </div>
                {feedback.techniques_used?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {feedback.techniques_used.map((tech, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
                {feedback.positive && (
                  <p className="text-green-700 flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 mt-0.5" />
                    {feedback.positive}
                  </p>
                )}
                {feedback.improvement && (
                  <p className="text-orange-700 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5" />
                    {feedback.improvement}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua resposta..."
            disabled={isAITyping}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!userInput.trim() || isAITyping}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAITyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}