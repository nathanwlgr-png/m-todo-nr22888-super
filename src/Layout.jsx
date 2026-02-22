import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AILimitProtection } from '@/components/AILimitProtection';
import AIUsageIndicator from '@/components/AIUsageIndicator';
import FloatingExportButton from '@/components/FloatingExportButton';
import FloatingPerformanceButton from '@/components/FloatingPerformanceButton';
import { useOfflineSync } from '@/components/hooks/useOfflineSync';
import { 
  Home, Users, UserPlus, Route, Settings, Zap, 
  Calendar, CheckSquare, BarChart3, Menu, X,
  ChevronRight, Bell, MessageSquare, TrendingUp, Award, Target, Sparkles, Package, FileText, Database, Brain
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  // Offline sync hook
  const { pendingCount: offlinePendingCount } = useOfflineSync();

  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Alert?.list().catch(() => []),
  });

  const { data: pendingMessages = [] } = useQuery({
    queryKey: ['pending-messages-count'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingMsgCount = pendingMessages.length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K = Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.href = createPageUrl('GlobalSearch');
      }
      // Ctrl/Cmd + H = Home
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        window.location.href = createPageUrl('Home');
      }
      // Ctrl/Cmd + N = New Client
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        window.location.href = createPageUrl('NewClient');
      }
      // Ctrl/Cmd + T = Tasks
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        window.location.href = createPageUrl('Tasks');
      }
      // Ctrl/Cmd + B = Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Generate breadcrumbs
  useEffect(() => {
    const pageMap = {
      Home: ['Dashboard'],
      Clients: ['Dashboard', 'Clientes'],
      ClientProfile: ['Dashboard', 'Clientes', 'Perfil'],
      NewClient: ['Dashboard', 'Novo Cliente'],
      Leads: ['Dashboard', 'Leads'],
      LeadProfile: ['Dashboard', 'Leads', 'Perfil'],
      Tasks: ['Dashboard', 'Tarefas'],
      RouteOptimizer: ['Dashboard', 'Otimizador de Rotas'],
      Integrations: ['Dashboard', 'Integrações'],
      ScheduledAgenda: ['Dashboard', 'Agenda'],
      NotificationSettings: ['Dashboard', 'Configurações', 'Notificações'],
      InteractiveDashboard: ['Dashboard', 'Analytics'],
    };

    setBreadcrumbs(pageMap[currentPageName] || ['Dashboard']);
  }, [currentPageName]);

  // Restore scroll position
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll_${currentPageName}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }
    
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${currentPageName}`, window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPageName]);

  const menuItems = [
    { icon: Sparkles, label: 'Master NR22888', page: 'MasterControlPanel', tourId: 'master' },
    { icon: Home, label: 'Dashboard', page: 'Home', shortcut: '⌘H', tourId: 'dashboard' },
    { icon: Users, label: 'Clientes', page: 'Clients', tourId: 'clients' },
    { icon: UserPlus, label: 'Leads', page: 'Leads', tourId: 'leads' },
    { icon: CheckSquare, label: 'Tarefas', page: 'TasksUnified', shortcut: '⌘T', tourId: 'tasks' },
    { icon: Bell, label: 'Aprovar Msgs', page: 'MessageApproval', badge: true },
    { icon: MessageSquare, label: 'Histórico Msgs', page: 'MessageHistory' },
    { icon: MessageSquare, label: 'WhatsApp Master', page: 'WhatsAppAgentMaster' },
    { icon: MessageSquare, label: 'WhatsApp Hub', page: 'WhatsAppHub' },
    { icon: Target, label: 'Segmentos', page: 'ClientSegmentation' },
    { icon: TrendingUp, label: 'Sentimento', page: 'SentimentDashboard' },
    { icon: Sparkles, label: 'Conteúdo IA', page: 'AIContentStudio' },
    { icon: Route, label: 'Rotas', page: 'RouteOptimizer', tourId: 'routes' },
    { icon: Calendar, label: 'Agenda', page: 'ScheduledAgenda' },
    { icon: BarChart3, label: 'Analytics', page: 'CustomDashboard', tourId: 'analytics' },
    { icon: MessageSquare, label: 'WhatsApp', page: 'WhatsAppInbox', tourId: 'whatsapp' },
    { icon: Award, label: 'Coaching IA', page: 'SalesCoachingDashboard' },
    { icon: Zap, label: 'Integrações', page: 'Integrations', tourId: 'integrations' },
    { icon: Settings, label: 'Workflows', page: 'WorkflowAutomation' },
    { icon: Package, label: 'Produtos', page: 'ProductManager' },
    { icon: FileText, label: 'Base IA', page: 'AIKnowledgeUploader' },
    { icon: Brain, label: 'Inteligência 360°', page: 'ProactiveIntelligenceDashboard' },
    { icon: Sparkles, label: 'Gerar Proposta', page: 'ProposalGenerator' },
    { icon: FileText, label: 'Relatórios Auto', page: 'ReportsAutomation' },
    { icon: MapPin, label: 'Analytics Geo', page: 'AnalyticsDashboardGeo' },
    { icon: Database, label: 'Offline Analytics', page: 'OfflineAnalytics', badge: true },
    { icon: Settings, label: 'Configurações', page: 'ContactSettings' },
    { icon: Zap, label: 'Automação Msgs', page: 'AutomationSettings' },
    ];

  return (
    <AILimitProtection>
      <div className="flex min-h-screen bg-slate-50" data-layout="root">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full bg-white border-r transition-all duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg" />
              <span className="font-bold text-lg">CRM NR22</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                data-tour={item.tourId}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors ${
                  currentPageName === item.page ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="text-xs text-slate-400">{item.shortcut}</span>
                )}
                {item.page === 'NotificationSettings' && unreadCount > 0 && (
                  <Badge className="bg-red-500">{unreadCount}</Badge>
                )}
                {item.badge && item.page === 'MessageApproval' && pendingMsgCount > 0 && (
                  <Badge className="bg-orange-500 animate-pulse">{pendingMsgCount}</Badge>
                )}
                {item.badge && item.page === 'OfflineAnalytics' && offlinePendingCount > 0 && (
                  <Badge className="bg-blue-500 animate-pulse">{offlinePendingCount}</Badge>
                )}
              </Link>
            ))}
          </nav>


        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} min-h-screen overflow-y-auto`}>
          {/* Top Bar with Breadcrumbs */}
          <header className="sticky top-0 z-30 bg-white border-b px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm">
                 {breadcrumbs.map((crumb, index) => (
                   <span key={index} className="flex items-center gap-2">
                     {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                     <span className={index === breadcrumbs.length - 1 ? 'text-indigo-600 font-semibold' : 'text-slate-600'}>
                       {crumb}
                     </span>
                   </span>
                 ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link to={createPageUrl('NotificationSettings')}>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 pb-24 min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      
      <FloatingExportButton />
      <AIUsageIndicator />
      <FloatingPerformanceButton />
    </AILimitProtection>
  );
}