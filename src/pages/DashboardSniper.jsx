import React, { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Target, Users, Search, MapPin, MessageSquare, FileText, TrendingUp,
  ChevronRight, Bell, AlertTriangle, Calendar
} from 'lucide-react';

import BotaoLimpezaCRM from '@/components/BotaoLimpezaCRM';
import CampoTotalNR22888 from '@/components/elite/CampoTotalNR22888';
import RadarConcorrenciaWidget from '@/components/elite/RadarConcorrenciaWidget';
import PendenciasPara100 from '@/components/elite/PendenciasPara100';
import ResolverPendencias from '@/components/elite/ResolverPendencias';
import SaneamentoConversaoSeguro from '@/components/elite/SaneamentoConversaoSeguro';
import AprovacaoVozFlutuante from '@/components/AprovacaoVozFlutuante';
const SniperDoDia = lazy(() => import('@/components/SniperDoDia'));
const SmartRouteMap = lazy(() => import('@/components/SmartRouteMap'));
const WeeklyHealthReport = lazy(() => import('@/components/WeeklyHealthReport'));
const ExportClinicReportWithROI = lazy(() => import('@/components/ExportClinicReportWithROI'));
const SuperAgentWidget = lazy(() => import('@/components/SuperAgentWidget'));
const PlanoEliteStatus = lazy(() => import('@/components/elite/PlanoEliteStatus'));
const CentralComandosSafe = lazy(() => import('@/components/elite/CentralComandosSafe'));
const ComparativoFechamento = lazy(() => import('@/components/elite/ComparativoFechamento'));

const HeavyFallback = () => <div className="h-16 rounded-xl animate-pulse mb-3 bg-[#111111]" />;

