import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Play, 
  Square, 
  Send, 
  Sparkles, 
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import AdvancedSalesCoachingAnalyzer from '@/components/AdvancedSalesCoachingAnalyzer';
import { addPhilosophicalEnding } from '@/components/PhilosophicalQuotes';
import { useAILimit } from '@/components/AILimitProtection';
import jsPDF from 'jspdf';
import { saveExportedDocument } from '@/components/AutoSaveExportedDocument';

export default function RolePlayTraining() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quotaExceeded, checkQuotaBeforeCall, trackAICall, limitReached, handleLimitError } = useAILimit();
  
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [realtimeFeedback, setRealtimeFeedback] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients-roleplay'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coaching-sessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 20)
  });

  const [sessionComplete, setSessionComplete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [previousScores, setPreviousScores] = useState([]);
  const [sessionReport, setSessionReport] = useState(null);

  const personas = [
    {
      id: 'analitico',
      name: 'Dr. Carlos Mendes',
      numerology: 4,
      profile: 'Analítico Detalhista',
      decision_style: 'Baseado em dados, pesquisa extensa, comparações técnicas',
      client_type: 'hospital_veterinario',
      tone: 'analítico',
      difficulty: 'Difícil',
      color: 'bg-blue-500',
      traits: ['Pede especificações técnicas', 'Compara concorrentes', 'Questiona ROI', 'Lento para decidir']
    },
    {
      id: 'impulsivo',
      name: 'Dra. Marina Costa',
      numerology: 3,
      profile: 'Criativa Impulsiva',
      decision_style: 'Emocional, busca inovação, gosta de novidades',
      client_type: 'clinica_especializada',
      tone: 'entusiasmado',
      difficulty: 'Médio',
      color: 'bg-pink-500',
      traits: ['Decide rápido', 'Valoriza inovação', 'Quer casos de sucesso', 'Gosta de conexão pessoal']
    },
    {
      id: 'executivo',
      name: 'Dr. Roberto Silva',
      numerology: 8,
      profile: 'Executivo Decisor',
      decision_style: 'Direto, foco em resultados, quer eficiência',
      client_type: 'clinica_media',
      tone: 'direto',
      difficulty: 'Médio',
      color: 'bg-purple-500',
      traits: ['Quer ir direto ao ponto', 'Foco em ROI', 'Não gosta de enrolação', 'Decide rápido se convencer']
    },
    {
      id: 'cauteloso',
      name: 'Dra. Beatriz Almeida',
      numerology: 7,
      profile: 'Cautelosa Reflexiva',
      decision_style: 'Precisa tempo, busca garantias, evita riscos',
      client_type: 'clinica_pequena',
      tone: 'cauteloso',
      difficulty: 'Difícil',
      color: 'bg-indigo-500',
      traits: ['Muitas objeções', 'Pede garantias', 'Medo de errar', 'Quer validação social']
    },
    {
      id: 'receptivo',
      name: 'Dr. Fernando Souza',
      numerology: 6,
      profile: 'Receptivo Colaborativo',
      decision_style: 'Busca parceria, valoriza relacionamento',
      client_type: 'clinica_media',
      tone: 'receptivo',
      difficulty: 'Fácil',
      color: 'bg-green-500',
      traits: ['Aberto a conversa', 'Valoriza confiança', 'Busca parceria longo prazo', 'Decisões consultivas']
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, realtimeFeedback]);

  const startSession = async (persona) => {
    if (quotaExceeded || limitReached || !checkQuotaBeforeCall()) {
      toast.error(quotaExceeded ? 'Quota diária atingida' : 'Limite IA atingido');
      return;
    }

    setSelectedPersona(persona);
    setSessionActive(true);
    setSessionStart(new Date());
    setMessages([]);
    setRealtimeFeedback([]);
    setCurrentScore(50);
    setShowReport(false);
    setSessionReport(null);
    
    // Carregar scores anteriores
    const prev = coachingSessions
      .filter(s => s.client_id === persona.id)
      .slice(0, 5)
      .map(s => s.overall_score);
    setPreviousScores(prev);

    try {
      trackAICall();
      
      const greeting = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é ${persona.name}, um(a) ${persona.client_type} com perfil numerológico ${persona.numerology} - ${persona.profile}.

INSTRUÇÕES CRÍTICAS:
1. Você É o cliente ${persona.name}. Responda SEMPRE em primeira pessoa.
2. Mantenha o perfil numerológico ${persona.numerology}: ${persona.decision_style}
3. Tom de voz: ${persona.tone}
4. Características: ${persona.traits.join(', ')}
5. NÃO quebre o personagem. NÃO dê dicas ao vendedor.
6. Responda como um cliente REAL reagiria
7. Seja realista: levante objeções típicas do seu perfil
8. Máximo 3 frases por resposta

O vendedor acabou de chegar para uma reunião. Como você o cumprimenta?

Responda diretamente como ${persona.name}:`
      });

      setMessages([{
        role: 'client',
        content: greeting,
        persona: persona.name
      }]);

      toast.success(`Sessão iniciada com ${persona.name}`);
    } catch (error) {
      console.error('Erro:', error);
      handleLimitError(error);
      toast.error('Erro ao iniciar sessão');
      setSessionActive(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        toast.error(quotaExceeded ? 'Quota diária atingida' : 'Limite IA atingido');
        setLoading(false);
        return;
      }

      trackAICall();

      const conversationHistory = messages.map(m => 
        `${m.role === 'user' ? 'Vendedor' : selectedPersona.name}: ${m.content}`
      ).join('\n\n');

      // Resposta do cliente + feedback simultâneo
      const [clientResponse, feedback] = await Promise.all([
        // Resposta do cliente
        base44.integrations.Core.InvokeLLM({
          prompt: `Você é ${selectedPersona.name}, perfil numerológico ${selectedPersona.numerology} - ${selectedPersona.profile}.

HISTÓRICO DA CONVERSA:
${conversationHistory}

Vendedor diz: "${userMessage}"

INSTRUÇÕES:
1. Responda como ${selectedPersona.name} em primeira pessoa
2. Mantenha perfil ${selectedPersona.numerology}: ${selectedPersona.decision_style}
3. Tom: ${selectedPersona.tone}
4. Seja realista: levante objeções apropriadas
5. Máximo 3 frases
6. NÃO quebre personagem

Responda diretamente:`
        }),
        // Feedback técnico
        base44.integrations.Core.InvokeLLM({
          prompt: `Você é um coach de vendas expert. Analise a abordagem do vendedor.

PERFIL DO CLIENTE SIMULADO:
- Nome: ${selectedPersona.name}
- Numerologia: ${selectedPersona.numerology} - ${selectedPersona.profile}
- Estilo Decisão: ${selectedPersona.decision_style}
- Tom: ${selectedPersona.tone}

HISTÓRICO:
${conversationHistory}

ÚLTIMA FALA DO VENDEDOR:
"${userMessage}"

Avalie rapidamente (formato JSON):`,
          response_json_schema: {
            type: "object",
            properties: {
              score_this_message: { type: "number" },
              what_worked: { type: "string" },
              what_missed: { type: "string" },
              framework_used: { type: "string" },
              suggested_improvement: { type: "string" },
              techniques_identified: { type: "array", items: { type: "string" } }
            }
          }
        })
      ]);

      setMessages(prev => [...prev, {
        role: 'client',
        content: clientResponse,
        persona: selectedPersona.name
      }]);

      setRealtimeFeedback(prev => [...prev, {
        timestamp: new Date().toISOString(),
        userMessage,
        ...feedback
      }]);

      // Atualizar score médio
      const allScores = [...realtimeFeedback, feedback].map(f => f.score_this_message || 50);
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      setCurrentScore(Math.round(avgScore));

    } catch (error) {
      console.error('Erro:', error);
      handleLimitError(error);
      toast.error('Erro ao processar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.RolePlaySession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roleplay-sessions']);
      toast.success('Sessão salva com sucesso!');
    }
  });

  const endSession = async () => {
    if (messages.length < 4) {
      toast.error('Converse mais antes de finalizar');
      return;
    }

    const duration = Math.round((new Date() - sessionStart) / 60000);
    const techniques = [...new Set(realtimeFeedback.flatMap(f => f.techniques_identified || []))];

    // Gerar análise avançada com frameworks
    try {
      const transcript = messages.map(m => 
        `${m.role === 'user' ? 'VENDEDOR' : selectedPersona.name}: ${m.content}`
      ).join('\n\n');

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um coach de vendas expert. Analise esta sessão de role-play.

PERFIL DO CLIENTE: ${selectedPersona.name}
Numerologia: ${selectedPersona.numerology} - ${selectedPersona.profile}
Estilo: ${selectedPersona.decision_style}

TRANSCRIPT COMPLETO:
${transcript}

SCORES HISTÓRICOS: ${previousScores.join(', ') || 'Primeira sessão'}

ANÁLISE DETALHADA POR FRAMEWORK (0-10 cada):
- SPIN Selling: Usou Situation, Problem, Implication, Need-Payoff?
- Cialdini: Aplicou reciprocidade, prova social, autoridade, escassez?
- Challenger: Ensinou algo novo, personalizou, controlou conversa?
- Voss (FBI): Usou mirroring, labeling, calibrated questions?
- Gap Selling: Identificou current state, future state, gap?
- Fechamento (Ziglar): Tentou trial close, alternative, assumptive?

Para CADA técnica forneça:
- Score 0-10
- Exemplo onde usou/deveria usar
- Capítulo do livro para revisar
- Exercício prático específico

Retorne análise completa.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            technique_scores: {
              type: "object",
              properties: {
                spin_selling: { type: "number" },
                cialdini: { type: "number" },
                challenger: { type: "number" },
                voss_negotiation: { type: "number" },
                gap_selling: { type: "number" },
                closing: { type: "number" }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            missed_opportunities: { type: "array", items: { type: "string" } },
            next_conversation_tips: { type: "array", items: { type: "string" } },
            book_chapters_recommended: { type: "array", items: { type: "string" } },
            practice_exercises: { type: "array", items: { type: "string" } },
            ai_detailed_feedback: { type: "string" }
          }
        }
      });

      setSessionReport(analysis);
      setShowReport(true);

      // Salvar sessão de coaching
      const coachingSession = await base44.entities.CoachingSession.create({
        client_id: selectedPersona.id,
        client_name: selectedPersona.name,
        conversation_type: 'role_play',
        transcript,
        duration_minutes: duration,
        overall_score: analysis.overall_score || currentScore,
        technique_scores: analysis.technique_scores,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missed_opportunities: analysis.missed_opportunities,
        next_conversation_tips: analysis.next_conversation_tips,
        outcome: analysis.overall_score >= 80 ? 'venda_fechada' : 
                 analysis.overall_score >= 60 ? 'agendou_proxima' : 'neutro',
        ai_detailed_feedback: analysis.ai_detailed_feedback
      });

      // Salvar progresso por técnica
      const techniqueMapping = {
        spin_selling: 'SPIN_Selling',
        cialdini: 'Cialdini_Persuasao',
        challenger: 'Challenger_Sale',
        voss_negotiation: 'Never_Split_Difference',
        gap_selling: 'Gap_Selling',
        closing: 'Ziglar_Closing'
      };

      for (const [key, techniqueName] of Object.entries(techniqueMapping)) {
        const score = analysis.technique_scores?.[key];
        if (score !== undefined) {
          await base44.entities.TechniqueProgress.create({
            technique_name: techniqueName,
            session_id: coachingSession.id,
            score: (score / 10) * 100,
            successes: analysis.strengths || [],
            failures: analysis.weaknesses || [],
            book_chapter_recommended: analysis.book_chapters_recommended?.find(ch => ch.includes(techniqueName)) || `Revisar ${techniqueName}`,
            practice_exercise: analysis.practice_exercises?.find(ex => ex.toLowerCase().includes(key.split('_')[0])) || `Praticar ${techniqueName}`
          });
        }
      }

      toast.success(addPhilosophicalEnding('Análise completa de coaching concluída!'));

    } catch (error) {
      console.error('Erro análise:', error);
      toast.warning('Análise salva, mas sem detalhamento IA');
    }

    const sessionData = {
      profile_id: selectedPersona.id,
      profile_name: selectedPersona.name,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString()
      })),
      final_score: currentScore,
      duration_minutes: duration,
      techniques_identified: techniques,
      feedback_summary: realtimeFeedback.map(f => 
        `✓ ${f.what_worked}\n✗ ${f.what_missed}\n💡 ${f.suggested_improvement}`
      ).join('\n\n'),
      completed: true
    };

    await saveMutation.mutateAsync(sessionData);
    setSessionActive(false);
    setSessionComplete(true);
  };

  const exportSessionPDF = async () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(16);
    doc.text('SESSAO DE TREINAMENTO - ROLE-PLAY', 105, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.text(`Persona: ${selectedPersona.name} (Perfil ${selectedPersona.numerology})`, 10, y);
    y += 5;
    doc.text(`Score Final: ${currentScore}/100`, 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text('CONVERSA:', 10, y);
    y += 8;

    messages.forEach(msg => {
      if (y > 270) { doc.addPage(); y = 15; }
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(msg.role === 'user' ? 'VOCE:' : `${selectedPersona.name}:`, 10, y);
      y += 5;
      
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(msg.content, 180);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.text(line, 10, y);
        y += 4;
      });
      y += 3;
    });

    if (realtimeFeedback.length > 0) {
      doc.addPage();
      y = 15;
      doc.setFontSize(14);
      doc.text('FEEDBACK E ANALISE', 10, y);
      y += 10;

      realtimeFeedback.forEach((fb, i) => {
        if (y > 250) { doc.addPage(); y = 15; }
        
        doc.setFontSize(10);
        doc.text(`Interacao ${i + 1} - Score: ${fb.score_this_message}/100`, 10, y);
        y += 6;
        
        doc.setFontSize(8);
        doc.text(`Funcionou: ${fb.what_worked}`, 15, y);
        y += 4;
        doc.text(`Perdeu: ${fb.what_missed}`, 15, y);
        y += 4;
        doc.text(`Sugestao: ${fb.suggested_improvement}`, 15, y);
        y += 8;
      });
    }

    const pdfBlob = doc.output('blob');
    const fileName = `RolePlay_${selectedPersona.name}_${Date.now()}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    try {
      // Upload to storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      
      // Save to ExportedDocument
      await saveExportedDocument({
        title: `Role-Play: ${selectedPersona.name}`,
        documentType: 'pdf',
        fileUrl: file_url,
        fileSizeKB: Math.round(pdfBlob.size / 1024),
        category: 'relatorio',
        description: `Treinamento role-play - Score: ${currentScore}/100 - ${messages.length} mensagens`
      });
      
      // Download locally
      doc.save(fileName);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar no exportador');
      doc.save(fileName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Treinamento Role-Play IA
              </h1>
              <p className="text-xs text-slate-600">Simule vendas • Feedback em tempo real</p>
            </div>
          </div>
          {sessionActive && (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 text-white animate-pulse">
                ATIVO
              </Badge>
              <Badge variant="outline" className="text-lg font-bold">
                {currentScore}/100
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-6xl">
        {!sessionActive ? (
          /* Seleção de Persona */
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300">
              <h2 className="text-xl font-bold text-purple-900 mb-2">🎭 Escolha seu Desafio</h2>
              <p className="text-sm text-purple-700">Selecione uma persona para praticar sua abordagem de vendas</p>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map(persona => (
                <Card 
                  key={persona.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-400"
                  onClick={() => !quotaExceeded && !limitReached && startSession(persona)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{persona.name}</h3>
                      <p className="text-xs text-slate-600">Numerologia {persona.numerology}</p>
                    </div>
                    <Badge className={`${persona.color} text-white`}>
                      {persona.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-purple-700 font-semibold">{persona.profile}</p>
                    <p className="text-xs text-slate-600">{persona.decision_style}</p>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="text-xs font-semibold text-slate-700">Características:</p>
                    {persona.traits.map((trait, i) => (
                      <p key={i} className="text-xs text-slate-600">• {trait}</p>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={quotaExceeded || limitReached}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Sessão
                  </Button>
                </Card>
              ))}
            </div>

            {/* Clientes Reais */}
            {allClients.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Ou pratique com cliente real:</h3>
                <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {allClients.filter(c => c.numerology_number && c.behavioral_profile).map(client => (
                    <Button
                      key={client.id}
                      variant="outline"
                      size="sm"
                      onClick={() => !quotaExceeded && !limitReached && startSession({
                        id: client.id,
                        name: client.first_name,
                        numerology: client.numerology_number,
                        profile: client.behavioral_profile,
                        decision_style: client.decision_style,
                        client_type: client.client_type,
                        tone: client.client_tone || 'profissional',
                        difficulty: client.status === 'quente' ? 'Fácil' : 'Difícil',
                        color: 'bg-blue-500',
                        traits: client.main_pains || ['Cliente real']
                      })}
                      disabled={quotaExceeded || limitReached}
                      className="justify-start"
                    >
                      {client.first_name} (Num. {client.numerology_number})
                    </Button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Sessão Ativa */
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Chat Principal */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-purple-900">{selectedPersona.name}</h3>
                    <p className="text-xs text-purple-700">
                      Perfil {selectedPersona.numerology} - {selectedPersona.profile}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-900">{currentScore}</p>
                    <p className="text-xs text-purple-600">Score</p>
                  </div>
                </div>
                <Progress value={currentScore} className="mt-3" />
              </Card>

              {/* Messages */}
              <Card className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {msg.role === 'client' && (
                          <p className="text-xs opacity-70 mb-1">{msg.persona}</p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </Card>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Sua resposta..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={endSession}
                  variant="outline"
                  className="flex-1"
                  disabled={messages.length < 4}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Finalizar e Salvar
                </Button>
                <Button
                  onClick={exportSessionPDF}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => {
                    setSessionActive(false);
                    setMessages([]);
                    setRealtimeFeedback([]);
                  }}
                  variant="ghost"
                  className="text-red-600"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>

            {/* Feedback Panel */}
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Feedback em Tempo Real
                </h4>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {realtimeFeedback.slice().reverse().map((fb, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-green-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          fb.score_this_message >= 80 ? 'bg-green-600' :
                          fb.score_this_message >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }>
                          {fb.score_this_message}/100
                        </Badge>
                        <span className="text-slate-500">#{realtimeFeedback.length - i}</span>
                      </div>

                      <div className="space-y-2">
                        {fb.what_worked && (
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-green-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Funcionou
                            </p>
                            <p className="text-green-600 text-xs mt-0.5">{fb.what_worked}</p>
                          </div>
                        )}

                        {fb.what_missed && (
                          <div className="p-2 bg-orange-50 rounded">
                            <p className="text-orange-700 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Perdeu
                            </p>
                            <p className="text-orange-600 text-xs mt-0.5">{fb.what_missed}</p>
                          </div>
                        )}

                        {fb.suggested_improvement && (
                          <div className="p-2 bg-blue-50 rounded">
                            <p className="text-blue-700 font-semibold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Melhoria
                            </p>
                            <p className="text-blue-600 text-xs mt-0.5">{fb.suggested_improvement}</p>
                          </div>
                        )}

                        {fb.framework_used && (
                          <Badge variant="outline" className="text-xs">
                            {fb.framework_used}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {realtimeFeedback.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Trophy className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">Feedback aparecerá aqui</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Técnicas Identificadas */}
              {realtimeFeedback.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-300">
                  <h4 className="text-sm font-bold text-amber-900 mb-2">🎯 Técnicas Usadas</h4>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(realtimeFeedback.flatMap(f => f.techniques_identified || []))].map((tech, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}