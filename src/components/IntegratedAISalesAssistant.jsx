import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Send, MessageSquare, Target, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegratedAISalesAssistant({ client }) {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', client.id],
    queryFn: () => base44.entities.Visit.filter({ client_id: client.id })
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['client-interactions', client.id],
    queryFn: () => base44.entities.Interaction.filter({ client_id: client.id })
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: client.id })
  });

  const quickActions = [
    { label: 'Melhor abordagem agora', icon: Target },
    { label: 'Contornar objeções', icon: MessageSquare },
    { label: 'Gatilho de urgência', icon: Sparkles },
    { label: 'Roteiro de fechamento', icon: Lightbulb }
  ];

  const askAI = async (userQuestion) => {
    setLoading(true);
    const userMessage = { role: 'user', content: userQuestion };
    setConversation(prev => [...prev, userMessage]);

    try {
      const context = `**CONTEXTO COMPLETO DO CLIENTE:**
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Caminho Vida: ${client.life_path_number}
- Estilo Decisão: ${client.decision_style}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Equipamento Interesse: ${client.equipment_interest}
- Orçamento: R$ ${client.available_budget?.toLocaleString('pt-BR')}
- Dores: ${client.main_pains?.join(', ')}
- Objeções: ${client.real_objections?.join(', ')}
- Última Visita: ${client.last_visit_date}
- Total Visitas: ${visits.length}
- Total Interações: ${interactions.length}
- Vendas: ${sales.length}

**PERGUNTA:**
${userQuestion}

Responda de forma PRÁTICA e ACIONÁVEL, usando:
- Numerologia do cliente
- Frameworks de vendas (SPIN, Cialdini, Challenger, Voss)
- Dados do histórico
- Scripts prontos para usar`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context
      });

      const aiMessage = { role: 'assistant', content: response };
      setConversation(prev => [...prev, aiMessage]);
      setQuestion('');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao consultar IA');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const questions = {
      'Melhor abordagem agora': 'Qual a melhor abordagem para este cliente AGORA considerando seu perfil numerológico e momento atual?',
      'Contornar objeções': 'Como contornar as objeções deste cliente usando técnicas do Chris Voss e Challenger Sale?',
      'Gatilho de urgência': 'Crie um gatilho de urgência ética para este cliente fechar a compra.',
      'Roteiro de fechamento': 'Me dê um roteiro completo de fechamento para este cliente incluindo melhor dia/horário.'
    };
    askAI(questions[action]);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Assistente IA de Vendas</h4>
          <p className="text-xs text-indigo-600">Respostas instantâneas personalizadas</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Button
              key={i}
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction(action.label)}
              disabled={loading}
              className="h-auto py-2 text-xs"
            >
              <Icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Conversation */}
      {conversation.length > 0 && (
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
          {conversation.map((msg, i) => (
            <Card key={i} className={`p-3 ${msg.role === 'user' ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}`}>
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && (
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{msg.content}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Pergunte ao assistente IA sobre este cliente..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="text-sm"
          disabled={loading}
        />
        <Button
          onClick={() => askAI(question)}
          disabled={loading || !question.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Pensando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Perguntar à IA
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}