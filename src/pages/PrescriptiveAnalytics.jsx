import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap,
  MessageSquare, Users, Calendar, Target, RefreshCw, ChevronRight,
  Loader2, DollarSign, Activity, Clock, Brain
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// ─────────────────────────────────────────────
// Sub-componente: Card de Ação Corretiva
// ─────────────────────────────────────────────
function PrescriptiveActionCard({ action, onExecute, loading }) {
  const urgencyColors = {
    critica: 'border-red-500 bg-red-950/30',
    alta: 'border-orange-500 bg-orange-950/30',
    media: 'border-yellow-500 bg-yellow-950/20',
    baixa: 'border-slate-600 bg-slate-900/30',
  };
  const urgencyBadge = {
    critica: 'bg-red-600 text-white',
    alta: 'bg-orange-600 text-white',
    media: 'bg-yellow-600 text-white',
    baixa: 'bg-slate-600 text-white',
  };
  const icons = {
    followup: <MessageSquare className="w-5 h-5 text-green-400" />,
    visita: <Calendar className="w-5 h-5 text-blue-400" />,
    proposta: <Target className="w-5 h-5 text-purple-400" />,
    reativacao: <Zap className="w-5 h-5 text-yellow-400" />,
    score: <Activity className="w-5 h-5 text-cyan-400" />,
  };

  return (
    <div className={`rounded-xl border-l-4 p-4 ${urgencyColors[action.urgency] || urgencyColors.baixa}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{icons[action.type] || <Brain className="w-5 h-5 text-orange-400" />}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${urgencyBadge[action.urgency]}`}>
                {action.urgency}
              </span>
              <span className="text-[10px] text-slate-400">{action.category}</span>
            </div>
            <p className="text-sm font-bold text-white leading-snug">{action.insight}</p>
            <p className="text-xs text-slate-400 mt-1">{action.detail}</p>
            {action.impact && (
              <p className="text-xs font-semibold text-green-400 mt-1">💰 Impacto potencial: {action.impact}</p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onExecute(action)}
          disabled={loading === action.id}
          className="shrink-0 text-xs h-8 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {loading === action.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
          {action.cta}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────
export default function PrescriptiveAnalytics() {
  const [actions, setActions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [executedIds, setExecutedIds] = useState([]);
  const [generatedMessages, setGeneratedMessages] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Dados ──────────────────────────────────
  const { data: clients = [] } = useQuery({
    queryKey: ['pa-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['pa-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200),
    staleTime: 120000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['pa-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }),
    staleTime: 120000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['pa-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100),
    staleTime: 120000,
  });

  // ── KPIs calculados ────────────────────────
  const now = new Date();
  const thisMonth = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const revenueThisMonth = thisMonth.reduce((a, s) => a + (s.sale_value || 0), 0);
  const revenueLastMonth = lastMonth.reduce((a, s) => a + (s.sale_value || 0), 0);
  const revenueDelta = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

  const hotClients = clients.filter(c => (c.purchase_score || 0) > 70).length;
  const coldClients = clients.filter(c => c.status === 'frio').length;
  const noContact15d = clients.filter(c => {
    if (!c.last_contact_date) return true;
    return (Date.now() - new Date(c.last_contact_date)) / 86400000 > 15;
  });
  const noContact7d = clients.filter(c => {
    if (!c.last_contact_date) return true;
    return (Date.now() - new Date(c.last_contact_date)) / 86400000 > 7;
  });

  const closedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue').length;
  const proposalSales = sales.filter(s => s.status === 'proposta').length;
  const conversionRate = (closedSales + proposalSales) > 0
    ? Math.round((closedSales / (closedSales + proposalSales)) * 100) : 0;

  // Agrupar sem contato por cidade
  const noContactByCityMap = {};
  noContact15d.forEach(c => {
    const city = c.city || 'Sem cidade';
    noContactByCityMap[city] = (noContactByCityMap[city] || 0) + 1;
  });
  const topNoContactCities = Object.entries(noContactByCityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Chart: vendas últimos 6 meses
  const salesByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthSales = sales.filter(s => {
      const sd = new Date(s.sale_date || s.created_date);
      return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
    });
    return {
      mes: d.toLocaleString('pt-BR', { month: 'short' }),
      valor: monthSales.reduce((a, s) => a + (s.sale_value || 0), 0),
      qtd: monthSales.length,
    };
  });

  // ── Gerar ações prescritivas via IA ────────
  const generatePrescriptiveActions = async () => {
    setLoadingAI(true);
    try {
      const context = {
        total_clients: clients.length,
        hot_clients: hotClients,
        cold_clients: coldClients,
        no_contact_15d: noContact15d.length,
        no_contact_by_city: topNoContactCities,
        no_contact_7d: noContact7d.length,
        revenue_this_month: revenueThisMonth,
        revenue_last_month: revenueLastMonth,
        revenue_delta_pct: revenueDelta,
        closed_sales_month: thisMonth.filter(s => s.status === 'fechada').length,
        pending_tasks: tasks.length,
        conversion_rate: conversionRate,
        overdue_proposals: proposalSales,
        scheduled_visits_pending: visits.filter(v => v.status === 'agendada').length,
      };

      const prompt = `Você é o Analytics Prescritivo do CRM Seamaty — sistema de vendas de equipamentos veterinários.

Com base nos KPIs abaixo, gere EXATAMENTE 6 ações corretivas prescritivas priorizadas, bem específicas e acionáveis.
Cada ação deve ter insight direto com números reais, e uma chamada para ação clara.

KPIs atuais:
${JSON.stringify(context, null, 2)}

Clientes sem contato +15 dias por cidade (top 3):
${topNoContactCities.map(([c, n]) => `- ${c}: ${n} clientes`).join('\n')}

Responda com JSON:
{
  "actions": [
    {
      "id": "a1",
      "type": "followup|visita|proposta|reativacao|score",
      "urgency": "critica|alta|media|baixa",
      "category": "categoria curta ex: Reengajamento",
      "insight": "frase direta com números: ex '${topNoContactCities[0]?.[1] || 3} clínicas em ${topNoContactCities[0]?.[0] || 'Marília'} sem contato há 15+ dias'",
      "detail": "explicação breve do por que isso importa agora",
      "impact": "estimativa de impacto financeiro ou percentual",
      "cta": "texto do botão curto (2-3 palavras)",
      "action_payload": { "type": "tipo da ação a executar" }
    }
  ]
}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            actions: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      });

      setActions(res.actions || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      // Fallback com ações baseadas nos dados reais
      const fallback = [];
      if (noContact15d.length > 0) {
        const [topCity, topCount] = topNoContactCities[0] || ['sua região', noContact15d.length];
        fallback.push({
          id: 'f1', type: 'followup', urgency: 'critica', category: 'Reengajamento',
          insight: `${topCount} clínicas em ${topCity} sem contato há 15+ dias`,
          detail: 'Clientes inativos têm alta chance de migrar para concorrentes.',
          impact: 'Recuperação potencial de R$' + (topCount * 15000).toLocaleString('pt-BR'),
          cta: 'Gerar Mensagens',
          action_payload: { type: 'followup' }
        });
      }
      if (revenueDelta < -10) {
        fallback.push({
          id: 'f2', type: 'score', urgency: 'alta', category: 'Performance',
          insight: `Receita caiu ${Math.abs(revenueDelta).toFixed(1)}% vs mês anterior`,
          detail: 'Queda expressiva exige revisão urgente do pipeline.',
          impact: 'Recuperar R$' + Math.abs(revenueThisMonth - revenueLastMonth).toLocaleString('pt-BR'),
          cta: 'Ver Pipeline',
          action_payload: { type: 'pipeline' }
        });
      }
      if (proposalSales > 2) {
        fallback.push({
          id: 'f3', type: 'proposta', urgency: 'alta', category: 'Conversão',
          insight: `${proposalSales} propostas abertas sem fechamento`,
          detail: 'Propostas paradas indicam objeções não tratadas.',
          impact: 'R$' + (proposalSales * 28000).toLocaleString('pt-BR') + ' em risco',
          cta: 'Acelerar Propostas',
          action_payload: { type: 'proposals' }
        });
      }
      if (tasks.length > 5) {
        fallback.push({
          id: 'f4', type: 'reativacao', urgency: 'media', category: 'Produtividade',
          insight: `${tasks.length} tarefas pendentes acumuladas`,
          detail: 'Backlog alto reduz foco e velocidade de fechamento.',
          impact: '+15% conversão ao limpar backlog',
          cta: 'Priorizar Tarefas',
          action_payload: { type: 'tasks' }
        });
      }
      setActions(fallback);
      setLastUpdated(new Date());
    }
    setLoadingAI(false);
  };

  useEffect(() => {
    if (clients.length > 0) generatePrescriptiveActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length]);

  // ── Executar ação ──────────────────────────
  const handleExecuteAction = async (action) => {
    setExecutingId(action.id);
    try {
      if (action.type === 'followup' || action.action_payload?.type === 'followup') {
        // Gerar sequência de mensagens via função existente
        const clients15d = noContact15d.slice(0, 5);
        const res = await base44.functions.invoke('generateAIFollowUpSequence', {
          clients: clients15d.map(c => ({ id: c.id, name: c.first_name || c.full_name, city: c.city, status: c.status })),
          reason: 'reengajamento_15_dias',
          channel: 'whatsapp',
        });
        setGeneratedMessages(res.data);
      } else if (action.type === 'score') {
        await base44.functions.invoke('batchCalculateClientScores', { limit: 50 });
        alert('✅ Scores recalculados com sucesso!');
      } else if (action.type === 'reativacao') {
        await base44.functions.invoke('aiPrioritizeTasks', { limit: 20 });
        alert('✅ Tarefas priorizadas pela IA!');
      } else {
        await base44.functions.invoke('generateProactiveAlerts', { context: action });
        alert('✅ Ação executada com sucesso!');
      }
      setExecutedIds(prev => [...prev, action.id]);
    } catch (e) {
      console.error(e);
      alert('Ação registrada! Execute manualmente pelo módulo correspondente.');
      setExecutedIds(prev => [...prev, action.id]);
    }
    setExecutingId(null);
  };

  const kpis = [
    {
      label: 'Receita do Mês',
      value: `R$ ${(revenueThisMonth / 1000).toFixed(1)}k`,
      delta: revenueDelta,
      icon: <DollarSign className="w-5 h-5" />,
      color: revenueDelta >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Clientes Quentes',
      value: hotClients,
      icon: <Zap className="w-5 h-5 text-orange-400" />,
      color: 'text-orange-400',
      sub: 'score > 70',
    },
    {
      label: 'Sem Contato 15d',
      value: noContact15d.length,
      icon: <Clock className="w-5 h-5 text-red-400" />,
      color: 'text-red-400',
      sub: 'risco de perda',
    },
    {
      label: 'Taxa Conversão',
      value: `${conversionRate}%`,
      icon: <Target className="w-5 h-5 text-purple-400" />,
      color: 'text-purple-400',
      sub: `${closedSales} fechadas`,
    },
    {
      label: 'Tarefas Pendentes',
      value: tasks.length,
      icon: <CheckCircle2 className="w-5 h-5 text-yellow-400" />,
      color: 'text-yellow-400',
      sub: 'para executar',
    },
    {
      label: 'Clientes Frios',
      value: coldClients,
      icon: <AlertTriangle className="w-5 h-5 text-slate-400" />,
      color: 'text-slate-400',
      sub: 'requerem atenção',
    },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-black text-white">🧠 Analytics Prescritivo</h1>
            <p className="text-xs text-orange-500">IA detecta problemas e sugere ações corretivas em tempo real</p>
          </div>
          <Button
            size="sm"
            onClick={generatePrescriptiveActions}
            disabled={loadingAI}
            className="bg-orange-600 hover:bg-orange-700 text-white h-9"
          >
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1 text-xs">Atualizar IA</span>
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-slate-600">
            Última análise: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="px-4 space-y-5">
        {/* KPIs Grid */}
        <div className="grid grid-cols-3 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                {kpi.icon}
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">{kpi.label}</span>
              </div>
              <p className={`text-xl font-black leading-none ${kpi.color}`}>{kpi.value}</p>
              {kpi.delta !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {kpi.delta >= 0
                    ? <TrendingUp className="w-3 h-3 text-green-500" />
                    : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={`text-[10px] font-bold ${kpi.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.delta >= 0 ? '+' : ''}{kpi.delta.toFixed(1)}% vs mês ant.
                  </span>
                </div>
              )}
              {kpi.sub && <p className="text-[9px] text-slate-600 mt-0.5">{kpi.sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart: Receita 6 meses */}
        <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-xs font-black text-orange-400 uppercase tracking-wider mb-3">📊 Receita — Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={salesByMonth} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="mes" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #ff6b00', borderRadius: 8 }}
                labelStyle={{ color: '#ff9500', fontSize: 11 }}
                formatter={(v) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']}
              />
              <Bar dataKey="valor" fill="#ff6b00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ações Prescritivas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-orange-400" />
            <p className="text-xs font-black text-orange-400 uppercase tracking-wider">Ações Corretivas Sugeridas pela IA</p>
            {loadingAI && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
            {actions.length > 0 && !loadingAI && (
              <Badge className="bg-orange-600 text-white text-[9px] ml-auto">
                {actions.filter(a => !executedIds.includes(a.id)).length} pendentes
              </Badge>
            )}
          </div>

          {loadingAI && actions.length === 0 && (
            <div className="rounded-xl p-6 text-center" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-orange-400 font-bold">IA analisando seus dados...</p>
              <p className="text-xs text-slate-500 mt-1">Gerando ações corretivas personalizadas</p>
            </div>
          )}

          <div className="space-y-3">
            {actions.map(action => (
              <div key={action.id} className={executedIds.includes(action.id) ? 'opacity-50' : ''}>
                <PrescriptiveActionCard
                  action={action}
                  onExecute={handleExecuteAction}
                  loading={executingId}
                />
                {executedIds.includes(action.id) && (
                  <p className="text-[10px] text-green-500 mt-1 ml-4">✅ Ação executada</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal resultado de mensagens geradas */}
        {generatedMessages && (
          <div className="rounded-xl p-4" style={{ background: '#0f1f0f', border: '1px solid rgba(0,200,80,0.4)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-green-400">✅ Sequência de Mensagens Gerada</p>
              <button onClick={() => setGeneratedMessages(null)} className="text-slate-500 text-xs">fechar</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(Array.isArray(generatedMessages) ? generatedMessages : [generatedMessages]).map((msg, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: '#162016' }}>
                  {msg.client_name && <p className="text-xs font-bold text-green-300 mb-1">Para: {msg.client_name}</p>}
                  <p className="text-xs text-slate-300">{msg.message || JSON.stringify(msg)}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.message || JSON.stringify(msg))}
                    className="text-[10px] text-green-600 mt-1"
                  >
                    📋 Copiar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clientes sem contato por cidade */}
        {topNoContactCities.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-xs font-black text-orange-400 uppercase tracking-wider mb-3">🗺️ Cidades com Maior Abandono</p>
            <div className="space-y-2">
              {topNoContactCities.map(([city, count], i) => (
                <div key={city} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-500">#{i + 1}</span>
                    <span className="text-sm font-bold text-white">{city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-orange-600" style={{ width: `${Math.min(100, count * 8)}px` }} />
                    <span className="text-xs font-black text-orange-400">{count} clientes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}