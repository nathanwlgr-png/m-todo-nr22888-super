import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Send, 
  HelpCircle,
  MessageCircle,
  Target,
  RotateCcw,
  Loader2,
  Sparkles,
  Save,
  Copy,
  Check,
  TrendingUp,
  FileText,
  Search,
  Brain
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import QuickActionButton from '@/components/QuickActionButton';

export default function AIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState({});
  const [generatedScript, setGeneratedScript] = useState(null);
  const [copied, setCopied] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['client-followup-logs', clientId],
    queryFn: () => base44.entities.FollowUpLog.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => queryClient.invalidateQueries(['client', clientId])
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (client && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou o **Método NR**, seu assistente de vendas. Estou aqui para ajudar você a se preparar para a visita com **${client.first_name}**.\n\nPosso gerar perguntas, responder objeções, criar estratégias de fechamento e follow-ups.\n\nComo posso ajudar?`
      }]);
    }
  }, [client]);

  const getSystemContext = () => {
    if (!client) return '';
    
    const interactionHistory = `
HISTÓRICO DE INTERAÇÕES:
- Total de visitas: ${visits.length}
- Última visita: ${client.last_visit_date || 'Nenhuma ainda'}
- Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}
- Dores identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Gatilhos usados: ${client.triggers_used?.join(', ') || 'Nenhum'}
- Notas anteriores: ${client.notes?.substring(0, 200) || 'Sem notas'}
    `;
    
    return `
      FRAMEWORKS ESTRATÉGICOS:
      Você tem acesso a:
      1. A Arte da Guerra (Sun Tzu): Estratégia, timing, conhecer o inimigo
      2. SPIN Selling (Neil Rackham): Situation, Problem, Implication, Need-Payoff questions
      3. As Armas da Persuasão (Cialdini): 6 princípios de persuasão ética
      4. Inteligência Emocional (Goleman): Empatia, autorregulação, motivação
      5. Numerologia Pitagórica: Perfis comportamentais 1-9, 11, 22

      Contexto do Cliente:
      - Nome: ${client.first_name}
      - Tipo: ${client.client_type}
      - Decisor: ${client.decision_role}
      - Perfil comportamental: ${client.behavioral_profile}
      - Estilo de decisão: ${client.decision_style}
      - Número numerológico: ${client.numerology_number}
      - Tom de voz: ${client.client_tone || 'não observado'}
      - Comunicação recomendada: ${client.recommended_communication || 'padrão'}
      - Status: ${client.status}
      - Score de compra: ${client.purchase_score}%
      - Objetivo da visita: ${client.visit_objective || 'diagnosticar'}
      
      ${interactionHistory}
      
      Você é um consultor de vendas especializado em equipamentos de diagnóstico veterinário POCT.
      Use a Numerologia Pitagórica e o histórico do cliente para personalizar suas respostas.
      
      PRODUTOS:
      - Analisadores Bioquímicos: SMT-120VP, QT3
      - Analisadores de Gases Sanguíneos: VG1, VG2
      - Analisador de Imunofluorescência: VI1
      - Analisador Hematológico: VBC-50A
      - Analisador PCR: VQ1
      
      DIFERENCIAIS:
      - 25 meses de garantia (mercado oferece 12)
      - Manutenção vitalícia inclusa
      - Bonificação em insumos (não damos desconto no equipamento)
      - Certificação ISO 13485:2016
      - Tecnologia POCT de ponta
      
      Seja CONCISO (máximo 3 frases). Foco em ações práticas.
      SEMPRE cite qual framework está usando (ex: "Usando SPIN - Implication:" ou "Arte da Guerra - Timing:")
      Combine Numerologia + SPIN + Persuasão + Inteligência Emocional + Arte da Guerra.
      Responda em português brasileiro.
    `;
  };

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${getSystemContext()}\n\nMensagem do vendedor: ${userMessage}`
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const generateQuickAction = async (type) => {
    setQuickLoading(prev => ({ ...prev, [type]: true }));
    setGeneratedScript(null);

    const prompts = {
      question: `Gere UMA pergunta SPIN Selling para abrir a conversa com ${client?.first_name}. 
        Numerologia: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Decisor: ${client?.decision_role}.
        
        Use SPIN (Situation/Problem/Implication/Need-Payoff) adaptado ao perfil numerológico.
        Indique qual tipo SPIN você usou.`,
      objection: `Controle de objeção estratégico para ${client?.first_name}.
        
        PERFIL: Numerologia ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Tom: ${client?.client_tone || 'padrão'}
        
        Combine:
        1. SPIN Selling: Transforme objeção em pergunta de Implication
        2. Persuasão (Cialdini): Use autoridade, prova social ou reciprocidade
        3. Inteligência Emocional: Empatia + autorregulação
        4. Numerologia: Adapte ao perfil comportamental
        
        Forneça:
        - Técnica principal (cite o framework)
        - Frase exemplo usando SPIN
        - Tom emocional ideal (Int. Emocional)
        
        Seja estratégico e multi-framework.`,
      closing: `Sugira UMA frase de fechamento adequada para ${client?.first_name}.
        Perfil: ${client?.behavioral_profile}. Objetivo: ${client?.visit_objective || 'apresentar_solucao'}.`,
      followup: `Crie UMA mensagem de follow-up curta e profissional para ${client?.first_name}.
        Tipo: ${client?.client_type}. Mantenha breve e com próximo passo claro.`,
      prospecting: `Crie técnicas de prospecção personalizadas para ${client?.first_name}.
        
        PERFIL NUMEROLÓGICO: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Decisor: ${client?.decision_role}
        Tom: ${client?.client_tone || 'padrão'}
        
        Baseado no perfil, sugira:
        1) Melhor canal de contato (telefone, WhatsApp, email, presencial)
        2) Melhor horário e frequência de abordagem
        3) Estratégia de entrada (consultiva, técnica, ROI, emocional)
        4) Primeira frase de impacto personalizada
        
        Seja prático e acionável.`,
      needs: `Analise o histórico e preveja necessidades futuras de ${client?.first_name}.
        
        HISTÓRICO:
        - Visitas: ${visits.length}
        - Dores: ${client?.main_pains?.join(', ') || 'Não identificadas'}
        - Status: ${client?.status}, Score: ${client?.purchase_score}%
        - Equipamento atual: ${client?.current_equipment || 'Não informado'}
        
        Com base nisso, identifique:
        1) Equipamento(s) complementar(es) que ele pode precisar em breve
        2) Dores não exploradas ainda
        3) Momento ideal para upsell/cross-sell
        4) Gatilho emocional/prático a explorar na próxima interação
        
        Seja estratégico e preditivo.`,
      proposal: `Crie uma proposta comercial personalizada para ${client?.first_name}.
        
        PERFIL NUMEROLÓGICO: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tom de voz: ${client?.client_tone || 'padrão'}
        Tipo: ${client?.client_type}
        Dores: ${client?.main_pains?.join(', ') || 'Gerais'}
        
        Adapte o tom da proposta (técnico, emocional, visual, ROI) ao perfil numerológico.
        
        Estruture em 3 parágrafos curtos:
        1) Abertura personalizada conectando com a dor específica
        2) Solução com diferenciais (garantia 25 meses, bonificação insumos)
        3) Call-to-action assertivo adaptado ao estilo de decisão
        
        Tom: ${client?.client_tone || 'profissional equilibrado'}
        Foco em conversão imediata.`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[type]
    });

    setGeneratedScript({ type, content: response });
    setQuickLoading(prev => ({ ...prev, [type]: false }));
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (generatedScript && client?.phone) {
      const message = encodeURIComponent(generatedScript.content);
      window.open(`https://wa.me/${client.phone}?text=${message}`, '_blank');
      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 2000);
    }
  };

  const handleSaveAndContinue = () => {
    if (messages.length > 2) {
      // Extract insights from conversation
      const lastMessages = messages.slice(-4).map(m => m.content).join(' ');
      updateMutation.mutate({
        notes: lastMessages.substring(0, 500),
        last_visit_date: new Date().toISOString().split('T')[0]
      });
    }
    navigate(createPageUrl(`VisitSummary?id=${clientId}`));
  };

  const scriptLabels = {
    question: 'Pergunta',
    objection: 'Controle de Objeções',
    closing: 'Fechamento',
    followup: 'Follow-up',
    prospecting: 'Prospecção',
    needs: 'Previsão de Necessidades',
    proposal: 'Proposta Comercial',
    insights: 'Insights Profundos'
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Assistente IA</h1>
            <p className="text-sm text-slate-500">{client?.first_name}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndContinue}
            className="text-emerald-600 border-emerald-200"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <QuickActionButton
            icon={Brain}
            label="Insights Profundos"
            onClick={() => generateQuickAction('insights')}
            loading={quickLoading.insights}
            className="shrink-0 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 text-pink-700 hover:bg-pink-100 font-semibold"
          />
          <QuickActionButton
            icon={HelpCircle}
            label="Pergunta"
            onClick={() => generateQuickAction('question')}
            loading={quickLoading.question}
            className="shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          />
          <QuickActionButton
            icon={MessageCircle}
            label="Controle de Objeções"
            onClick={() => generateQuickAction('objection')}
            loading={quickLoading.objection}
            className="shrink-0 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          />
          <QuickActionButton
            icon={Target}
            label="Fechamento"
            onClick={() => generateQuickAction('closing')}
            loading={quickLoading.closing}
            className="shrink-0 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          />
          <QuickActionButton
            icon={RotateCcw}
            label="Follow-up"
            onClick={() => generateQuickAction('followup')}
            loading={quickLoading.followup}
            className="shrink-0 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          />
          <QuickActionButton
            icon={Search}
            label="Prospecção"
            onClick={() => generateQuickAction('prospecting')}
            loading={quickLoading.prospecting}
            className="shrink-0 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          />
          <QuickActionButton
            icon={TrendingUp}
            label="Previsão"
            onClick={() => generateQuickAction('needs')}
            loading={quickLoading.needs}
            className="shrink-0 bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
          />
          <QuickActionButton
            icon={FileText}
            label="Proposta"
            onClick={() => generateQuickAction('proposal')}
            loading={quickLoading.proposal}
            className="shrink-0 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          />
        </div>
      </div>

      {/* Generated Script Modal */}
      {generatedScript && (
        <div className="p-4 bg-white border-b">
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                {scriptLabels[generatedScript.type]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyScript}
                className="h-8"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-slate-700 leading-relaxed">{generatedScript.content}</p>
            <div className="flex gap-2 mt-3">
              {client?.phone && (
                <Button
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {whatsappSent ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Enviado
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateQuickAction(generatedScript.type)}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Nova
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedScript(null)}
              >
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg.content} isUser={msg.role === 'user'} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
            placeholder="Digite sua mensagem..."
            className="flex-1 h-12 rounded-xl border-2"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}