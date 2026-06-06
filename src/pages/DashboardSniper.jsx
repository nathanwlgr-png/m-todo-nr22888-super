import React, { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Target, Users, Search, MapPin, MessageSquare, FileText, TrendingUp,
  ChevronRight, Zap, Bell, AlertTriangle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Lazy load componentes pesados
const SniperDoDia = lazy(() => import('@/components/SniperDoDia'));
const SmartRouteMap = lazy(() => import('@/components/SmartRouteMap'));
const WeeklyHealthReport = lazy(() => import('@/components/WeeklyHealthReport'));

const HeavyFallback = () => <div className="h-16 rounded-xl animate-pulse mb-3" style={{ background: '#1a1a1a' }} />;

export default function DashboardSniper() {
  const { data: clients = [] } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 100),
    staleTime: 60000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }),
    staleTime: 60000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['dashboard-visits'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
    staleTime: 60000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 50),
    staleTime: 60000,
  });

  const hotClients = clients.filter(c => (c.purchase_score || 0) > 70);
  const noContact7d = clients.filter(c => {
    if (!c.last_contact_date) return true;
    return (Date.now() - new Date(c.last_contact_date)) / 86400000 > 7;
  });

  const handleQuickAction = (page, action) => {
    toast.info(`Abrindo ${action}...`);
  };

  return (
    <div className="min-h-screen pb-20 relative" style={{ 
      backgroundImage: 'url(https://media.base44.com/images/public/6997e09fd222346f10842c38/a3b87a785_file_000000003da471f5ae99a055bf18cb4a.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Overlay semitransparente para readabilidade */}
      <div className="fixed inset-0 bg-black/60 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="relative" style={{ zIndex: 1 }}>
      {/* Header */}
      <div className="sticky top-0 px-4 py-4 relative" style={{ background: 'rgba(10,10,10,0.98)', borderBottom: '1px solid rgba(255,107,0,0.15)', zIndex: 50 }}>
        <h1 className="text-2xl font-black text-orange-400 mb-1">🎯 Dashboard Sniper</h1>
        <p className="text-xs text-orange-600">Fluxo comercial otimizado</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* KPIs Rápidos */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-xs text-orange-400 font-bold">🔥 Clientes Quentes</p>
            <p className="text-2xl font-black text-orange-400">{hotClients.length}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-xs text-orange-400 font-bold">⏰ Sem Contato +7d</p>
            <p className="text-2xl font-black text-orange-400">{noContact7d.length}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-xs text-orange-400 font-bold">📅 Visitas</p>
            <p className="text-2xl font-black text-orange-400">{visits.length}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: '#1a0a00', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-xs text-orange-400 font-bold">💰 Vendas</p>
            <p className="text-2xl font-black text-orange-400">{sales.length}</p>
          </div>
        </div>

        {/* Fluxo Sniper — Botões de Ação Rápida */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '2px solid rgba(255,107,0,0.3)' }}>
          <h2 className="text-sm font-black text-orange-400 mb-3 uppercase tracking-wider">⚡ Fluxo de Vendas</h2>
          
          <div className="space-y-2">
            {/* 1. Clientes */}
            <Link to={createPageUrl('Clients')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>1️⃣ Clientes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>

            {/* 2. Investigação */}
            <Link to={createPageUrl('ModoInvestigativoSupremo')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-orange-400" />
                  <span>2️⃣ Investigação</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>

            {/* 3. SPIN */}
            <Link to={createPageUrl('GenerateWhatsAppIntegrated')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>3️⃣ Gerar SPIN</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>

            {/* 4. WhatsApp */}
            <Link to={createPageUrl('WhatsAppHub')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span>4️⃣ WhatsApp com Aprovação</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>

            {/* 5. Proposta */}
            <Link to={createPageUrl('ProposalGenerator')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>5️⃣ Gerar Proposta</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>

            {/* 6. Fechamento */}
            <Link to={createPageUrl('SalesFunnel')}>
              <Button className="w-full justify-between h-12 bg-orange-950 hover:bg-orange-900" variant="outline">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>6️⃣ Funil & Fechamento</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Ranking do Dia */}
        <Suspense fallback={<HeavyFallback />}>
          <SniperDoDia />
        </Suspense>

        {/* Melhores Clientes */}
        {hotClients.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider mb-2">🏆 Melhores Clientes</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {hotClients.slice(0, 5).map(client => (
                <Link key={client.id} to={`/ClientProfile?id=${client.id}`}>
                  <div className="p-2 rounded-lg hover:bg-orange-950/30 transition-colors flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-200">{client.first_name}</span>
                    <span className="text-xs font-black text-orange-400">{client.purchase_score}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Rota Inteligente */}
        <Suspense fallback={<HeavyFallback />}>
          <SmartRouteMap />
        </Suspense>

        {/* Health Report */}
        <Suspense fallback={<HeavyFallback />}>
          <WeeklyHealthReport clients={clients} />
        </Suspense>

        {/* Próxima Ação Recomendada */}
        {noContact7d.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,107,0,0.05)', border: '2px solid rgba(255,107,0,0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-orange-400 mb-1">💡 Próxima Ação Recomendada</p>
                <p className="text-xs text-orange-200 mb-2">{noContact7d.length} cliente(s) sem contato há +7 dias precisam de follow-up</p>
                <Link to={createPageUrl('TasksUnified')}>
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                    Ir para Tarefas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}