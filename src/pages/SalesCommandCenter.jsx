import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Users, Calendar, Route, DollarSign,
  Zap, Target, ChevronRight, RefreshCw, Clock, Flame,
  Star, MessageSquare, ArrowRight, MapPin,
  Search, WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import BestOpportunityCard from '@/components/BestOpportunityCard';
import NearbyOpportunitiesModal from '@/components/NearbyOpportunitiesModal';

const STALE_5MIN = 5 * 60 * 1000;
const STALE_2MIN = 2 * 60 * 1000;

const HeavyFallback = () => (
  <div className="h-16 rounded-xl animate-pulse mb-3" style={{ background: '#1a1a1a' }} />
);

// Lazy load do componente de ranking
const RankingDoDia = lazy(() => import('@/components/RankingDoDia'));

export default function SalesCommandCenter() {
  const [aiMode, setAiMode] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [generatingAction, setGeneratingAction] = useState(null);
  const [showNearby, setShowNearby] = useState(false);
  const [bestOpp, setBestOpp] = useState(null);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['scc-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: STALE_5MIN,
    gcTime: 10 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['scc-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }),
    staleTime: STALE_2MIN,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['scc-visits'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
    staleTime: STALE_5MIN,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['scc-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100),
    staleTime: STALE_5MIN,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['scc-consumables'],
    queryFn: () => base44.entities.ConsumableOrder?.list('-next_reorder_date', 100).catch(() => []),
    staleTime: STALE_5MIN,
  });

  const { data: pendingMessages = [] } = useQuery({
    queryKey: ['scc-pending-msgs'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    staleTime: STALE_2MIN,
  });

  // Melhor oportunidade do dia
  const { data: oppData } = useQuery({
    queryKey: ['best-daily-opp'],
    queryFn: async () => {
      const res = await base44.functions.invoke('bestDailyOpportunity', {});
      if (res?.data?.opp) setBestOpp(res.data.opp);
      return res?.data;
    },
    staleTime: STALE_5MIN,
  });

  const metrics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const thirtyDaysAgo = new Date(now - 30 * 86400000);

    const hotClients = clients.filter(c => (c.purchase_score || 0) >= 70 || c.status === 'quente');
    const coldClients = clients.filter(c => {
      if (!c.last_contact_date) return true;
      return new Date(c.last_contact_date) < sevenDaysAgo;
    });
    const noPurchaseClients = clients.filter(c => {
      if (!c.last_purchase_date) return true;
      return new Date(c.last_purchase_date) < thirtyDaysAgo;
    });
    const proposalClients = clients.filter(c =>
      c.pipeline_stage === 'proposta' || c.pipeline_stage === 'negociacao'
    );
    // Oportunidades de comodato: clientes com equipamentos mas sem contrato recente
    const comodatoOpps = clients.filter(c =>
      c.equipment_sold && !c.sale_closed && (c.status === 'quente' || c.status === 'morno')
    );

    const closedSales = sales.filter(s => {
      const d = new Date(s.sale_date || s.created_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && (s.status === 'fechada' || s.status === 'entregue');
    });
    const monthRevenue = closedSales.reduce((a, s) => a + (s.sale_value || 0), 0);
    const nextVisit = visits
      .filter(v => new Date(v.scheduled_date) >= now)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0];
    const nextVisits = visits
      .filter(v => new Date(v.scheduled_date) >= now)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .slice(0, 5);
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const projectedRevenue = proposalClients.reduce(
      (a, c) => a + (c.projected_revenue || c.average_purchase_value || 0), 0
    );
    // Insumos vencendo em 7 dias
    const insumoAlert = consumables.filter(c => {
      if (!c.next_reorder_date) return false;
      const d = new Date(c.next_reorder_date);
      return d >= now && d <= new Date(now.getTime() + 7 * 86400000);
    });

    return {
      hotClients, coldClients: coldClients.slice(0, 20),
      noPurchaseClients: noPurchaseClients.slice(0, 15),
      proposalClients, comodatoOpps: comodatoOpps.slice(0, 10),
      closedSales, monthRevenue, nextVisit, nextVisits,
      overdueTasks, projectedRevenue,
      totalClients: clients.length,
      insumoAlert,
    };
  }, [clients, tasks, visits, sales, consumables]);

  const handleQuickAction = useCallback(async (action) => {
    setGeneratingAction(action);
    try {
      if (action === 'spin') {
        const topClient = metrics.hotClients[0];
        if (!topClient) { toast.info('Nenhum lead quente encontrado'); return; }
        const res = await base44.functions.invoke('generateSpinSellingMessages', {
          client_id: topClient.id,
          client_name: topClient.first_name,
          clinic_name: topClient.clinic_name,
          equipment_interest: topClient.equipment_interest,
        });
        toast.success('SPIN gerado! Copie no WhatsApp Hub.');
      } else if (action === 'pipeline') {
        const res = await base44.functions.invoke('analyzeSalesFunnel', {
          clients: metrics.proposalClients.slice(0, 10).map(c => ({
            id: c.id, name: c.first_name, status: c.status,
            score: c.purchase_score, stage: c.pipeline_stage,
          }))
        });
        setAiResult(res?.data);
        setAiMode('done');
      } else if (action === 'forecast') {
        const res = await base44.functions.invoke('generateSalesForecast', {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
        setAiResult(res?.data);
        setAiMode('done');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setGeneratingAction(null);
    }
  }, [metrics]);

  const formatCurrency = (v) =>
    `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  const isOnline = navigator.onLine;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0a0a0a' }}>

      {/* ── HEADER ── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-black text-white">⚡ NR22888 Command</h1>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">
              Seamaty Brasil • Sniper Mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status offline */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{
                background: isOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                border: `1px solid ${isOnline ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
              }}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[9px] font-bold" style={{ color: isOnline ? '#00ff88' : '#ff4444' }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {/* Msgs pendentes */}
            {pendingMessages.length > 0 && (
              <Link to="/WhatsAppHub">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)' }}>
                    <MessageSquare className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-black text-white">
                    {pendingMessages.length}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── MELHOR OPORTUNIDADE ── */}
      <div className="px-4 pt-2">
        <BestOpportunityCard />
      </div>

      {/* ── KPI CARDS ── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Receita Mês', val: formatCurrency(metrics.monthRevenue), icon: DollarSign, color: '#00ff88', bg: 'rgba(0,255,136,0.08)' },
            { label: 'Previsão', val: formatCurrency(metrics.projectedRevenue), icon: TrendingUp, color: '#ff9500', bg: 'rgba(255,149,0,0.08)' },
            { label: 'Leads Quentes', val: metrics.hotClients.length, icon: Flame, color: '#ff4444', bg: 'rgba(255,68,68,0.08)' },
            { label: 'Em Proposta', val: metrics.proposalClients.length, icon: Star, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-3" style={{ background: bg, border: `1px solid ${color}33` }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-bold" style={{ color: color + 'cc' }}>{label}</span>
              </div>
              <p className="text-lg font-black text-white">{val}</p>
            </div>
          ))}
        </div>

        {/* ── ALERTAS CRÍTICOS ── */}
        {(metrics.overdueTasks.length > 0 || metrics.insumoAlert.length > 0 || pendingMessages.length > 0) && (
          <div className="rounded-2xl p-3 mb-3" style={{ background: '#1a0500', border: '1px solid rgba(255,68,68,0.4)' }}>
            <p className="text-xs font-black text-red-400 mb-2">🚨 Alertas Críticos</p>
            {metrics.overdueTasks.length > 0 && (
              <Link to="/TasksUnified">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-red-300">⚠️ {metrics.overdueTasks.length} tarefas em atraso</span>
                  <ChevronRight className="w-3.5 h-3.5 text-red-600" />
                </div>
              </Link>
            )}
            {metrics.insumoAlert.length > 0 && (
              <Link to="/ModoInsumos">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-orange-300">📦 {metrics.insumoAlert.length} insumos vencendo em 7 dias</span>
                  <ChevronRight className="w-3.5 h-3.5 text-orange-600" />
                </div>
              </Link>
            )}
            {pendingMessages.length > 0 && (
              <Link to="/WhatsAppHub">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-yellow-300">💬 {pendingMessages.length} msgs aguardando aprovação</span>
                  <ChevronRight className="w-3.5 h-3.5 text-yellow-600" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ── MELHOR OPORTUNIDADE DO DIA ── */}
        {bestOpp && (
          <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(255,107,0,0.06)', border: '2px solid rgba(255,107,0,0.4)' }}>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">🎯 MELHOR OPORTUNIDADE DE HOJE</p>
            <div className="space-y-2 mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-white">{bestOpp.name}</p>
                  <p className="text-[11px] text-slate-400">{bestOpp.clinic}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-orange-500">{bestOpp.score}</p>
                  <p className="text-[9px] text-orange-600 font-bold">Score</p>
                </div>
              </div>
              {bestOpp.city && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />{bestOpp.city}
                </p>
              )}
              <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }} className="rounded-lg p-2">
                <p className="text-[10px] text-green-400 font-bold">🔬 {bestOpp.equipment}</p>
                <p className="text-[10px] text-slate-400 mt-1">{bestOpp.potentialReason}</p>
              </div>
              <p className="text-[10px] text-slate-500 italic">→ {bestOpp.nextAction}</p>
            </div>
            <div className="flex gap-2">
              {bestOpp.phone && (
                <a href={`https://wa.me/${bestOpp.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl text-xs font-black text-green-400 text-center"
                  style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                  💬 WhatsApp
                </a>
              )}
              <Link to={`/ClientProfile?id=${bestOpp.id}`} className="flex-1">
                <div className="py-2 rounded-xl text-xs font-black text-blue-400 text-center"
                  style={{ background: 'rgba(0,191,255,0.15)', border: '1px solid rgba(0,191,255,0.3)' }}>
                  📍 Rota
                </div>
              </Link>
              <Link to={`/ClientProfile?id=${bestOpp.id}`} className="flex-1">
                <div className="py-2 rounded-xl text-xs font-black text-purple-400 text-center"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  ✅ Visita
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── PRÓXIMA MELHOR VISITA ── */}
        {metrics.nextVisit && (
          <div className="rounded-2xl p-3 mb-3" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.25)' }}>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">📍 Próxima Visita</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">{metrics.nextVisit.client_name}</p>
                {metrics.nextVisit.location && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />{metrics.nextVisit.location}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-400">
                  {new Date(metrics.nextVisit.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
                <p className="text-[10px] text-slate-500">
                  {new Date(metrics.nextVisit.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <Link to="/SmartRouteOptimizer">
              <button className="mt-2 w-full py-1.5 rounded-xl text-xs font-black text-blue-300"
                style={{ background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.2)' }}>
                🗺️ Abrir Rota Otimizada
              </button>
            </Link>
          </div>
        )}

        {/* ── AÇÕES RÁPIDAS ELITE ── */}
        <div className="rounded-2xl p-3 mb-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">⚡ Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/GenerateWhatsAppIntegrated', label: '💬 Gerar WhatsApp', color: '#25d366', bg: 'rgba(37,211,102,0.08)' },
              { to: '/ProposalGenerator', label: '📄 Gerar Proposta', color: '#ff9500', bg: 'rgba(255,149,0,0.08)' },
              { to: '/SmartRouteOptimizer', label: '🗺️ Abrir Rota', color: '#00bfff', bg: 'rgba(0,191,255,0.08)' },
              { onClick: () => setShowNearby(true), label: '📍 Oportunidades', color: '#00ff88', bg: 'rgba(0,255,136,0.08)' },
              { to: '/ModoCacaComercial', label: '🎯 Modo Caça', color: '#ff4444', bg: 'rgba(255,68,68,0.08)' },
              { to: '/ModoInsumos', label: '📦 Modo Insumos', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
            ].map((item, i) => (
              item.to ? (
                <Link key={i} to={item.to}>
                  <div className="py-2.5 px-3 rounded-xl flex items-center justify-between"
                    style={{ background: item.bg, border: `1px solid ${item.color}33` }}>
                    <span className="text-xs font-black" style={{ color: item.color }}>{item.label}</span>
                    <ArrowRight className="w-3 h-3" style={{ color: item.color }} />
                  </div>
                </Link>
              ) : (
                <button key={i} onClick={item.onClick}>
                  <div className="py-2.5 px-3 rounded-xl flex items-center justify-between"
                    style={{ background: item.bg, border: `1px solid ${item.color}33`, width: '100%' }}>
                    <span className="text-xs font-black" style={{ color: item.color }}>{item.label}</span>
                    <ArrowRight className="w-3 h-3" style={{ color: item.color }} />
                  </div>
                </button>
              )
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 rounded-xl p-1 mb-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.1)' }}>
          {[
            { key: 'overview', label: '📊 Geral' },
            { key: 'hot', label: '🔥 Quentes' },
            { key: 'comodato', label: '🤝 Comodato' },
            { key: 'agenda', label: '📅 Agenda' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveSection(t.key)}
              className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
              style={activeSection === t.key
                ? { background: '#ff6b00', color: 'white' }
                : { color: '#555' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MODO PREDADOR IA ── */}
        <div className="rounded-2xl p-3 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">🧠 IA Sob Demanda</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'pipeline', label: '📊 Pipeline', color: '#7c3aed' },
              { key: 'spin', label: '🎯 Gerar SPIN', color: '#ff6b00' },
              { key: 'forecast', label: '📈 Previsão', color: '#00bfff' },
            ].map(({ key, label, color }) => (
              <button key={key}
                onClick={() => handleQuickAction(key)}
                disabled={generatingAction !== null}
                className="py-2.5 px-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-40"
                style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                {generatingAction === key ? <RefreshCw className="w-3 h-3 animate-spin mx-auto" /> : label}
              </button>
            ))}
          </div>
          {aiMode === 'done' && aiResult && (
            <div className="mt-3 rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.2)' }}>
              <p className="text-xs font-black text-green-400 mb-1">✅ Resultado da IA:</p>
              <pre className="text-[10px] text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}
              </pre>
              <button onClick={() => { setAiMode(null); setAiResult(null); }}
                className="mt-2 text-xs text-orange-500 underline">Fechar</button>
            </div>
          )}
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="space-y-3">
            {/* Ranking do Dia */}
            <Suspense fallback={<HeavyFallback />}>
              <RankingDoDia compact />
            </Suspense>

            {/* Clientes sem compra */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-orange-400">🛒 Clientes sem Compra +30d</p>
                <span className="text-[10px] text-orange-600 font-bold">{metrics.noPurchaseClients.length}</span>
              </div>
              {metrics.noPurchaseClients.slice(0, 5).map(c => (
                <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{c.first_name}</p>
                      <p className="text-[10px] text-slate-500">{c.clinic_name}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-orange-700" />
                  </div>
                </Link>
              ))}
              {metrics.noPurchaseClients.length === 0 && (
                <p className="text-xs text-slate-600">Todos os clientes compraram recentemente! 🎉</p>
              )}
            </div>

            {/* Funil rápido */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-xs font-black text-orange-400 mb-3">🔄 Funil de Vendas</p>
              {[
                { stage: 'lead', label: 'Leads', color: '#64748b' },
                { stage: 'qualificado', label: 'Qualificados', color: '#3b82f6' },
                { stage: 'proposta', label: 'Propostas', color: '#f59e0b' },
                { stage: 'negociacao', label: 'Negociação', color: '#f97316' },
                { stage: 'fechado', label: 'Fechados', color: '#22c55e' },
              ].map(({ stage, label, color }) => {
                const count = clients.filter(c => c.pipeline_stage === stage).length;
                const pct = clients.length ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={stage} className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] w-20 shrink-0" style={{ color }}>{label}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-[10px] w-6 text-right" style={{ color }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Links principais */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/Clients', label: '👥 Clientes', color: '#4f8ef7' },
                { to: '/Leads', label: '🎯 Leads', color: '#00c853' },
                { to: '/WhatsAppHub', label: '💬 WhatsApp', color: '#25d366' },
                { to: '/ScheduledAgenda', label: '📅 Agenda', color: '#ff9500' },
                { to: '/EquipmentCatalog', label: '🔬 Catálogo', color: '#00bfff' },
                { to: '/GlobalSearch', label: '🔍 Busca Global', color: '#a855f7' },
              ].map(({ to, label, color }) => (
                <Link key={to} to={to}>
                  <div className="rounded-xl p-2.5 flex items-center justify-between"
                    style={{ background: '#141414', border: `1px solid ${color}22` }}>
                    <span className="text-xs font-black" style={{ color }}>{label}</span>
                    <ArrowRight className="w-3 h-3" style={{ color }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── QUENTES ── */}
        {activeSection === 'hot' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 mb-2">{metrics.hotClients.length} leads quentes • score ≥ 70</p>
            {metrics.hotClients.slice(0, 15).map(c => (
              <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                <div className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: '#141414', border: '1px solid rgba(255,68,68,0.2)' }}>
                  <div>
                    <p className="text-xs font-black text-white">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                    {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                    <div className="flex gap-2 mt-1">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}>
                        Score {c.purchase_score || 0}
                      </span>
                      {c.pipeline_stage && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500' }}>
                          {c.pipeline_stage}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                          <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                        </div>
                      </a>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-orange-800" />
                  </div>
                </div>
              </Link>
            ))}
            {metrics.hotClients.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Nenhum lead quente no momento.</div>
            )}
          </div>
        )}

        {/* ── COMODATO ── */}
        {activeSection === 'comodato' && (
          <div className="space-y-2">
            <div className="rounded-2xl p-3 mb-2" style={{ background: '#0a1a00', border: '1px solid rgba(0,255,136,0.2)' }}>
              <p className="text-xs font-black text-green-400 mb-1">🤝 Oportunidades de Comodato</p>
              <p className="text-[11px] text-slate-500">
                Clientes com equipamentos Seamaty que podem expandir para comodato estratégico.
              </p>
            </div>
            {metrics.comodatoOpps.map(c => (
              <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                <div className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(0,255,136,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{c.first_name}</p>
                      <p className="text-[10px] text-slate-500">{c.clinic_name}</p>
                      <p className="text-[10px] text-green-400 mt-0.5">📦 {c.equipment_sold}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
                        {c.status}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-green-700 mt-1 ml-auto" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {metrics.comodatoOpps.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">
                Nenhuma oportunidade de comodato identificada.
              </div>
            )}
          </div>
        )}

        {/* ── AGENDA ── */}
        {activeSection === 'agenda' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.2)' }}>
              <p className="text-xs font-black text-blue-400 mb-2">📅 Próximas Visitas</p>
              {metrics.nextVisits.length === 0 && (
                <p className="text-xs text-slate-600">Nenhuma visita agendada.</p>
              )}
              {metrics.nextVisits.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-900 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-white">{v.client_name}</p>
                    {v.location && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{v.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-400">
                      {new Date(v.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(v.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-orange-400">✅ Tarefas Pendentes</p>
                <span className="text-[10px] text-orange-600 font-bold">{tasks.length}</span>
              </div>
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900 last:border-0">
                  <Clock className={`w-3 h-3 shrink-0 ${t.due_date && new Date(t.due_date) < new Date() ? 'text-red-500' : 'text-orange-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.title}</p>
                    {t.client_name && <p className="text-[11px] text-slate-500">{t.client_name}</p>}
                  </div>
                  {t.due_date && (
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-600">Sem tarefas pendentes. 🎉</p>}
              {tasks.length > 8 && (
                <Link to="/TasksUnified">
                  <p className="text-xs text-orange-500 mt-2 underline">Ver todas ({tasks.length})</p>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link to="/VisitRouteManager">
                <div className="rounded-xl p-3 flex items-center gap-2"
                  style={{ background: '#141414', border: '1px solid rgba(0,191,255,0.2)' }}>
                  <Route className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-blue-400">Gestor de Visitas</span>
                </div>
              </Link>
              <Link to="/ScheduledAgenda">
                <div className="rounded-xl p-3 flex items-center gap-2"
                  style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-black text-orange-400">Agenda Completa</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-2"
        style={{ background: 'rgba(10,10,10,0.98)', borderTop: '1px solid rgba(255,107,0,0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/OfflineMode">
              <div className="flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Offline</span>
              </div>
            </Link>
            <Link to="/GlobalSearch">
              <div className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Busca</span>
              </div>
            </Link>
          </div>
          <p className="text-[9px] text-slate-700 font-bold">NR22888 v2.0 • {new Date().toLocaleDateString('pt-BR')}</p>
          <div className="flex items-center gap-3">
            <Link to="/Clients">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[10px] text-orange-700">{metrics.totalClients}</span>
              </div>
            </Link>
            <Link to="/WhatsAppHub">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                {pendingMessages.length > 0 && (
                  <span className="text-[10px] text-red-400 font-bold">{pendingMessages.length}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Oportunidades Próximas */}
      {showNearby && <NearbyOpportunitiesModal onClose={() => setShowNearby(false)} />}
    </div>
  );
}