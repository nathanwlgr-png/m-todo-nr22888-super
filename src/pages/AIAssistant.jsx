import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Send, Loader2, Sparkles, Save, Copy, Check, FileText,
  Search, Brain, CheckSquare, Handshake, Globe, Zap, MessageCircle,
  MessageSquare, Target, RotateCcw, TrendingUp, HelpCircle, Calendar,
  Building2, Bell, ChevronRight, X, Phone, Star, MapPin, Navigation
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import QuickActionButton from '@/components/QuickActionButton';
import VoiceRecorderButton from '@/components/VoiceRecorderButton';
import MasterAIAssistant from '@/components/MasterAIAssistant';
import AgendaComandoPanel from '@/components/AgendaComandoPanel';
import BuscaClinicaCNPJ from '@/components/BuscaClinicaCNPJ';
import AlertasTempoReal from '@/components/AlertasTempoReal';
import EditableClientName from '@/components/EditableClientName';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useAILimit } from '@/components/AILimitProtection';
import { getFallbackResponse } from '@/components/LocalAIFallbacks';

export default function AIAssistant() {
  const { limitReached, getCachedResponse, setCachedResponse, handleLimitError, checkQuotaBeforeCall, trackAICall, quotaExceeded } = useAILimit();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');

  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState({});
  const [generatedScript, setGeneratedScript] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rolePlayMode, setRolePlayMode] = useState(false);
  const [analyzingTranscript, setAnalyzingTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [nearbyClients, setNearbyClients] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: client } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const clients = await base44.entities.Client.list();
      const found = clients.find(c => c && c.id === selectedClientId);
      if (!found) { setSelectedClientId(null); return null; }
      return found;
    },
    enabled: !!selectedClientId,
    retry: 0
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', selectedClientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', selectedClientId],
    queryFn: () => base44.entities.Task.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', selectedClientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['client-followup-logs', selectedClientId],
    queryFn: () => base44.entities.FollowUpLog.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(selectedClientId, data),
    onSuccess: () => queryClient.invalidateQueries(['client', selectedClientId])
  });

  const createTasksMutation = useMutation({
    mutationFn: (tasks) => Promise.all(tasks.map(task => base44.entities.Task.create(task))),
    onSuccess: () => { queryClient.invalidateQueries(['client-tasks']); toast.success('Tarefas criadas!'); }
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (client && messages.length === 0 && client.first_name) {
      setMessages([{
        role: 'assistant',
        content: `👋 Olá! Sou **Primori**, sua Assistente Master de Vendas.\n\n📊 **Cliente:** ${client.first_name} | Score: ${client.purchase_score || 50}% | Status: ${client.status}\n\n💬 Pergunte qualquer coisa ou use as ferramentas acima!`
      }]);
    }
  }, [client]);

  const getSystemContext = (isRolePlay = false) => {
    if (!client) return '';
    const interactionHistory = `HISTÓRICO: ${visits.length} visitas | ${tasks.filter(t => t.status === 'pendente').length} tarefas | Dores: ${client.main_pains?.join(', ') || 'N/A'}`;

    if (isRolePlay) {
      return `MODO ROLE-PLAY: Você É ${client.first_name}. Perfil: ${client.behavioral_profile}. Tom: ${client.client_tone}. ${interactionHistory}. Responda em 1ª pessoa SEMPRE.`;
    }

    return `VOCÊ É PRIMORI - IA MASTER DE VENDAS INTEGRATIVA.
    
Cliente: ${client.first_name} | Tipo: ${client.client_type} | Score: ${client.purchase_score}%
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Status: ${client.status} | Pipeline: ${client.pipeline_stage}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
${interactionHistory}

FRAMEWORKS: Numerologia Pitagórica + SPIN Selling + Cialdini + Arte da Guerra + Neurovendas

PRODUTOS NR22: VG1/VG2 (Gasometria), VBC-50A (Hematologia), QT3/SMT-120VP (Bioquímica), VI1 (Imunofluorescência), VQ1 (PCR)
DIFERENCIAIS: 25 meses garantia, manutenção vitalícia, bonificação insumos, ISO 13485

Responda em português. Seja ESTRATÉGICO, cite frameworks, dê probabilidades. Máx 4 parágrafos.`;
  };

  // ─── ENVIAR MENSAGEM COM MENSAGEM COMPLETA (SEM CORTAR) ───────────────────────
  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⏱️ Quota atingida. Use os botões rápidos.' }]);
        return;
      }

      trackAICall();
      const conversationHistory = messages.slice(-6).map(m =>
        `${m.role === 'user' ? 'Vendedor' : 'Primori'}: ${m.content}`
      ).join('\n\n');

      // Detectar comando de agenda
      const msgLower = userMessage.toLowerCase();
      if (msgLower.includes('agenda') || msgLower.includes('visita') && (msgLower.includes('semana') || msgLower.includes('mês') || msgLower.includes('mes'))) {
        const cidadeMatch = ['Marília', 'Bauru', 'Botucatu', 'Lins', 'Ourinhos', 'Assis', 'Tupã', 'Jaú'].filter(c =>
          msgLower.includes(c.toLowerCase())
        );
        if (cidadeMatch.length > 0 || msgLower.includes('agenda')) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📅 **Comando de Agenda detectado!**\n\nCidades identificadas: ${cidadeMatch.length > 0 ? cidadeMatch.join(', ') : 'nenhuma específica'}\n\n👉 Clique na aba **📅 Agenda** para gerar sua agenda completa automaticamente com os melhores clientes!`
          }]);
          setActiveTab('agenda');
          return;
        }
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${getSystemContext(rolePlayMode)}

HISTÓRICO DA CONVERSA:
${conversationHistory}

${rolePlayMode ? 'Vendedor diz:' : 'Pergunta:'} ${userMessage}

IMPORTANTE: Resposta COMPLETA, nunca corte no meio. Use markdown estruturado.`
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      const isLimit = handleLimitError(error);
      setMessages(prev => [...prev, { role: 'assistant', content: isLimit ? '⚠️ Limite de IA atingido.' : '⚠️ Erro ao processar.' }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── AÇÃO RÁPIDA ──────────────────────────────────────────────────────────────
  const generateQuickAction = async (type) => {
    if (!client) { toast.error('Selecione um cliente primeiro'); return; }
    setQuickLoading(prev => ({ ...prev, [type]: true }));
    setGeneratedScript(null);

    try {
      const cacheKey = `${type}_${client.id}_${client.numerology_number}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) { setGeneratedScript({ type, content: cached }); toast.success('📦 Cache'); return; }

      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        const fallback = getFallbackResponse(type, client);
        setGeneratedScript({ type, content: fallback });
        toast.info('📋 Template local');
        return;
      }

      trackAICall();

      const prompts = {
        presentation: `Crie guia completo de apresentação para ${client.first_name}. Perfil ${client.numerology_number}: ${client.behavioral_profile}. Tom: ${client.client_tone}. Tipo: ${client.client_type}. Inclua: apresentação presencial, WhatsApp, telefone, diferenciação, checklist. Resposta COMPLETA em markdown.`,
        insights: `Análise psicológica e estratégica PROFUNDA de ${client.first_name}. Numerologia: ${client.numerology_number}. Score: ${client.purchase_score}%. Vendas: ${sales.length}. Dores: ${client.main_pains?.join(', ')}. Gere: perfil psicológico completo, motivadores, comunicação ideal, objeções previstas, estratégia de pitch, próximos passos, alerta de risco. Resposta COMPLETA.`,
        prospecting: `Técnicas de prospecção para ${client.first_name}. Perfil ${client.numerology_number}: ${client.behavioral_profile}. Inclua canal ideal, horário, frequência, estratégia de entrada, primeira frase. COMPLETO.`,
        question: `Pergunta SPIN Selling para ${client.first_name}. Numerologia ${client.numerology_number}. Tipo: ${client.client_type}. Indique qual tipo SPIN (S/P/I/N).`,
        objection: `Controle de objeção multi-framework para ${client.first_name}. Perfil ${client.numerology_number}. Combine SPIN + Cialdini + IE. Frase exata de resposta.`,
        closing: `Frase de fechamento personalizada para ${client.first_name}. Perfil: ${client.behavioral_profile}. Objetivo: ${client.visit_objective}. Direto e assertivo.`,
        followup: `Mensagem de follow-up profissional para ${client.first_name}. Tipo: ${client.client_type}. Breve, com próximo passo claro.`,
        proposal: `Proposta comercial personalizada para ${client.first_name}. Perfil ${client.numerology_number}. Tom: ${client.client_tone}. Dores: ${client.main_pains?.join(', ')}. 3 parágrafos: abertura, solução NR22 (25 meses garantia, bonificação), CTA. COMPLETA.`,
        needs: `Análise preditiva de necessidades de ${client.first_name}. Histórico: ${visits.length} visitas, ${sales.length} vendas. Dores: ${client.main_pains?.join(', ')}. Equipamento atual: ${client.current_equipment}. Preveja: próximo produto, dores inexploradas, upsell timing, gatilho.`,
        suggestTasks: `Sugira 3-5 tarefas concretas para ${client.first_name}. Status: ${client.status}. Score: ${client.purchase_score}%. Última visita: ${client.last_visit_date}. Formato: **1. [tipo] - [título]** Prioridade/Prazo/Descrição.`,
      };

      const prompt = prompts[type];
      if (!prompt) { toast.error('Ação não encontrada'); return; }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + '\n\nRESPOSTA OBRIGATORIAMENTE COMPLETA. NÃO corte no meio. Use markdown estruturado.'
      });

      setCachedResponse(cacheKey, response);
      setGeneratedScript({ type, content: response });
      toast.success('✅ Gerado!');
    } catch (error) {
      const isLimit = handleLimitError(error);
      if (isLimit) { setGeneratedScript({ type, content: getFallbackResponse(type, client) }); }
      else { toast.error('Erro ao gerar'); }
    } finally {
      setQuickLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // ─── AUTO CRIAR TAREFAS ───────────────────────────────────────────────────────
  const handleAutoCreateTasks = async () => {
    if (!selectedClientId || !client) { toast.error('Selecione um cliente'); return; }
    setQuickLoading(prev => ({ ...prev, autoTasks: true }));
    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) { toast.error('Limite IA atingido.'); return; }
      trackAICall();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie 3-5 tarefas para ${client.first_name}. Status: ${client.status}. Score: ${client.purchase_score}%. JSON obrigatório.`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: { type: "array", items: { type: "object", properties: {
              title: { type: "string" }, description: { type: "string" },
              type: { type: "string" }, priority: { type: "string" }, due_days: { type: "number" }
            }}}
          }
        }
      });

      const tasksToCreate = result.tasks.map(task => ({
        client_id: selectedClientId, client_name: client.first_name,
        title: task.title, description: task.description,
        type: task.type, priority: task.priority,
        due_date: new Date(Date.now() + task.due_days * 86400000).toISOString().split('T')[0],
        status: 'pendente', auto_created: true
      }));

      await createTasksMutation.mutateAsync(tasksToCreate);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **${tasksToCreate.length} Tarefas Criadas!**\n\n${tasksToCreate.map((t, i) => `${i + 1}. **${t.title}** (${t.type}) - ${t.due_date}`).join('\n')}`
      }]);
    } catch (error) {
      handleLimitError(error); toast.error('Erro ao criar tarefas');
    } finally {
      setQuickLoading(prev => ({ ...prev, autoTasks: false }));
    }
  };

  // ─── ENVIAR WHATSAPP COM CHUNKS (SEM PERDER CONTEÚDO) ────────────────────────
  const handleShareWhatsApp = async () => {
    if (!generatedScript || !client?.phone) return;
    try {
      const res = await base44.functions.invoke('whatsappSendChunked', {
        message: generatedScript.content,
        phone: client.phone,
        client_id: client.id,
        client_name: client.first_name,
      });

      if (res.data?.success) {
        const chunks = res.data.chunks || [];
        if (chunks.length === 1) {
          window.open(chunks[0].whatsapp_url, '_blank');
          toast.success('WhatsApp aberto!');
        } else {
          // Abrir todos os chunks sequencialmente
          toast.success(`Mensagem dividida em ${chunks.length} partes. Abrindo...`);
          chunks.forEach((chunk, i) => {
            setTimeout(() => window.open(chunk.whatsapp_url, '_blank'), i * 1500);
          });
        }
      }
    } catch (e) {
      // Fallback direto
      const msg = encodeURIComponent(generatedScript.content.substring(0, 3800));
      window.open(`https://wa.me/${client.phone}?text=${msg}`, '_blank');
    }
  };

  // ─── ANÁLISE DE TRANSCRIÇÃO ───────────────────────────────────────────────────
  const analyzeTranscript = async (transcriptText) => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setAnalyzingTranscript(true);
    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) { toast.error('Limite IA atingido.'); return; }
      trackAICall();
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta transcrição de conversa com ${client.first_name} (perfil numerológico ${client.numerology_number}).

