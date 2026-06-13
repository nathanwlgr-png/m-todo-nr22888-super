import React, { lazy, Suspense } from 'react';
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

const SniperDoDia = lazy(() => import('@/components/SniperDoDia'));
const SmartRouteMap = lazy(() => import('@/components/SmartRouteMap'));
const WeeklyHealthReport = lazy(() => import('@/components/WeeklyHealthReport'));
const ExportClinicReportWithROI = lazy(() => import('@/components/ExportClinicReportWithROI'));

const HeavyFallback = () => <div className="h-16 rounded-xl animate-pulse mb-3 bg-[#111111]" />;

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

  return (
    <div className="min-h-screen bg-black text-white pb-20 flex flex-col items-center p-4">
      <div className="w-full max-w-xl space-y-4">
        {/* Header */}
        <div className="px-4 py-4 rounded-2xl bg-[#0f0f11] border border-orange-500/20 shadow-lg">
          <h1 className="text-2xl font-black text-orange-400 mb-1 flex items-center gap-2 justify-center">
            🎯 Dashboard Sniper
          </h1>
          <p className="text-xs text-center text-orange-500 font-bold tracking-widest uppercase">Fluxo Comercial de Elite</p>
        </div>

        {/* Imagem central */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/35 shadow-[0_0_25px_rgba(255,107,0,0.15)] bg-[#050505]">
          <img
            src="https://media.base44.com/images/public/6997e09fd222346f10842c38/a3b87a785_file_000000003da471f5ae99a055bf18cb4a.png"
            className="w-full h-auto object-contain max-h-[380px]"
            alt="NR22888 Sniper"
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-emerald-500/30">
            <p className="text-xs text-emerald-400 font-bold">🔥 Clientes Quentes</p>
            <p className="text-2xl font-black text-emerald-300">{hotClients.length}</p>
          </div>
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-rose-500/30">
            <p className="text-xs text-rose-400 font-bold">⏰ Sem Contato +7d</p>
            <p className="text-2xl font-black text-rose-300">{noContact7d.length}</p>
          </div>
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-cyan-500/30">
            <p className="text-xs text-cyan-400 font-bold">📅 Visitas</p>
            <p className="text-2xl font-black text-cyan-300">{visits.length}</p>
          </div>
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-amber-500/30">
            <p className="text-xs text-amber-400 font-bold">💰 Vendas</p>
            <p className="text-2xl font-black text-amber-300">{sales.length}</p>
          </div>
        </div>

        {/* Fluxo 7 etapas */}
        <div className="rounded-2xl p-4 bg-[#0f0f11] border border-orange-500/20 shadow-xl space-y-3">
          <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest text-center mb-1">
            ⚡ Fluxo de Vendas (7 Etapas)
          </h2>
          <div className="space-y-2">
            <Link to={createPageUrl('Clients')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Users className="w-5 h-5" /><span>1️⃣ Clientes</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('ClientLocationMap')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /><span>2️⃣ Mapa Inteligente</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('ModoInvestigativoSupremo')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Search className="w-5 h-5" /><span>3️⃣ Investigação Suprema</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('GenerateWhatsAppIntegrated')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Zap className="w-5 h-5" /><span>4️⃣ Gerar SPIN</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('WhatsAppHub')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /><span>5️⃣ WhatsApp com Aprovação</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('ProposalGenerator')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><FileText className="w-5 h-5" /><span>6️⃣ Gerar Proposta</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('SalesFunnel')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /><span>7️⃣ Funil & Fechamento</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Link de teste — ClienteDetalhe360 */}
        <Link to="/ClienteDetalhe360?id=6a2d109cf3035a700442b501">
          <div className="rounded-xl p-3 flex items-center justify-between bg-[#0f0f11] border-2 border-orange-500/40">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs font-black text-orange-400">🧪 Cliente360 — Teste</p>
                <p className="text-[9px] text-slate-600">VetPrime Marília · Ricardo · QUENTE</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-500" />
          </div>
        </Link>

        {/* Atalhos extras */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/AgendaMensal">
            <div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-indigo-500/30">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-indigo-400">📅 Agenda Mensal</span>
            </div>
          </Link>
          <Link to="/RelatorioRicardo">
            <div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-cyan-500/30">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-cyan-400">📊 Relatório</span>
            </div>
          </Link>
          <Link to="/ModoCacaComercial">
            <div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-rose-500/30">
              <Target className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black text-rose-400">🎯 Modo Caça</span>
            </div>
          </Link>
          <Link to="/RankingOportunidades">
            <div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-yellow-500/30">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-black text-yellow-400">🏆 Ranking do Dia</span>
            </div>
          </Link>
          <Link to="/ScheduledAgenda">
            <div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-amber-500/30">
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400">🗺️ Rota do Dia</span>
            </div>
          </Link>
        </div>

        {/* Exportar Relatório de ROI */}
        <div className="rounded-xl p-3 bg-[#0f0f11] border border-green-500/30">
          <p className="text-xs font-black text-green-400 mb-2">💹 Relatório de Clínicas</p>
          <Suspense fallback={<div className="h-10 animate-pulse rounded" />}>
            <ExportClinicReportWithROI />
          </Suspense>
        </div>

        {/* Sniper do Dia */}
        <Suspense fallback={<HeavyFallback />}>
          <SniperDoDia />
        </Suspense>

        {/* Melhores Clientes */}
        {hotClients.length > 0 && (
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-orange-500/20 shadow-lg">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">🏆 Melhores Clientes</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {hotClients.slice(0, 5).map(client => (
                <Link key={client.id} to={`/ClientProfile?id=${client.id}`}>
                  <div className="p-2 rounded-lg hover:bg-orange-500/10 transition-colors flex justify-between items-center">
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

        {/* Relatório Semanal de Saúde */}
        <Suspense fallback={<HeavyFallback />}>
          <WeeklyHealthReport clients={clients} />
        </Suspense>

        {/* Recomendação de Ação */}
        {noContact7d.length > 0 && (
          <div className="rounded-xl p-4 bg-orange-500/5 border-2 border-orange-500/35 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-orange-400 mb-1">💡 Próxima Ação Recomendada</p>
                <p className="text-xs text-orange-200 mb-2">{noContact7d.length} cliente(s) sem contato há +7 dias precisam de follow-up</p>
                <Link to={createPageUrl('TasksUnified')}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold border-none">
                    Ir para Tarefas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}