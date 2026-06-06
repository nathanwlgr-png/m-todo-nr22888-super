import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Users, AlertCircle, Calendar, Route, DollarSign,
  Zap, Target, ChevronRight, RefreshCw, Clock, MessageSquare,
  BarChart3, ArrowRight, MapPin, Flame, Star, Package, FileText,
  Brain, Search, WifiOff, Bell, Phone, Award, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const STALE_5MIN = 5 * 60 * 1000;
const STALE_2MIN = 2 * 60 * 1000;

// ─── QUICK ACTION BUTTONS ───
const QUICK_ACTIONS = [
  { to: '/Clients', label: '👥 Clientes', color: '#4f8ef7' },
  { to: '/Leads', label: '🎯 Leads', color: '#00c853' },
  { to: '/VisitManager', label: '📍 Visitas', color: '#ff9500' },
  { to: '/TasksUnified', label: '✅ Tarefas', color: '#b44ef7' },
  { to: '/WhatsAppHub', label: '💬 WhatsApp', color: '#25d366' },
  { to: '/SmartRouteOptimizer', label: '🗺️ Rota', color: '#ff6b00' },
  { to: '/ProposalGenerator', label: '📄 Proposta', color: '#f59e0b' },
  { to: '/EquipmentCatalog', label: '🔬 Catálogo', color: '#06b6d4' },
  { to: '/ModoInvestigacaoSuprema', label: '🕵️ Investigar', color: '#a855f7' },
  { to: '/GenerateWhatsAppIntegrated', label: '⚡ SPIN', color: '#ef4444' },
];

