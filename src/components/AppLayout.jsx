import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Home, Users, FileText, Star, MessageSquare, ChevronLeft, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VendedorMenu from '@/components/VendedorMenu';
import ArchiveModeBanner from '@/components/ArchiveModeBanner';

const STALE_2MIN = 2 * 60 * 1000;

// Navegação inferior — 5 abas principais
const BOTTOM_NAV = [
  { to: '/',                       icon: Home,         label: 'Hoje',       match: ['/'] },
  { to: '/Clients',                icon: Users,        label: 'Clientes',   match: ['/Clients', '/ClientProfile', '/ClienteDetalhe360'] },
  { to: '/WhatsAppHub',            icon: MessageSquare,label: 'Mensagens',  match: ['/WhatsAppHub', '/WhatsAppInbox', '/GenerateWhatsAppIntegrated'] },
  { to: '/DayFieldView',           icon: Star,         label: 'Rota',       match: ['/DayFieldView', '/VisitManager', '/ScheduledAgenda'] },
  { to: '/ProposalGenerator',      icon: FileText,     label: 'Propostas',  match: ['/ProposalGenerator'] },
];

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
  ModoInvestigativoSupremo: 'Análise de Cliente',
  ModoCacaComercial: 'Prospecção',
  ArquivoMasterConsulta: 'Arquivo Master / Consulta',
  PipelineView: 'Pipeline',
  SalesFunnel: 'Vendas',
  AutoFollowUpDashboard: 'Pós-venda',
  DuplicateManager: 'Duplicados',
};

export default function AppLayout({ children, currentPageName }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ['layout-alerts'],
    queryFn: () => base44.entities.Alert?.filter({ read: false }).catch(() => []),
    staleTime: STALE_2MIN,
    gcTime: 5 * 60 * 1000,
  });

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const unread = safeAlerts.length;
  const pageTitle = PAGE_TITLES[currentPageName] || currentPageName;

  const isTabActive = (nav) =>
    nav.match.some(p => location.pathname.startsWith(p) && (p !== '/' || location.pathname === '/'));

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <ArchiveModeBanner />
      {/* TOP BAR — aparece em todas as páginas exceto home */}
      {!isHome && (
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5"
          style={{
            background: 'rgba(10,10,10,0.95)',
            borderBottom: '1px solid rgba(255,107,0,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2">
            <Link to="/">
              <button
                className="flex items-center gap-1.5 text-xs font-bold text-orange-400 py-1.5 px-2.5 rounded-xl"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Início
              </button>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              <Menu className="w-4 h-4 text-orange-400" />
            </button>
          </div>

          <span className="text-xs font-black text-orange-300 truncate max-w-[140px]">{pageTitle}</span>

          <Link to={createPageUrl('NotificationSettings')}>
            <div className="relative">
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}
              >
                <Bell className="w-4 h-4 text-orange-400" />
              </button>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
          </Link>
        </header>
      )}

      {/* CONTENT */}
      <main className="pb-28">{children}</main>

      {/* BOTTOM NAV — sempre visível */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] flex"
        style={{
          background: 'rgba(10,10,10,0.97)',
          borderTop: '1px solid rgba(255,107,0,0.18)',
          backdropFilter: 'blur(14px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BOTTOM_NAV.map(({ to, icon: Icon, label, match }) => {
          const active = isTabActive({ match });
          return (
            <Link key={to} to={to} className="flex-1">
              <div className="flex flex-col items-center py-2.5 gap-0.5">
                <div
                  className="rounded-xl p-1.5 transition-colors"
                  style={{ background: active ? 'rgba(255,107,0,0.18)' : 'transparent' }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: active ? '#ff9500' : '#555' }}
                  />
                </div>
                <span
                  className="text-[9px] font-bold"
                  style={{ color: active ? '#ff9500' : '#555' }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* MENU DRAWER */}
      <VendedorMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}