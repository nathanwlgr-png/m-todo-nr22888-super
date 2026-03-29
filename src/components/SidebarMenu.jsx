import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight, Home, Users, Target, CheckSquare, Calendar, Map, ShoppingCart, TrendingUp, FileText, BarChart3, MessageSquare, Bot, Bell, History, Zap, Settings, Search, Package, Route, Brain, Star } from 'lucide-react';

const MENU_GROUPS = [
  {
    label: 'Principais',
    icon: Star,
    color: 'text-yellow-500',
    defaultOpen: true,
    items: [
      { page: 'Home', label: 'Dashboard', icon: Home },
      { page: 'Clients', label: 'Clientes', icon: Users },
      { page: 'Leads', label: 'Leads', icon: Target },
      { page: 'TasksUnified', label: 'Tarefas', icon: CheckSquare },
      { page: 'ScheduledAgenda', label: 'Agenda', icon: Calendar },
      { page: 'VisitManager', label: 'Visitas', icon: Map },
      { page: 'VisitRouteManager', label: '🗺️ Rotas Otimizadas', icon: Route },
    ]
  },
  {
    label: 'Vendas',
    icon: TrendingUp,
    color: 'text-emerald-500',
    defaultOpen: false,
    items: [
      { page: 'SalesFunnel', label: 'Funil de Vendas', icon: TrendingUp },
      { page: 'SalesFunnelKanban', label: 'Funil Kanban', icon: BarChart3 },
      { page: 'ProposalGenerator', label: 'Gerar Proposta', icon: FileText },
      { page: 'PossibleSales', label: 'Possíveis Vendas', icon: ShoppingCart },
      { page: 'ClosingForecast', label: 'Previsão Fechamento', icon: Target },
      { page: 'ClientSegmentation', label: 'Segmentos', icon: Users },
      { page: 'SalesOptimizationCenter', label: 'Otimização de Vendas', icon: Zap },
      { page: 'AIAssistant', label: 'Assistente IA Vendas', icon: Brain },
      { page: 'SalesCoachingDashboard', label: 'Coaching IA', icon: Brain },
      { page: 'ProposalTemplates', label: 'Templates Proposta', icon: FileText },
      { page: 'EquipmentCatalog', label: 'Catálogo Equipamentos', icon: Package },
      { page: 'ProductManager', label: 'Produtos', icon: Package },
      { page: 'RouteOptimizer', label: 'Rotas', icon: Route },
      { page: 'EliteVetClientSearch', label: 'Busca Elite Vet', icon: Search },
    ]
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    color: 'text-blue-500',
    defaultOpen: false,
    items: [
      { page: 'InteractiveDashboard', label: 'Dashboard Interativo', icon: BarChart3 },
      { page: 'ExecutiveSalesDashboard', label: 'Dashboard Executivo', icon: BarChart3 },
      { page: 'CustomDashboard', label: 'Analytics Geral', icon: BarChart3 },
      { page: 'AdvancedSalesAnalytics', label: 'Analytics Avançado', icon: TrendingUp },
      { page: 'Reports', label: 'Relatórios', icon: FileText },
      { page: 'SentimentDashboard', label: 'Sentimento', icon: Brain },
      { page: 'SentimentAnalysisDashboard', label: 'Análise de Sentimento', icon: Brain },
      { page: 'ProactiveIntelligenceDashboard', label: 'Inteligência 360°', icon: Brain },
      { page: 'IntelligenceDashboard', label: 'Dashboard IA', icon: Brain },
      { page: 'NumerologyAnalysis', label: 'Numerologia', icon: Star },
      { page: 'OfflineAnalytics', label: 'Analytics Offline', icon: BarChart3 },
    ]
  },
  {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-green-500',
    defaultOpen: false,
    items: [
      { page: 'WhatsAppHub', label: 'WhatsApp Hub', icon: MessageSquare },
      { page: 'WhatsAppInbox', label: 'Inbox', icon: MessageSquare },
      { page: 'WhatsAppMasterAssistant', label: 'Assistente Master', icon: Bot },
      { page: 'NegociacoesWhatsApp', label: 'Negociações + Cobrança', icon: ShoppingCart },
      { page: 'MessageApproval', label: 'Aprovar Mensagens', icon: Bell },
      { page: 'MessageHistory', label: 'Histórico', icon: History },
      { page: 'AutomationSettings', label: 'Automação de Msgs', icon: Zap },
      { page: 'FollowUpAutomationModule', label: 'Follow-up Automático', icon: Zap },
      { page: 'AIContentStudio', label: 'Conteúdo IA', icon: Brain },
    ]
  },
  {
    label: 'Configurações',
    icon: Settings,
    color: 'text-slate-500',
    defaultOpen: false,
    items: [
      { page: 'ContactSettings', label: 'Configurações', icon: Settings },
      { page: 'NotificationSettings', label: 'Notificações', icon: Bell },
      { page: 'Integrations', label: 'Integrações', icon: Zap },
      { page: 'WorkflowAutomation', label: 'Workflows', icon: Zap },
      { page: 'AIKnowledgeUploader', label: 'Base de Conhecimento IA', icon: Brain },
      { page: 'ClientImportManager', label: 'Importar Clientes', icon: Users },
      { page: 'MaterialUploadHub', label: 'Envio de Materiais', icon: FileText },
      { page: 'AgentSetup', label: 'Config. Agentes', icon: Bot },
      { page: 'MasterCRM', label: 'Master CRM NR22', icon: Zap },
      { page: 'MasterControlPanel', label: 'Painel Master NR22888', icon: Settings },
      { page: 'SystemManual', label: 'Manual do Sistema', icon: FileText },
      { page: 'GlobalSearch', label: 'Busca Global', icon: Search },
    ]
  },
];

export default function SidebarMenu({ currentPageName }) {
  const initialOpen = MENU_GROUPS.reduce((acc, g) => {
    acc[g.label] = g.defaultOpen || g.items.some(i => i.page === currentPageName);
    return acc;
  }, {});

  const [openGroups, setOpenGroups] = useState(initialOpen);

  const toggle = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="p-2 space-y-1 overflow-y-auto flex-1">
      {MENU_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = openGroups[group.label];
        const hasActive = group.items.some(i => i.page === currentPageName);

        return (
          <div key={group.label}>
            <button
              onClick={() => toggle(group.label)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                hasActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GroupIcon className={`w-4 h-4 ${hasActive ? 'text-indigo-600' : group.color}`} />
                <span>{group.label}</span>
              </div>
              {isOpen
                ? <ChevronDown className="w-4 h-4 opacity-50" />
                : <ChevronRight className="w-4 h-4 opacity-40" />
              }
            </button>

            {isOpen && (
              <div className="ml-3 mt-0.5 mb-1 border-l-2 border-slate-100 pl-2 space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <ItemIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}