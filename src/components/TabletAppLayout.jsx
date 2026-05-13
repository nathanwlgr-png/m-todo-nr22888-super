import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, Bell, Home, Users, Zap, Settings, BarChart3, 
  Phone, MapPin, Clock, Grid3x3, ChevronRight, LogOut
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const menuItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'clients', icon: Users, label: 'Clientes', path: '/Clients' },
  { id: 'leads', icon: Zap, label: 'Leads', path: '/Leads' },
  { id: 'visits', icon: MapPin, label: 'Visitas', path: '/VisitManager' },
  { id: 'tasks', icon: Clock, label: 'Tarefas', path: '/TasksUnified' },
  { id: 'routes', icon: MapPin, label: 'Rotas', path: '/RouteOptimization' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/ExecutiveSalesAnalysis' },
  { id: 'whatsapp', icon: Phone, label: 'WhatsApp', path: '/WhatsAppHub' },
];

const settingsItems = [
  { id: 'integration', icon: Grid3x3, label: 'Integrações', path: '/Integrations' },
  { id: 'settings', icon: Settings, label: 'Configurações', path: '/ContactSettings' },
];

export default function TabletAppLayout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-tablet'],
    queryFn: () => base44.entities.Alert?.list().catch(() => []),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await base44.auth.logout('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  // Em landscape, sidebar sempre visível
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Otimizada para Tablet */}
      <aside
        className={`
          flex flex-col transition-all duration-300 bg-white border-r border-slate-200
          ${sidebarOpen ? 'w-20 lg:w-28' : 'w-0'}
          lg:relative absolute z-40
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20 lg:h-24 border-b border-slate-200">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg lg:text-2xl">
            S
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 p-2 lg:p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.id;
            return (
              <Link key={item.id} to={item.path}>
                <button
                  className={`
                    w-full flex flex-col items-center justify-center gap-1 p-3 lg:p-4
                    rounded-xl transition-all duration-200 h-20 lg:h-24
                    ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                  title={item.label}
                >
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                  <span className="text-xs lg:text-sm font-medium text-center truncate px-1">
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Divisor */}
        <div className="h-px bg-slate-200 mx-2" />

        {/* Menu Configurações */}
        <nav className="p-2 lg:p-3 space-y-1">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} to={item.path}>
                <button
                  className="w-full flex flex-col items-center justify-center gap-1 p-3 lg:p-4 rounded-xl text-slate-600 hover:bg-slate-50 transition-all h-20 lg:h-24"
                  title={item.label}
                >
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                  <span className="text-xs lg:text-sm font-medium text-center truncate px-1">
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex flex-col items-center justify-center gap-1 p-3 lg:p-4 rounded-xl text-red-600 hover:bg-red-50 transition-all h-20 lg:h-24"
            title="Logout"
          >
            <LogOut className="w-6 h-6 lg:w-8 lg:h-8" />
            <span className="text-xs lg:text-sm font-medium">Sair</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Otimizada */}
        <header className="h-20 lg:h-24 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden h-12 w-12"
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
            {sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-12 w-12"
              >
                <X className="w-6 h-6" />
              </Button>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 hidden md:block">
              {currentPageName}
            </h1>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {/* Notificações */}
            <Link to="/NotificationSettings">
              <Button variant="ghost" size="icon" className="h-12 w-12 lg:h-14 lg:w-14 relative">
                <Bell className="w-6 h-6 lg:w-7 lg:h-7" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Quick Actions */}
            <Button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="bg-indigo-600 hover:bg-indigo-700 h-12 lg:h-14 px-6 lg:px-8 text-base lg:text-lg font-semibold"
            >
              ⚡ Ações Rápidas
            </Button>
          </div>
        </header>

        {/* Quick Actions Sheet */}
        {showQuickActions && (
          <div className="h-20 lg:h-24 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 px-4 lg:px-8 flex items-center gap-3 overflow-x-auto">
            <Link to="/Clients">
              <Button variant="outline" className="h-12 lg:h-14 px-6 lg:px-8 whitespace-nowrap text-base lg:text-lg font-semibold">
                👤 Abrir Cliente
              </Button>
            </Link>
            <Link to="/VisitManager">
              <Button variant="outline" className="h-12 lg:h-14 px-6 lg:px-8 whitespace-nowrap text-base lg:text-lg font-semibold">
                ✓ Registrar Visita
              </Button>
            </Link>
            <Link to="/WhatsAppHub">
              <Button variant="outline" className="h-12 lg:h-14 px-6 lg:px-8 whitespace-nowrap text-base lg:text-lg font-semibold">
                💬 WhatsApp
              </Button>
            </Link>
            <Link to="/RouteOptimization">
              <Button variant="outline" className="h-12 lg:h-14 px-6 lg:px-8 whitespace-nowrap text-base lg:text-lg font-semibold">
                🗺️ Rota
              </Button>
            </Link>
          </div>
        )}

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}