TRANSCRIÇÃO: ${transcriptText}

Forneça feedback COMPLETO: 1.Pontos Fortes 2.Melhorias 3.Scores (SPIN/Numerologia/Gatilhos) 4.Tom/Linguagem 5.Próximas Ações. Resposta COMPLETA em markdown.`
      });
      setMessages(prev => [...prev, { role: 'assistant', content: `📊 **ANÁLISE DA CONVERSA**\n\n${analysis}` }]);
      toast.success('Análise concluída!');
    } catch (error) {
      handleLimitError(error); toast.error('Erro ao analisar');
    } finally {
      setAnalyzingTranscript(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => analyzeTranscript(ev.target?.result);
    reader.readAsText(file);
  };

  const exportChatToPDF = () => {
    if (messages.length === 0) { toast.error('Nenhuma mensagem'); return; }
    const doc = new jsPDF();
    let y = 15;
    const addLine = (text, size = 10, bold = false) => {
      doc.setFontSize(size); doc.setFont(undefined, bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach(l => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, 15, y); y += size * 0.5; });
      y += 2;
    };
    addLine(`CONVERSA PRIMORI - ${client?.first_name || 'IA'}`, 14, true);
    addLine(`Data: ${new Date().toLocaleString('pt-BR')}`, 9);
    y += 5;
    messages.forEach(msg => {
      addLine(msg.role === 'user' ? 'VOCÊ:' : 'PRIMORI:', 11, true);
      addLine(msg.content, 10);
      y += 3;
    });
    doc.save(`Primori_${client?.first_name || 'IA'}_${Date.now()}.pdf`);
    toast.success('PDF exportado!');
  };

  const sendWhatsAppNotif = async (action) => {
    setSendingNotif(true);
    try {
      const res = await base44.functions.invoke('whatsappMasterNotificacao', { action, phone: '5514991676428' });
      const link = res.data?.whatsapp_link;
      if (link) { window.open(link, '_blank'); toast.success('WhatsApp aberto!'); }
      else { toast.error('Erro ao gerar link'); }
    } catch (e) { toast.error('Erro: ' + e.message); }
    finally { setSendingNotif(false); }
  };

  // ─── BUSCA POR GPS ────────────────────────────────────────────────────────────
  const buscarPorGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS não disponível neste dispositivo');
      return;
    }
    setGpsLoading(true);
    setNearbyClients([]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });

        // Calcular distância de cada cliente
        const withDist = allClients
          .filter(c => c.address || c.city)
          .map(c => {
            // Coordenadas aproximadas por cidade conhecida
            const cityCoords = {
              'marília': { lat: -22.2139, lng: -49.9461 },
              'bauru': { lat: -22.3246, lng: -49.0653 },
              'botucatu': { lat: -22.8834, lng: -48.4446 },
              'lins': { lat: -21.6775, lng: -49.7445 },
              'ourinhos': { lat: -22.9788, lng: -49.8696 },
              'assis': { lat: -22.6622, lng: -50.4124 },
              'tupã': { lat: -21.9347, lng: -50.5127 },
              'jaú': { lat: -22.2966, lng: -48.5580 },
              'garça': { lat: -22.2128, lng: -49.6537 },
              'presidente prudente': { lat: -22.1256, lng: -51.3886 },
            };
            const cityKey = (c.city || '').toLowerCase().trim();
            const coord = cityCoords[cityKey];
            if (!coord) return { ...c, distance: 9999 };
            const R = 6371;
            const dLat = (coord.lat - lat) * Math.PI / 180;
            const dLng = (coord.lng - lng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(coord.lat*Math.PI/180)*Math.sin(dLng/2)**2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return { ...c, distance: dist, cityCoord: coord };
          })
          .filter(c => c.distance < 150)
          .sort((a, b) => {
            // Prioriza por distância + score
            const aDist = a.distance || 999;
            const bDist = b.distance || 999;
            const aScore = (a.purchase_score || 0) + (a.status === 'quente' ? 30 : a.status === 'morno' ? 15 : 0);
            const bScore = (b.purchase_score || 0) + (b.status === 'quente' ? 30 : b.status === 'morno' ? 15 : 0);
            return (aDist - aScore * 0.5) - (bDist - bScore * 0.5);
          })
          .slice(0, 10);

        setNearbyClients(withDist);
        setGpsLoading(false);

        if (withDist.length === 0) {
          toast.info('Nenhum cliente encontrado nas proximidades (150km)');
        } else {
          toast.success(`${withDist.length} clientes próximos encontrados!`);
          setActiveTab('chat');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📍 **GPS Ativado** — Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}\n\n🏥 **${withDist.length} clientes nas proximidades (até 150km):**\n\n${withDist.map((c, i) => `${i+1}. **${c.first_name}** ${c.clinic_name ? `(${c.clinic_name})` : ''} — ${c.city} — ${c.distance < 10 ? `${(c.distance*1000).toFixed(0)}m` : `${c.distance.toFixed(0)}km`} — ${c.status === 'quente' ? '🔥' : c.status === 'morno' ? '🌡️' : '❄️'} Score: ${c.purchase_score || 0}%`).join('\n')}\n\n💡 Clique em um cliente para selecionar e iniciar abordagem.`
          }]);
        }
      },
      (err) => {
        setGpsLoading(false);
        toast.error('Erro ao obter localização: ' + (err.message || 'Permissão negada'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleRolePlay = () => {
    if (!client) return;
    setRolePlayMode(!rolePlayMode);
    setMessages([{
      role: 'assistant',
      content: !rolePlayMode
        ? `🎭 **MODO TREINAMENTO** - Sou ${client.first_name}. ${client.behavioral_profile}. Como você vai me abordar?`
        : `Modo Treinamento desativado. Como posso ajudar?`
    }]);
  };

  const scriptLabels = {
    presentation: '🤝 Apresentação', insights: '🧠 Insights', prospecting: '🔍 Prospecção',
    question: '❓ Pergunta SPIN', objection: '🛡️ Objeções', proposal: '📄 Proposta',
    closing: '🎯 Fechamento', needs: '📈 Previsão', followup: '🔄 Follow-up', suggestTasks: '✅ Tarefas'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Primori - Master de Vendas
            </h1>
            <p className="text-indigo-200 text-xs">IA Integrativa + Agenda + Pesquisa + Alertas em Tempo Real</p>
          </div>
          {/* Alertas em tempo real */}
          <AlertasTempoReal />
          <Button size="sm" variant="ghost" onClick={exportChatToPDF} className="text-white hover:bg-white/20 h-8 px-2">
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={toggleRolePlay}
            disabled={!selectedClientId}
            className={`h-8 text-xs ${rolePlayMode ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            🎭 {rolePlayMode ? 'Treinando' : 'Treinar'}
          </Button>
        </div>

        {/* Seletor de cliente */}
        <Select value={selectedClientId || ''} onValueChange={v => { setSelectedClientId(v === 'none' ? null : v); setMessages([]); setRolePlayMode(false); }}>
          <SelectTrigger className="h-10 bg-white/20 border-white/30 text-white placeholder:text-white/60">
            <SelectValue placeholder="Selecione um cliente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem cliente específico</SelectItem>
            {allClients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.first_name} {c.clinic_name ? `- ${c.clinic_name}` : ''} {c.status === 'quente' ? '🔥' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {client && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <EditableClientName client={client} onUpdate={() => queryClient.invalidateQueries(['client', selectedClientId])} />
            <Badge className={`text-xs ${client.status === 'quente' ? 'bg-red-400' : client.status === 'morno' ? 'bg-yellow-400 text-black' : 'bg-slate-400'}`}>
              {client.status}
            </Badge>
            <Badge className="bg-white/20 text-white text-xs">Score: {client.purchase_score}%</Badge>
            {client.pipeline_stage && <Badge className="bg-indigo-400 text-xs">{client.pipeline_stage}</Badge>}
            {client.phone && (
              <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer">
                <Badge className="bg-green-500 text-white text-xs cursor-pointer hover:bg-green-400">📱 WhatsApp</Badge>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ═══ TABS PRINCIPAIS ═══ */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-5 m-2 mb-0 shrink-0">
            <TabsTrigger value="chat" className="text-xs">💬 Chat</TabsTrigger>
            <TabsTrigger value="agenda" className="text-xs">📅 Agenda</TabsTrigger>
            <TabsTrigger value="pesquisa" className="text-xs">🔍 Pesquisa</TabsTrigger>
            <TabsTrigger value="web" className="text-xs">🌐 Web/IA</TabsTrigger>
            <TabsTrigger value="notif" className="text-xs">📲 Notif</TabsTrigger>
          </TabsList>

          {/* ── TAB CHAT ── */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
            {/* Ações rápidas */}
            <div className="bg-white border-b px-3 py-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { type: 'presentation', icon: Handshake, label: 'Apresentar', color: 'bg-green-50 border-green-300 text-green-700' },
                  { type: 'insights', icon: Brain, label: 'Insights', color: 'bg-pink-50 border-pink-300 text-pink-700' },
                  { type: 'prospecting', icon: Search, label: 'Prospecção', color: 'bg-purple-50 border-purple-300 text-purple-700' },
                  { type: 'question', icon: HelpCircle, label: 'Pergunta', color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
                  { type: 'objection', icon: MessageCircle, label: 'Objeções', color: 'bg-red-50 border-red-300 text-red-700' },
                  { type: 'proposal', icon: FileText, label: 'Proposta', color: 'bg-orange-50 border-orange-300 text-orange-700' },
                  { type: 'closing', icon: Target, label: 'Fechamento', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                  { type: 'needs', icon: TrendingUp, label: 'Previsão', color: 'bg-cyan-50 border-cyan-300 text-cyan-700' },
                  { type: 'followup', icon: RotateCcw, label: 'Follow-up', color: 'bg-amber-50 border-amber-300 text-amber-700' },
                  { type: 'suggestTasks', icon: CheckSquare, label: 'Tarefas', color: 'bg-teal-50 border-teal-300 text-teal-700' },
                ].map(({ type, icon: Icon, label, color }) => (
                  <QuickActionButton key={type} icon={Icon} label={label}
                    onClick={() => generateQuickAction(type)} loading={quickLoading[type]}
                    className={`shrink-0 ${color} text-xs`} />
                ))}
                <QuickActionButton icon={Zap} label="🤖 Criar Tarefas"
                  onClick={handleAutoCreateTasks} loading={quickLoading.autoTasks}
                  className="shrink-0 bg-gradient-to-r from-fuchsia-50 to-purple-50 border-fuchsia-300 text-fuchsia-700 font-bold text-xs" />
                <button
                  onClick={buscarPorGPS}
                  disabled={gpsLoading}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {gpsLoading ? 'Buscando...' : '📍 GPS'}
                </button>
              </div>
            </div>

            {/* Clientes próximos via GPS */}
            {nearbyClients.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 shrink-0">
                <p className="text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {nearbyClients.length} clientes próximos
                  <button onClick={() => setNearbyClients([])} className="ml-auto text-blue-400 hover:text-blue-600"><X className="w-3.5 h-3.5" /></button>
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {nearbyClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedClientId(c.id); setMessages([]); setNearbyClients([]); }}
                      className="shrink-0 text-left bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-100 transition-colors"
                    >
                      <div className="text-xs font-medium text-slate-800">{c.first_name} {c.status === 'quente' ? '🔥' : ''}</div>
                      <div className="text-[10px] text-slate-500">{c.city} • {c.distance < 10 ? `${(c.distance*1000).toFixed(0)}m` : `${c.distance.toFixed(0)}km`}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Script gerado */}
            {generatedScript && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b p-3 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-700">{scriptLabels[generatedScript.type] || generatedScript.type}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(generatedScript.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    {client?.phone && (
                      <Button size="sm" onClick={handleShareWhatsApp} className="h-6 px-2 bg-green-500 hover:bg-green-600 text-xs">
                        WhatsApp
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setGeneratedScript(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {generatedScript.content}
                </div>
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-indigo-300" />
                  <p className="font-medium text-slate-500">Primori - Assistente Master de Vendas</p>
                  <p className="text-xs mt-1">Selecione um cliente e use os botões acima ou digite sua pergunta</p>
                  <p className="text-xs mt-1 text-indigo-500">Dica: "faça agenda da semana em Marília" 👆 aba Agenda</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg.content} isUser={msg.role === 'user'} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Análise transcrição + Input */}
            <div className="bg-white border-t p-3 shrink-0 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {client?.phone && (
                  <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700 h-7 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                  </a>
                )}
                <a href={base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant')} target="_blank" rel="noreferrer">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs">
                    💬 NR22888
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={analyzingTranscript} className="border-cyan-300 text-cyan-700 h-7 text-xs">
                  {analyzingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : '📎 Analisar .txt'}
                </Button>
                <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              </div>
              {rolePlayMode && (
                <div className="px-2 py-1 bg-purple-50 rounded border border-purple-200 text-xs text-purple-700">
                  🎭 Modo Treinamento: você fala com {client?.first_name}
                </div>
              )}
              <div className="flex gap-2">
                <VoiceRecorderButton onTranscript={t => setInput(t)} size="icon" className="h-11 w-11 shrink-0" />
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !loading && sendMessage(input)}
                  placeholder={rolePlayMode ? 'Sua abordagem...' : 'Pergunte ou dê comandos... (ex: faça agenda semana Marília)'}
                  className="flex-1 h-11 rounded-xl"
                  disabled={loading}
                />
                <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                  className={`h-11 w-11 rounded-xl ${rolePlayMode ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB AGENDA ── */}
          <TabsContent value="agenda" className="overflow-y-auto p-3 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-indigo-800 mb-1">💡 Como usar a Agenda Inteligente:</p>
              <ul className="text-xs text-indigo-700 space-y-0.5">
                <li>• Digite cidades (ex: Marília, Bauru) e clique em Gerar</li>
                <li>• A IA organiza os melhores clientes por score e potencial</li>
                <li>• As visitas são criadas automaticamente no CRM</li>
                <li>• Envie a agenda direto para seu WhatsApp</li>
              </ul>
            </div>
            <AgendaComandoPanel />
          </TabsContent>

          {/* ── TAB PESQUISA ── */}
          <TabsContent value="pesquisa" className="overflow-y-auto p-3 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">🔍 Ferramentas de Pesquisa:</p>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>• <strong>Internet:</strong> Busca clínicas por cidade com dados de contato e proprietário</li>
                <li>• <strong>CNPJ:</strong> Consulta Receita Federal - razão social, sócios, endereço</li>
                <li>• <strong>CRMV:</strong> Veterinários registrados por cidade</li>
                <li>• Adicione clínicas como Lead ou Cliente diretamente</li>
              </ul>
            </div>
            <BuscaClinicaCNPJ />
          </TabsContent>

          {/* ── TAB WEB IA ── */}
          <TabsContent value="web" className="overflow-y-auto p-3">
            <MasterAIAssistant client={client} />
          </TabsContent>

          {/* ── TAB NOTIF ── */}
          <TabsContent value="notif" className="overflow-y-auto p-3 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-semibold text-green-800 mb-2">📲 Enviar para WhatsApp (5514991676428)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { action: 'resumo_diario', label: '🌅 Resumo Diário', desc: 'Clientes, tarefas, visitas do dia' },
                  { action: 'relatorio_pipeline', label: '📊 Pipeline', desc: 'Funil de vendas completo' },
                  { action: 'alerta_clientes_frios', label: '❄️ Clientes Frios', desc: 'Sem contato há 14+ dias' },
                  { action: 'test', label: '✅ Teste Sistema', desc: 'Verificar conexão ativa' },
                ].map(({ action, label, desc }) => (
                  <button
                    key={action}
                    onClick={() => sendWhatsAppNotif(action)}
                    disabled={sendingNotif}
                    className="text-left p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-sm text-green-800">{label}</div>
                    <div className="text-xs text-green-600 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enviar conteúdo gerado via chunks */}
            {generatedScript && client?.phone && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">📤 Enviar último conteúdo gerado</p>
                  <p className="text-xs text-slate-500 mb-2">{generatedScript.content.substring(0, 100)}...</p>
                  <Button onClick={handleShareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-sm h-9">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar para {client.first_name} ({client.phone})
                  </Button>
                  <p className="text-xs text-slate-400 mt-1 text-center">Mensagens longas são divididas automaticamente em partes</p>
                </CardContent>
              </Card>
            )}

            {/* Link NR22888 */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-semibold mb-2">🤖 WhatsApp Bot NR22888</p>
                <p className="text-xs text-slate-500 mb-3">Acesse o assistente master diretamente no WhatsApp</p>
                <a href={base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant')} target="_blank" rel="noreferrer">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-sm h-9">
                    <MessageCircle className="w-4 h-4 mr-2" /> Conectar NR22888
                  </Button>
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}