import * as React from 'react';
const { useState } = React;
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Menu, X, Bell, Home, Users, FileText, MessageSquare,
  MapPin, Calendar, WifiOff, LogOut, ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import VendedorMenu from '@/components/VendedorMenu';
import ArchiveModeBanner from '@/components/ArchiveModeBanner';

const PAGE_TITLES = {
  HojeModoRuaNR22888: 'Hoje — Modo Rua NR22888',
  DashboardSniper: 'Painel Comercial',
  GenerateWhatsAppIntegrated: 'WhatsApp Consultivo',
  RankingOportunidades: 'Interesse do Cliente',
  EventoClienteTracking: 'Histórico de Acesso',
  Clients: 'Clientes',
  ClientProfile: 'Perfil do Cliente',
  ClienteDetalhe360: 'Cliente 360°',
  ProposalGenerator: 'Propostas',
  WhatsAppHub: 'WhatsApp',
  WhatsAppInbox: 'WhatsApp',
  SalesFunnel: 'Funil de Vendas',
  TasksUnified: 'Tarefas',
  VisitManager: 'Visitas',
  AgendaMensal: 'Agenda',
  ScheduledAgenda: 'Agenda',
  DayFieldView: 'Campo Hoje',
  SmartRouteOptimizer: 'Rota Inteligente',
  OfflineMode: 'Modo Offline',
  ModoInvestigativoSupremo: 'Análise de Cliente',
  ModoCacaComercial: 'Prospecção',
  SeamatyHunter: 'Buscar Clínicas por Cidade',
  ArquivoMasterConsulta: 'Arquivo Master / Consulta',
  PipelineView: 'Pipeline',
  SalesFunnel: 'Vendas',
  AutoFollowUpDashboard: 'Pós-venda',
  AutomationSettings: 'Preparação Automática',
  DuplicateManager: 'Duplicados',
};

// Sidebar lateral para tablet — segue o menu principal
const SIDEBAR_ITEMS = [
  { icon: Home,          label: 'Hoje',       path: '/' },
  { icon: Users,         label: 'Clientes',   path: '/Clients' },
  { icon: MessageSquare, label: 'Mensagens',  path: '/WhatsAppHub' },
  { icon: MapPin,        label: 'Campo',      path: '/DayFieldView' },
  { icon: Calendar,      label: 'Agenda',     path: '/ScheduledAgenda' },
  { icon: FileText,      label: 'Propostas',  path: '/ProposalGenerator' },
  { icon: RefreshCw,     label: 'Pós-venda',  path: '/AutoFollowUpDashboard' },
  { icon: WifiOff,       label: 'Offline',    path: '/OfflineMode' },
];

export default function TabletAppLayout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['layout-alerts'],
    queryFn: () => base44.entities.Alert?.filter({ read: false }).catch(() => []),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const unreadCount = notifications.length;
  const pageTitle = PAGE_TITLES[currentPageName] || currentPageName;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try { await base44.auth.logout('/'); }
    catch { toast.error('Erro ao sair'); }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <ArchiveModeBanner />
      <div className="flex flex-1 overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className="flex flex-col transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarOpen ? '72px' : '0px',
          background: 'rgba(15,15,17,0.98)',
          borderRight: '1px solid rgba(255,107,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b" style={{ borderColor: 'rgba(255,107,0,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-orange-400"
            style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)' }}>
            S
          </div>
        </div>

        {/* Itens de navegação */}
        <nav className="flex-1 py-3 space-y-1 overflow-y-auto px-1.5">
          {SIDEBAR_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}>
                <button
                  className="w-full flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl transition-all"
                  style={{
                    background: active ? 'rgba(255,107,0,0.18)' : 'transparent',
                    color: active ? '#ff9500' : '#555',
                  }}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold leading-none">{label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-1.5 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl transition-all"
            style={{ color: '#ff4444' }}
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-bold">Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header
          className="flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{
            background: 'rgba(10,10,10,0.97)',
            borderBottom: '1px solid rgba(255,107,0,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              {sidebarOpen ? <X className="w-4 h-4 text-orange-400" /> : <Menu className="w-4 h-4 text-orange-400" />}
            </button>
            {location.pathname !== '/' && (
              <Link to="/">
                <button
                  className="flex items-center gap-1 text-xs font-bold text-orange-400 py-1.5 px-2.5 rounded-xl"
                  style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)' }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Início
                </button>
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="text-[10px] font-bold text-orange-500/60 hover:text-orange-400 px-2">
              ☰ Menu
            </button>
          </div>

          <span className="text-sm font-black text-orange-300 truncate max-w-[200px]">{pageTitle}</span>

          <div className="flex items-center gap-2">
            <Link to="/NotificationSettings">
              <button
                className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}
              >
                <Bell className="w-4 h-4 text-orange-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* MENU DRAWER */}
      <VendedorMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </div>
  );
}