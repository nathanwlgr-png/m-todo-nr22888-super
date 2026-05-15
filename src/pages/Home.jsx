import React, { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAIConsumption } from '@/hooks/useAIConsumption';
import AIConsumptionBar from '@/components/AIConsumptionBar';
import FloatingCreditsButton from '@/components/FloatingCreditsButton';
import CRMManualPDF from '@/components/CRMManualPDF';
import CRMStatsBar from '@/components/CRMStatsBar';
import DaySummary from '@/components/DaySummary';
import PWAStatusChecklist from '@/components/PWAStatusChecklist';
import PWAForceUpdate from '@/components/PWAForceUpdate';
import OfflineSyncButton from '@/components/OfflineSyncButton';
import { Button } from '@/components/ui/button';
import QuickActionsBar from '@/components/QuickActionsBar';
import {
  Users, UserPlus, CheckSquare, Calendar, BarChart3, MessageSquare,
  Zap, Route, Settings, Brain, Target, TrendingUp, Award, Package,
  FileText, Search, Bell, Sparkles, Database, ChevronRight,
  Activity, DollarSign, Map, Bot, Workflow,
  BookOpen, Shield, LayoutDashboard, Hash,
  Globe, AreaChart, PieChart, ClipboardList, X, Eye, AlertTriangle,
  Trash2, RefreshCw, Mic, WifiOff
} from 'lucide-react';

// Componentes pesados — carregam DEPOIS da UI principal aparecer
const SniperDoDia        = lazy(() => import('@/components/SniperDoDia'));
const ComodatoAlertMonitor = lazy(() => import('@/components/ComodatoAlertMonitor'));
const WeeklyHealthReport = lazy(() => import('@/components/WeeklyHealthReport'));
const InsumoPatternAlert = lazy(() => import('@/components/InsumoPatternAlert'));
const ConsolidatedDashboard = lazy(() => import('@/components/ConsolidatedDashboard'));
const SmartRouteMap      = lazy(() => import('@/components/SmartRouteMap'));
const SalesDashboardWidget = lazy(() => import('@/components/SalesDashboardWidget'));
const GPSAutoDiscovery   = lazy(() => import('@/components/GPSAutoDiscovery'));
const CityClinicAnalyzer = lazy(() => import('@/components/CityClinicAnalyzer'));

const HeavyFallback = () => <div className="h-16 rounded-xl animate-pulse mb-3" style={{ background: '#1a1a1a' }} />;


