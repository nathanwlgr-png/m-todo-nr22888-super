import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, Loader2, Sparkles, Brain, Target, RotateCcw, TrendingUp,
  MessageCircle, CheckSquare, FileText, Search, Handshake, HelpCircle,
  Navigation, MapPin, X, Copy, Check, ChevronDown, ChevronUp,
  BarChart3, Award, Zap, RefreshCw, Bell, Calendar, Package, Users,
  Phone, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from '@/components/ChatMessage';
import VoiceRecorderButton from '@/components/VoiceRecorderButton';
import QuickActionButton from '@/components/QuickActionButton';
import EditableClientName from '@/components/EditableClientName';
import AlertasTempoReal from '@/components/AlertasTempoReal';
import AgendaComandoPanel from '@/components/AgendaComandoPanel';
import SmartSalesRouteOptimizer from '@/components/SmartSalesRouteOptimizer';
import BuscaClinicaCNPJ from '@/components/BuscaClinicaCNPJ';
import TGPSVetSearch from '@/components/TGPSVetSearch';
import AutoFollowUpIA from '@/components/AutoFollowUpIA';
import SalesPerformanceReport from '@/components/SalesPerformanceReport';
import ClientReactivationIA from '@/components/ClientReactivationIA';
import DemandForecastAI from '@/components/DemandForecastAI';
import WhatsAppFileShare from '@/components/WhatsAppFileShare';
import MarketIntelligenceDashboard from '@/components/MarketIntelligenceDashboard';
import CrossSellUpsellAnalyzer from '@/components/CrossSellUpsellAnalyzer';
import FunnelAnalysisAI from '@/components/FunnelAnalysisAI';
import NR22MasterHub from '@/components/NR22MasterHub';
import { useAILimit } from '@/components/AILimitProtection';
import { getFallbackResponse } from '@/components/LocalAIFallbacks';
import jsPDF from 'jspdf';

// ──────────────────────────────────────────────────────────────────────────────
// SEÇÕES / ABAS PRINCIPAIS
// ──────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chat',      icon: '💬', label: 'Chat NR22' },
  { id: 'score',     icon: '📊', label: 'Score IA' },
  { id: 'coaching',  icon: '🏆', label: 'Coaching' },
  { id: 'agenda',    icon: '📅', label: 'Agenda' },
  { id: 'rota',      icon: '🗺️', label: 'Rota' },
  { id: 'busca',     icon: '🔍', label: 'Busca' },
  { id: 'mercado',   icon: '📈', label: 'Mercado' },
  { id: 'ia-auto',   icon: '🤖', label: 'IA Auto' },
  { id: 'crosssell', icon: '💡', label: 'Cross/Upsell' },
  { id: 'funil',     icon: '⚗️', label: 'Funil' },
  { id: 'master',    icon: '⚡', label: 'Master' },
  { id: 'ops',       icon: '⚙️', label: 'Ops' },
];

