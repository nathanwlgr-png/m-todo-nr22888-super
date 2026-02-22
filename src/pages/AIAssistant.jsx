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
import {
  ArrowLeft, Send, Loader2, Sparkles, Save, Copy, Check, FileText,
  Search, Brain, CheckSquare, Handshake, Globe, Zap, MessageCircle,
  MessageSquare, Target, RotateCcw, TrendingUp, HelpCircle, Calendar,
  Building2, Bell, ChevronRight, X, Phone, Star, MapPin, Navigation,
  Activity, BarChart3, Award, RefreshCw, ChevronDown, ChevronUp, Flame
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import QuickActionButton from '@/components/QuickActionButton';
import VoiceRecorderButton from '@/components/VoiceRecorderButton';
import MasterAIAssistant from '@/components/MasterAIAssistant';
import MarketIntelligenceDashboard from '@/components/MarketIntelligenceDashboard';
import AgendaComandoPanel from '@/components/AgendaComandoPanel';
import SmartSalesRouteOptimizer from '@/components/SmartSalesRouteOptimizer';
import BuscaClinicaCNPJ from '@/components/BuscaClinicaCNPJ';
import TGPSVetSearch from '@/components/TGPSVetSearch';
import AlertasTempoReal from '@/components/AlertasTempoReal';
import EditableClientName from '@/components/EditableClientName';
import AutoFollowUpIA from '@/components/AutoFollowUpIA';
import SalesPerformanceReport from '@/components/SalesPerformanceReport';
import ClientReactivationIA from '@/components/ClientReactivationIA';
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
  const [systemStatus, setSystemStatus] = useState({});
  const [testingSystem, setTestingSystem] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [coachingData, setCoachingData] = useState(null);
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
    retry: 1, staleTime: 60000
  });

  const { data: client } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const found = allClients.find(c => c && c.id === selectedClientId);
      if (found) return found;
      const clients = await base44.entities.Client.list();
      const fromList = clients.find(c => c && c.id === selectedClientId);
      if (!fromList) { setSelectedClientId(null); return null; }
      return fromList;
    },
    enabled: !!selectedClientId, retry: 0, staleTime: 30000
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
      const num = client.numerology_number;
      const perfisNum = {
        1:'Líder/Direto',2:'Diplomata/Relacional',3:'Comunicador',4:'Analítico',
        5:'Aventureiro',6:'Conselheiro',7:'Analista',8:'Executivo/ROI',9:'Humanitário',
        11:'Mestre Visionário',22:'Mestre Construtor'
      };
      const conversao = client.ai_sales_intelligence?.conversion_probability || client.purchase_score || 50;
      setMessages([{
        role: 'assistant',
        content: `🔥 **MÉTODO NR22 — ANÁLISE INSTANTÂNEA**\n\n**Cliente:** ${client.first_name}${client.clinic_name ? ` | ${client.clinic_name}` : ''}${client.city ? ` | ${client.city}` : ''}\n\n📊 **Score:** ${client.purchase_score || 0}% | **Status:** ${(client.status || 'morno').toUpperCase()} | **Pipeline:** ${client.pipeline_stage || 'lead'}\n🔢 **Numerologia ${num}:** ${perfisNum[num] || 'Perfil ' + num} | **Tom:** ${client.client_tone || 'a identificar'}\n🎯 **Conversão IA:** ${conversao}% | **Health:** ${client.health_score || 0}% | **Prioridade:** ${client.attention_priority || 5}/10\n💡 **Necessidades Lab:** ${client.lab_needs?.join(', ') || 'a mapear'}\n\n🚀 **Próxima Ação IA:** ${client.ai_next_best_action || client.next_action || 'Analisar necessidades e agendar visita'}\n\n_Use os botões acima ou pergunte qualquer coisa!_`
      }]);
      // Auto-load score silenciosamente
      loadClientScore(client);
    }
  }, [client]);

  // ─── SCORE PREDITIVO ────────────────────────────────────────────────────────
  const loadClientScore = async (c) => {
    if (!c) return;
    setLoadingScore(true);
    try {
      const res = await base44.functions.invoke('predictiveLeadScoring', {
        action: 'calculate_score',
        client_id: c.id,
        client_data: {
          status: c.status, pipeline_stage: c.pipeline_stage,
          purchase_score: c.purchase_score, health_score: c.health_score,
          client_type: c.client_type, current_volume: c.current_volume,
          available_budget: c.available_budget, last_contact_date: c.last_contact_date,
          total_visits_count: c.total_visits_count, numerology_number: c.numerology_number
        }
      });
      if (res.data) setScoreData(res.data);
    } catch (e) {
      // Silencioso — fallback com dados do CRM
      setScoreData({
        conversion_probability: c.ai_sales_intelligence?.conversion_probability || c.purchase_score || 50,
        churn_risk: c.ai_sales_intelligence?.churn_risk || 20,
        next_best_action: c.ai_next_best_action || c.next_action || 'Agendar visita',
        priority_level: c.attention_priority || 5
      });
    } finally {
      setLoadingScore(false);
    }
  };

  // ─── COACHING IA ────────────────────────────────────────────────────────────
  const loadCoaching = async () => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setLoadingCoaching(true);
    try {
      trackAICall();
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — COACHING DE VENDAS PERSONALIZADO\n\nCliente: ${client.first_name} | Numerologia: ${client.numerology_number} | Status: ${client.status} | Score: ${client.purchase_score}% | Visitas: ${visits.length} | Vendas: ${sales.length} | Dores: ${client.main_pains?.join(', ') || 'N/A'} | Objeções: ${client.real_objections?.join(', ') || 'N/A'}\n\nGere coaching COMPLETO:\n1. 🎯 Diagnóstico do momento atual com este cliente\n2. 💪 3 forças que você pode usar agora\n3. ⚠️ 2 armadilhas a evitar\n4. 📱 Script ideal para próximo contato (copia e cola)\n5. 🧠 Técnica psicológica mais efetiva para o perfil ${client.numerology_number}\n6. 💡 Insight surpreendente baseado nos dados\n7. 🔥 Frase motivacional de Napoleão Hill para agir AGORA\n\nResposta em markdown estruturado.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnostico: { type: "string" },
            forcas: { type: "array", items: { type: "string" } },
            armadilhas: { type: "array", items: { type: "string" } },
            script_contato: { type: "string" },
            tecnica_psicologica: { type: "string" },
            insight: { type: "string" },
            frase_motivacional: { type: "string" }
          }
        }
      });
      setCoachingData(res);
    } catch (e) {
      toast.error('Erro ao carregar coaching');
    } finally {
      setLoadingCoaching(false);
    }
  };

  const getSystemContext = (isRolePlay = false) => {
    if (!client) return '';
    const interactionHistory = `HISTÓRICO: ${visits.length} visitas | ${tasks.filter(t => t.status === 'pendente').length} tarefas pendentes | Dores: ${client.main_pains?.join(', ') || 'N/A'}`;
    if (isRolePlay) {
      return `MODO ROLE-PLAY: Você É ${client.first_name}. Perfil: ${client.behavioral_profile}. Tom: ${client.client_tone}. ${interactionHistory}. Responda em 1ª pessoa SEMPRE como se fosse o cliente.`;
    }
    const numPerfis = {
      1:'Líder — direto, objetivo, eficiência',2:'Diplomata — detalhista, consenso',
      3:'Comunicador — entusiasta, relacionamento',4:'Organizador — analítico, dados concretos',
      5:'Aventureiro — inovador, novidades',6:'Conselheiro — cauteloso, segurança',
      7:'Analista — pesquisador, info técnica',8:'Executivo — ROI claro e rápido',
      9:'Humanitário — valores e impacto',11:'Mestre Visionário — intuitivo, idealista',
      22:'Mestre Construtor — grandes projetos'
    };
    const intel = client.ai_sales_intelligence || {};
    return `VOCÊ É PRIMORI — MÉTODO NR22 | IA MASTER DE VENDAS.

━━━ CLIENTE ━━━
Nome: ${client.first_name} | Clínica: ${client.clinic_name || 'N/A'} | Cidade: ${client.city || 'N/A'}
Tipo: ${client.client_type || 'N/A'} | Papel: ${client.decision_role || 'N/A'}
Status: ${client.status} | Pipeline: ${client.pipeline_stage || 'lead'}
Score Compra: ${client.purchase_score || 0}% | Health: ${client.health_score || 0}% | Engagement: ${client.engagement_score || 0}%
Conversão IA: ${intel.conversion_probability || 'N/A'}% | Churn Risk: ${intel.churn_risk || 'N/A'}%

━━━ PERFIL COMPORTAMENTAL ━━━
Numerologia: ${client.numerology_number} — ${numPerfis[client.numerology_number] || client.behavioral_profile || 'N/A'}
Caminho Vida: ${client.life_path_number || 'N/A'} | Tom: ${client.client_tone || 'N/A'}
Estilo Decisão: ${client.decision_style || 'N/A'} | Comunicação: ${client.recommended_communication || 'N/A'}
Dicas Abordagem: ${client.approach_tips || 'N/A'}
Melhores Dias: ${client.melhores_dias_venda?.join(', ') || 'calcular'}

━━━ SITUAÇÃO COMERCIAL ━━━
Equip Atual: ${client.current_equipment || 'N/A'} | Interesse: ${client.equipment_interest || 'N/A'}
Volume Exames: ${client.current_volume || 'N/A'} | Orçamento: R$${client.available_budget || 'N/A'}
Prazo Decisão: ${client.decision_deadline || 'N/A'} | Tempo Mercado: ${client.market_time || 'N/A'}
Lab Needs: ${client.lab_needs?.join(', ') || 'N/A'}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Objeções Reais: ${client.real_objections?.join(', ') || 'N/A'}
Motivadores: ${client.purchase_motivators?.join(', ') || 'N/A'}

━━━ HISTÓRICO ━━━
${interactionHistory}
Última Visita: ${client.last_visit_date || 'N/A'} | Total: ${client.total_visits_count || 0}
Vendas: ${sales.length} | Tarefas Pendentes: ${tasks.filter(t => t.status === 'pendente').length}
Gatilhos Usados: ${client.triggers_used?.join(', ') || 'N/A'}

━━━ INTELIGÊNCIA IA ━━━
Próx Ação: ${client.ai_next_best_action || intel.best_approach || 'N/A'}
Horário Ótimo: ${intel.optimal_contact_time || 'N/A'}
Gatilhos IA: ${intel.key_triggers?.join(', ') || 'N/A'}
Objeções Previstas: ${intel.predicted_objections?.join(', ') || 'N/A'}
LTV 12m: R$${intel.ltv_12_months || 'N/A'} | LTV 36m: R$${intel.ltv_36_months || 'N/A'}

━━━ FRAMEWORKS ATIVOS ━━━
Numerologia Pitagórica + SPIN Selling + Cialdini (6 gatilhos) + Arte da Guerra + Challenger Sale + Value Selling + Neurovendas

━━━ PRODUTOS SEAMATY ━━━
• VBC-50A: Hematológico 5 partes, 26 param, 20μL, 3-5min (>40 hemogramas/mês)
• SMT-120VP: Bioquímico auto, 120 testes/h (>30 bioquímicos/mês)
• QT3: Bioquímico individual, rotores, portátil (entry point)
• VG1: Gasometria portátil, 15 param, 3min, 65μL (UTI/cirurgia)
• VG2: Gasometria + Imunofluorescência (hospitais)
• Vi1: Imunofluorescência (especialidades)
• VQ1: PCR quantitativo (laboratórios)
DIFERENCIAIS: 25 MESES GARANTIA | MANUTENÇÃO VITALÍCIA | BONIFICAÇÃO INSUMOS | ISO 13485:2016

Responda em português. Seja ESTRATÉGICO, cite dados. Use markdown estruturado. Inclua próximos passos concretos.`;
  };

  // ─── ENVIAR MENSAGEM ─────────────────────────────────────────────────────────
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
      if ((msgLower.includes('agenda') || msgLower.includes('visita')) && (msgLower.includes('semana') || msgLower.includes('mês') || msgLower.includes('mes'))) {
        const cidadeMatch = ['Marília','Bauru','Botucatu','Lins','Ourinhos','Assis','Tupã','Jaú'].filter(c => msgLower.includes(c.toLowerCase()));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📅 **Comando de Agenda detectado!**\n\nCidades: ${cidadeMatch.length > 0 ? cidadeMatch.join(', ') : 'use a aba para configurar'}\n\n👉 Abrindo aba **📅 Agenda** automaticamente...`
        }]);
        setActiveTab('agenda');
        return;
      }

      // Detectar comando de análise de score
      if (msgLower.includes('score') || msgLower.includes('análise completa') || msgLower.includes('analise completa')) {
        if (client) { setActiveTab('score'); setLoading(false); return; }
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${getSystemContext(rolePlayMode)}\n\nHISTÓRICO:\n${conversationHistory}\n\n${rolePlayMode ? 'Vendedor diz' : 'Pergunta'}: ${userMessage}\n\nIMPORTANTE: Resposta COMPLETA. Use markdown.`
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
      if (cached) { setGeneratedScript({ type, content: cached }); setScriptExpanded(true); toast.success('📦 Cache'); return; }
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        const fallback = getFallbackResponse(type, client);
        setGeneratedScript({ type, content: fallback }); setScriptExpanded(true);
        toast.info('📋 Template local'); return;
      }
      trackAICall();
      const ctx = `Cliente: ${client.first_name} | Clínica: ${client.clinic_name || ''} | Cidade: ${client.city || ''} | Tipo: ${client.client_type || ''} | Numerologia ${client.numerology_number}: ${client.behavioral_profile || ''} | Tom: ${client.client_tone || ''} | Score: ${client.purchase_score}% | Status: ${client.status} | Dores: ${client.main_pains?.join(', ') || ''} | Equip atual: ${client.current_equipment || ''} | Volume: ${client.current_volume || ''} | Orçamento: R$${client.available_budget || ''} | Objeções: ${client.real_objections?.join(', ') || ''} | Motivadores: ${client.purchase_motivators?.join(', ') || ''} | Visitas: ${visits.length} | Vendas: ${sales.length}`;
      const prompts = {
        presentation: `MÉTODO NR22 — ROTEIRO COMPLETO DE APRESENTAÇÃO\n\n${ctx}\n\n1. Abertura adaptada ao numerológico ${client.numerology_number}\n2. Script presencial palavra por palavra\n3. Versão WhatsApp (pronta para copiar)\n4. Versão ligação (2 min)\n5. Diferenciação vs concorrentes (25m garantia, manutenção vitalícia, bonificação insumos, ISO 13485)\n6. Checklist pré-visita\n7. Frase motivacional de Napoleão Hill\n\nCompleto em markdown.`,
        insights: `MÉTODO NR22 — ANÁLISE PSICOLÓGICA PROFUNDA\n\n${ctx}\n\n1. Perfil psicológico (numerologia ${client.numerology_number})\n2. Motivadores conscientes e inconscientes\n3. Medos e resistências prováveis\n4. Canal e horário ideal com justificativa\n5. Gatilhos Cialdini mais efetivos com script\n6. Estratégia de pitch em 3 atos\n7. Alertas: o que NUNCA dizer\n8. Probabilidade de conversão + próximos 3 passos\n9. Frase de Platão para Nathan\n\nCompleto em markdown.`,
        prospecting: `MÉTODO NR22 — ESTRATÉGIA DE PROSPECÇÃO\n\n${ctx}\n\n1. Canal ideal com justificativa\n2. Horário e frequência recomendados\n3. Primeira frase de abertura (perfil ${client.numerology_number})\n4. Sequência de 5 contatos (intervalos e canais)\n5. Scripts para cada canal\n6. Como agir se não responder\n7. Frase de Sócrates\n\nCompleto em markdown.`,
        question: `MÉTODO NR22 — PERGUNTAS SPIN SELLING\n\n${ctx}\n\nSITUAÇÃO (S): 3 perguntas para mapear contexto\nPROBLEMA (P): 3 perguntas para revelar dores\nIMPLICAÇÃO (I): 3 perguntas para amplificar custo da inação\nNECESSIDADE-SOLUÇÃO (N): 3 perguntas para o cliente concluir\n\nAdapte ao perfil ${client.numerology_number}. Indique gatilho Cialdini após cada resposta. Completo em markdown.`,
        objection: `MÉTODO NR22 — CONTROLE DE OBJEÇÕES\n\n${ctx}\n\n1. "Está caro" → resposta + técnica\n2. "Preciso pensar" → resposta + urgência\n3. "Meu equip ainda funciona" → comparativo\n4. "Já tenho IDEXX/Mindray" → diferenciação\n5. "Não tenho volume" → cálculo ROI\n6. Objeção específica: ${client.real_objections?.join(' / ') || 'preço'}\n\nFrase exata + framework + gatilho mental. Adaptado ao perfil ${client.numerology_number}. Completo em markdown.`,
        proposal: `MÉTODO NR22 — PROPOSTA COMERCIAL\n\n${ctx}\n\n# PROPOSTA — SEAMATY\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n1. Abertura personalizada (tom ${client.numerology_number})\n2. Diagnóstico das necessidades identificadas\n3. Equipamento recomendado + especificações\n4. Cálculo ROI (${client.current_volume} × economia mensal)\n5. Condições: à vista ou 5x cartão s/juros\n6. Bonificação insumos (não desconto no equip)\n7. Diferenciais: 25m garantia, manutenção vitalícia, ISO 13485\n8. CTA com urgência\n9. Assinatura Nathan Rosa — CMAT Brasil\n\nPronto para WhatsApp. Completo.`,
        closing: `MÉTODO NR22 — ARSENAL DE FECHAMENTO\n\n${ctx}\n\n1. Frase de fechamento principal (numerológico ${client.numerology_number})\n2. Fechamento por escassez (Cialdini)\n3. Fechamento por resumo de valor (ROI calculado)\n4. Fechamento condicional\n5. Script para última resistência\n6. Como lidar com "deixa eu pensar mais"\n7. CTA final com urgência real\n8. Frase de Napoleão Hill sobre perseverança`,
        followup: `MÉTODO NR22 — FOLLOW-UP\n\n${ctx}\n\nVERSÃO 1 — WhatsApp curta (3 linhas):\n[texto pronto]\n\nVERSÃO 2 — WhatsApp com ROI:\n[texto com dado específico + próximo passo]\n\nVERSÃO 3 — Email profissional:\n[assunto + corpo]\n\nAdaptado ao perfil ${client.numerology_number}. Referência ao último contato + valor específico + CTA com data.`,
        needs: `MÉTODO NR22 — ANÁLISE PREDITIVA\n\n${ctx}\n\n1. Gap atual vs ideal (soluções faltando)\n2. Próximo produto mais provável de compra (com %)\n3. Dores ainda não exploradas\n4. Janela de oportunidade (timing + ciclo numerológico)\n5. Estratégia upsell + cross-sell\n6. LTV estimado 12/24/36 meses\n7. Risco de perda para concorrente\n8. Gatilho para ativar agora\n9. Plano nurturing se ainda não pronto`,
        suggestTasks: `MÉTODO NR22 — PLANO DE AÇÕES\n\n${ctx}\n\n5-7 tarefas concretas. Para cada:\n**[N]. [TIPO] — [Título]**\n• Prioridade: ALTA/MÉDIA/BAIXA\n• Prazo: X dias\n• Canal: WhatsApp/Telefone/Email/Visita\n• Script: o que fazer e dizer\n• Objetivo: resultado esperado\n\nOrdenar por impacto × urgência. Inclua: contato imediato + envio material + agendamento + follow-up. Completo em markdown.`,
      };
      const prompt = prompts[type];
      if (!prompt) { toast.error('Ação não encontrada'); return; }
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + '\n\nRESPOSTA COMPLETA. NÃO corte. Markdown estruturado.'
      });
      setCachedResponse(cacheKey, response);
      setGeneratedScript({ type, content: response });
      setScriptExpanded(true);
      toast.success('✅ Gerado pelo Método NR22!');
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
        prompt: `Método NR22 — Crie 4-5 tarefas estratégicas para ${client.first_name}. Status: ${client.status}. Score: ${client.purchase_score}%. Numerologia: ${client.numerology_number}. Pipeline: ${client.pipeline_stage}.`,
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
        due_date: new Date(Date.now() + (task.due_days || 3) * 86400000).toISOString().split('T')[0],
        status: 'pendente', auto_created: true
      }));
      await createTasksMutation.mutateAsync(tasksToCreate);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **${tasksToCreate.length} Tarefas Criadas pelo Método NR22!**\n\n${tasksToCreate.map((t, i) => `${i+1}. **${t.title}** (${t.type}, ${t.priority}) — ${t.due_date}`).join('\n')}`
      }]);
    } catch (error) {
      handleLimitError(error); toast.error('Erro ao criar tarefas');
    } finally {
      setQuickLoading(prev => ({ ...prev, autoTasks: false }));
    }
  };

  // ─── ENVIAR WHATSAPP CHUNKED ──────────────────────────────────────────────────
  const handleShareWhatsApp = async () => {
    if (!generatedScript || !client?.phone) return;
    try {
      const res = await base44.functions.invoke('whatsappSendChunked', {
        message: generatedScript.content, phone: client.phone,
        client_id: client.id, client_name: client.first_name,
      });
      if (res.data?.success) {
        const chunks = res.data.chunks || [];
        if (chunks.length === 1) { window.open(chunks[0].whatsapp_url, '_blank'); toast.success('WhatsApp aberto!'); }
        else { toast.success(`Mensagem em ${chunks.length} partes. Abrindo...`); chunks.forEach((chunk, i) => setTimeout(() => window.open(chunk.whatsapp_url, '_blank'), i * 1500)); }
      }
    } catch (e) {
      const msg = encodeURIComponent(generatedScript.content.substring(0, 3800));
      window.open(`https://wa.me/${client.phone}?text=${msg}`, '_blank');
    }
  };

  // ─── ANÁLISE TRANSCRIÇÃO ──────────────────────────────────────────────────────
  const analyzeTranscript = async (transcriptText) => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setAnalyzingTranscript(true);
    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) { toast.error('Limite IA atingido.'); return; }
      trackAICall();
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta transcrição de conversa com ${client.first_name} (numerologia ${client.numerology_number}).\n\nTRANSCRIÇÃO: ${transcriptText}\n\nFeedback: 1.Pontos Fortes 2.Melhorias 3.Scores (SPIN/Numerologia/Gatilhos) 4.Tom/Linguagem 5.Próximas Ações. Completo em markdown.`
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
    addLine(`MÉTODO NR22 — CONVERSA — ${client?.first_name || 'IA'}`, 14, true);
    addLine(`Data: ${new Date().toLocaleString('pt-BR')}`, 9);
    y += 5;
    messages.forEach(msg => {
      addLine(msg.role === 'user' ? 'VOCÊ:' : 'PRIMORI NR22:', 11, true);
      addLine(msg.content, 10);
      y += 3;
    });
    doc.save(`NR22_${client?.first_name || 'IA'}_${Date.now()}.pdf`);
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

  const runSystemDiagnostic = async () => {
    setTestingSystem(true);
    const results = {};
    const tests = [
      { name: 'whatsappBot', label: 'Bot WhatsApp', payload: { message: 'ajuda' } },
      { name: 'whatsappMasterNotificacao', label: 'Notificações', payload: { action: 'test', phone: '5514991676428' } },
      { name: 'agendaInteligente', label: 'Agenda IA', payload: { tipo: 'semana', cidades: [], criar_visitas: false } },
      { name: 'whatsappSendChunked', label: 'Envio Chunked', payload: { message: 'Teste NR22', phone: '5514991676428' } },
      { name: 'predictiveLeadScoring', label: 'Score Preditivo', payload: { action: 'get_priorities' } },
      { name: 'marketIntelligenceMonitor', label: 'Intel Mercado', payload: { action: 'market_scan', region: 'São Paulo' } },
    ];
    await Promise.allSettled(tests.map(async (t) => {
      try {
        const r = await base44.functions.invoke(t.name, t.payload);
        results[t.label] = r.data?.success !== false ? '✅' : '⚠️';
      } catch (e) { results[t.label] = '❌'; }
    }));
    setSystemStatus(results);
    setTestingSystem(false);
    const statusMsg = Object.entries(results).map(([k, v]) => `${v} ${k}`).join('\n');
    setMessages(prev => [...prev, { role: 'assistant', content: `🔧 **Diagnóstico NR22:**\n\n${statusMsg}\n\n${Object.values(results).every(v => v === '✅') ? '🎉 Todos os sistemas OK!' : '⚠️ Verifique os itens com erro.'}` }]);
    setActiveTab('chat');
  };

  const buscarPorGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS não disponível'); return; }
    setGpsLoading(true);
    setNearbyClients([]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const cityCoords = {
          'marília': { lat: -22.2139, lng: -49.9461 }, 'bauru': { lat: -22.3246, lng: -49.0653 },
          'botucatu': { lat: -22.8834, lng: -48.4446 }, 'lins': { lat: -21.6775, lng: -49.7445 },
          'ourinhos': { lat: -22.9788, lng: -49.8696 }, 'assis': { lat: -22.6622, lng: -50.4124 },
          'tupã': { lat: -21.9347, lng: -50.5127 }, 'jaú': { lat: -22.2966, lng: -48.5580 },
          'garça': { lat: -22.2128, lng: -49.6537 }, 'presidente prudente': { lat: -22.1256, lng: -51.3886 },
        };
        const withDist = allClients
          .filter(c => c.address || c.city)
          .map(c => {
            const coord = cityCoords[(c.city || '').toLowerCase().trim()];
            if (!coord) return { ...c, distance: 9999 };
            const dLat = (coord.lat - lat) * Math.PI / 180;
            const dLng = (coord.lng - lng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(coord.lat*Math.PI/180)*Math.sin(dLng/2)**2;
            return { ...c, distance: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) };
          })
          .filter(c => c.distance < 150)
          .sort((a, b) => (a.distance - (a.purchase_score||0)*0.5) - (b.distance - (b.purchase_score||0)*0.5))
          .slice(0, 10);
        setNearbyClients(withDist);
        setGpsLoading(false);
        if (withDist.length === 0) toast.info('Nenhum cliente até 150km');
        else {
          toast.success(`${withDist.length} clientes próximos!`);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📍 **GPS Ativado** | ${withDist.length} clientes nas proximidades:\n\n${withDist.map((c, i) => `${i+1}. **${c.first_name}** ${c.clinic_name ? `(${c.clinic_name})` : ''} — ${c.city} — ${c.distance < 10 ? `${(c.distance*1000).toFixed(0)}m` : `${c.distance.toFixed(0)}km`} — ${c.status === 'quente' ? '🔥' : c.status === 'morno' ? '🌡️' : '❄️'} Score: ${c.purchase_score||0}%`).join('\n')}`
          }]);
        }
      },
      (err) => { setGpsLoading(false); toast.error('Erro GPS: ' + (err.message || 'Permissão negada')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleRolePlay = () => {
    if (!client) return;
    setRolePlayMode(!rolePlayMode);
    setMessages([{ role: 'assistant', content: !rolePlayMode ? `🎭 **MODO TREINAMENTO** — Sou ${client.first_name}. ${client.behavioral_profile}. Como você vai me abordar?` : `Modo Treinamento desativado. Pronto para ajudar!` }]);
  };

  const scriptLabels = {
    presentation:'🤝 Apresentação', insights:'🧠 Insights', prospecting:'🔍 Prospecção',
    question:'❓ Pergunta SPIN', objection:'🛡️ Objeções', proposal:'📄 Proposta',
    closing:'🎯 Fechamento', needs:'📈 Previsão', followup:'🔄 Follow-up', suggestTasks:'✅ Tarefas'
  };

  const statusColor = client?.status === 'quente' ? 'bg-red-500' : client?.status === 'morno' ? 'bg-yellow-400 text-black' : 'bg-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-4 py-3 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Método NR22
              <span className="text-xs font-normal text-indigo-200 ml-1">v4 TURBO</span>
            </h1>
            <p className="text-indigo-200 text-[10px]">47 variáveis × 15.000 cruzamentos/min × 22 IAs ativas</p>
          </div>
          <AlertasTempoReal />
          <Button size="sm" variant="ghost" onClick={exportChatToPDF} className="text-white hover:bg-white/20 h-8 w-8 p-0">
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={toggleRolePlay}
            disabled={!selectedClientId}
            className={`h-8 text-xs px-2 ${rolePlayMode ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            🎭 {rolePlayMode ? 'Treinando' : 'Treinar'}
          </Button>
        </div>

        {/* Seletor de cliente */}
        <Select value={selectedClientId || ''} onValueChange={v => { setSelectedClientId(v === 'none' ? null : v); setMessages([]); setRolePlayMode(false); setScoreData(null); setCoachingData(null); }}>
          <SelectTrigger className="h-10 bg-white/15 border-white/30 text-white">
            <SelectValue placeholder="🔍 Selecione um cliente para análise NR22..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sem cliente específico —</SelectItem>
            {allClients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.status === 'quente' ? '🔥 ' : c.status === 'morno' ? '🌡️ ' : '❄️ '}
                {c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''} {c.city ? `· ${c.city}` : ''}
                {c.purchase_score ? ` · ${c.purchase_score}%` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {client && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <EditableClientName client={client} onUpdate={() => queryClient.invalidateQueries(['client', selectedClientId])} />
            <Badge className={`text-[10px] h-5 ${statusColor}`}>{client.status}</Badge>
            <Badge className="bg-white/20 text-white text-[10px] h-5">📊 {client.purchase_score || 0}%</Badge>
            {client.pipeline_stage && <Badge className="bg-indigo-400 text-[10px] h-5">{client.pipeline_stage}</Badge>}
            {client.numerology_number && <Badge className="bg-purple-400 text-[10px] h-5">🔢 {client.numerology_number}</Badge>}
            {client.phone && (
              <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer">
                <Badge className="bg-green-500 text-white text-[10px] h-5 cursor-pointer hover:bg-green-400">📱 WA</Badge>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ═══ TABS PRINCIPAIS ═══ */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-5 m-2 mb-0 shrink-0 h-9">
            <TabsTrigger value="chat" className="text-[10px] px-1">💬 Chat</TabsTrigger>
            <TabsTrigger value="score" className="text-[10px] px-1">📊 Score</TabsTrigger>
            <TabsTrigger value="coaching" className="text-[10px] px-1">🏆 Coach</TabsTrigger>
            <TabsTrigger value="automacao" className="text-[10px] px-1">🤖 IA Auto</TabsTrigger>
            <TabsTrigger value="mais" className="text-[10px] px-1">⚡ Mais</TabsTrigger>
          </TabsList>
          {/* Segunda linha de tabs */}
          <div className="flex gap-1 mx-2 mt-1 overflow-x-auto">
            {[
              { value: 'rota', label: '🗺️ Rota' },
              { value: 'agenda', label: '📅 Agenda' },
              { value: 'pesquisa', label: '🔍 Busca' },
              { value: 'mercado', label: '📈 Mercado' },
              { value: 'notif', label: '⚙️ Ops' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setActiveTab(value)}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${activeTab === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB CHAT ── */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
            {/* Ações rápidas */}
            <div className="bg-white border-b px-3 py-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { type: 'presentation', icon: Handshake, label: 'Apresentar', color: 'bg-green-50 border-green-300 text-green-700' },
                  { type: 'insights', icon: Brain, label: 'Insights', color: 'bg-pink-50 border-pink-300 text-pink-700' },
                  { type: 'prospecting', icon: Search, label: 'Prospecção', color: 'bg-purple-50 border-purple-300 text-purple-700' },
                  { type: 'question', icon: HelpCircle, label: 'SPIN', color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
                  { type: 'objection', icon: MessageCircle, label: 'Objeções', color: 'bg-red-50 border-red-300 text-red-700' },
                  { type: 'proposal', icon: FileText, label: 'Proposta', color: 'bg-orange-50 border-orange-300 text-orange-700' },
                  { type: 'closing', icon: Target, label: 'Fechamento', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                  { type: 'needs', icon: TrendingUp, label: 'Previsão', color: 'bg-cyan-50 border-cyan-300 text-cyan-700' },
                  { type: 'followup', icon: RotateCcw, label: 'Follow-up', color: 'bg-amber-50 border-amber-300 text-amber-700' },
                  { type: 'suggestTasks', icon: CheckSquare, label: 'Tarefas', color: 'bg-teal-50 border-teal-300 text-teal-700' },
                ].map(({ type, icon: Icon, label, color }) => (
                  <QuickActionButton key={type} icon={Icon} label={label}
                    onClick={() => generateQuickAction(type)} loading={quickLoading[type]}
                    className={`shrink-0 ${color} text-[10px]`} />
                ))}
                <QuickActionButton icon={Zap} label="🤖 Tarefas IA"
                  onClick={handleAutoCreateTasks} loading={quickLoading.autoTasks}
                  className="shrink-0 bg-gradient-to-r from-fuchsia-50 to-purple-50 border-fuchsia-300 text-fuchsia-700 font-bold text-[10px]" />
                <button
                  onClick={buscarPorGPS}
                  disabled={gpsLoading}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-medium bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  GPS
                </button>
              </div>
            </div>

            {/* GPS nearby */}
            {nearbyClients.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 shrink-0">
                <p className="text-[10px] font-semibold text-blue-800 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {nearbyClients.length} clientes próximos
                  <button onClick={() => setNearbyClients([])} className="ml-auto"><X className="w-3 h-3 text-blue-400" /></button>
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {nearbyClients.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClientId(c.id); setMessages([]); setNearbyClients([]); }}
                      className="shrink-0 text-left bg-white border border-blue-200 rounded-lg px-2 py-1.5 hover:bg-blue-100 transition-colors">
                      <div className="text-[10px] font-medium">{c.first_name} {c.status === 'quente' ? '🔥' : ''}</div>
                      <div className="text-[9px] text-slate-500">{c.city} • {c.distance < 10 ? `${(c.distance*1000).toFixed(0)}m` : `${c.distance.toFixed(0)}km`}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Script gerado */}
            {generatedScript && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b p-3 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => setScriptExpanded(!scriptExpanded)} className="flex items-center gap-1 text-xs font-semibold text-indigo-700">
                    {scriptLabels[generatedScript.type] || generatedScript.type}
                    {scriptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(generatedScript.content); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Copiado!'); }}>
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    {client?.phone && (
                      <Button size="sm" onClick={handleShareWhatsApp} className="h-6 px-2 bg-green-500 hover:bg-green-600 text-[10px]">📱 WA</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setGeneratedScript(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {scriptExpanded && (
                  <div className="text-xs text-slate-700 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed bg-white/50 rounded p-2">
                    {generatedScript.content}
                  </div>
                )}
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-slate-700 text-lg">Método NR22</p>
                  <p className="text-xs text-slate-500 mt-1">Fusão: Vendas + Neurociência + IA</p>
                  <div className="mt-4 text-left bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mx-2 text-xs text-indigo-700 space-y-1.5 border border-indigo-100">
                    <p className="font-semibold text-indigo-800 mb-2">🚀 Como usar:</p>
                    <p>🎯 Selecione um cliente → análise automática de 47 variáveis</p>
                    <p>🔢 Numerologia 1-22 (incl. mestres 11/22) aplicada a vendas</p>
                    <p>📊 Score preditivo + probabilidade de conversão em tempo real</p>
                    <p>🤖 Tab Score → análise profunda | Tab Coach → coaching IA</p>
                    <p>📅 "agenda semana Marília" → redireciona para aba Agenda</p>
                    <p>💬 NR22888 TURBO → WhatsApp com 22 IAs em tempo real</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg.content || msg} isUser={msg.role === 'user'} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500">Método NR22 processando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t p-3 shrink-0 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {client?.phone && (
                  <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700 h-7 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" /> WA
                    </Button>
                  </a>
                )}
                <a href={base44.agents.getWhatsAppConnectURL('whatsapp_nr22888_turbo')} target="_blank" rel="noreferrer">
                  <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 h-7 text-xs">
                    🤖 NR22888 TURBO
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={analyzingTranscript} className="border-cyan-300 text-cyan-700 h-7 text-xs">
                  {analyzingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : '📎 .txt'}
                </Button>
                <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              </div>
              {rolePlayMode && (
                <div className="px-2 py-1 bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-700">
                  🎭 Treinamento ativo — você está falando com {client?.first_name}
                </div>
              )}
              <div className="flex gap-2">
                <VoiceRecorderButton onTranscript={t => setInput(t)} size="icon" className="h-10 w-10 shrink-0" />
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                  placeholder={rolePlayMode ? 'Sua abordagem para o cliente...' : 'Pergunte ou comande... (ex: "agenda semana Marília")'}
                  className="flex-1 h-10 rounded-xl text-sm"
                  disabled={loading}
                />
                <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                  className={`h-10 w-10 rounded-xl ${rolePlayMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB SCORE IA ── */}
          <TabsContent value="score" className="overflow-y-auto p-3 space-y-3">
            {!client ? (
              <div className="text-center py-12 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                <p>Selecione um cliente para ver o Score IA</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">📊 Score NR22 — {client.first_name}</h2>
                  <Button size="sm" onClick={() => loadClientScore(client)} disabled={loadingScore} variant="outline" className="h-7 text-xs">
                    {loadingScore ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>

                {/* Score visual */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Score Compra', value: client.purchase_score || 0, color: 'from-indigo-500 to-purple-600', icon: '🎯' },
                    { label: 'Health Score', value: client.health_score || 0, color: 'from-green-500 to-emerald-600', icon: '💚' },
                    { label: 'Engagement', value: client.engagement_score || 0, color: 'from-blue-500 to-cyan-600', icon: '⚡' },
                    { label: 'Conversão IA', value: client.ai_sales_intelligence?.conversion_probability || scoreData?.conversion_probability || 0, color: 'from-orange-500 to-red-500', icon: '🔥' },
                  ].map(({ label, value, color, icon }) => (
                    <Card key={label} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">{icon} {label}</span>
                          <span className="text-lg font-bold text-slate-800">{Math.round(value)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Score preditivo detalhado */}
                {scoreData && (
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-slate-700">🤖 Score Preditivo IA</p>
                      {scoreData.next_best_action && (
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <p className="text-[10px] text-indigo-500 font-medium">PRÓXIMA MELHOR AÇÃO</p>
                          <p className="text-xs text-indigo-800 mt-0.5">{scoreData.next_best_action}</p>
                        </div>
                      )}
                      {scoreData.churn_risk !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Risco de Perda</span>
                          <Badge className={`text-[10px] ${scoreData.churn_risk > 60 ? 'bg-red-500' : scoreData.churn_risk > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                            {Math.round(scoreData.churn_risk)}%
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Dados CRM completos */}
                <Card>
                  <CardContent className="p-3 space-y-1.5">
                    <p className="text-sm font-semibold text-slate-700">📋 Dados CRM (47 variáveis)</p>
                    {[
                      ['Pipeline', client.pipeline_stage],
                      ['Tipo Cliente', client.client_type],
                      ['Volume Exames', client.current_volume],
                      ['Orçamento', client.available_budget ? `R$ ${client.available_budget.toLocaleString()}` : null],
                      ['Equip. Atual', client.current_equipment],
                      ['Interesse', client.equipment_interest],
                      ['Tempo Mercado', client.market_time],
                      ['Prioridade', `${client.attention_priority || '-'}/10`],
                      ['Segmento IA', client.ai_segment],
                      ['LTV 12m', client.ai_sales_intelligence?.ltv_12_months ? `R$ ${client.ai_sales_intelligence.ltv_12_months.toLocaleString()}` : null],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-slate-800 font-medium">{v}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Numerologia */}
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold text-purple-800 mb-2">🔢 Perfil Numerológico</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {client.numerology_number || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-800">{client.behavioral_profile || 'Perfil a analisar'}</p>
                        <p className="text-[10px] text-purple-600">{client.decision_style || 'Estilo a identificar'}</p>
                      </div>
                    </div>
                    {client.approach_tips && (
                      <p className="text-[10px] text-purple-700 bg-white/60 rounded p-2">{client.approach_tips}</p>
                    )}
                    {client.numerology_tip && (
                      <p className="text-[10px] text-indigo-700 bg-indigo-100 rounded p-2 mt-1">💡 {client.numerology_tip}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Dores e objeções */}
                {(client.main_pains?.length > 0 || client.real_objections?.length > 0) && (
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      {client.main_pains?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-500 font-semibold mb-1">😣 DORES IDENTIFICADAS</p>
                          <div className="flex flex-wrap gap-1">
                            {client.main_pains.map((p, i) => <Badge key={i} className="text-[10px] bg-red-100 text-red-700">{p}</Badge>)}
                          </div>
                        </div>
                      )}
                      {client.real_objections?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-500 font-semibold mb-1">🛡️ OBJEÇÕES REAIS</p>
                          <div className="flex flex-wrap gap-1">
                            {client.real_objections.map((o, i) => <Badge key={i} className="text-[10px] bg-orange-100 text-orange-700">{o}</Badge>)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── TAB COACHING IA ── */}
          <TabsContent value="coaching" className="overflow-y-auto p-3 space-y-3">
            {!client ? (
              <div className="text-center py-12 text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-2" />
                <p>Selecione um cliente para coaching personalizado</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">🏆 Coaching NR22 — {client.first_name}</h2>
                  <Button size="sm" onClick={loadCoaching} disabled={loadingCoaching} className="bg-indigo-600 h-8 text-xs">
                    {loadingCoaching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Gerar Coaching
                  </Button>
                </div>

                {!coachingData && !loadingCoaching && (
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-800">Coaching Personalizado com IA</p>
                      <p className="text-xs text-amber-600 mt-1">Diagnóstico + Forças + Armadilhas + Script pronto</p>
                      <Button onClick={loadCoaching} className="mt-3 bg-amber-500 hover:bg-amber-600 text-sm h-8">
                        🚀 Gerar Coaching Agora
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {loadingCoaching && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Método NR22 analisando {client.first_name}...</p>
                    </CardContent>
                  </Card>
                )}

                {coachingData && (
                  <div className="space-y-3">
                    {coachingData.diagnostico && (
                      <Card className="border-indigo-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-bold text-indigo-700 mb-1.5">🎯 DIAGNÓSTICO DO MOMENTO</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{coachingData.diagnostico}</p>
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.forcas?.length > 0 && (
                      <Card className="border-green-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-bold text-green-700 mb-1.5">💪 SUAS FORÇAS AGORA</p>
                          <ul className="space-y-1">
                            {coachingData.forcas.map((f, i) => <li key={i} className="text-xs text-slate-700 flex gap-1.5"><span className="text-green-500">✓</span>{f}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.armadilhas?.length > 0 && (
                      <Card className="border-red-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-bold text-red-700 mb-1.5">⚠️ ARMADILHAS A EVITAR</p>
                          <ul className="space-y-1">
                            {coachingData.armadilhas.map((a, i) => <li key={i} className="text-xs text-slate-700 flex gap-1.5"><span className="text-red-500">✕</span>{a}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.script_contato && (
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-bold text-blue-700">📱 SCRIPT PRÓXIMO CONTATO</p>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(coachingData.script_contato); toast.success('Copiado!'); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap bg-white/70 rounded p-2">{coachingData.script_contato}</p>
                          {client.phone && (
                            <a href={`https://wa.me/${client.phone}?text=${encodeURIComponent(coachingData.script_contato)}`} target="_blank" rel="noreferrer">
                              <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs h-7">
                                📱 Enviar agora no WhatsApp
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.tecnica_psicologica && (
                      <Card className="border-purple-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-bold text-purple-700 mb-1.5">🧠 TÉCNICA PSICOLÓGICA</p>
                          <p className="text-xs text-slate-700">{coachingData.tecnica_psicologica}</p>
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.insight && (
                      <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-3">
                          <p className="text-xs font-bold text-amber-700 mb-1">💡 INSIGHT NR22</p>
                          <p className="text-xs text-amber-800">{coachingData.insight}</p>
                        </CardContent>
                      </Card>
                    )}
                    {coachingData.frase_motivacional && (
                      <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-indigo-200 mb-1">🔥 FORTALECIMENTO MENTAL NR22</p>
                          <p className="text-xs text-white font-medium italic">"{coachingData.frase_motivacional}"</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── TAB IA AUTO (Follow-up + Relatórios + Reativação) ── */}
          <TabsContent value="automacao" className="overflow-y-auto p-3">
            <Tabs defaultValue="followup" className="space-y-3">
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="followup" className="text-[10px]">🔄 Follow-up</TabsTrigger>
                <TabsTrigger value="relatorio" className="text-[10px]">📊 Relatório</TabsTrigger>
                <TabsTrigger value="reativacao" className="text-[10px]">🔔 Reativar</TabsTrigger>
              </TabsList>
              <TabsContent value="followup">
                <AutoFollowUpIA client={client} visits={visits} tasks={tasks} />
              </TabsContent>
              <TabsContent value="relatorio">
                <SalesPerformanceReport />
              </TabsContent>
              <TabsContent value="reativacao">
                <ClientReactivationIA />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ── TAB MAIS ── */}
          <TabsContent value="mais" className="overflow-y-auto p-3">
            <MasterAIAssistant client={client} />
          </TabsContent>

          {/* ── TAB ROTA ── */}
          <TabsContent value="rota" className="overflow-y-auto p-3">
            <SmartSalesRouteOptimizer />
          </TabsContent>

          {/* ── TAB AGENDA ── */}
          <TabsContent value="agenda" className="overflow-y-auto p-3 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-indigo-800 mb-1">💡 Agenda Inteligente NR22</p>
              <ul className="text-xs text-indigo-700 space-y-0.5">
                <li>• Digite cidades (ex: Marília, Bauru) e clique Gerar</li>
                <li>• IA organiza clientes por score, distância e numerologia</li>
                <li>• Visitas criadas automaticamente no CRM</li>
                <li>• Envie direto para seu WhatsApp</li>
              </ul>
            </div>
            <AgendaComandoPanel />
          </TabsContent>

          {/* ── TAB PESQUISA ── */}
          <TabsContent value="pesquisa" className="overflow-y-auto p-3 space-y-3">
            <TGPSVetSearch />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-blue-800 mb-1">🔍 Ferramentas de Prospecção NR22</p>
              <ul className="text-blue-700 space-y-0.5">
                <li>• <strong>GPS:</strong> Busca clínicas por localização em tempo real</li>
                <li>• <strong>CNPJ:</strong> Receita Federal — sócios, endereço, porte</li>
                <li>• Adicione como Lead ou Cliente direto no CRM</li>
              </ul>
            </div>
            <BuscaClinicaCNPJ />
          </TabsContent>

          {/* ── TAB MERCADO ── */}
          <TabsContent value="mercado" className="overflow-y-auto p-3">
            <MarketIntelligenceDashboard />
          </TabsContent>

          {/* ── TAB OPS ── */}
          <TabsContent value="notif" className="overflow-y-auto p-3 space-y-3">
            {/* MasterAI Search */}
            <MasterAIAssistant client={client} />

            {/* Notificações WhatsApp */}
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">📲 Notificações WhatsApp</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { action: 'resumo_diario', label: '🌅 Resumo Diário', desc: 'Clientes, tarefas, visitas' },
                    { action: 'relatorio_pipeline', label: '📊 Pipeline', desc: 'Funil completo' },
                    { action: 'alerta_clientes_frios', label: '❄️ Frios', desc: 'Sem contato 14+ dias' },
                    { action: 'test', label: '✅ Teste', desc: 'Verificar conexão' },
                  ].map(({ action, label, desc }) => (
                    <button key={action} onClick={() => sendWhatsAppNotif(action)} disabled={sendingNotif}
                      className="text-left p-2.5 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50">
                      <div className="font-medium text-xs text-green-800">{label}</div>
                      <div className="text-[10px] text-green-600">{desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diagnóstico */}
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">🔧 Diagnóstico NR22</p>
                <button onClick={runSystemDiagnostic} disabled={testingSystem}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {testingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {testingSystem ? 'Testando 6 sistemas em paralelo...' : '⚡ Diagnóstico Completo (6 IAs)'}
                </button>
                {Object.keys(systemStatus).length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {Object.entries(systemStatus).map(([k, v]) => (
                      <div key={k} className="text-[10px] flex items-center gap-1 bg-slate-50 border rounded px-2 py-1">
                        <span>{v}</span><span className="text-slate-600">{k}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Envio conteúdo */}
            {generatedScript && client?.phone && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-2">📤 Enviar conteúdo gerado</p>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{generatedScript.content.substring(0, 80)}...</p>
                  <Button onClick={handleShareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-xs h-8">
                    <MessageCircle className="w-3 h-3 mr-2" /> Enviar para {client.first_name}
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1 text-center">Mensagens longas divididas automaticamente</p>
                </CardContent>
              </Card>
            )}

            {/* NR22888 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-3">
                <p className="text-sm font-semibold text-green-800 mb-1">🤖 WhatsApp Bot NR22888 TURBO</p>
                <p className="text-xs text-green-600 mb-3">22 IAs + CRM completo + Pesquisa web em tempo real</p>
                <a href={base44.agents.getWhatsAppConnectURL('whatsapp_nr22888_turbo')} target="_blank" rel="noreferrer">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-sm h-9 hover:opacity-90">
                    <MessageCircle className="w-4 h-4 mr-2" /> Conectar NR22888 TURBO
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