export default function SalesCommandCenter() {
  const [aiMode, setAiMode] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const queryClient = useQueryClient();

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

  const { data: pendingMsgs = [] } = useQuery({
    queryKey: ['scc-pending-msgs'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => []),
    staleTime: STALE_2MIN,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['scc-consumables'],
    queryFn: () => base44.entities.ConsumableOrder?.list('-next_reorder_date', 50).catch(() => []),
    staleTime: STALE_5MIN,
  });

  // ─── MÉTRICAS ───
  const metrics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const thirtyDaysAgo = new Date(now - 30 * 86400000);

    const hotClients = clients.filter(c => (c.purchase_score || 0) >= 70 || c.status === 'quente');
    const coldClients = clients.filter(c => {
      if (!c.last_contact_date) return true;
      return new Date(c.last_contact_date) < sevenDaysAgo;
    });
    const noPurchase = clients.filter(c => {
      if (!c.last_purchase_date) return true;
      return new Date(c.last_purchase_date) < thirtyDaysAgo;
    });
    const proposalClients = clients.filter(c => c.pipeline_stage === 'proposta' || c.pipeline_stage === 'negociacao');
    const comodatoOpp = clients.filter(c =>
      c.client_type === 'clinica_pequena' || c.client_type === 'sem_equipamento' ||
      (c.current_volume === 'mais_230_mes' && !c.equipment_sold)
    );

    const closedSales = sales.filter(s => {
      const d = new Date(s.sale_date || s.created_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && (s.status === 'fechada' || s.status === 'entregue');
    });
    const monthRevenue = closedSales.reduce((a, s) => a + (s.sale_value || 0), 0);

    const nextVisits = visits
      .filter(v => new Date(v.scheduled_date) >= now)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .slice(0, 5);

    const bestNextVisit = nextVisits[0] || null;

    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const projectedRevenue = proposalClients.reduce((a, c) => a + (c.projected_revenue || c.average_purchase_value || 0), 0);

    // Ranking do Dia — top 5 por score
    const rankingDia = [...clients]
      .filter(c => c.purchase_score > 0)
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 5);

    // Alertas críticos de consumíveis
    const consumableAlerts = consumables.filter(c => {
      if (!c.next_reorder_date) return false;
      const diff = (new Date(c.next_reorder_date) - now) / 86400000;
      return diff <= 7 && c.status === 'ativo';
    });

    return {
      hotClients, coldClients: coldClients.slice(0, 20), proposalClients,
      comodatoOpp, noPurchase: noPurchase.slice(0, 20),
      closedSales, monthRevenue, nextVisits, bestNextVisit,
      overdueTasks, projectedRevenue, totalClients: clients.length,
      rankingDia, consumableAlerts,
    };
  }, [clients, tasks, visits, sales, consumables]);

  // ─── IA SOB DEMANDA ───
  const activatePredatorMode = useCallback(async (action) => {
    setAiMode('loading');
    setAiResult(null);
    try {
      let res;
      if (action === 'pipeline') {
        res = await base44.functions.invoke('analyzeSalesFunnel', {
          clients: metrics.proposalClients.slice(0, 10).map(c => ({
            id: c.id, name: c.first_name, status: c.status,
            score: c.purchase_score, stage: c.pipeline_stage,
          }))
        });
      } else if (action === 'priority') {
        res = await base44.functions.invoke('aiPrioritizeTasks', {
          clients: metrics.hotClients.slice(0, 15).map(c => ({
            id: c.id, name: c.first_name, score: c.purchase_score,
            last_contact: c.last_contact_date, stage: c.pipeline_stage,
          }))
        });
      } else if (action === 'forecast') {
        res = await base44.functions.invoke('generateSalesForecast', {
          month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        });
      }
      setAiResult(res?.data || { message: 'Análise concluída.' });
      setAiMode('done');
    } catch (e) {
      toast.error('Erro na análise: ' + e.message);
      setAiMode(null);
    }
  }, [metrics]);

  const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
  const isOffline = !navigator.onLine;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>

      {/* ── HEADER ── */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-white">⚡ NR22888</h1>
            <p className="text-[10px] text-orange-600 uppercase tracking-widest">Sales Command Center • Seamaty Brasil</p>
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-yellow-400"
                style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
                <WifiOff className="w-3 h-3" />
                OFFLINE
              </div>
            )}
            <Link to="/NotificationSettings">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <Bell className="w-4 h-4 text-orange-400" />
                {pendingMsgs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black text-white">
                    {pendingMsgs.length}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* ── ALERTAS CRÍTICOS TOPO ── */}
        {(metrics.overdueTasks.length > 0 || metrics.consumableAlerts.length > 0 || pendingMsgs.length > 0) && (
          <div className="rounded-xl p-3 mb-3 flex flex-wrap gap-2" style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)' }}>
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest w-full">🚨 Alertas Críticos</span>
            {metrics.overdueTasks.length > 0 && (
              <Link to="/TasksUnified">
                <span className="text-[11px] px-2 py-1 rounded-lg font-bold text-red-300" style={{ background: 'rgba(255,68,68,0.15)' }}>
                  ⚠️ {metrics.overdueTasks.length} tarefas em atraso
                </span>
              </Link>
            )}
            {pendingMsgs.length > 0 && (
              <Link to="/WhatsAppHub">
                <span className="text-[11px] px-2 py-1 rounded-lg font-bold text-orange-300" style={{ background: 'rgba(255,107,0,0.15)' }}>
                  💬 {pendingMsgs.length} msgs aguardando aprovação
                </span>
              </Link>
            )}
            {metrics.consumableAlerts.length > 0 && (
              <Link to="/ModoInsumos">
                <span className="text-[11px] px-2 py-1 rounded-lg font-bold text-yellow-300" style={{ background: 'rgba(234,179,8,0.15)' }}>
                  📦 {metrics.consumableAlerts.length} insumos críticos
                </span>
              </Link>
            )}
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Receita Mês', val: fmt(metrics.monthRevenue), icon: DollarSign, color: '#00ff88', bg: 'rgba(0,255,136,0.08)' },
            { label: 'Previsão', val: fmt(metrics.projectedRevenue), icon: TrendingUp, color: '#ff9500', bg: 'rgba(255,149,0,0.08)' },
            { label: 'Leads Quentes', val: metrics.hotClients.length, icon: Flame, color: '#ff4444', bg: 'rgba(255,68,68,0.08)' },
            { label: 'Em Proposta', val: metrics.proposalClients.length, icon: Star, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-3" style={{ background: bg, border: `1px solid ${color}33` }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[10px] font-bold" style={{ color: color + 'cc' }}>{label}</span>
              </div>
              <p className="text-lg font-black text-white">{val}</p>
            </div>
          ))}
        </div>

        {/* ── PRÓXIMA MELHOR VISITA ── */}
        {metrics.bestNextVisit && (
          <Link to="/VisitManager">
            <div className="rounded-xl p-3 mb-3 flex items-center justify-between"
              style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.2)' }}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Próxima Visita</p>
                  <p className="text-sm font-black text-white">{metrics.bestNextVisit.client_name}</p>
                  <p className="text-[11px] text-blue-400">
                    {new Date(metrics.bestNextVisit.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às{' '}
                    {new Date(metrics.bestNextVisit.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </div>
          </Link>
        )}

        {/* ── NAV TABS ── */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.1)' }}>
          {[
            { key: 'overview', label: '📊 Geral' },
            { key: 'ranking', label: '🏆 Ranking' },
            { key: 'comodato', label: '🔬 Comodato' },
            { key: 'agenda', label: '📅 Agenda' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveSection(t.key)}
              className="flex-1 py-2 rounded-lg text-[11px] font-black transition-all"
              style={activeSection === t.key ? { background: '#ff6b00', color: 'white' } : { color: '#555' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── AÇÕES RÁPIDAS ── */}
        <div className="grid grid-cols-5 gap-1.5">
          {QUICK_ACTIONS.map(({ to, label, color }) => (
            <Link key={to} to={to}>
              <div className="rounded-xl p-2 text-center" style={{ background: '#141414', border: `1px solid ${color}22` }}>
                <p className="text-[10px] font-black leading-tight" style={{ color }}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── MODO PREDADOR IA ── */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.25)' }}>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">⚡ IA Sob Demanda</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'pipeline', label: '📊 Pipeline', color: '#7c3aed' },
              { key: 'priority', label: '🎯 Priorizar', color: '#ff6b00' },
              { key: 'forecast', label: '📈 Previsão', color: '#00bfff' },
            ].map(({ key, label, color }) => (
              <button key={key} onClick={() => activatePredatorMode(key)}
                disabled={aiMode === 'loading'}
                className="py-2.5 px-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-40"
                style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                {aiMode === 'loading' ? '⏳' : label}
              </button>
            ))}
          </div>
          {aiMode === 'loading' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analisando...
            </div>
          )}
          {aiMode === 'done' && aiResult && (
            <div className="mt-3 rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.2)' }}>
              <p className="text-xs font-black text-green-400 mb-1">✅ Resultado:</p>
              <pre className="text-[10px] text-slate-400 whitespace-pre-wrap max-h-28 overflow-y-auto">
                {typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}
              </pre>
              <button onClick={() => { setAiMode(null); setAiResult(null); }}
                className="mt-2 text-xs text-orange-500 underline">Fechar</button>
            </div>
          )}
        </div>

        {/* ══════ SECTIONS ══════ */}

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="space-y-3">
            {/* Funil */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">🔄 Funil de Vendas</p>
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
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-[10px] w-5 text-right font-bold" style={{ color }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Clientes sem compra +30d */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(234,179,8,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                  ⏰ Sem Compra +30d ({metrics.noPurchase.length})
                </p>
                <Link to="/ActiveProspecting">
                  <span className="text-[10px] text-yellow-600 underline">Ver todos</span>
                </Link>
              </div>
              {metrics.noPurchase.slice(0, 5).map(c => (
                <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{c.first_name || c.full_name}</p>
                      {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {c.phone && (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}>
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(37,211,102,0.1)' }}>
                            <MessageSquare className="w-3 h-3 text-green-400" />
                          </div>
                        </a>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-700" />
                    </div>
                  </div>
                </Link>
              ))}
              {metrics.noPurchase.length === 0 && (
                <p className="text-xs text-slate-600 py-2">Todos com compra recente 🎉</p>
              )}
            </div>

            {/* Gerar SPIN / WhatsApp / Proposta / Rota */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/GenerateWhatsAppIntegrated', label: '⚡ Gerar SPIN', color: '#ef4444' },
                { to: '/WhatsAppHub', label: '💬 Gerar WhatsApp', color: '#25d366' },
                { to: '/ProposalGenerator', label: '📄 Gerar Proposta', color: '#f59e0b' },
                { to: '/SmartRouteOptimizer', label: '🗺️ Abrir Rota', color: '#00bfff' },
              ].map(({ to, label, color }) => (
                <Link key={to} to={to}>
                  <div className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: '#141414', border: `1px solid ${color}22` }}>
                    <span className="text-xs font-black" style={{ color }}>{label}</span>
                    <ArrowRight className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Status Offline */}
            <Link to="/OfflineMode">
              <div className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: isOffline ? 'rgba(234,179,8,0.08)' : '#111', border: `1px solid ${isOffline ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.05)'}` }}>
                <div className="flex items-center gap-2">
                  <WifiOff className={`w-4 h-4 ${isOffline ? 'text-yellow-400' : 'text-slate-600'}`} />
                  <div>
                    <p className={`text-xs font-black ${isOffline ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {isOffline ? '⚠️ Modo Offline Ativo' : '✅ Online — Modo Offline disponível'}
                    </p>
                    <p className="text-[10px] text-slate-600">Toque para gerenciar sincronização</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </Link>
          </div>
        )}

        {/* ── RANKING DO DIA ── */}
        {activeSection === 'ranking' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Top clientes por score de compra</p>
            {metrics.rankingDia.map((c, i) => (
              <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: '#141414', border: i === 0 ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,107,0,0.12)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: i === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(255,107,0,0.1)', color: i === 0 ? '#ffd700' : '#ff9500' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                    {c.clinic_name && <p className="text-[10px] text-slate-500 truncate">{c.clinic_name}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{ color: '#ff4444' }}>{c.purchase_score || 0}</p>
                    <p className="text-[10px] text-slate-600">score</p>
                  </div>
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)' }}>
                        <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                      </div>
                    </a>
                  )}
                </div>
              </Link>
            ))}
            {metrics.rankingDia.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Sem score calculado. Atualize os clientes.</div>
            )}
            <Link to="/RankingAndConsumables">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <span className="text-xs font-black text-orange-400">🏆 Ver Ranking Completo</span>
              </div>
            </Link>
          </div>
        )}

        {/* ── OPORTUNIDADES DE COMODATO ── */}
        {activeSection === 'comodato' && (
          <div className="space-y-2">
            <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <p className="text-xs text-cyan-400 font-black mb-1">🔬 O que é Comodato?</p>
              <p className="text-[11px] text-slate-500">
                Cliente recebe equipamento Seamaty gratuitamente e paga apenas pelos insumos/reagentes mensalmente.
                Ideal para clínicas sem budget para compra direta.
              </p>
            </div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              {metrics.comodatoOpp.length} oportunidades identificadas
            </p>
            {metrics.comodatoOpp.slice(0, 15).map(c => (
              <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                <div className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: '#141414', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <div>
                    <p className="text-xs font-black text-white">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                    {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                      {c.client_type?.replace(/_/g, ' ') || 'potencial'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(37,211,102,0.1)' }}>
                          <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                        </div>
                      </a>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                </div>
              </Link>
            ))}
            {metrics.comodatoOpp.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Nenhuma oportunidade de comodato identificada.</div>
            )}
          </div>
        )}

        {/* ── AGENDA ── */}
        {activeSection === 'agenda' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">📅 Próximas Visitas</p>
                <Link to="/VisitManager">
                  <span className="text-[10px] text-blue-600 underline">+ Agendar</span>
                </Link>
              </div>
              {metrics.nextVisits.length === 0 && (
                <p className="text-xs text-slate-600">Nenhuma visita agendada.</p>
              )}
              {metrics.nextVisits.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-900 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-white">{v.client_name}</p>
                    {v.location && <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{v.location}</p>}
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
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                  ✅ Tarefas ({tasks.length})
                </p>
                <Link to="/TasksUnified">
                  <span className="text-[10px] text-orange-600 underline">Ver todas</span>
                </Link>
              </div>
              {tasks.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900 last:border-0">
                  <Clock className={`w-3 h-3 shrink-0 ${t.due_date && new Date(t.due_date) < new Date() ? 'text-red-500' : 'text-orange-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.title}</p>
                    {t.client_name && <p className="text-[11px] text-slate-500 truncate">{t.client_name}</p>}
                  </div>
                  {t.due_date && (
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-600">Sem tarefas pendentes 🎉</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}