const ALL_PAGES = [
  // Dashboards Executivos
  { page: 'ExecutiveSalesAnalysis', label: '📊 Análise Executiva', icon: BarChart3, color: 'bg-cyan-500', category: 'Executivo' },
  { page: 'SalesFunnelKanban', label: '🎯 Funil Kanban', icon: LayoutDashboard, color: 'bg-orange-500', category: 'Executivo' },
  { page: 'WhatsAppAutomationTriggers', label: '💬 Automação WhatsApp', icon: MessageSquare, color: 'bg-green-600', category: 'Executivo' },

  // CRM Principal
  { page: 'Clients', label: 'Clientes', icon: Users, color: 'bg-indigo-500', category: 'CRM' },
  { page: 'ClientProfile', label: 'Perfil Cliente', icon: Eye, color: 'bg-indigo-400', category: 'CRM' },
  { page: 'NewClient', label: 'Novo Cliente', icon: UserPlus, color: 'bg-green-500', category: 'CRM' },
  { page: 'Leads', label: 'Leads', icon: UserPlus, color: 'bg-blue-500', category: 'CRM' },
  { page: 'LeadProfile', label: 'Perfil Lead', icon: Eye, color: 'bg-blue-400', category: 'CRM' },
  { page: 'LeadsKanban', label: 'Kanban Leads', icon: LayoutDashboard, color: 'bg-blue-600', category: 'CRM' },
  { page: 'LeadsDashboard', label: 'Dashboard Leads', icon: AreaChart, color: 'bg-blue-700', category: 'CRM' },
  { page: 'TasksUnified', label: 'Tarefas', icon: CheckSquare, color: 'bg-purple-500', category: 'CRM' },
  { page: 'ScheduledAgenda', label: 'Agenda', icon: Calendar, color: 'bg-orange-500', category: 'CRM' },
  { page: 'VisitManager', label: 'Visitas', icon: Map, color: 'bg-teal-500', category: 'CRM' },
  
  // WhatsApp & Mensagens
  { page: 'WhatsAppHub', label: 'WhatsApp Hub', icon: MessageSquare, color: 'bg-green-600', category: 'WhatsApp' },
  { page: 'WhatsAppInbox', label: 'WhatsApp Inbox', icon: MessageSquare, color: 'bg-green-500', category: 'WhatsApp' },
  { page: 'WhatsAppMasterAssistant', label: 'Assistente Master', icon: Bot, color: 'bg-green-700', category: 'WhatsApp' },
  { page: 'MessageApproval', label: 'Aprovar Msgs', icon: Bell, color: 'bg-orange-600', category: 'WhatsApp' },
  { page: 'MessageHistory', label: 'Histórico Msgs', icon: FileText, color: 'bg-slate-500', category: 'WhatsApp' },
  { page: 'AutomationSettings', label: 'Automação Msgs', icon: Zap, color: 'bg-yellow-600', category: 'WhatsApp' },
  
  // IA & Análise
  { page: 'AIAssistant', label: 'Assistente IA', icon: Brain, color: 'bg-purple-600', category: 'IA' },
  { page: 'AIContentStudio', label: 'Conteúdo IA', icon: Sparkles, color: 'bg-pink-500', category: 'IA' },
  { page: 'AIKnowledgeUploader', label: 'Base IA', icon: BookOpen, color: 'bg-indigo-600', category: 'IA' },
  { page: 'ProactiveIntelligenceDashboard', label: 'Inteligência 360°', icon: Brain, color: 'bg-violet-600', category: 'IA' },
  { page: 'SalesCoachingDashboard', label: 'Coaching IA', icon: Award, color: 'bg-amber-600', category: 'IA' },
  { page: 'NumerologyAnalysis', label: 'Numerologia', icon: Hash, color: 'bg-rose-500', category: 'IA' },
  { page: 'PredictiveAnalyticsDashboard', label: 'Analytics Preditivo', icon: TrendingUp, color: 'bg-cyan-600', category: 'IA' },
  { page: 'AIFollowUpSequences', label: 'Sequências IA', icon: Zap, color: 'bg-fuchsia-600', category: 'IA' },
  { page: 'MarketIntelligence', label: 'Inteligência Mercado', icon: Globe, color: 'bg-emerald-600', category: 'IA' },
  
  // Vendas & Pipeline
  { page: 'SalesFunnel', label: 'Funil de Vendas', icon: TrendingUp, color: 'bg-orange-500', category: 'Vendas' },
  { page: 'ProposalGenerator', label: 'Gerar Proposta', icon: FileText, color: 'bg-orange-600', category: 'Vendas' },
  { page: 'PossibleSales', label: 'Possíveis Vendas', icon: DollarSign, color: 'bg-green-600', category: 'Vendas' },
  { page: 'ClosingForecast', label: 'Previsão Fechamento', icon: Target, color: 'bg-red-500', category: 'Vendas' },
  { page: 'ClientSegmentation', label: 'Segmentos', icon: Target, color: 'bg-indigo-500', category: 'Vendas' },
  { page: 'SentimentDashboard', label: 'Sentimento', icon: Activity, color: 'bg-pink-600', category: 'Vendas' },
  
  // Relatórios & Analytics
  { page: 'CustomDashboard', label: 'Analytics', icon: BarChart3, color: 'bg-indigo-600', category: 'Relatórios' },
  { page: 'InteractiveDashboard', label: 'Dashboard Interativo', icon: PieChart, color: 'bg-blue-600', category: 'Relatórios' },
  { page: 'SalesAnalyticsDashboard', label: 'Analytics Vendas', icon: AreaChart, color: 'bg-green-600', category: 'Relatórios' },
  { page: 'Reports', label: 'Relatórios', icon: ClipboardList, color: 'bg-slate-600', category: 'Relatórios' },
  { page: 'ReportsAutomation', label: 'Relatórios Auto', icon: FileText, color: 'bg-slate-500', category: 'Relatórios' },
  { page: 'OfflineAnalytics', label: 'Analytics Offline', icon: Database, color: 'bg-slate-700', category: 'Relatórios' },
  
  // Produtos & Equipamentos
  { page: 'ProductManager', label: 'Produtos', icon: Package, color: 'bg-teal-600', category: 'Produtos' },
  { page: 'EquipmentCatalog', label: 'Catálogo Equipamentos', icon: Package, color: 'bg-cyan-600', category: 'Produtos' },
  { page: 'ProposalTemplates', label: 'Templates Proposta', icon: FileText, color: 'bg-amber-500', category: 'Produtos' },
  
  // Automação & Integrações
  { page: 'Integrations', label: 'Integrações', icon: Zap, color: 'bg-yellow-600', category: 'Automação' },
  { page: 'WorkflowAutomation', label: 'Workflows', icon: Workflow, color: 'bg-orange-700', category: 'Automação' },
  { page: 'AutomationManager', label: 'Automação Geral', icon: Settings, color: 'bg-slate-600', category: 'Automação' },
  { page: 'RouteOptimizer', label: 'Rotas', icon: Route, color: 'bg-emerald-500', category: 'Automação' },
  
  // Configurações & Sistema
  { page: 'ContactSettings', label: 'Configurações', icon: Settings, color: 'bg-slate-500', category: 'Sistema' },
  { page: 'NotificationSettings', label: 'Notificações', icon: Bell, color: 'bg-red-500', category: 'Sistema' },
  { page: 'GlobalSearch', label: 'Busca Global', icon: Search, color: 'bg-indigo-500', category: 'Sistema' },
  { page: 'DataHub', label: 'Hub de Dados', icon: Database, color: 'bg-slate-700', category: 'Sistema' },
  { page: 'SystemAudit', label: 'Auditoria', icon: Shield, color: 'bg-red-700', category: 'Sistema' },
  { page: 'ModoInvestigativoSupremo', label: '🕵️ Investigativo', icon: Target, color: 'bg-red-900', category: 'IA' },
  { page: 'PrescriptiveAnalytics', label: '🧠 Analytics Prescritivo', icon: Brain, color: 'bg-violet-700', category: 'IA' },
  { page: 'CompetitiveIntelligenceDashboard', label: '🏥 Radar Competitivo', icon: TrendingUp, color: 'bg-emerald-700', category: 'IA' },
  { page: 'ActiveProspecting', label: '🎯 Prospecção Ativa', icon: Zap, color: 'bg-green-700', category: 'CRM' },
  { page: 'SmartRouteOptimizer', label: '🗺️ Rotas Inteligentes', icon: Route, color: 'bg-orange-700', category: 'Automação' },
  { page: 'SalesCommandCenter', label: '⚡ Command Center', icon: Zap, color: 'bg-orange-600', category: 'Executivo' },
];

