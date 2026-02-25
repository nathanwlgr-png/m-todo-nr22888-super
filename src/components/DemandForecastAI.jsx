import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Sparkles, TrendingUp, TrendingDown, MapPin, Package,
  Target, AlertTriangle, RefreshCw, BarChart3, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const CACHE_KEY = 'demand_forecast_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1h

export default function DemandForecastAI() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch all data in parallel
  const { data: clients = [] } = useQuery({ queryKey: ['clients-forecast'], queryFn: () => base44.entities.Client.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales-forecast'], queryFn: () => base44.entities.Sale.list() });
  const { data: visits = [] } = useQuery({ queryKey: ['visits-forecast'], queryFn: () => base44.entities.Visit.list() });

  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch { return null; }
    return null;
  };

  const analyze = async () => {
    const cached = getCached();
    if (cached) { setForecast(cached); setExpanded(true); return; }

    setLoading(true);
    try {
      // Aggregate stats for the prompt
      const equipmentSales = {};
      const regionStats = {};
      const pipelineByEquip = {};

      sales.forEach(s => {
        const eq = s.equipment_name || 'Outro';
        equipmentSales[eq] = (equipmentSales[eq] || 0) + 1;
      });

      clients.forEach(c => {
        const city = c.city || 'Sem cidade';
        if (!regionStats[city]) regionStats[city] = { total: 0, hot: 0, sales: 0, score: 0 };
        regionStats[city].total++;
        if (c.status === 'quente') regionStats[city].hot++;
        regionStats[city].score += (c.purchase_score || 0);
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
        .map(([city, d]) => `${city}: ${d.total} clientes, ${d.hot} quentes, score médio ${(d.score / d.total).toFixed(0)}%`);

      const equipInterest = Object.entries(pipelineByEquip)
        .sort((a, b) => b[1] - a[1])
        .map(([eq, n]) => `${eq}: ${n} interessados`);

      const salesByEquip = Object.entries(equipmentSales)
        .sort((a, b) => b[1] - a[1])
        .map(([eq, n]) => `${eq}: ${n} vendas`);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de business intelligence especializado em vendas de equipamentos veterinários diagnósticos (Seamaty).

DADOS HISTÓRICOS DO CRM:
- Total clientes: ${clients.length} | Quentes: ${hotClients} | Mornos: ${warmClients} | Frios: ${coldClients}
- Total vendas: ${sales.length} | Fechadas: ${closedSales.length} | Receita total: R$${totalRevenue.toLocaleString('pt-BR')}
- Ticket médio: R$${avgDealValue.toLocaleString('pt-BR')} | Score médio clientes: ${avgScore.toFixed(0)}%
- Total visitas: ${visits.length}

VENDAS POR EQUIPAMENTO (histórico):
${salesByEquip.join('\n') || 'Sem dados'}

INTERESSE ATUAL DO PIPELINE (clientes com equipamento de interesse marcado):
${equipInterest.join('\n') || 'Sem dados'}

TOP REGIÕES (por concentração de leads quentes):
${topRegions.join('\n') || 'Sem dados'}

Com base nesses dados, gere uma análise de previsão de demanda completa. Retorne JSON:

{
  "equipment_demand": [
    { "name": "VG2", "demand_score": 85, "trend": "alta", "reason": "motivo curto", "potential_deals": 12, "revenue_potential": 180000 }
  ],
  "region_priority": [
    { "city": "Marília", "priority_score": 90, "action": "ação recomendada curta", "hot_clients": 5, "opportunity": "tipo de oportunidade" }
  ],
  "resource_allocation": [
    { "area": "ex: Visitas presenciais VG2 em Marília", "allocation_pct": 35, "rationale": "motivo" }
  ],
  "sales_targets": {
    "next_30_days": { "units": 3, "revenue": 150000, "confidence": 75 },
    "next_90_days": { "units": 8, "revenue": 400000, "confidence": 60 },
    "next_180_days": { "units": 18, "revenue": 900000, "confidence": 45 }
  },
  "key_actions": ["ação 1", "ação 2", "ação 3", "ação 4", "ação 5"],
  "market_signals": ["sinal 1", "sinal 2", "sinal 3"],
  "risk_factors": ["risco 1", "risco 2"],
  "summary": "resumo executivo em 2 frases"
}

Equipamentos Seamaty: VBC-50A (hematológico), SMT-120VP (bioquímico), QT3 (bioquímico portátil), VG1 (gasometria básica), VG2 (gasometria + imuno), Vi1 (imunofluorescência), VQ1 (PCR).
Seja preciso com os números, baseando-se nos dados fornecidos. Máximo de 5 equipamentos e 6 regiões.`,
        response_json_schema: {
          type: "object",
          properties: {
            equipment_demand: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  demand_score: { type: "number" },
                  trend: { type: "string" },
                  reason: { type: "string" },
                  potential_deals: { type: "number" },
                  revenue_potential: { type: "number" }
                }
              }
            },
            region_priority: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  priority_score: { type: "number" },
                  action: { type: "string" },
                  hot_clients: { type: "number" },
                  opportunity: { type: "string" }
                }
              }
            },
            resource_allocation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  allocation_pct: { type: "number" },
                  rationale: { type: "string" }
                }
              }
            },
            sales_targets: {
              type: "object",
              properties: {
                next_30_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" } } },
                next_90_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" } } },
                next_180_days: { type: "object", properties: { units: { type: "number" }, revenue: { type: "number" }, confidence: { type: "number" } } }
              }
            },
            key_actions: { type: "array", items: { type: "string" } },
            market_signals: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });

      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
      setForecast(result);
      setExpanded(true);
      toast.success('Previsão de demanda gerada!');
    } catch (e) {
      toast.error('Erro ao gerar previsão');
    } finally {
      setLoading(false);
    }
  };

  const trendColor = { alta: 'text-green-600', estavel: 'text-yellow-600', baixa: 'text-red-600' };
  const trendIcon = { alta: '📈', estavel: '➡️', baixa: '📉' };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Previsão de Demanda IA</p>
              <p className="text-[10px] text-indigo-300">{clients.length} clientes · {sales.length} vendas · {visits.length} visitas analisados</p>
            </div>
          </div>
          {forecast && (
            <button onClick={() => setExpanded(!expanded)} className="text-indigo-300 hover:text-white">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* CTA */}
        {!forecast && !loading && (
          <Button onClick={analyze} disabled={clients.length === 0} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 font-semibold">
            <Sparkles className="w-4 h-4 mr-2" /> Gerar Previsão de Demanda com IA
          </Button>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-indigo-300 text-sm">Analisando {clients.length} clientes, {sales.length} vendas e tendências de mercado...</p>
          </div>
        )}

        {/* Results */}
        {forecast && expanded && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-[10px] font-bold text-indigo-300 mb-1">📋 RESUMO EXECUTIVO</p>
              <p className="text-sm text-white leading-relaxed">{forecast.summary}</p>
            </div>

            {/* Sales Targets */}
            <div>
              <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">🎯 Metas de Vendas Previstas</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '30 dias', data: forecast.sales_targets?.next_30_days },
                  { label: '90 dias', data: forecast.sales_targets?.next_90_days },
                  { label: '180 dias', data: forecast.sales_targets?.next_180_days },
                ].map(({ label, data }) => data && (
                  <div key={label} className="bg-white/10 rounded-lg p-2.5 border border-white/20 text-center">
                    <p className="text-[9px] text-indigo-300 font-semibold uppercase">{label}</p>
                    <p className="text-lg font-bold text-white">{data.units}</p>
                    <p className="text-[9px] text-indigo-200">unidades</p>
                    <p className="text-xs font-semibold text-green-400 mt-1">
                      R${(data.revenue / 1000).toFixed(0)}k
                    </p>
                    <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${data.confidence}%` }} />
                    </div>
                    <p className="text-[8px] text-indigo-300 mt-0.5">{data.confidence}% conf.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment Demand */}
            {forecast.equipment_demand?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">📦 Demanda por Equipamento</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={forecast.equipment_demand} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#a5b4fc', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#a5b4fc', fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#e0e7ff' }}
                      formatter={(v, n) => [v + '%', 'Score Demanda']}
                    />
                    <Bar dataKey="demand_score" radius={[4, 4, 0, 0]}>
                      {forecast.equipment_demand.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {forecast.equipment_demand.map((eq, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2.5 border border-white/10 flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{eq.name}</span>
                          <span className={`text-[10px] font-semibold ${trendColor[eq.trend]}`}>{trendIcon[eq.trend]} {eq.trend}</span>
                        </div>
                        <p className="text-[10px] text-indigo-300 truncate">{eq.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-white">{eq.demand_score}%</p>
                        <p className="text-[9px] text-green-400">{eq.potential_deals} deals</p>
                        <p className="text-[9px] text-indigo-300">R${(eq.revenue_potential / 1000).toFixed(0)}k</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Region Priority */}
            {forecast.region_priority?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">🗺️ Regiões Prioritárias</p>
                <div className="space-y-2">
                  {forecast.region_priority.map((r, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span className="font-semibold text-sm text-white">{r.city}</span>
                          {i === 0 && <Badge className="text-[9px] bg-yellow-500 text-black h-4 px-1">🥇 Top</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-red-400">🔥 {r.hot_clients}</span>
                          <span className="font-bold text-indigo-300 text-xs">{r.priority_score}pts</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${r.priority_score}%` }} />
                      </div>
                      <div className="flex items-start gap-1">
                        <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-indigo-200">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource Allocation */}
            {forecast.resource_allocation?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">⚖️ Alocação de Recursos Recomendada</p>
                <div className="space-y-2">
                  {forecast.resource_allocation.map((r, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white truncate flex-1 mr-2">{r.area}</span>
                        <span className="text-sm font-bold text-indigo-300 flex-shrink-0">{r.allocation_pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full" style={{ width: `${r.allocation_pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <p className="text-[9px] text-indigo-300">{r.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Actions */}
            {forecast.key_actions?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">✅ Ações Estratégicas Imediatas</p>
                <div className="space-y-1.5">
                  {forecast.key_actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                      <span className="text-indigo-400 font-bold text-xs flex-shrink-0">{i + 1}.</span>
                      <p className="text-xs text-white">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signals & Risks */}
            <div className="grid grid-cols-2 gap-3">
              {forecast.market_signals?.length > 0 && (
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                  <p className="text-[10px] font-bold text-green-400 mb-1.5">📡 SINAIS DE MERCADO</p>
                  {forecast.market_signals.map((s, i) => (
                    <p key={i} className="text-[10px] text-green-200 mb-1">• {s}</p>
                  ))}
                </div>
              )}
              {forecast.risk_factors?.length > 0 && (
                <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                  <p className="text-[10px] font-bold text-red-400 mb-1.5">⚠️ RISCOS</p>
                  {forecast.risk_factors.map((r, i) => (
                    <p key={i} className="text-[10px] text-red-200 mb-1">• {r}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <Button size="sm" variant="ghost" className="w-full text-indigo-400 hover:text-white text-xs h-7"
              onClick={() => { sessionStorage.removeItem(CACHE_KEY); setForecast(null); setExpanded(false); }}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reanalisar dados
            </Button>
          </div>
        )}

        {/* Collapsed preview */}
        {forecast && !expanded && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-indigo-700 text-indigo-100 text-[10px]">
              30d: {forecast.sales_targets?.next_30_days?.units} unid · R${((forecast.sales_targets?.next_30_days?.revenue || 0) / 1000).toFixed(0)}k
            </Badge>
            {forecast.equipment_demand?.[0] && (
              <Badge className="bg-purple-700 text-purple-100 text-[10px]">
                📦 {forecast.equipment_demand[0].name} top demanda
              </Badge>
            )}
            {forecast.region_priority?.[0] && (
              <Badge className="bg-green-800 text-green-100 text-[10px]">
                📍 {forecast.region_priority[0].city} prioridade
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}