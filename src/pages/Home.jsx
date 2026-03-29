import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import SalesDashboardWidget from '@/components/SalesDashboardWidget';
import DaySummary from '@/components/DaySummary';
import { useQuery } from '@tanstack/react-query';
import GPSAutoDiscovery from '@/components/GPSAutoDiscovery';
import CityClinicAnalyzer from '@/components/CityClinicAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, UserPlus, CheckSquare, Calendar, BarChart3, MessageSquare,
  Zap, Route, Settings, Brain, Target, TrendingUp, Award, Package,
  FileText, Search, Phone, Bell, Sparkles, Database, ChevronRight,
  Activity, DollarSign, Star, Map, FileSearch, Bot, Workflow,
  ShoppingCart, BookOpen, Shield, LayoutDashboard, Hash, Megaphone,
  Globe, AreaChart, PieChart, ClipboardList, Loader2, X, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ALL_PAGES = [
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
];

const CATEGORIES = ['Todos', 'CRM', 'WhatsApp', 'IA', 'Vendas', 'Relatórios', 'Produtos', 'Automação', 'Sistema'];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

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

  const filteredPages = ALL_PAGES.filter(p => {
    const matchesSearch = !search || p.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const quickLinks = [
    { page: 'Clients', label: 'Clientes', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { page: 'WhatsAppHub', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { page: 'AIAssistant', label: 'IA Primori', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
    { page: 'TasksUnified', label: 'Tarefas', icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { page: 'ProposalGenerator', label: 'Proposta', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { page: 'SalesFunnel', label: 'Pipeline', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">CRM NR22</h1>
            <p className="text-indigo-200 text-sm">Sistema Completo de Vendas</p>
          </div>
          <Link to={createPageUrl('NotificationSettings')}>
            <div className="relative">
              <Bell className="w-7 h-7 text-white" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {alerts.length}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{clients.length}+</p>
            <p className="text-xs text-indigo-200">Clientes</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs text-indigo-200">Tarefas</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{pendingMessages.length}</p>
            <p className="text-xs text-indigo-200">Msgs Pend.</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{alerts.length}</p>
            <p className="text-xs text-indigo-200">Alertas</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Acesso Rápido WhatsApp Master */}
        <a
          href={base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant')}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Nathan - NR22888</p>
                <p className="text-green-100 text-sm">Assistente Master de Vendas WhatsApp</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </a>

        {/* Resumo do Dia */}
        <div className="mb-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">📋 Resumo do Dia</p>
          <DaySummary />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {quickLinks.map(({ page, label, icon: Icon, color, bg }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}>
                <Icon className={`w-6 h-6 ${color}`} />
                <p className={`text-xs font-semibold text-center ${color}`}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Sales Dashboard */}
        <SalesDashboardWidget />

        {/* GPS Auto-Discovery */}
        <GPSAutoDiscovery />

        {/* Análise de Clínicas por Cidade */}
        <CityClinicAnalyzer />

        {/* Busca de páginas */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar página..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Categorias */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid de todas as páginas */}
        <div className="grid grid-cols-3 gap-3">
          {filteredPages.map(({ page, label, icon: Icon, color, category }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</p>
                <span className="text-[10px] text-slate-400">{category}</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredPages.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhuma página encontrada para "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}