export default function DashboardSniper() {
  const [showSecondary, setShowSecondary] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['dashboard-clients-rua'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 50),
    staleTime: 300000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['dashboard-visits-rua'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }, 'scheduled_date', 30),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['dashboard-sales-rua'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 20),
    staleTime: 300000,
  });

  const hotClients = clients.filter(c => (c.purchase_score || 0) > 70);
  const noContact7d = clients.filter(c => {
    if (!c.last_contact_date) return true;
    return (Date.now() - new Date(c.last_contact_date)) / 86400000 > 7;
  });

  // Cliente mais quente real para o link 360
  const topClient = hotClients[0] || clients[0];

  return (
    <div className="min-h-screen bg-black text-white pb-20 flex flex-col items-center p-4">
      <div className="w-full max-w-xl space-y-4">

        {/* ── HEADER ── */}
        <div className="px-4 py-4 rounded-2xl bg-[#0f0f11] border border-orange-500/20 shadow-lg">
          <h1 className="text-2xl font-black text-orange-400 mb-1 flex items-center gap-2 justify-center">
            🎯 Painel Comercial
          </h1>
          <p className="text-xs text-center text-orange-500 font-bold tracking-widest uppercase">Compet Distribuidora · Seamaty</p>
        </div>

        {/* ── MÁQUINA DE VENDA — foco: vender, concorrência, fechamento ── */}
        <div className="grid grid-cols-3 gap-2">
          <Link to="/ModoCacaComercial">
            <div className="rounded-xl p-3 text-center bg-rose-500/10 border border-rose-500/35">
              <p className="text-lg">🎯</p>
              <p className="text-[10px] font-black text-rose-300 uppercase">Caçar</p>
            </div>
          </Link>
          <Link to="/PainelConcorrencia">
            <div className="rounded-xl p-3 text-center bg-cyan-500/10 border border-cyan-500/35">
              <p className="text-lg">🧭</p>
              <p className="text-[10px] font-black text-cyan-300 uppercase">Concorrente</p>
            </div>
          </Link>
          <Link to="/RankingOportunidades">
            <div className="rounded-xl p-3 text-center bg-orange-500/10 border border-orange-500/35">
              <p className="text-lg">💰</p>
              <p className="text-[10px] font-black text-orange-300 uppercase">Fechar</p>
            </div>
          </Link>
        </div>

        {/* ── 1. SNIPER DO DIA — O FOGO (topo absoluto) ── */}
        <Suspense fallback={<HeavyFallback />}>
          <SniperDoDia />
        </Suspense>

        {/* ── MODO RUA — só ações que geram venda imediata ── */}
        <div className="rounded-2xl p-4 bg-[#0f0f11] border border-emerald-500/25 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-emerald-300 uppercase tracking-widest">⚡ Modo Rua</h2>
            <span className="text-[10px] text-slate-400">Tablet rápido</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/DayFieldView" className="rounded-xl p-3 bg-cyan-500/10 border border-cyan-500/30"><p className="text-xs font-black text-cyan-300">Agenda/Rota hoje</p><p className="text-[10px] text-slate-400">{visits.length} visitas</p></Link>
            <Link to="/RankingOportunidades" className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/30"><p className="text-xs font-black text-orange-300">Clientes quentes</p><p className="text-[10px] text-slate-400">{hotClients.length} prioridades</p></Link>
            <Link to="/WhatsAppHub" className="rounded-xl p-3 bg-green-500/10 border border-green-500/30"><p className="text-xs font-black text-green-300">WhatsApp manual</p><p className="text-[10px] text-slate-400">Fila/aprovação</p></Link>
            <Link to="/PainelConcorrencia" className="rounded-xl p-3 bg-red-500/10 border border-red-500/30"><p className="text-xs font-black text-red-300">Concorrente crítico</p><p className="text-[10px] text-slate-400">Argumento de venda</p></Link>
            <Link to="/ProposalGenerator" className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30"><p className="text-xs font-black text-amber-300">Proposta/material</p><p className="text-[10px] text-slate-400">Preparar fechamento</p></Link>
            <Link to="/VisitManager" className="rounded-xl p-3 bg-purple-500/10 border border-purple-500/30"><p className="text-xs font-black text-purple-300">Registrar visita</p><p className="text-[10px] text-slate-400">Sem alterar cliente</p></Link>
          </div>
        </div>

        {/* ── 2. ALERTAS CRÍTICOS — Sem contato +7d ── */}
        {noContact7d.length > 0 && (
          <div className="rounded-xl p-4 bg-orange-500/5 border-2 border-orange-500/35 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-orange-400 mb-1">🚨 Ação Urgente</p>
                <p className="text-xs text-orange-200 mb-2">{noContact7d.length} cliente(s) sem contato há +7 dias</p>
                <Link to={createPageUrl('TasksUnified')}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold border-none">
                    Ver Tarefas Pendentes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. ALTA PRIORIDADE COMERCIAL ── */}
        {hotClients.length > 0 && (
          <div className="rounded-xl p-3 bg-[#0f0f11] border border-orange-500/20 shadow-lg">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">🏆 Alta Prioridade</h3>
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

        {/* ── 4. FLUXO CRONOLÓGICO DE VENDAS ── */}
        <div className="rounded-2xl p-4 bg-[#0f0f11] border border-orange-500/20 shadow-xl space-y-3">
          <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest text-center mb-1">
            ⚡ Fluxo de Vendas
          </h2>
          <div className="space-y-2">
            <Link to={createPageUrl('Clients')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Users className="w-5 h-5" /><span>1️⃣ Clientes</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('ModoInvestigativoSupremo')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Search className="w-5 h-5" /><span>2️⃣ Investigação</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('GenerateWhatsAppIntegrated')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /><span>3️⃣ SPIN + WhatsApp</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('WhatsAppHub')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><Bell className="w-5 h-5" /><span>4️⃣ Fila de Aprovação</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('ProposalGenerator')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><FileText className="w-5 h-5" /><span>5️⃣ Gerar Proposta</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('SalesFunnel')}>
              <Button className="w-full justify-between h-14 bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 text-white font-extrabold rounded-xl border-none">
                <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /><span>6️⃣ Fechamento</span></div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ── CAMPO TOTAL — visão compacta de campo (SAFE) ── */}
        <CampoTotalNR22888 />

        {/* ── RADAR DE CONCORRÊNCIA — monitoramento multicanal (SAFE) ── */}
        <RadarConcorrenciaWidget />

        {/* ── COMPARATIVO DE FECHAMENTO — Seamaty vs concorrentes ── */}
        <Suspense fallback={<HeavyFallback />}>
          <ComparativoFechamento />
        </Suspense>

        {/* ── FERRAMENTAS SECUNDÁRIAS — carregam só quando Nathan pedir ── */}
        <button
          onClick={() => setShowSecondary(p => !p)}
          className="w-full rounded-2xl p-3 bg-[#0f0f11] border border-slate-700 text-xs font-black text-slate-300 flex items-center justify-between"
        >
          <span>Ferramentas de gestão / relatórios / limpeza</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showSecondary ? 'rotate-90' : ''}`} />
        </button>

        {showSecondary && (
          <div className="space-y-4">
            <Suspense fallback={<HeavyFallback />}>
              <PlanoEliteStatus hotCount={hotClients?.length || 0} visitsCount={visits?.length || 0} inactiveCount={noContact7d?.length || 0} />
            </Suspense>
            <Suspense fallback={<HeavyFallback />}><CentralComandosSafe /></Suspense>
            <SaneamentoConversaoSeguro />

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3 bg-[#0f0f11] border border-emerald-500/30"><p className="text-xs text-emerald-400 font-bold">🔥 Alta Prioridade</p><p className="text-2xl font-black text-emerald-300">{hotClients.length}</p></div>
              <div className="rounded-xl p-3 bg-[#0f0f11] border border-rose-500/30"><p className="text-xs text-rose-400 font-bold">⏰ Sem Contato +7d</p><p className="text-2xl font-black text-rose-300">{noContact7d.length}</p></div>
              <div className="rounded-xl p-3 bg-[#0f0f11] border border-cyan-500/30"><p className="text-xs text-cyan-400 font-bold">📅 Visitas</p><p className="text-2xl font-black text-cyan-300">{visits.length}</p></div>
              <div className="rounded-xl p-3 bg-[#0f0f11] border border-amber-500/30"><p className="text-xs text-amber-400 font-bold">💰 Vendas</p><p className="text-2xl font-black text-amber-300">{sales.length}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link to="/ModoCacaComercial"><div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-rose-500/30"><Target className="w-4 h-4 text-rose-400" /><span className="text-xs font-black text-rose-400">🎯 Prospecção</span></div></Link>
              <Link to="/ClientLocationMap"><div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-blue-500/30"><MapPin className="w-4 h-4 text-blue-400" /><span className="text-xs font-black text-blue-400">📍 Mapa Matriz</span></div></Link>
              <Link to="/AgendaMensal"><div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-indigo-500/30"><Calendar className="w-4 h-4 text-indigo-400" /><span className="text-xs font-black text-indigo-400">📅 Agenda Mensal</span></div></Link>
              <Link to="/RelatorioRicardo"><div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-cyan-500/30"><FileText className="w-4 h-4 text-cyan-400" /><span className="text-xs font-black text-cyan-400">📊 Relatório</span></div></Link>
              {topClient && <Link to={`/ClienteDetalhe360?id=${topClient.id}`}><div className="rounded-xl p-3 flex items-center gap-2 bg-[#0f0f11] border border-orange-500/30"><Target className="w-4 h-4 text-orange-400" /><span className="text-xs font-black text-orange-400">📋 Cliente 360°</span></div></Link>}
            </div>

            <Suspense fallback={<HeavyFallback />}><SmartRouteMap /></Suspense>
            <Suspense fallback={<HeavyFallback />}><WeeklyHealthReport clients={clients} /></Suspense>
            <Suspense fallback={<HeavyFallback />}><SuperAgentWidget /></Suspense>
            <div className="rounded-xl p-3 bg-[#0f0f11] border border-green-500/30"><p className="text-xs font-black text-green-400 mb-2">💹 Relatório de Clínicas</p><Suspense fallback={<div className="h-10 animate-pulse rounded" />}><ExportClinicReportWithROI /></Suspense></div>
            <details className="rounded-2xl overflow-hidden border border-orange-500/20 bg-[#0f0f11]"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-orange-400 flex items-center justify-between"><span>🖼️ Imagem institucional</span><ChevronRight className="w-4 h-4" /></summary><div className="relative bg-[#050505]"><img src="https://media.base44.com/images/public/6997e09fd222346f10842c38/a3b87a785_file_000000003da471f5ae99a055bf18cb4a.png" className="w-full h-auto object-contain max-h-[320px]" alt="Painel Comercial" /></div></details>
            <ResolverPendencias />
            <PendenciasPara100 />
            <BotaoLimpezaCRM />
          </div>
        )}

      </div>

      {/* ── Botão flutuante: Aprovação por Voz (1 clique) ── */}
      <AprovacaoVozFlutuante />
    </div>
  );
}