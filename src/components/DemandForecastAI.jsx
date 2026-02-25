import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Sparkles, TrendingUp, TrendingDown, MapPin, Package,
  Target, RefreshCw, BarChart3, Zap, ChevronDown, ChevronUp,
  Users, DollarSign, AlertTriangle, Activity, Crosshair
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const CACHE_KEY = 'demand_forecast_v2';
const CACHE_TTL = 60 * 60 * 1000; // 1h
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

function StatBox({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/10 rounded-lg p-2.5 border border-white/20 text-center">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-indigo-300 mt-0.5">{label}</p>
      {sub && <p className="text-[8px] text-indigo-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DemandForecastAI() {
  const [forecast, setForecast] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) { const { data, ts } = JSON.parse(raw); if (Date.now() - ts < CACHE_TTL) return data; }
    } catch { }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!!forecast);
  const [activeSection, setActiveSection] = useState('equipment');
  const [scenarioMultiplier, setScenarioMultiplier] = useState(1.0);

  const { data: clients = [] } = useQuery({ queryKey: ['clients-forecast'], queryFn: () => base44.entities.Client.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales-forecast'], queryFn: () => base44.entities.Sale.list() });
  const { data: visits = [] } = useQuery({ queryKey: ['visits-forecast'], queryFn: () => base44.entities.Visit.list() });

  // Monthly trend data from sales
  const monthlyTrend = useMemo(() => {
    const months = {};
    sales.forEach(s => {
      if (!s.sale_date) return;
      const m = s.sale_date.slice(0, 7);
      if (!months[m]) months[m] = { month: m, revenue: 0, units: 0 };
      months[m].revenue += s.sale_value || 0;
      months[m].units++;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(m => ({
      ...m,
      month: m.month.slice(5) + '/' + m.month.slice(2, 4),
      revenue: Math.round(m.revenue / 1000)
    }));
  }, [sales]);

  // Region saturation analysis
  const regionStats = useMemo(() => {
    const stats = {};
    clients.forEach(c => {
      const city = c.city || 'Sem cidade';
      if (!stats[city]) stats[city] = { total: 0, hot: 0, warm: 0, cold: 0, score: 0, sales: 0 };
      stats[city].total++;
      if (c.status === 'quente') stats[city].hot++;
      else if (c.status === 'morno') stats[city].warm++;
      else stats[city].cold++;
      stats[city].score += c.purchase_score || 0;
    });
    sales.forEach(s => {
      if (s.client_name) {
        const c = clients.find(x => x.id === s.client_id);
        if (c?.city && stats[c.city]) stats[c.city].sales++;
      }
    });
    return stats;
  }, [clients, sales]);

  const analyze = async () => {
    setLoading(true);
    try {
      const equipmentSales = {};
      const pipelineByEquip = {};

      sales.forEach(s => {
        const eq = s.equipment_name || 'Outro';
        equipmentSales[eq] = (equipmentSales[eq] || 0) + 1;
      });
      clients.forEach(c => {
        if (c.equipment_interest) {
          pipelineByEquip[c.equipment_interest] = (pipelineByEquip[c.equipment_interest] || 0) + 1;
        }
      });

      const closedSales = sales.filter(s => s.status === 'fechada');
      const totalRevenue = closedSales.reduce((s, x) => s + (x.sale_value || 0), 0);
      const avgDealValue = closedSales.length > 0 ? totalRevenue / closedSales.length : 0;
      const hotClients = clients.filter(c => c.status === 'quente').length;
      const warmClients = clients.filter(c => c.status === 'morno').length;
      const coldClients = clients.filter(c => c.status === 'frio').length;
      const avgScore = clients.length > 0 ? clients.reduce((s, c) => s + (c.purchase_score || 0), 0) / clients.length : 0;

      const topRegions = Object.entries(regionStats)
        .sort((a, b) => (b[1].hot * 3 + b[1].total) - (a[1].hot * 3 + a[1].total))
        .slice(0, 8)
        .map(([city, d]) => `${city}: ${d.total} clientes, ${d.hot} quentes, ${d.warm} mornos, ${d.sales} vendas fechadas, score médio ${d.total > 0 ? (d.score / d.total).toFixed(0) : 0}%`);

      const equipInterest = Object.entries(pipelineByEquip).sort((a, b) => b[1] - a[1]).map(([eq, n]) => `${eq}: ${n} interessados`);
      const salesByEquip = Object.entries(equipmentSales).sort((a, b) => b[1] - a[1]).map(([eq, n]) => `${eq}: ${n} vendas`);

      const trendSummary = monthlyTrend.map(m => `${m.month}: ${m.units} unidades, R$${m.revenue}k`).join(' | ');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de BI especializado em vendas de equipamentos veterinários diagnósticos (Seamaty).

DADOS HISTÓRICOS DO CRM:
- Total clientes: ${clients.length} | Quentes: ${hotClients} | Mornos: ${warmClients} | Frios: ${coldClients}
- Total vendas: ${sales.length} | Fechadas: ${closedSales.length} | Receita total: R$${totalRevenue.toLocaleString('pt-BR')}
- Ticket médio: R$${avgDealValue.toLocaleString('pt-BR')} | Score médio: ${avgScore.toFixed(0)}% | Visitas: ${visits.length}

TENDÊNCIA MENSAL (últimos 6 meses): ${trendSummary || 'Sem dados suficientes'}

VENDAS POR EQUIPAMENTO: ${salesByEquip.join(' | ') || 'Sem dados'}
INTERESSE PIPELINE: ${equipInterest.join(' | ') || 'Sem dados'}
TOP REGIÕES: ${topRegions.join(' || ') || 'Sem dados'}

Gere previsão de demanda completa com foco em:
1. Quais equipamentos têm alta demanda futura e por quê
2. Quais regiões precisam mais foco comercial e por quê
3. Como alocar recursos de vendas de forma otimizada

Retorne JSON completo:
{
  "equipment_demand": [
    { "name": "VG2", "demand_score": 85, "trend": "alta", "reason": "motivo detalhado", "potential_deals": 12, "revenue_potential": 180000, "saturation": 30, "recommended_action": "ação específica" }
  ],
  "region_priority": [
    { "city": "Marília", "priority_score": 90, "action": "ação recomendada", "hot_clients": 5, "opportunity": "tipo", "saturation_pct": 25, "next_30_days_potential": 2 }
  ],
  "resource_allocation": [
    { "area": "Visitas presenciais VG2 em Marília", "allocation_pct": 35, "rationale": "motivo claro", "expected_roi": "R$X em Y semanas", "priority": "alta" }
  ],
  "sales_targets": {
    "next_30_days": { "units": 3, "revenue": 150000, "confidence": 75, "key_driver": "driver principal" },
    "next_90_days": { "units": 8, "revenue": 400000, "confidence": 60, "key_driver": "driver principal" },
    "next_180_days": { "units": 18, "revenue": 900000, "confidence": 45, "key_driver": "driver principal" }
  },
  "key_actions": ["ação 1 detalhada", "ação 2", "ação 3", "ação 4", "ação 5"],
  "market_signals": ["sinal 1", "sinal 2", "sinal 3"],
  "risk_factors": ["risco 1", "risco 2"],
  "summary": "resumo executivo em 2 frases com números concretos",
  "market_opportunity_score": 78,
  "recommended_headcount_focus": "ex: 70% em campo, 30% digital"
}

Equipamentos: VBC-50A (hematológico), SMT-120VP (bioquímico), QT3 (bioquímico portátil), VG1 (gasometria básica), VG2 (gasometria + imuno), Vi1 (imunofluorescência), VQ1 (PCR).
Máximo: 5 equipamentos, 6 regiões, 5 alocações de recursos.`,
        response_json_schema: {
          type: "object",
          properties: {
            equipment_demand: { type: "array", items: { type: "object", properties: { name: { type: "string" }, demand_score: { type: "number" }, trend: { type: "string" }, reason: { type: "string" }, potential_deals: { type: "number" }, revenue_potential: { type: "number" }, saturation: { type: "number" }, recommended_action: { type: "string" } } } },
            region_priority: { type: "array", items: { type: "object", properties: { city: { type: "string" }, priority_score: { type: "number" }, action: { type: "string" }, hot_clients: { type: "number" }, opportunity: { type: "string" }, saturation_pct: { type: "number" }, next_30_days_potential: { type: "number" } } } },
            resource_allocation: { type: "array", items: { type: "object", properties: { area: { type: "string" }, allocation_pct: { type: "number" }, rationale: { type: "string" }, expected_roi: { type: "string" }, priority: { type: "string" } } } },
            sales_targets: { type: "object", properties: { next_30_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" }, key_driver: { type: "string" } } }, next_90_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" }, key_driver: { type: "string" } } }, next_180_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" }, key_driver: { type: "string" } } } } },
            key_actions: { type: "array", items: { type: "string" } },
            market_signals: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            market_opportunity_score: { type: "number" },
            recommended_headcount_focus: { type: "string" }
          }
        }
      });

      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
      setForecast(result);
      setExpanded(true);
      toast.success('Previsão de demanda gerada!');
    } catch (e) {
      toast.error('Erro ao gerar previsão: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const trendColor = { alta: 'text-green-400', estavel: 'text-yellow-400', baixa: 'text-red-400' };
  const trendBg = { alta: 'bg-green-900/40 border-green-500/30', estavel: 'bg-yellow-900/40 border-yellow-500/30', baixa: 'bg-red-900/40 border-red-500/30' };
  const trendIcon = { alta: '📈', estavel: '➡️', baixa: '📉' };
  const priorityBg = { alta: 'bg-red-500', media: 'bg-yellow-500', baixa: 'bg-green-500' };

  const scenarioTargets = forecast ? {
    d30: { units: Math.round((forecast.sales_targets?.next_30_days?.units || 0) * scenarioMultiplier), revenue: Math.round((forecast.sales_targets?.next_30_days?.revenue || 0) * scenarioMultiplier) },
    d90: { units: Math.round((forecast.sales_targets?.next_90_days?.units || 0) * scenarioMultiplier), revenue: Math.round((forecast.sales_targets?.next_90_days?.revenue || 0) * scenarioMultiplier) },
    d180: { units: Math.round((forecast.sales_targets?.next_180_days?.units || 0) * scenarioMultiplier), revenue: Math.round((forecast.sales_targets?.next_180_days?.revenue || 0) * scenarioMultiplier) },
  } : null;

  const SECTIONS = [
    { id: 'equipment', label: '📦 Equipamentos' },
    { id: 'regions', label: '🗺️ Regiões' },
    { id: 'resources', label: '⚖️ Recursos' },
    { id: 'scenario', label: '🎯 Cenários' },
  ];

  return (
    <Card className="border-2 border-indigo-500/40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm">Previsão de Demanda IA</p>
                {forecast?.market_opportunity_score && (
                  <Badge className="bg-green-600 text-white text-[9px] h-4 px-1.5">
                    Oportunidade: {forecast.market_opportunity_score}%
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-indigo-300">
                {clients.length} clientes · {sales.length} vendas · {visits.length} visitas · {Object.keys(regionStats).length} regiões
              </p>
            </div>
          </div>
          {forecast && (
            <button onClick={() => setExpanded(!expanded)} className="text-indigo-300 hover:text-white p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Monthly Trend Mini Chart (always visible if data) */}
        {monthlyTrend.length > 1 && !loading && (
          <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] font-bold text-indigo-300 mb-2 uppercase">📊 Tendência de Vendas (Últimos 6 Meses)</p>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="month" tick={{ fill: '#a5b4fc', fontSize: 9 }} />
                <YAxis tick={{ fill: '#a5b4fc', fontSize: 8 }} />
                <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 6, fontSize: 10 }} labelStyle={{ color: '#e0e7ff' }} formatter={(v) => [`R$${v}k`, 'Receita']} />
                <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CTA */}
        {!forecast && !loading && (
          <Button onClick={analyze} disabled={clients.length === 0} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 font-semibold h-10">
            <Sparkles className="w-4 h-4 mr-2" /> Gerar Previsão de Demanda com IA
          </Button>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
            <p className="text-indigo-300 text-sm font-semibold">Analisando dados...</p>
            <p className="text-indigo-400 text-xs mt-1">{clients.length} clientes · {sales.length} vendas · tendências de mercado</p>
          </div>
        )}

        {/* Collapsed Preview */}
        {forecast && !expanded && (
          <div className="flex flex-wrap gap-2 mt-1">
            {scenarioTargets && (
              <Badge className="bg-indigo-700 text-indigo-100 text-[10px]">
                30d: {scenarioTargets.d30.units} unid · R${(scenarioTargets.d30.revenue / 1000).toFixed(0)}k
              </Badge>
            )}
            {forecast.equipment_demand?.[0] && (
              <Badge className="bg-purple-700 text-purple-100 text-[10px]">📦 {forecast.equipment_demand[0].name} top</Badge>
            )}
            {forecast.region_priority?.[0] && (
              <Badge className="bg-green-800 text-green-100 text-[10px]">📍 {forecast.region_priority[0].city}</Badge>
            )}
          </div>
        )}

        {/* Full Results */}
        {forecast && expanded && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-indigo-900/40 rounded-xl p-3 border border-indigo-500/30">
              <p className="text-[10px] font-bold text-indigo-300 mb-1.5">📋 RESUMO EXECUTIVO</p>
              <p className="text-sm text-white leading-relaxed">{forecast.summary}</p>
              {forecast.recommended_headcount_focus && (
                <div className="mt-2 flex items-center gap-2">
                  <Users className="w-3 h-3 text-indigo-400" />
                  <p className="text-[10px] text-indigo-200">Foco recomendado: <span className="font-semibold text-indigo-100">{forecast.recommended_headcount_focus}</span></p>
                </div>
              )}
            </div>

            {/* Scenario Simulator */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/15">
              <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">🎯 Simulador de Cenários</p>
              <div className="flex items-center gap-3 mb-3">
                {[
                  { label: 'Conservador', val: 0.7, color: 'bg-red-600' },
                  { label: 'Base', val: 1.0, color: 'bg-indigo-600' },
                  { label: 'Otimista', val: 1.3, color: 'bg-green-600' },
                  { label: 'Agressivo', val: 1.6, color: 'bg-yellow-500' },
                ].map(s => (
                  <button key={s.val} onClick={() => setScenarioMultiplier(s.val)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition-all ${scenarioMultiplier === s.val ? s.color + ' text-white' : 'bg-white/10 text-indigo-300 hover:bg-white/20'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '30 dias', data: scenarioTargets?.d30, conf: forecast.sales_targets?.next_30_days?.confidence, driver: forecast.sales_targets?.next_30_days?.key_driver },
                  { label: '90 dias', data: scenarioTargets?.d90, conf: forecast.sales_targets?.next_90_days?.confidence, driver: forecast.sales_targets?.next_90_days?.key_driver },
                  { label: '180 dias', data: scenarioTargets?.d180, conf: forecast.sales_targets?.next_180_days?.confidence, driver: forecast.sales_targets?.next_180_days?.key_driver },
                ].map(({ label, data, conf, driver }) => data && (
                  <div key={label} className="bg-white/10 rounded-lg p-2.5 border border-white/20 text-center">
                    <p className="text-[9px] text-indigo-300 font-bold uppercase">{label}</p>
                    <p className="text-xl font-bold text-white">{data.units}</p>
                    <p className="text-[9px] text-indigo-200">unidades</p>
                    <p className="text-xs font-bold text-green-400 mt-1">R${(data.revenue / 1000).toFixed(0)}k</p>
                    <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${conf}%` }} />
                    </div>
                    <p className="text-[8px] text-indigo-400 mt-0.5">{conf}% conf.</p>
                    {driver && <p className="text-[8px] text-yellow-300 mt-1 leading-tight">{driver}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Section Nav */}
            <div className="flex gap-1.5 flex-wrap">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${activeSection === s.id ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-300 hover:bg-white/20'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Equipment Demand */}
            {activeSection === 'equipment' && forecast.equipment_demand?.length > 0 && (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={forecast.equipment_demand} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#a5b4fc', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#a5b4fc', fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#e0e7ff' }} formatter={(v) => [v + '%', 'Score Demanda']} />
                    <Bar dataKey="demand_score" radius={[4, 4, 0, 0]} name="Demanda">
                      {forecast.equipment_demand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                    <Bar dataKey="saturation" radius={[4, 4, 0, 0]} name="Saturação" fill="#ffffff20">
                      {forecast.equipment_demand.map((_, i) => <Cell key={i} fill="#ffffff15" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {forecast.equipment_demand.map((eq, i) => (
                    <div key={i} className={`rounded-lg p-3 border ${trendBg[eq.trend] || 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ background: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-white">{eq.name}</span>
                            <span className={`text-[10px] font-semibold ${trendColor[eq.trend]}`}>{trendIcon[eq.trend]} {eq.trend}</span>
                            {eq.saturation !== undefined && (
                              <span className="text-[9px] text-slate-400">Saturação: {eq.saturation}%</span>
                            )}
                          </div>
                          <p className="text-[10px] text-indigo-300 mb-1">{eq.reason}</p>
                          {eq.recommended_action && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />
                              <p className="text-[9px] text-yellow-300">{eq.recommended_action}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-white">{eq.demand_score}%</p>
                          <p className="text-[9px] text-green-400">{eq.potential_deals} deals</p>
                          <p className="text-[9px] text-indigo-300">R${(eq.revenue_potential / 1000).toFixed(0)}k</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regions */}
            {activeSection === 'regions' && forecast.region_priority?.length > 0 && (
              <div className="space-y-2">
                {forecast.region_priority.map((r, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-sm text-white">{r.city}</span>
                        {i === 0 && <Badge className="text-[8px] bg-yellow-500 text-black h-4 px-1">🥇 TOP</Badge>}
                        <Badge className="text-[8px] bg-indigo-700 text-indigo-100 h-4 px-1">{r.opportunity}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-red-400">🔥 {r.hot_clients} quentes</span>
                        {r.next_30_days_potential !== undefined && (
                          <span className="text-[10px] text-green-400">+{r.next_30_days_potential} 30d</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${r.priority_score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-indigo-300 w-10 text-right">{r.priority_score}pts</span>
                    </div>
                    {r.saturation_pct !== undefined && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[9px] text-slate-400">Saturação mercado:</p>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${r.saturation_pct}%` }} />
                        </div>
                        <span className="text-[9px] text-orange-300 w-8 text-right">{r.saturation_pct}%</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5">
                      <Crosshair className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-indigo-200">{r.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resource Allocation */}
            {activeSection === 'resources' && forecast.resource_allocation?.length > 0 && (
              <div className="space-y-2">
                {forecast.resource_allocation.map((r, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white flex-1 mr-2">{r.area}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {r.priority && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${priorityBg[r.priority] || 'bg-indigo-600'} text-white`}>
                            {r.priority}
                          </span>
                        )}
                        <span className="text-sm font-bold text-indigo-300">{r.allocation_pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.allocation_pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-[9px] text-indigo-300">{r.rationale}</p>
                    {r.expected_roi && (
                      <div className="flex items-center gap-1 mt-1">
                        <DollarSign className="w-2.5 h-2.5 text-green-400" />
                        <p className="text-[9px] text-green-300">ROI esperado: {r.expected_roi}</p>
                      </div>
                    )}
                  </div>
                ))}
                {/* Allocation Donut */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[9px] font-bold text-indigo-300 mb-2">Distribuição Visual de Recursos</p>
                  <div className="space-y-1.5">
                    {forecast.resource_allocation.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <p className="text-[9px] text-indigo-200 flex-1 truncate">{r.area}</p>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.allocation_pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <p className="text-[9px] text-white font-bold w-6 text-right">{r.allocation_pct}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scenario Tab */}
            {activeSection === 'scenario' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {forecast.market_signals?.length > 0 && (
                    <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                      <p className="text-[10px] font-bold text-green-400 mb-1.5 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> SINAIS DE MERCADO
                      </p>
                      {forecast.market_signals.map((s, i) => (
                        <p key={i} className="text-[10px] text-green-200 mb-1.5 flex items-start gap-1">
                          <span className="text-green-400 mt-0.5">•</span> {s}
                        </p>
                      ))}
                    </div>
                  )}
                  {forecast.risk_factors?.length > 0 && (
                    <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                      <p className="text-[10px] font-bold text-red-400 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> FATORES DE RISCO
                      </p>
                      {forecast.risk_factors.map((r, i) => (
                        <p key={i} className="text-[10px] text-red-200 mb-1.5 flex items-start gap-1">
                          <span className="text-red-400 mt-0.5">•</span> {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {forecast.key_actions?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">✅ Ações Estratégicas Imediatas</p>
                    <div className="space-y-1.5">
                      {forecast.key_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                          <span className="text-indigo-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                          <p className="text-xs text-white leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refresh */}
            <Button size="sm" variant="ghost" className="w-full text-indigo-400 hover:text-white text-xs h-7 mt-2"
              onClick={() => { sessionStorage.removeItem(CACHE_KEY); setForecast(null); setExpanded(false); }}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reanalisar dados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}