const CATEGORIES = ['Todos', 'Executivo', 'CRM', 'WhatsApp', 'IA', 'Vendas', 'Relatórios', 'Produtos', 'Automação', 'Sistema'];

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [dedupeStatus, setDedupeStatus] = useState(null);
  const [dedupeLoading, setDedupeLoading] = useState(false);
  const { consumption } = useAIConsumption();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-count'],
    queryFn: () => base44.entities.Client.list('-updated_date', 5),
    staleTime: 60000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-pending'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }),
    staleTime: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-unread'],
    queryFn: () => base44.entities.Alert?.filter({ read: false }).catch(() => []),
    staleTime: 60000,
  });

  const { data: pendingMessages = [] } = useQuery({
    queryKey: ['pending-msgs'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    staleTime: 30000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['home-visits'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
    staleTime: 60000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['home-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 50),
    staleTime: 60000,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['home-consumables'],
    queryFn: () => base44.entities.ConsumableOrder?.list('-next_reorder_date', 100).catch(() => []),
    staleTime: 60000,
  });

  const hotLeads = Math.max(0, clients.filter(c => (c.purchase_score || 0) > 70).length);
  const noContact7d = Math.max(0, clients.filter(c => {
    if (!c.last_contact_date) return true;
    return (Date.now() - new Date(c.last_contact_date)) / 86400000 > 7;
  }).length);
  const now = new Date();
  const isMaio2026 = now.getMonth() === 4 && now.getFullYear() === 2026; // maio = índice 4

  // Nova meta de maio 2026: 2 equipamentos → 3 + comissão R$15k
  // Meta: maio = histórica (encerrada); junho+ = nova meta 12 equip
  const META_EQUIPAMENTOS = isMaio2026 ? 7 : 12;
  const META_VALOR = isMaio2026 ? 210000 : 360000;

  // Resultado real de maio (fixo, pois o mês encerrou)
  const MAIO_VALOR_REAL = 12188.20; // R$9.188,20 comissão + R$3.000 fixo
  const MAIO_EQUIP_REAL = 2; // vendas registradas em maio

  const salesThisMonth = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && (s.status === 'fechada' || s.status === 'entregue');
  });

  const metaQtd = isMaio2026 ? MAIO_EQUIP_REAL : salesThisMonth.length;
  const metaValor = isMaio2026 ? MAIO_VALOR_REAL : (salesThisMonth.reduce((a, s) => a + (s.sale_value || 0), 0) || 0);
  const metaPct = isMaio2026 ? 100 : Math.min(100, Math.round((salesThisMonth.length / META_EQUIPAMENTOS) * 100));
  const nextVisits = visits
    .filter(v => { const d = new Date(v.scheduled_date); const diff = (d - Date.now()) / 86400000; return diff >= 0 && diff <= 7; })
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  const filteredPages = ALL_PAGES.filter(p => {
    const matchesSearch = !search || p.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleScanDuplicates = async () => {
    setDedupeLoading(true);
    try {
      const res = await base44.functions.invoke('deduplicateAndClean', { mode: 'scan', entity: 'Client' });
      setDedupeStatus(res.data);
    } catch (e) {
      setDedupeStatus({ error: e.message });
    }
    setDedupeLoading(false);
  };

  const handleMergeDuplicates = async () => {
    setDedupeLoading(true);
    try {
      const res = await base44.functions.invoke('deduplicateAndClean', { mode: 'merge', entity: 'Client' });
      setDedupeStatus(res.data);
    } catch (e) {
      setDedupeStatus({ error: e.message });
    }
    setDedupeLoading(false);
  };

  const quickLinks = [
    { page: 'SalesCommandCenter', label: '⚡ Command Center', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-950' },
    { page: 'RankingDoDia', label: '🏆 Ranking do Dia', icon: Target, color: 'text-orange-400', bg: 'bg-orange-950' },
    { page: 'PredictiveSalesAnalyzer', label: '📈 Preditivo', icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { page: 'SalesCallAnalysis', label: '🎙️ Chamadas', icon: Mic, color: 'text-purple-600', bg: 'bg-purple-50' },
    { page: 'ClientSegmentation', label: '👥 Segmentos', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { page: 'WhatsAppHub', label: '💬 WhatsApp', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      {/* ====== HERO BANNER — SEAMATY EM KARANJA ====== */}
      <div className="relative overflow-hidden">
        {/* Imagem banner principal */}
        <img
          src="https://media.base44.com/images/public/6997e09fd222346f10842c38/253b40388_file_00000000151071fbb26c5abe25068f16.png"
          alt="Seamaty em Karanja — Vamos Dominar 2026"
          className="w-full object-cover"
          style={{ maxHeight: 260, objectPosition: 'center top' }}
        />

        {/* Overlay escuro inferior para transição suave */}
        <div className="absolute bottom-0 left-0 right-0 h-20 z-10" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }} />

        {/* Badge sistema ativo + notificação sobrepostos */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,107,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Sistema Ativo • 29 IAs</span>
          </div>
        </div>

        <Link to={createPageUrl('NotificationSettings')} className="absolute top-3 right-3 z-20">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,107,0,0.4)', backdropFilter: 'blur(8px)' }}>
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-black text-white">
                {alerts.length}
              </span>
            )}
          </div>
        </Link>

        {/* Métricas sobrepostas na parte inferior do banner */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: `${clients.length}+`, label: 'Clientes' },
              { val: tasks.length, label: 'Tarefas' },
              { val: pendingMessages.length, label: 'Msgs' },
              { val: alerts.length, label: 'Alertas' },
            ].map(({ val, label }) => (
              <div key={label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,107,0,0.3)', backdropFilter: 'blur(8px)' }}>
                <p className="text-lg font-black text-orange-400 leading-none">{val}</p>
                <p className="text-[9px] text-orange-300 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linha divisória laranja */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #ff6b00, transparent)' }} />

      <div className="px-4 pt-4" style={{ background: '#0a0a0a' }}>

        {/* ⚡ Ações Rápidas — Modo Vendedor */}
        <div className="mb-4">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">⚡ Ações Rápidas</p>
          <QuickActionsBar />
        </div>

        {/* Barra de Consumo de IA */}
        <AIConsumptionBar consumption={consumption} />

        {/* Manual PDF */}
        <CRMManualPDF />

        {/* 🧠 Central IA Master */}
        <Link to={createPageUrl('CentralIAMaster')} className="block mb-3">
          <div className="rounded-2xl p-4 flex items-center justify-between text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #0a0a1a, #1a0050)', border: '1px solid rgba(139,92,246,0.5)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)' }}>
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="font-black text-base text-purple-400">🧠 Central IA Master</p>
                <p className="text-purple-200 text-xs">GPT-4o • Briefing • Ranking • WhatsApp • Marketing</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-purple-400" />
          </div>
        </Link>

        {/* Acesso Rápido WhatsApp Master — AGENTE ÚNICO */}
        <a
          href={base44.agents.getWhatsAppConnectURL('whatsapp_master_agent')}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3"
        >
          <div className="rounded-2xl p-4 flex items-center justify-between text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2a1500)', border: '1px solid rgba(255,107,0,0.4)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.5)' }}>
                <MessageSquare className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="font-black text-base text-orange-400">🔥 NR22888 — Agente Master</p>
                <p className="text-orange-200 text-xs">WhatsApp • 29 IAs • CRM Total • Modo Predador</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-orange-400" />
          </div>
        </a>

        {/* PWA Status + Offline Sync */}
        <div className="mb-4 space-y-2">
          <PWAStatusChecklist />
          <div className="flex items-center gap-2 flex-wrap">
            <PWAForceUpdate />
            <OfflineSyncButton compact />
            <Link to="/OfflineMode">
              <button
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(80,80,80,0.15)', border: '1px solid rgba(150,150,150,0.25)', color: '#aaa' }}
              >
                <WifiOff className="w-3 h-3" />
                Modo offline
              </button>
            </Link>
          </div>
        </div>

        {/* Guia rápido do agente */}
        <div className="rounded-xl p-3 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-xs font-bold text-orange-400 mb-1.5">💬 Comandos do Agente Master:</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-orange-200">
            <span>🔍 <strong>pesquisa [nome]</strong> → clínica</span>
            <span>🏦 <strong>score [CNPJ]</strong> → crédito</span>
            <span>🗺️ <strong>rota hoje</strong> → otimizada</span>
            <span>📊 <strong>relatório</strong> → KPIs</span>
            <span>💡 <strong>sugestões</strong> → 3 ações</span>
            <span>🧹 <strong>limpar dupl.</strong> → CRM limpo</span>
          </div>
          <p className="text-xs text-orange-500 mt-1.5">🐾 Fale normalmente — ele entende contexto!</p>
        </div>

        {/* Stats do CRM — clientes, equipamentos, mês, quentes */}
        <CRMStatsBar />

        {/* 🔴 Monitor de Oportunidades de Comodato — carrega lazy */}
        <Suspense fallback={<HeavyFallback />}>
          <ComodatoAlertMonitor />
        </Suspense>

        {/* Sniper do Dia — carrega lazy */}
        <Suspense fallback={<HeavyFallback />}>
          <SniperDoDia />
        </Suspense>

        {/* Resumo do Dia */}
        <div className="mb-3">
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 px-1">📋 Resumo do Dia</p>
          <DaySummary />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickLinks.map(({ page, label, icon: Icon }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="rounded-xl p-3 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity" style={{ background: '#161616', border: '1px solid rgba(255,107,0,0.15)' }}>
                <Icon className="w-6 h-6 text-orange-400" />
                <p className="text-xs font-bold text-center text-orange-200">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Métricas Dashboard */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,50,50,0.3)' }}>
            <p className="text-xs text-red-400 font-bold">🔥 Leads Quentes</p>
            <p className="text-2xl font-black text-red-400">{hotLeads}</p>
            <p className="text-xs text-red-600">score &gt; 70</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-xs text-orange-400 font-bold">⏰ Sem Contato +7d</p>
            <p className="text-2xl font-black text-orange-400">{noContact7d}</p>
            <p className="text-xs text-orange-600">precisam de follow-up</p>
          </div>
          <div className="col-span-2 rounded-xl p-3" style={{ background: '#111', border: `1px solid ${isMaio2026 ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,0,0.3)'}` }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                {isMaio2026 ? (
                  <>
                    <p className="text-xs font-bold" style={{ color: '#00ff88' }}>✅ MAIO 2026 — ENCERRADO</p>
                    <p className="text-lg font-black text-white">{MAIO_EQUIP_REAL} equipamentos vendidos</p>
                    <p className="text-xs" style={{ color: '#00cc66' }}>💰 R$ {MAIO_VALOR_REAL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (comissão + fixo)</p>
                    <p className="text-[9px] mt-0.5" style={{ color: '#888' }}>Comissão R$9.188,20 · Fixo R$3.000,00</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-orange-400 font-bold">🎯 Meta {now.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</p>
                    <p className="text-lg font-black text-white">{metaQtd}/{META_EQUIPAMENTOS} equipamentos</p>
                    <p className="text-xs text-orange-600">R$ {metaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {META_VALOR.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: '#ff6b00' }}>Nova meta: 12 equip/mês · R$30k/equip</p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: isMaio2026 ? '#00ff88' : '#ff9500' }}>{metaPct}%</p>
                <p className="text-xs" style={{ color: isMaio2026 ? '#00cc66' : '#ff6b00' }}>{isMaio2026 ? 'concluído' : 'atingido'}</p>
              </div>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: '#1a1a1a' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${metaPct}%`, background: isMaio2026 ? 'linear-gradient(90deg, #00c851, #00ff88)' : 'linear-gradient(90deg, #ff6b00, #ffb347)' }} />
            </div>
          </div>
        </div>

        {nextVisits.length > 0 && (
          <div className="rounded-xl p-3 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-xs font-black text-orange-400 uppercase tracking-wider mb-2">📅 Próximas Visitas (7 dias)</p>
            <div className="space-y-2">
              {nextVisits.map(v => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold text-white">{v.client_name}</p>
                    <p className="text-xs text-orange-600">{v.location || 'Sem endereço'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-orange-400">{new Date(v.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                    <p className="text-xs text-orange-600">{new Date(v.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Painel de Deduplicação Inteligente */}
        <div className="rounded-xl p-3 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-black text-orange-400 uppercase tracking-wider">🧹 Limpeza Inteligente do CRM</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleScanDuplicates} disabled={dedupeLoading} className="text-xs h-7">
                {dedupeLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                <span className="ml-1">Escanear</span>
              </Button>
              {dedupeStatus && !dedupeStatus.error && dedupeStatus.mode === 'scan' && dedupeStatus.duplicate_groups > 0 && (
                <Button size="sm" onClick={handleMergeDuplicates} disabled={dedupeLoading} className="text-xs h-7 bg-amber-600 hover:bg-amber-700">
                  <Trash2 className="w-3 h-3" />
                  <span className="ml-1">Mesclar</span>
                </Button>
              )}
            </div>
          </div>
          {dedupeStatus && !dedupeStatus.error && (
            <div className="text-xs text-orange-300">
              {dedupeStatus.mode === 'scan' ? (
                <p>📊 <strong>{dedupeStatus.total_records}</strong> clientes | <strong className="text-red-400">{dedupeStatus.duplicate_groups}</strong> grupos duplicados | <strong className="text-red-400">{dedupeStatus.duplicates_to_remove}</strong> para remover</p>
              ) : (
                <p>✅ <strong>{dedupeStatus.records_merged}</strong> duplicatas removidas em <strong>{dedupeStatus.groups_processed}</strong> grupos!</p>
              )}
            </div>
          )}
          {!dedupeStatus && (
            <p className="text-xs text-orange-600">Clique em "Escanear" para encontrar e mesclar registros duplicados automaticamente.</p>
          )}
        </div>

        <Suspense fallback={<HeavyFallback />}>
          <WeeklyHealthReport clients={clients} />
        </Suspense>

        {/* Alertas de Padrão de Insumo */}
        <Suspense fallback={<HeavyFallback />}>
          <div className="mb-4">
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 px-1">📦 Padrões de Compra de Insumos</p>
            <InsumoPatternAlert clients={clients} consumables={consumables || []} />
          </div>
        </Suspense>

        {/* Dashboard Consolidado com Recharts */}
        <Suspense fallback={<HeavyFallback />}>
          <ConsolidatedDashboard />
        </Suspense>

        {/* Mapa de Rotas Inteligente */}
        <Suspense fallback={<HeavyFallback />}>
          <SmartRouteMap />
        </Suspense>

        {/* Sales Dashboard */}
        <Suspense fallback={<HeavyFallback />}>
          <SalesDashboardWidget />
        </Suspense>

        {/* GPS Auto-Discovery */}
        <Suspense fallback={<HeavyFallback />}>
          <GPSAutoDiscovery />
        </Suspense>

        {/* Análise de Clínicas por Cidade */}
        <Suspense fallback={<HeavyFallback />}>
          <CityClinicAnalyzer />
        </Suspense>

        {/* Busca de páginas */}
        <div className="rounded-2xl mb-4 p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              placeholder="Buscar página..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-lg text-sm text-orange-100 placeholder-orange-700 focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-orange-600" />
              </button>
            )}
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={activeCategory === cat
                  ? { background: '#ff6b00', color: 'white' }
                  : { background: '#1a1a1a', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de todas as páginas */}
        <div className="grid grid-cols-3 gap-2">
          {filteredPages.map(({ page, label, icon: Icon, color, category }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="rounded-xl p-3 flex flex-col items-center gap-2 hover:opacity-75 transition-opacity" style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.12)' }}>
                <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-[11px] font-bold text-orange-200 text-center leading-tight">{label}</p>
                <span className="text-[9px] text-orange-700">{category}</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredPages.length === 0 && (
          <div className="text-center py-12" style={{ color: '#ff6b00', opacity: 0.5 }}>
            <Search className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Nenhuma página encontrada para "{search}"</p>
          </div>
        )}
      </div>
      <FloatingCreditsButton />
    </div>
  );
}