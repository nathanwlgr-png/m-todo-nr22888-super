import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MENU_GROUPS = [
  {
    label: '⭐ Principais',
    items: [
      { page: 'Home', label: 'Dashboard' },
      { page: 'Clients', label: '👥 Clientes' },
      { page: 'Leads', label: '🎯 Leads' },
      { page: 'TasksUnified', label: '✅ Tarefas' },
      { page: 'ScheduledAgenda', label: '📅 Agenda' },
      { page: 'VisitManager', label: '🗺️ Visitas' },
      { page: 'SalesFunnelKanban', label: '📊 Funil Kanban' },
    ]
  },
  {
    label: '💬 WhatsApp & Msgs',
    items: [
      { page: 'WhatsAppHub', label: 'WhatsApp Hub' },
      { page: 'WhatsAppInbox', label: 'WhatsApp Inbox' },
      { page: 'WhatsAppMasterAssistant', label: '🤖 Assistente Master' },
      { page: 'MessageApproval', label: '🔔 Aprovar Msgs' },
      { page: 'MessageHistory', label: 'Histórico Msgs' },
      { page: 'NegociacoesWhatsApp', label: '💰 Negociações + Cobrança' },
      { page: 'AutomationSettings', label: 'Automação Msgs' },
    ]
  },
  {
    label: '🤖 IA & Análise',
    items: [
      { page: 'AIAssistant', label: 'Assistente IA' },
      { page: 'AIContentStudio', label: 'Conteúdo IA' },
      { page: 'AIKnowledgeUploader', label: 'Base de Conhecimento IA' },
      { page: 'ProactiveIntelligenceDashboard', label: 'Inteligência 360°' },
      { page: 'SalesCoachingDashboard', label: 'Coaching IA' },
      { page: 'NumerologyAnalysis', label: 'Numerologia' },
      { page: 'IntelligenceDashboard', label: '🧠 Dashboard IA' },
    ]
  },
  {
    label: '💼 Vendas & Pipeline',
    items: [
      { page: 'SalesFunnel', label: 'Funil de Vendas' },
      { page: 'ProposalGenerator', label: 'Gerar Proposta' },
      { page: 'PossibleSales', label: 'Possíveis Vendas' },
      { page: 'ClosingForecast', label: 'Previsão Fechamento' },
      { page: 'ClientSegmentation', label: 'Segmentos' },
      { page: 'SentimentDashboard', label: 'Sentimento' },
      { page: 'SalesOptimizationCenter', label: '🚀 Centro de Otimização' },
    ]
  },
  {
    label: '📈 Relatórios & Analytics',
    items: [
      { page: 'CustomDashboard', label: 'Analytics' },
      { page: 'InteractiveDashboard', label: 'Dashboard Interativo' },
      { page: 'ExecutiveSalesDashboard', label: '📊 Dashboard Executivo' },
      { page: 'AdvancedSalesAnalytics', label: 'Sales Analytics' },
      { page: 'SentimentAnalysisDashboard', label: 'Sentimento IA' },
      { page: 'Reports', label: 'Relatórios' },
      { page: 'OfflineAnalytics', label: 'Analytics Offline' },
    ]
  },
  {
    label: '📦 Produtos & Equipamentos',
    items: [
      { page: 'ProductManager', label: 'Produtos' },
      { page: 'EquipmentCatalog', label: 'Catálogo Equipamentos' },
      { page: 'ProposalTemplates', label: 'Templates Proposta' },
      { page: 'MaterialUploadHub', label: '📤 Envio Direto Material' },
    ]
  },
  {
    label: '⚡ Automação & Integrações',
    items: [
      { page: 'FollowUpAutomationModule', label: '🔔 Follow-up Automático' },
      { page: 'WorkflowAutomation', label: 'Workflows' },
      { page: 'Integrations', label: 'Integrações' },
      { page: 'RouteOptimizer', label: 'Rotas' },
      { page: 'EliteVetClientSearch', label: '👑 Busca Elite Vet' },
      { page: 'ClientImportManager', label: 'Importar Clientes' },
    ]
  },
  {
    label: '⚙️ Sistema',
    items: [
      { page: 'SystemManual', label: '📖 Manual do Sistema' },
      { page: 'MasterCRM', label: '⚡ Master CRM NR22' },
      { page: 'MasterControlPanel', label: 'Master NR22888' },
      { page: 'AgentSetup', label: 'Config Agentes' },
      { page: 'ContactSettings', label: 'Configurações' },
      { page: 'NotificationSettings', label: 'Notificações' },
      { page: 'GlobalSearch', label: '🔍 Busca Global' },
    ]
  },
];

export default function SidebarMenu({ currentPageName }) {
  const [openGroups, setOpenGroups] = useState({ '⭐ Principais': true });

  const toggle = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="p-3 space-y-1 overflow-y-auto flex-1">
      {MENU_GROUPS.map((group) => {
        const isOpen = openGroups[group.label];
        const hasActive = group.items.some(i => i.page === currentPageName);

        return (
          <div key={group.label}>
            <button
              onClick={() => toggle(group.label)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100 ${
                hasActive ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600'
              }`}
            >
              <span>{group.label}</span>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isOpen && (
              <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-2">
                {group.items.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-slate-100 ${
                      currentPageName === item.page
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}