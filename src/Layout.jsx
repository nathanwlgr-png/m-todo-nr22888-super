import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Bell, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Alert?.list().catch(() => []),
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.href = createPageUrl('GlobalSearch');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        window.location.href = createPageUrl('Home');
      }
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
      Tasks: ['Dashboard', 'Tarefas'],
    };

    setBreadcrumbs(pageMap[currentPageName] || ['Dashboard']);
  }, [currentPageName]);

  return (
    <div className="flex min-h-screen bg-slate-50/90 dark:bg-slate-900/90">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r transition-all duration-300 z-40 flex flex-col overflow-hidden lg:w-64 ${
        sidebarOpen ? 'w-full sm:w-64' : 'w-0'
      }`}>
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg" />
            <span className="font-bold text-lg">CRM NR22</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant={currentPageName === 'Home' ? 'default' : 'ghost'} className="w-full justify-start">
              🏠 Home
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 min-h-screen overflow-y-auto ${sidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
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
        <main className="p-4 sm:p-6 pb-40">
          {children}
        </main>
      </div>
    </div>
  );
}