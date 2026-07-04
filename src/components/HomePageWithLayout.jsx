import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SalesCommandCenter from '@/pages/SalesCommandCenter';
import VendedorMenu from '@/components/VendedorMenu';

export default function HomePageWithLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ['home-alerts'],
    queryFn: () => base44.entities.Alert?.filter({ read: false }).catch(() => []),
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Top bar mínima */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'rgba(10,10,10,0.97)',
          borderBottom: '1px solid rgba(255,107,0,0.12)',
          backdropFilter: 'blur(12px)',
        }}>
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
        >
          <Menu className="w-4 h-4 text-orange-400" />
        </button>

        <div className="text-center">
          <p className="text-xs font-black text-orange-400">NR22888</p>
          <p className="text-[8px] text-slate-600 uppercase tracking-widest">SEAMATY Brasil</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/ExecutiveLayerCEO">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              👑
            </div>
          </Link>
          <Link to="/NotificationSettings">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              <Bell className="w-4 h-4 text-orange-400" />
            </div>
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-black text-white">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </div>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal — SalesCommandCenter como home */}
      <SalesCommandCenter />

      {/* Menu lateral */}
      <VendedorMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}