const QUICK_ACTIONS = [
  { type: 'presentation', icon: Handshake, label: 'Apresentar',   color: 'bg-green-50 border-green-300 text-green-700' },
  { type: 'insights',     icon: Brain,     label: 'Insights',     color: 'bg-pink-50 border-pink-300 text-pink-700' },
  { type: 'prospecting',  icon: Search,    label: 'Prospecção',   color: 'bg-purple-50 border-purple-300 text-purple-700' },
  { type: 'question',     icon: HelpCircle,label: 'SPIN',         color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
  { type: 'objection',    icon: MessageCircle, label: 'Objeções', color: 'bg-red-50 border-red-300 text-red-700' },
  { type: 'proposal',     icon: FileText,  label: 'Proposta',     color: 'bg-orange-50 border-orange-300 text-orange-700' },
  { type: 'closing',      icon: Target,    label: 'Fechamento',   color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { type: 'needs',        icon: TrendingUp,label: 'Previsão',     color: 'bg-cyan-50 border-cyan-300 text-cyan-700' },
  { type: 'followup',     icon: RotateCcw, label: 'Follow-up',    color: 'bg-amber-50 border-amber-300 text-amber-700' },
  { type: 'suggestTasks', icon: CheckSquare, label: 'Tarefas',    color: 'bg-teal-50 border-teal-300 text-teal-700' },
];

const SCRIPT_LABELS = {
  presentation:'🤝 Apresentação', insights:'🧠 Insights', prospecting:'🔍 Prospecção',
  question:'❓ SPIN', objection:'🛡️ Objeções', proposal:'📄 Proposta',
  closing:'🎯 Fechamento', needs:'📈 Previsão', followup:'🔄 Follow-up', suggestTasks:'✅ Tarefas'
};

const NUM_PERFIS = {
  1:'Líder/Direto',2:'Diplomata',3:'Comunicador',4:'Analítico',5:'Aventureiro',
  6:'Conselheiro',7:'Analista',8:'Executivo/ROI',9:'Humanitário',11:'Visionário',22:'Construtor'
};

// ──────────────────────────────────────────────────────────────────────────────
export default function MasterCRM() {
  const { limitReached, getCachedResponse, setCachedResponse, handleLimitError,
    checkQuotaBeforeCall, trackAICall, quotaExceeded } = useAILimit();

  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);

  const [tab, setTab]             = useState('chat');
  const [clientId, setClientId]   = useState(urlParams.get('id') || null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [quickLoading, setQL]     = useState({});
  const [script, setScript]       = useState(null);
  const [scriptOpen, setScriptOpen] = useState(true);
  const [copied, setCopied]       = useState(false);
  const [rolePlay, setRolePlay]   = useState(false);
  const [nearby, setNearby]       = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [coachingData, setCoaching] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [sysStatus, setSysStatus] = useState({});
  const [testingSys, setTestingSys] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const messagesEnd = useRef(null);
  const fileRef = useRef(null);

  // ── Data fetching (shared, single source of truth) ──────────────────────────
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-updated_date'),
    staleTime: 60000, retry: 1
  });
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      return allClients.find(c => c.id === clientId) || null;
    },
    enabled: !!clientId, staleTime: 30000
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['sales', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const createTasksMut = useMutation({
    mutationFn: (ts) => Promise.all(ts.map(t => base44.entities.Task.create(t))),
    onSuccess: () => { queryClient.invalidateQueries(['tasks', clientId]); toast.success('Tarefas criadas!'); }
  });

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (client && messages.length === 0 && client.first_name) {
      const conv = client.ai_sales_intelligence?.conversion_probability || client.purchase_score || 50;
      setMessages([{ role: 'assistant', content:
        `🔥 **MÉTODO NR22 — ANÁLISE INSTANTÂNEA**\n\n**Cliente:** ${client.first_name}${client.clinic_name ? ` | ${client.clinic_name}` : ''}${client.city ? ` | ${client.city}` : ''}\n\n📊 **Score:** ${client.purchase_score || 0}% | **Status:** ${(client.status || 'morno').toUpperCase()} | **Pipeline:** ${client.pipeline_stage || 'lead'}\n🔢 **Numerologia ${client.numerology_number}:** ${NUM_PERFIS[client.numerology_number] || ''} | **Tom:** ${client.client_tone || 'a identificar'}\n🎯 **Conversão IA:** ${conv}% | **Health:** ${client.health_score || 0}%\n💡 **Lab Needs:** ${client.lab_needs?.join(', ') || 'a mapear'}\n\n🚀 **Próxima Ação:** ${client.ai_next_best_action || client.next_action || 'Analisar necessidades e agendar visita'}\n\n_Use os botões rápidos ou pergunte qualquer coisa!_`
      }]);
    }
  }, [client]);

  // ── CONTEXTO ─────────────────────────────────────────────────────────────────
  const getCtx = (rp = false) => {
    if (!client) return '';
    const hist = `HISTÓRICO: ${visits.length} visitas | ${tasks.filter(t => t.status === 'pendente').length} tarefas pendentes | Dores: ${client.main_pains?.join(', ') || 'N/A'}`;
    if (rp) return `MODO ROLE-PLAY: Você É ${client.first_name}. Perfil: ${client.behavioral_profile}. Tom: ${client.client_tone}. ${hist}. Responda em 1ª pessoa SEMPRE como o cliente.`;
    const intel = client.ai_sales_intelligence || {};
    return `VOCÊ É PRIMORI — MÉTODO NR22 | IA MASTER DE VENDAS.
━━━ CLIENTE ━━━
Nome: ${client.first_name} | Clínica: ${client.clinic_name || 'N/A'} | Cidade: ${client.city || 'N/A'}
Status: ${client.status} | Pipeline: ${client.pipeline_stage || 'lead'} | Score: ${client.purchase_score || 0}% | Health: ${client.health_score || 0}%
Conversão IA: ${intel.conversion_probability || 'N/A'}% | Churn: ${intel.churn_risk || 'N/A'}%
━━━ PERFIL ━━━
Numerologia: ${client.numerology_number} — ${NUM_PERFIS[client.numerology_number] || ''} | Tom: ${client.client_tone || 'N/A'}
Estilo Decisão: ${client.decision_style || 'N/A'} | Dicas: ${client.approach_tips || 'N/A'}
━━━ COMERCIAL ━━━
Equip Atual: ${client.current_equipment || 'N/A'} | Interesse: ${client.equipment_interest || 'N/A'}
Volume: ${client.current_volume || 'N/A'} | Orçamento: R$${client.available_budget || 'N/A'}
Dores: ${client.main_pains?.join(', ') || 'N/A'} | Objeções: ${client.real_objections?.join(', ') || 'N/A'}
━━━ HISTÓRICO ━━━
${hist} | Vendas: ${sales.length}
━━━ PRODUTOS SEAMATY ━━━
VBC-50A (hematológico) | SMT-120VP (bioquímico) | QT3 (bioquímico portátil) | VG1 (gasometria) | VG2 (gasometria+imuno) | Vi1 (imunofluorescência) | VQ1 (PCR)
DIFERENCIAIS: 25M GARANTIA | MANUTENÇÃO VITALÍCIA | BONIFICAÇÃO INSUMOS | ISO 13485:2016
Responda em português, use markdown estruturado com próximos passos concretos.`;
  };

  // ── CHAT ─────────────────────────────────────────────────────────────────────
  const sendMsg = async (msg) => {
    if (!msg.trim()) return;
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setInput(''); setLoading(true);
    try {
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        setMessages(p => [...p, { role: 'assistant', content: '⏱️ Quota atingida. Use os botões rápidos.' }]); return;
      }
      // Detectar intenções
      const low = msg.toLowerCase();
      if ((low.includes('agenda') || low.includes('visita')) && (low.includes('semana') || low.includes('mês'))) {
        setMessages(p => [...p, { role: 'assistant', content: '📅 Abrindo aba Agenda...' }]);
        setTab('agenda'); return;
      }
      trackAICall();
      const hist = messages.slice(-6).map(m => `${m.role === 'user' ? 'Vendedor' : 'Primori'}: ${m.content}`).join('\n\n');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${getCtx(rolePlay)}\n\nHISTÓRICO:\n${hist}\n\n${rolePlay ? 'Vendedor diz' : 'Pergunta'}: ${msg}\n\nResposta COMPLETA em markdown.`
      });
      setMessages(p => [...p, { role: 'assistant', content: res }]);
    } catch (e) {
      const lim = handleLimitError(e);
      setMessages(p => [...p, { role: 'assistant', content: lim ? '⚠️ Limite IA atingido.' : '⚠️ Erro.' }]);
    } finally { setLoading(false); }
  };

  // ── AÇÃO RÁPIDA ───────────────────────────────────────────────────────────────
  const quickAction = async (type) => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setQL(p => ({ ...p, [type]: true })); setScript(null);
    const cacheKey = `${type}_${client.id}_${client.numerology_number}`;
    try {
      const cached = getCachedResponse(cacheKey);
      if (cached) { setScript({ type, content: cached }); setScriptOpen(true); toast.success('📦 Cache'); return; }
      if (quotaExceeded || !checkQuotaBeforeCall() || limitReached) {
        setScript({ type, content: getFallbackResponse(type, client) }); setScriptOpen(true);
        toast.info('📋 Template local'); return;
      }
      trackAICall();
      const ctx = `Cliente: ${client.first_name} | Clínica: ${client.clinic_name || ''} | Cidade: ${client.city || ''} | Numerologia ${client.numerology_number} | Tom: ${client.client_tone || ''} | Score: ${client.purchase_score}% | Status: ${client.status} | Dores: ${client.main_pains?.join(', ') || ''} | Equip: ${client.current_equipment || ''} | Volume: ${client.current_volume || ''} | Orçamento: R$${client.available_budget || ''} | Objeções: ${client.real_objections?.join(', ') || ''} | Visitas: ${visits.length} | Vendas: ${sales.length}`;
      const prompts = {
        presentation: `MÉTODO NR22 — ROTEIRO COMPLETO DE APRESENTAÇÃO\n\n${ctx}\n\n1. Abertura para numerológico ${client.numerology_number}\n2. Script presencial palavra por palavra\n3. Versão WhatsApp pronta\n4. Versão ligação 2min\n5. Diferenciação vs concorrentes\n6. Checklist pré-visita\n7. Frase motivacional Napoleão Hill`,
        insights: `MÉTODO NR22 — ANÁLISE PSICOLÓGICA PROFUNDA\n\n${ctx}\n\n1. Perfil psicológico numerologia ${client.numerology_number}\n2. Motivadores conscientes e inconscientes\n3. Medos e resistências\n4. Canal e horário ideal\n5. Gatilhos Cialdini com script\n6. Estratégia pitch 3 atos\n7. O que NUNCA dizer\n8. Probabilidade conversão + próximos 3 passos`,
        prospecting: `MÉTODO NR22 — PROSPECÇÃO\n\n${ctx}\n\n1. Canal ideal com justificativa\n2. Horário e frequência\n3. Primeira frase abertura\n4. Sequência 5 contatos\n5. Scripts cada canal\n6. Como agir sem resposta`,
        question: `MÉTODO NR22 — SPIN SELLING\n\n${ctx}\n\nS: 3 perguntas situação\nP: 3 perguntas problema\nI: 3 perguntas implicação\nN: 3 perguntas necessidade-solução\nAdaptado perfil ${client.numerology_number}. Gatilho Cialdini após cada resposta.`,
        objection: `MÉTODO NR22 — OBJEÇÕES\n\n${ctx}\n\n1. "Está caro" → resposta\n2. "Preciso pensar" → urgência\n3. "Meu equip ainda funciona" → comparativo\n4. "Já tenho IDEXX/Mindray" → diferenciação\n5. "Não tenho volume" → ROI\n6. Objeção específica: ${client.real_objections?.join(' / ') || 'preço'}\nFrase exata + framework + gatilho. Perfil ${client.numerology_number}.`,
        proposal: `MÉTODO NR22 — PROPOSTA COMERCIAL\n\n${ctx}\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n1. Abertura personalizada\n2. Diagnóstico necessidades\n3. Equipamento recomendado + ROI\n4. Condições pagamento\n5. Bonificação insumos\n6. Diferenciais 25m garantia, manutenção vitalícia, ISO 13485\n7. CTA com urgência\nPronto para WhatsApp.`,
        closing: `MÉTODO NR22 — FECHAMENTO\n\n${ctx}\n\n1. Frase fechamento perfil ${client.numerology_number}\n2. Fechamento por escassez\n3. Fechamento por valor/ROI\n4. Fechamento condicional\n5. Script última resistência\n6. "Deixa eu pensar mais"\n7. CTA final com urgência`,
        followup: `MÉTODO NR22 — FOLLOW-UP\n\n${ctx}\n\nV1 WhatsApp curta (3 linhas):\n[texto]\n\nV2 WhatsApp com ROI:\n[texto + próximo passo]\n\nV3 Email profissional:\n[assunto + corpo]\n\nPerfil ${client.numerology_number}. Referência ao último contato + valor específico + CTA com data.`,
        needs: `MÉTODO NR22 — ANÁLISE PREDITIVA\n\n${ctx}\n\n1. Gap atual vs ideal\n2. Próximo produto mais provável (%)\n3. Dores não exploradas\n4. Janela de oportunidade\n5. Upsell/Cross-sell\n6. LTV 12/24/36 meses\n7. Risco perda concorrente\n8. Gatilho para ativar agora`,
        suggestTasks: `MÉTODO NR22 — PLANO DE AÇÕES\n\n${ctx}\n\n5-7 tarefas estratégicas. Para cada:\n**[N]. [TIPO] — [Título]**\n• Prioridade: ALTA/MÉDIA/BAIXA\n• Prazo: X dias\n• Canal: WhatsApp/Telefone/Email/Visita\n• Script: o que fazer/dizer\n• Objetivo: resultado esperado`,
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: (prompts[type] || type) + '\n\nRESPOSTA COMPLETA. Markdown estruturado.'
      });
      setCachedResponse(cacheKey, res);
      setScript({ type, content: res }); setScriptOpen(true);
      toast.success('✅ Método NR22!');
    } catch (e) {
      const lim = handleLimitError(e);
      if (lim) { setScript({ type, content: getFallbackResponse(type, client) }); }
      else { toast.error('Erro ao gerar'); }
    } finally { setQL(p => ({ ...p, [type]: false })); }
  };

  // ── TAREFAS IA ────────────────────────────────────────────────────────────────
  const autoTasks = async () => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setQL(p => ({ ...p, autoTasks: true }));
    try {
      trackAICall();
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie 4-5 tarefas estratégicas NR22 para ${client.first_name}. Status: ${client.status}. Score: ${client.purchase_score}%. Numerologia: ${client.numerology_number}.`,
        response_json_schema: { type: "object", properties: { tasks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, type: { type: "string" }, priority: { type: "string" }, due_days: { type: "number" } } } } } }
      });
      const ts = res.tasks.map(t => ({
        client_id: clientId, client_name: client.first_name,
        title: t.title, description: t.description, type: t.type, priority: t.priority,
        due_date: new Date(Date.now() + (t.due_days || 3) * 86400000).toISOString().split('T')[0],
        status: 'pendente', auto_created: true
      }));
      await createTasksMut.mutateAsync(ts);
      setMessages(p => [...p, { role: 'assistant', content: `✅ **${ts.length} Tarefas criadas NR22!**\n\n${ts.map((t, i) => `${i+1}. **${t.title}** (${t.type}, ${t.priority}) — ${t.due_date}`).join('\n')}` }]);
    } catch (e) { handleLimitError(e); toast.error('Erro'); }
    finally { setQL(p => ({ ...p, autoTasks: false })); }
  };

  // ── GPS ───────────────────────────────────────────────────────────────────────
  const buscarGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS não disponível'); return; }
    setGpsLoading(true); setNearby([]);
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: la, longitude: lo } = pos.coords;
      const coords = { 'marília': [-22.2139,-49.9461], 'bauru': [-22.3246,-49.0653], 'botucatu': [-22.8834,-48.4446], 'lins': [-21.6775,-49.7445], 'ourinhos': [-22.9788,-49.8696], 'assis': [-22.6622,-50.4124], 'tupã': [-21.9347,-50.5127], 'jaú': [-22.2966,-48.5580] };
      const withDist = allClients.filter(c => c.city).map(c => {
        const coord = coords[(c.city || '').toLowerCase().trim()];
        if (!coord) return { ...c, distance: 9999 };
        const dLat = (coord[0]-la)*Math.PI/180, dLng = (coord[1]-lo)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(la*Math.PI/180)*Math.cos(coord[0]*Math.PI/180)*Math.sin(dLng/2)**2;
        return { ...c, distance: 6371*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) };
      }).filter(c => c.distance < 150).sort((a,b) => (a.distance-(a.purchase_score||0)*0.5)-(b.distance-(b.purchase_score||0)*0.5)).slice(0,10);
      setNearby(withDist); setGpsLoading(false);
      if (withDist.length) toast.success(`${withDist.length} clientes próximos!`);
      else toast.info('Nenhum cliente até 150km');
    }, () => { setGpsLoading(false); toast.error('Permissão GPS negada'); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  // ── WHATSAPP ──────────────────────────────────────────────────────────────────
  const shareWA = async () => {
    if (!script || !client?.phone) return;
    try {
      const res = await base44.functions.invoke('whatsappSendChunked', { message: script.content, phone: client.phone, client_id: client.id });
      const chunks = res.data?.chunks || [];
      if (chunks.length === 1) window.open(chunks[0].whatsapp_url, '_blank');
      else chunks.forEach((c, i) => setTimeout(() => window.open(c.whatsapp_url, '_blank'), i * 1500));
      toast.success('WhatsApp aberto!');
    } catch { window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(script.content.substring(0,3800))}`, '_blank'); }
  };

  const sendNotif = async (action) => {
    setSendingNotif(true);
    try {
      const res = await base44.functions.invoke('whatsappMasterNotificacao', { action, phone: '5514991676428' });
      if (res.data?.whatsapp_link) { window.open(res.data.whatsapp_link, '_blank'); toast.success('WhatsApp aberto!'); }
    } catch (e) { toast.error(e.message); } finally { setSendingNotif(false); }
  };

  const runDiag = async () => {
    setTestingSys(true);
    const tests = [
      { name: 'whatsappBot', label: 'Bot WhatsApp', payload: { message: 'ajuda' } },
      { name: 'whatsappMasterNotificacao', label: 'Notificações', payload: { action: 'test', phone: '5514991676428' } },
      { name: 'agendaInteligente', label: 'Agenda IA', payload: { tipo: 'semana', cidades: [], criar_visitas: false } },
      { name: 'whatsappSendChunked', label: 'Envio Chunked', payload: { message: 'Teste', phone: '5514991676428' } },
      { name: 'predictiveLeadScoring', label: 'Score Preditivo', payload: { action: 'get_priorities' } },
      { name: 'marketIntelligenceMonitor', label: 'Intel Mercado', payload: { action: 'market_scan', region: 'São Paulo' } },
      { name: 'processAutoFollowUps', label: 'Auto Follow-up', payload: {} },
      { name: 'proactiveAIAutomation', label: 'Proactive AI', payload: { action: 'run_all' } },
    ];
    const results = {};
    await Promise.allSettled(tests.map(async t => {
      try { const r = await base44.functions.invoke(t.name, t.payload); results[t.label] = r.data?.success !== false ? '✅' : '⚠️'; }
      catch { results[t.label] = '❌'; }
    }));
    setSysStatus(results); setTestingSys(false);
    const ok = Object.values(results).filter(v => v === '✅').length;
    const total = Object.keys(results).length;
    toast.success(`Diagnóstico: ${ok}/${total} sistemas OK`);
    setTab('ops');
  };

  const exportPDF = () => {
    if (!messages.length) { toast.error('Sem mensagens'); return; }
    const doc = new jsPDF(); let y = 15;
    const line = (t, size = 10, bold = false) => {
      doc.setFontSize(size); doc.setFont(undefined, bold ? 'bold' : 'normal');
      doc.splitTextToSize(t, 180).forEach(l => { if (y > 280) { doc.addPage(); y = 15; } doc.text(l, 15, y); y += size * 0.5; }); y += 2;
    };
    line(`NR22 — ${client?.first_name || 'IA'} — ${new Date().toLocaleString('pt-BR')}`, 14, true);
    messages.forEach(m => { line(m.role === 'user' ? 'VOCÊ:' : 'PRIMORI:', 11, true); line(m.content, 10); y += 3; });
    doc.save(`NR22_${client?.first_name || 'IA'}_${Date.now()}.pdf`);
    toast.success('PDF exportado!');
  };

  const changeClient = (id) => {
    setClientId(id === 'none' ? null : id);
    setMessages([]); setRolePlay(false); setScript(null); setScoreData(null); setCoaching(null);
  };

  const statusColor = client?.status === 'quente' ? 'bg-red-500' : client?.status === 'morno' ? 'bg-yellow-400 text-black' : 'bg-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-4 py-3 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Master CRM NR22
              <Badge className="text-[9px] bg-yellow-400 text-black ml-1 h-4 px-1.5">TURBO</Badge>
            </h1>
            <p className="text-indigo-200 text-[9px]">Todas as IAs unificadas · 47 variáveis · 22 sistemas ativos</p>
          </div>
          <AlertasTempoReal />
          <Button size="sm" variant="ghost" onClick={exportPDF} className="text-white hover:bg-white/20 h-7 w-7 p-0">
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={() => { if (!clientId) return; setRolePlay(!rolePlay); setMessages([{ role: 'assistant', content: !rolePlay ? `🎭 **MODO TREINAMENTO** — Sou ${client?.first_name}. ${client?.behavioral_profile}. Como vai me abordar?` : 'Modo Treinamento desativado.' }]); }}
            className={`h-7 text-[10px] px-2 ${rolePlay ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}`} disabled={!clientId}>
            🎭 {rolePlay ? 'Treinando' : 'Treinar'}
          </Button>
          <a href={base44.agents.getWhatsAppConnectURL('whatsapp_nr22888_turbo')} target="_blank" rel="noreferrer">
            <Button size="sm" className="bg-green-500 hover:bg-green-400 text-white h-7 text-[10px] px-2 animate-pulse">
              🤖 NR22888
            </Button>
          </a>
          <Button size="sm" onClick={runDiag} disabled={testingSys} className="bg-white/20 hover:bg-white/30 text-white h-7 text-[10px] px-2">
            {testingSys ? <Loader2 className="w-3 h-3 animate-spin" /> : '⚡ Run'}
          </Button>
        </div>

        {/* Seletor de cliente */}
        <Select value={clientId || ''} onValueChange={changeClient}>
          <SelectTrigger className="h-9 bg-white/15 border-white/30 text-white text-sm">
            <SelectValue placeholder="🔍 Selecione um cliente para análise NR22..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sem cliente específico —</SelectItem>
            {allClients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.status === 'quente' ? '🔥 ' : c.status === 'morno' ? '🌡️ ' : '❄️ '}
                {c.first_name}{c.clinic_name ? ` · ${c.clinic_name}` : ''}{c.city ? ` · ${c.city}` : ''}{c.purchase_score ? ` · ${c.purchase_score}%` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {client && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <EditableClientName client={client} onUpdate={() => queryClient.invalidateQueries(['client', clientId])} />
            <Badge className={`text-[9px] h-4 ${statusColor}`}>{client.status}</Badge>
            <Badge className="bg-white/20 text-white text-[9px] h-4">📊 {client.purchase_score || 0}%</Badge>
            {client.pipeline_stage && <Badge className="bg-indigo-400 text-[9px] h-4">{client.pipeline_stage}</Badge>}
            {client.numerology_number && <Badge className="bg-purple-400 text-[9px] h-4">🔢 {client.numerology_number}</Badge>}
            {client.phone && <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer"><Badge className="bg-green-500 text-[9px] h-4 cursor-pointer">📱</Badge></a>}
          </div>
        )}
      </div>

      {/* ═══ TABS ═══ */}
      <div className="bg-white border-b sticky top-[108px] z-10 overflow-x-auto">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 text-[10px] font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Ações rápidas */}
            <div className="bg-white border-b px-3 py-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_ACTIONS.map(({ type, icon: Icon, label, color }) => (
                  <QuickActionButton key={type} icon={Icon} label={label} onClick={() => quickAction(type)} loading={quickLoading[type]} className={`shrink-0 ${color} text-[10px]`} />
                ))}
                <QuickActionButton icon={Zap} label="🤖 Tarefas IA" onClick={autoTasks} loading={quickLoading.autoTasks} className="shrink-0 bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700 text-[10px]" />
                <button onClick={buscarGPS} disabled={gpsLoading}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-medium bg-blue-50 border-blue-300 text-blue-700 disabled:opacity-50">
                  {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} GPS
                </button>
              </div>
            </div>

            {/* GPS nearby */}
            {nearby.length > 0 && (
              <div className="bg-blue-50 border-b px-3 py-2 shrink-0">
                <p className="text-[10px] font-semibold text-blue-800 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {nearby.length} clientes próximos
                  <button onClick={() => setNearby([])} className="ml-auto"><X className="w-3 h-3 text-blue-400" /></button>
                </p>
                <div className="flex gap-2 overflow-x-auto">
                  {nearby.map(c => (
                    <button key={c.id} onClick={() => { setClientId(c.id); setMessages([]); setNearby([]); }}
                      className="shrink-0 text-left bg-white border border-blue-200 rounded-lg px-2 py-1.5 hover:bg-blue-100">
                      <div className="text-[10px] font-medium">{c.first_name} {c.status === 'quente' ? '🔥' : ''}</div>
                      <div className="text-[9px] text-slate-500">{c.city} · {c.distance.toFixed(0)}km</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Script gerado */}
            {script && (
              <div className="bg-indigo-50 border-b p-3 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => setScriptOpen(!scriptOpen)} className="flex items-center gap-1 text-xs font-semibold text-indigo-700">
                    {SCRIPT_LABELS[script.type] || script.type}
                    {scriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(script.content); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Copiado!'); }}>
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    {client?.phone && <Button size="sm" onClick={shareWA} className="h-6 px-2 bg-green-500 hover:bg-green-600 text-[10px]">📱 WA</Button>}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setScript(null)}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
                {scriptOpen && <div className="text-xs text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap bg-white/50 rounded p-2">{script.content}</div>}
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-slate-700 text-lg">Master CRM NR22</p>
                  <p className="text-xs text-slate-500 mt-1">Vendas + Neurociência + 22 IAs unificadas</p>
                  <div className="mt-4 text-left bg-indigo-50 rounded-xl p-4 mx-2 text-xs text-indigo-700 space-y-1.5 border border-indigo-100">
                    <p className="font-semibold mb-2">🚀 Use as abas no topo para acessar tudo:</p>
                    {TABS.map(t => <p key={t.id}>• <strong>{t.icon} {t.label}</strong></p>)}
                  </div>
                </div>
              )}
              {messages.map((m, i) => <ChatMessage key={i} message={m.content || m} isUser={m.role === 'user'} />)}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500">Método NR22 processando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="bg-white border-t p-3 shrink-0 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {client?.phone && <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="border-green-300 text-green-700 h-7 text-xs"><MessageCircle className="w-3 h-3 mr-1" />WA</Button></a>}
                <a href={base44.agents.getWhatsAppConnectURL('whatsapp_nr22888_turbo')} target="_blank" rel="noreferrer">
                  <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 h-7 text-xs">🤖 NR22888 TURBO</Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="border-cyan-300 text-cyan-700 h-7 text-xs">📎 .txt</Button>
                <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setMessages(p => [...p, { role: 'user', content: `[TRANSCRIÇÃO]\n${ev.target?.result}` }]); sendMsg(`Analise esta transcrição de ${client?.first_name || 'cliente'}: ${ev.target?.result}`); }; r.readAsText(f); }} />
              </div>
              {rolePlay && <div className="px-2 py-1 bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-700">🎭 Treinamento ativo — falando com {client?.first_name}</div>}
              <div className="flex gap-2">
                <VoiceRecorderButton onTranscript={t => setInput(t)} size="icon" className="h-10 w-10 shrink-0" />
                <Input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && sendMsg(input)}
                  placeholder="Pergunte ou comande... (ex: 'agenda semana Marília')"
                  className="flex-1 h-10 rounded-xl text-sm" disabled={loading} />
                <Button onClick={() => sendMsg(input)} disabled={loading || !input.trim()}
                  className={`h-10 w-10 rounded-xl ${rolePlay ? 'bg-yellow-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCORE IA ── */}
        {tab === 'score' && (
          <div className="p-3 space-y-3">
            {!client ? (
              <div className="text-center py-16 text-slate-400"><BarChart3 className="w-10 h-10 mx-auto mb-2" /><p>Selecione um cliente</p></div>
            ) : (
              <>
                <h2 className="font-bold text-slate-800">📊 Score NR22 — {client.first_name}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Score Compra', value: client.purchase_score || 0, color: 'from-indigo-500 to-purple-600', icon: '🎯' },
                    { label: 'Health Score', value: client.health_score || 0, color: 'from-green-500 to-emerald-600', icon: '💚' },
                    { label: 'Engagement', value: client.engagement_score || 0, color: 'from-blue-500 to-cyan-600', icon: '⚡' },
                    { label: 'Conversão IA', value: client.ai_sales_intelligence?.conversion_probability || 0, color: 'from-orange-500 to-red-500', icon: '🔥' },
                  ].map(({ label, value, color, icon }) => (
                    <Card key={label}><CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500">{icon} {label}</span><span className="text-lg font-bold">{Math.round(value)}%</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${Math.min(value,100)}%` }} /></div>
                    </CardContent></Card>
                  ))}
                </div>
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold text-purple-800 mb-2">🔢 Perfil Numerológico</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{client.numerology_number || '?'}</div>
                      <div>
                        <p className="text-xs font-medium text-purple-800">{client.behavioral_profile || 'Perfil a analisar'}</p>
                        <p className="text-[10px] text-purple-600">{client.decision_style || 'Estilo a identificar'}</p>
                      </div>
                    </div>
                    {client.approach_tips && <p className="text-[10px] text-purple-700 bg-white/60 rounded p-2">{client.approach_tips}</p>}
                    {client.numerology_tip && <p className="text-[10px] text-indigo-700 bg-indigo-100 rounded p-2 mt-1">💡 {client.numerology_tip}</p>}
                  </CardContent>
                </Card>
                <Card><CardContent className="p-3 space-y-1.5">
                  <p className="text-sm font-semibold">📋 Dados CRM</p>
                  {[
                    ['Pipeline', client.pipeline_stage], ['Tipo', client.client_type], ['Volume', client.current_volume],
                    ['Orçamento', client.available_budget ? `R$ ${client.available_budget.toLocaleString()}` : null],
                    ['Equip. Atual', client.current_equipment], ['Interesse', client.equipment_interest],
                    ['Segmento IA', client.ai_segment], ['LTV 12m', client.ai_sales_intelligence?.ltv_12_months ? `R$ ${client.ai_sales_intelligence.ltv_12_months.toLocaleString()}` : null],
                  ].filter(([,v]) => v).map(([k,v]) => (
                    <div key={k} className="flex justify-between text-xs py-0.5 border-b border-slate-50">
                      <span className="text-slate-500">{k}</span><span className="font-medium">{v}</span>
                    </div>
                  ))}
                </CardContent></Card>
                {(client.main_pains?.length > 0 || client.real_objections?.length > 0) && (
                  <Card><CardContent className="p-3 space-y-2">
                    {client.main_pains?.length > 0 && <div><p className="text-[10px] font-semibold text-slate-500 mb-1">😣 DORES</p><div className="flex flex-wrap gap-1">{client.main_pains.map((p,i) => <Badge key={i} className="text-[10px] bg-red-100 text-red-700">{p}</Badge>)}</div></div>}
                    {client.real_objections?.length > 0 && <div><p className="text-[10px] font-semibold text-slate-500 mb-1">🛡️ OBJEÇÕES</p><div className="flex flex-wrap gap-1">{client.real_objections.map((o,i) => <Badge key={i} className="text-[10px] bg-orange-100 text-orange-700">{o}</Badge>)}</div></div>}
                  </CardContent></Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── COACHING ── */}
        {tab === 'coaching' && (
          <div className="p-3 space-y-3">
            {!client ? (
              <div className="text-center py-16 text-slate-400"><Award className="w-10 h-10 mx-auto mb-2" /><p>Selecione um cliente</p></div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">🏆 Coaching NR22 — {client.first_name}</h2>
                  <Button size="sm" onClick={async () => {
                    setLoadingCoach(true);
                    try {
                      trackAICall();
                      const res = await base44.integrations.Core.InvokeLLM({
                        prompt: `COACHING NR22 para ${client.first_name} | Numerologia: ${client.numerology_number} | Status: ${client.status} | Score: ${client.purchase_score}% | Visitas: ${visits.length} | Dores: ${client.main_pains?.join(', ')} | Objeções: ${client.real_objections?.join(', ')}\n\n1. Diagnóstico 2. Forças 3. Armadilhas 4. Script WhatsApp 5. Técnica psicológica 6. Insight 7. Frase motivacional`,
                        response_json_schema: { type: "object", properties: { diagnostico: { type: "string" }, forcas: { type: "array", items: { type: "string" } }, armadilhas: { type: "array", items: { type: "string" } }, script_contato: { type: "string" }, tecnica_psicologica: { type: "string" }, insight: { type: "string" }, frase_motivacional: { type: "string" } } }
                      });
                      setCoaching(res);
                    } catch { toast.error('Erro'); } finally { setLoadingCoach(false); }
                  }} disabled={loadingCoach} className="bg-indigo-600 h-8 text-xs">
                    {loadingCoach ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />} Gerar Coaching
                  </Button>
                </div>
                {!coachingData && !loadingCoach && (
                  <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-800">Coaching IA Personalizado NR22</p>
                    <p className="text-xs text-amber-600 mt-1">Diagnóstico + Forças + Script pronto para usar</p>
                  </CardContent></Card>
                )}
                {loadingCoach && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" /><p className="text-sm text-slate-500">Analisando {client.first_name}...</p></div>}
                {coachingData && (
                  <div className="space-y-3">
                    {coachingData.diagnostico && <Card className="border-indigo-200"><CardContent className="p-3"><p className="text-xs font-bold text-indigo-700 mb-1.5">🎯 DIAGNÓSTICO</p><p className="text-xs text-slate-700">{coachingData.diagnostico}</p></CardContent></Card>}
                    {coachingData.forcas?.length > 0 && <Card className="border-green-200"><CardContent className="p-3"><p className="text-xs font-bold text-green-700 mb-1.5">💪 FORÇAS</p><ul className="space-y-1">{coachingData.forcas.map((f,i) => <li key={i} className="text-xs flex gap-1.5"><span className="text-green-500">✓</span>{f}</li>)}</ul></CardContent></Card>}
                    {coachingData.armadilhas?.length > 0 && <Card className="border-red-200"><CardContent className="p-3"><p className="text-xs font-bold text-red-700 mb-1.5">⚠️ ARMADILHAS</p><ul className="space-y-1">{coachingData.armadilhas.map((a,i) => <li key={i} className="text-xs flex gap-1.5"><span className="text-red-500">✕</span>{a}</li>)}</ul></CardContent></Card>}
                    {coachingData.script_contato && <Card className="border-blue-200 bg-blue-50"><CardContent className="p-3">
                      <div className="flex justify-between mb-1.5"><p className="text-xs font-bold text-blue-700">📱 SCRIPT CONTATO</p>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(coachingData.script_contato); toast.success('Copiado!'); }}><Copy className="w-3 h-3" /></Button>
                      </div>
                      <p className="text-xs text-blue-800 whitespace-pre-wrap bg-white/70 rounded p-2">{coachingData.script_contato}</p>
                      {client.phone && <a href={`https://wa.me/${client.phone}?text=${encodeURIComponent(coachingData.script_contato)}`} target="_blank" rel="noreferrer"><Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs h-7">📱 Enviar no WhatsApp</Button></a>}
                    </CardContent></Card>}
                    {coachingData.insight && <Card className="border-amber-200 bg-amber-50"><CardContent className="p-3"><p className="text-xs font-bold text-amber-700 mb-1">💡 INSIGHT NR22</p><p className="text-xs text-amber-800">{coachingData.insight}</p></CardContent></Card>}
                    {coachingData.frase_motivacional && <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0"><CardContent className="p-3"><p className="text-[10px] text-indigo-200 mb-1">🔥 FORTALECIMENTO</p><p className="text-xs text-white italic">"{coachingData.frase_motivacional}"</p></CardContent></Card>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── AGENDA ── */}
        {tab === 'agenda' && (
          <div className="p-3 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700">
              <p className="font-semibold mb-1">💡 Agenda Inteligente NR22</p>
              <p>IA organiza clientes por score, distância e numerologia. Visitas criadas automaticamente.</p>
            </div>
            <AgendaComandoPanel />
          </div>
        )}

        {/* ── ROTA ── */}
        {tab === 'rota' && <div className="p-3"><SmartSalesRouteOptimizer /></div>}

        {/* ── BUSCA ── */}
        {tab === 'busca' && (
          <div className="p-3 space-y-3">
            <TGPSVetSearch />
            <BuscaClinicaCNPJ />
          </div>
        )}

        {/* ── MERCADO ── */}
        {tab === 'mercado' && (
          <div className="p-3 space-y-4">
            <DemandForecastAI />
            <MarketIntelligenceDashboard />
          </div>
        )}

        {/* ── IA AUTO ── */}
        {tab === 'ia-auto' && (
          <div className="p-3 space-y-4">
            <AutoFollowUpIA client={client} visits={visits} tasks={tasks} />
            <SalesPerformanceReport />
            <ClientReactivationIA />
          </div>
        )}

        {/* ── CROSS/UPSELL ── */}
        {tab === 'crosssell' && (
          <div className="p-3 space-y-3">
            <Card><CardContent className="p-4 space-y-3">
              <Select value={clientId || ''} onValueChange={changeClient}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                <SelectContent>
                  {allClients.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name}{c.clinic_name ? ` (${c.clinic_name})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              {clientId && <CrossSellUpsellAnalyzer clientId={clientId} />}
            </CardContent></Card>
          </div>
        )}

        {/* ── FUNIL ── */}
        {tab === 'funil' && <div className="p-3"><FunnelAnalysisAI /></div>}

        {/* ── MASTER ── */}
        {tab === 'master' && <div className="p-3"><NR22MasterHub /></div>}

        {/* ── OPS ── */}
        {tab === 'ops' && (
          <div className="p-3 space-y-3">
            <Card><CardContent className="p-3">
              <p className="text-sm font-semibold mb-2">📲 Notificações WhatsApp</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { action: 'resumo_diario', label: '🌅 Resumo Diário' },
                  { action: 'relatorio_pipeline', label: '📊 Pipeline' },
                  { action: 'alerta_clientes_frios', label: '❄️ Clientes Frios' },
                  { action: 'test', label: '✅ Teste Conexão' },
                ].map(({ action, label }) => (
                  <button key={action} onClick={() => sendNotif(action)} disabled={sendingNotif}
                    className="text-left p-2.5 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50">
                    <div className="font-medium text-xs text-green-800">{label}</div>
                  </button>
                ))}
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-3">
              <p className="text-sm font-semibold mb-2">🔧 Diagnóstico do Sistema</p>
              <button onClick={runDiag} disabled={testingSys}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">
                {testingSys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {testingSys ? 'Testando 6 sistemas...' : '⚡ Diagnóstico Completo (6 IAs)'}
              </button>
              {Object.keys(sysStatus).length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {Object.entries(sysStatus).map(([k, v]) => (
                    <div key={k} className="text-[10px] flex items-center gap-1 bg-slate-50 border rounded px-2 py-1">
                      <span>{v}</span><span className="text-slate-600">{k}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>

            <Card className="bg-green-50 border-green-200"><CardContent className="p-3">
              <p className="text-sm font-semibold text-green-800 mb-2">🤖 WhatsApp Bot NR22888 TURBO</p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mb-3">
                <p className="text-xs font-bold text-orange-700 mb-1">⚠️ Problema de conexão?</p>
                <p className="text-[10px] text-orange-700 mb-1.5">1. Abra WhatsApp com <strong>14 99167-6428</strong> → envie <code className="bg-orange-100 px-1 rounded">/disconnect</code></p>
                <a href="https://wa.me/14991676428?text=/disconnect" target="_blank" rel="noreferrer"
                  className="block text-center bg-orange-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5">
                  📲 Enviar /disconnect
                </a>
              </div>
              <a href={base44.agents.getWhatsAppConnectURL('whatsapp_nr22888_turbo')} target="_blank" rel="noreferrer">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 h-9 text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" /> Conectar NR22888 TURBO
                </Button>
              </a>
            </CardContent></Card>

            {script && client?.phone && (
              <Card><CardContent className="p-3">
                <p className="text-sm font-medium mb-2">📤 Enviar conteúdo gerado para {client.first_name}</p>
                <Button onClick={shareWA} className="w-full bg-green-600 hover:bg-green-700 text-xs h-8">
                  <MessageCircle className="w-3 h-3 mr-2" /> Enviar via WhatsApp
                </Button>
              </CardContent></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}