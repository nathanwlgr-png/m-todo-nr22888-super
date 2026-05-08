import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AILimitProtection } from '@/components/AILimitProtection';
import AIUsageIndicator from '@/components/AIUsageIndicator';
import FloatingExportButton from '@/components/FloatingExportButton';
import FloatingPerformanceButton from '@/components/FloatingPerformanceButton';
import EconomicModeToggle from '@/components/EconomicModeToggle';
import DataSecurityMonitor from '@/components/DataSecurityMonitor';
import FloatingCNPJScore from '@/components/FloatingCNPJScore';
import { useOfflineSync } from '@/components/hooks/useOfflineSync';
import { Menu, X, Bell, ChevronRight } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';
import QuickVisitButton from '@/components/QuickVisitButton';
import DarkModeToggle from '@/components/DarkModeToggle';
import OfflineBanner from '@/components/OfflineBanner';
import PhoneSearch from '@/components/PhoneSearch';
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



  return (
    <AILimitProtection>
      <OfflineBanner />
      {/* Fundo global NR2288 — Seamaty Vamos Dominar */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://media.base44.com/images/public/6997e09fd222346f10842c38/7d4aa5894_file_000000005a50720eb9730a2c653680ed.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.07,
        }}
      />
      <div className="flex min-h-screen bg-slate-50/90 dark:bg-slate-900/90" data-layout="root" style={{ position: 'relative', zIndex: 1 }}>
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

          <SidebarMenu currentPageName={currentPageName} />


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
                <PhoneSearch />
                <DarkModeToggle />
                <EconomicModeToggle />
                <Link to={createPageUrl('GlobalSearch')}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="text-slate-600">🔍 Buscar</span>
                    <kbd className="px-2 py-1 text-xs bg-slate-100 rounded">⌘K</kbd>
                  </Button>
                </Link>
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
      <DataSecurityMonitor />
      <FloatingCNPJScore />
      <QuickVisitButton />
    </AILimitProtection>
  );
}