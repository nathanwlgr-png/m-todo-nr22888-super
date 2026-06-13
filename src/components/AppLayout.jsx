import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Home, Zap, ChevronLeft, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VendedorMenu from '@/components/VendedorMenu';
import CentralIAFab from '@/components/CentralIAFab';

const STALE_2MIN = 2 * 60 * 1000;

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

  const unread = alerts.length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* TOP BAR */}
      {!isHome && (
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5"
          style={{ background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,107,0,0.15)', backdropFilter: 'blur(12px)' }}>
          {/* Voltar */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <button className="flex items-center gap-1.5 text-xs font-bold text-orange-400 py-1.5 px-2.5 rounded-xl"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                Home
              </button>
            </Link>
            {/* Menu hambúrguer */}
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              <Menu className="w-4 h-4 text-orange-400" />
            </button>
          </div>

          {/* Page name */}
          <span className="text-xs font-black text-orange-300 truncate max-w-[120px]">{currentPageName}</span>

          {/* Notificações */}
          <Link to={createPageUrl('NotificationSettings')}>
            <div className="relative">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
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
      <main className={isHome ? '' : 'pb-20'}>
        {children}
      </main>

      {/* FAB Central IA — aparece em todas as páginas exceto home */}
      {!isHome && <CentralIAFab />}

      {/* BOTTOM NAV */}
      {!isHome && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] flex"
          style={{
            background: 'rgba(10,10,10,0.97)',
            borderTop: '1px solid rgba(255,107,0,0.15)',
            backdropFilter: 'blur(12px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
          {[
            { to: '/', icon: Home, label: 'Home', color: '#ff9500' },
            { to: createPageUrl('SalesCommandCenter'), icon: Zap, label: 'Command', color: '#00ff88' },
            { to: createPageUrl('NotificationSettings'), icon: Bell, label: 'Alertas', color: '#ff4444', badge: unread },
          ].map(({ to, icon: Icon, label, color, badge }) => (
            <Link key={to} to={to} className="flex-1">
              <div className="flex flex-col items-center py-2.5 gap-0.5">
                <div className="relative">
                  <Icon className="w-5 h-5" style={{ color }} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-black text-white">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
              </div>
            </Link>
          ))}
        </nav>
      )}

      {/* MENU DRAWER */}
      <VendedorMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}