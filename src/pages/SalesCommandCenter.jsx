import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Users, AlertCircle, Calendar, Route, DollarSign,
  Zap, Target, ChevronRight, Phone, RefreshCw, Clock, CheckCircle,
  Flame, Star, MessageSquare, BarChart3, ArrowRight, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

// ─── STALE TIMES CONSERVADORES (evita polling contínuo) ───
const STALE_5MIN = 5 * 60 * 1000;
const STALE_2MIN = 2 * 60 * 1000;

export default function SalesCommandCenter() {
  const [aiMode, setAiMode] = useState(null); // null | 'loading' | 'done'
  const [aiResult, setAiResult] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  // ─── DATA FETCHING OTIMIZADO (sem polling) ───
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

  // ─── MÉTRICAS CALCULADAS (memoized) ───
  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now - 7 * 86400000);

    const hotClients = clients.filter(c => (c.purchase_score || 0) >= 70 || c.status === 'quente');
    const coldClients = clients.filter(c => {
      if (!c.last_contact_date) return true;
      return new Date(c.last_contact_date) < sevenDaysAgo;
    });
    const proposalClients = clients.filter(c => c.pipeline_stage === 'proposta' || c.pipeline_stage === 'negociacao');
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
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const projectedRevenue = proposalClients.reduce((a, c) => a + (c.projected_revenue || c.average_purchase_value || 0), 0);

    return {
      hotClients,
      coldClients: coldClients.slice(0, 20),
      proposalClients,
      closedSales,
      monthRevenue,
      nextVisits,
      overdueTasks,
      projectedRevenue,
      totalClients: clients.length,
    };
  }, [clients, tasks, visits, sales]);

  // ─── MODO PREDADOR: IA sob demanda ───
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
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
      }
      setAiResult(res?.data || { message: 'Análise concluída.' });
      setAiMode('done');
    } catch (e) {
      toast.error('Erro na análise: ' + e.message);
      setAiMode(null);
    }
  }, [metrics]);

  const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* HEADER */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">⚡ Sales Command Center</h1>
            <p className="text-xs text-orange-600">Central de Comando • Modo Potência Inteligente</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('Home')}>
              <button className="h-8 px-3 rounded-xl text-xs font-bold text-orange-400"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
                🏠 Home
              </button>
            </Link>
          </div>
        </div>

        {/* KPI CARDS */}
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
                <span className="text-[10px] font-bold" style={{ color: color + 'cc' }}>{label}</span>
              </div>
              <p className="text-lg font-black text-white">{val}</p>
            </div>
          ))}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.1)' }}>
          {[
            { key: 'overview', label: '📊 Geral' },
            { key: 'hot', label: '🔥 Quentes' },
            { key: 'pipeline', label: '🎯 Pipeline' },
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
      </div>

      <div className="px-4">

        {/* ── MODO PREDADOR ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.25)' }}>
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">
            ⚡ Modo Predador — IA Sob Demanda
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'pipeline', label: '📊 Analisar Pipeline', color: '#7c3aed' },
              { key: 'priority', label: '🎯 Priorizar Leads', color: '#ff6b00' },
              { key: 'forecast', label: '📈 Previsão Vendas', color: '#00bfff' },
            ].map(({ key, label, color }) => (
              <button key={key}
                onClick={() => activatePredatorMode(key)}
                disabled={aiMode === 'loading'}
                className="py-2.5 px-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-40"
                style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                {aiMode === 'loading' ? '⏳' : label}
              </button>
            ))}
          </div>

          {aiMode === 'loading' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              IA processando análise avançada...
            </div>
          )}

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
            {/* Alertas críticos */}
            {(metrics.overdueTasks.length > 0 || metrics.coldClients.length > 0) && (
              <div className="rounded-2xl p-3" style={{ background: '#1a0500', border: '1px solid rgba(255,68,68,0.3)' }}>
                <p className="text-xs font-black text-red-400 mb-2">🚨 Atenção Imediata</p>
                {metrics.overdueTasks.length > 0 && (
                  <Link to={createPageUrl('TasksUnified')}>
                    <div className="flex items-center justify-between py-2 border-b border-red-900">
                      <span className="text-xs text-red-300">⚠️ {metrics.overdueTasks.length} tarefas em atraso</span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  </Link>
                )}
                {metrics.coldClients.length > 0 && (
                  <Link to={createPageUrl('ActiveProspecting')}>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-red-300">❄️ {metrics.coldClients.length} clientes sem contato +7d</span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: 'ActiveProspecting', label: '🎯 Prospecção Ativa', color: '#00ff88' },
                { to: 'SmartRouteOptimizer', label: '🗺️ Rota do Dia', color: '#00bfff' },
                { to: 'WhatsAppMasterAssistantLapidado', label: '💬 WhatsApp Master', color: '#ff9500' },
                { to: 'SalesFunnelKanban', label: '📊 Funil Kanban', color: '#7c3aed' },
              ].map(({ to, label, color }) => (
                <Link key={to} to={createPageUrl(to)}>
                  <div className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: '#141414', border: `1px solid ${color}22` }}>
                    <span className="text-xs font-black" style={{ color }}>{label}</span>
                    <ArrowRight className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </Link>
              ))}
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
          </div>
        )}

        {/* ── LEADS QUENTES ── */}
        {activeSection === 'hot' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 mb-2">{metrics.hotClients.length} leads quentes • score ≥ 70</p>
            {metrics.hotClients.slice(0, 15).map(c => (
              <Link key={c.id} to={`${createPageUrl('ClientProfile')}?id=${c.id}`}>
                <div className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: '#141414', border: '1px solid rgba(255,68,68,0.2)' }}>
                  <div>
                    <p className="text-xs font-black text-white">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                    {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}>
                        Score {c.purchase_score || 0}
                      </span>
                      {c.pipeline_stage && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500' }}>
                          {c.pipeline_stage}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noopener noreferrer"
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

        {/* ── PIPELINE ── */}
        {activeSection === 'pipeline' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 mb-2">{metrics.proposalClients.length} clientes em proposta/negociação</p>
            {metrics.proposalClients.map(c => (
              <Link key={c.id} to={`${createPageUrl('ClientProfile')}?id=${c.id}`}>
                <div className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                      {c.clinic_name && <p className="text-[10px] text-slate-500">{c.clinic_name}</p>}
                    </div>
                    <div className="text-right">
                      {c.projected_revenue && (
                        <p className="text-xs font-black text-purple-400">{formatCurrency(c.projected_revenue)}</p>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7' }}>
                        {c.pipeline_stage}
                      </span>
                    </div>
                  </div>
                  {c.next_action && (
                    <p className="text-[10px] text-slate-500 mt-1.5">→ {c.next_action}</p>
                  )}
                </div>
              </Link>
            ))}
            {metrics.proposalClients.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Nenhuma proposta ativa.</div>
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

            {/* Tarefas pendentes */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-xs font-black text-orange-400 mb-2">✅ Tarefas Pendentes ({tasks.length})</p>
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900 last:border-0">
                  <Clock className={`w-3 h-3 shrink-0 ${t.due_date && new Date(t.due_date) < new Date() ? 'text-red-500' : 'text-orange-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{t.title}</p>
                    {t.client_name && <p className="text-[9px] text-slate-600">{t.client_name}</p>}
                  </div>
                  {t.due_date && (
                    <span className="text-[9px] text-slate-500 shrink-0">
                      {new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-600">Sem tarefas pendentes. 🎉</p>}
              {tasks.length > 8 && (
                <Link to={createPageUrl('TasksUnified')}>
                  <p className="text-xs text-orange-500 mt-2 underline">Ver todas ({tasks.length})</p>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}