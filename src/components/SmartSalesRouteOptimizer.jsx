import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Loader2, Navigation, Clock, MapPin, TrendingUp,
  Car, DollarSign, AlertTriangle, MessageSquare, Star, Flame,
  Zap, Target, ChevronDown, ChevronUp, Phone, CheckCircle2,
  Calendar, BarChart3, Route
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

const CITY_COORDS = {
  'Marília': [-22.2139, -49.9461], 'Bauru': [-22.3149, -49.0614],
  'Lins': [-21.6778, -49.7436], 'Botucatu': [-22.8858, -48.4450],
  'Ourinhos': [-22.9789, -49.8708], 'Assis': [-22.6614, -50.4122],
  'Tupã': [-21.9347, -50.5136], 'Jaú': [-22.2964, -48.5578],
  'Garça': [-22.2128, -49.6537], 'Presidente Prudente': [-22.1256, -51.3886],
  'São Paulo': [-23.5505, -46.6333], 'Campinas': [-22.9099, -47.0626],
  'Piracicaba': [-22.7253, -47.6492], 'Sorocaba': [-23.5015, -47.4526],
  'Araçatuba': [-21.2094, -50.4322], 'Avaré': [-23.1017, -48.9241],
  'Birigui': [-21.2861, -50.3381], 'Araraquara': [-21.7948, -48.1758],
  'São José do Rio Preto': [-20.8113, -49.3758], 'Ribeirão Preto': [-21.1704, -47.8103],
};

function calcDist([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPriorityScore(client) {
  let score = 0;
  // Status (40 pts)
  if (client.status === 'quente') score += 40;
  else if (client.status === 'morno') score += 20;
  // Purchase score (30 pts)
  score += ((client.purchase_score || 0) / 100) * 30;
  // Pipeline (20 pts)
  const pipelineWeights = { negociacao: 20, proposta: 15, qualificado: 10, lead: 5, fechado: 0, perdido: 0 };
  score += pipelineWeights[client.pipeline_stage] || 5;
  // Days without contact (10 pts) - more days = higher priority
  if (client.last_contact_date) {
    const days = Math.floor((Date.now() - new Date(client.last_contact_date)) / 86400000);
    score += Math.min(days / 30, 1) * 10;
  } else {
    score += 10; // Never contacted = highest urgency
  }
  // Priority level override
  if (client.priority_level === 1) score += 15;
  else if (client.priority_level === 2) score += 10;
  return Math.min(Math.round(score), 100);
}

export default function SmartSalesRouteOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [expandedDay, setExpandedDay] = useState(0);
  const [config, setConfig] = useState({
    baseCity: 'Marília',
    departureTime: '07:30',
    maxVisitsPerDay: 5,
    maxKmPerDay: 250,
    date: format(new Date(), 'yyyy-MM-dd'),
    focusStatus: 'all',
    minScore: 0,
  });
  const [selectedClients, setSelectedClients] = useState([]);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients-for-route'],
    queryFn: () => base44.entities.Client.list('-purchase_score'),
  });

  // Clients with location data, enriched with priority score
  const eligibleClients = allClients
    .filter(c => c.city && CITY_COORDS[c.city])
    .map(c => ({ ...c, _priorityScore: calcPriorityScore(c) }))
    .filter(c => {
      if (config.focusStatus !== 'all' && c.status !== config.focusStatus) return false;
      if (c._priorityScore < config.minScore) return false;
      return true;
    })
    .sort((a, b) => b._priorityScore - a._priorityScore);

  const toggleClient = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOptimize = async () => {
    const clients = selectedClients.length > 0
      ? eligibleClients.filter(c => selectedClients.includes(c.id))
      : eligibleClients.slice(0, 20);

    if (clients.length === 0) {
      toast.error('Nenhum cliente com cidade cadastrada para otimizar');
      return;
    }

    setIsOptimizing(true);
    setOptimizedRoute(null);

    try {
      const baseCoords = CITY_COORDS[config.baseCity] || CITY_COORDS['Marília'];

      // Pre-group clients by city proximity (local optimization before AI)
      const clientsWithDist = clients.map(c => ({
        ...c,
        _coords: CITY_COORDS[c.city],
        _distFromBase: calcDist(baseCoords, CITY_COORDS[c.city]),
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em logística e otimização de rotas de vendas no interior de SP.

BASE: ${config.baseCity} | SAÍDA: ${config.departureTime} | DATA: ${config.date}
LIMITE: ${config.maxVisitsPerDay} visitas/dia | ${config.maxKmPerDay} km/dia ida+volta

CLIENTES DISPONÍVEIS (${clientsWithDist.length} clientes, ordenados por PRIORIDADE CALCULADA):
${clientsWithDist.map((c, i) => `
[${i + 1}] ${c.first_name} | ${c.clinic_name || 'Sem clínica'} | ${c.city} (${c._distFromBase.toFixed(0)}km)
  Score: ${c._priorityScore}/100 | Status: ${c.status} | Compra: ${c.purchase_score || 0}%
  Pipeline: ${c.pipeline_stage} | Último contato: ${c.last_contact_date || 'nunca'}
  Equip. interesse: ${c.equipment_interest || 'N/A'} | Receita proj.: R$${c.projected_revenue || 0}`).join('\n')}

REGRAS DE OTIMIZAÇÃO:
1. PRIORIDADE: score mais alto = visitar primeiro no dia/semana
2. GEOGRAFIA: agrupar cidades próximas no MESMO dia (minimizar km)
3. TIMING: clientes "quentes" nos primeiros horários do dia (8h-10h)
4. ROTA: ${config.baseCity} → cidades próximas → retorno → máx ${config.maxKmPerDay}km/dia
5. LOGÍSTICA: máx ${config.maxVisitsPerDay} visitas/dia, 45-75min por visita, almoço 12h-13h

Crie rota OTIMIZADA para maximizar negócios fechados. Retorne JSON:`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            optimization_summary: { type: "string" },
            total_days: { type: "number" },
            total_visits: { type: "number" },
            total_distance_km: { type: "number" },
            estimated_total_cost_r$: { type: "number" },
            efficiency_score: { type: "number" },
            top_opportunity: { type: "string" },
            key_recommendations: { type: "array", items: { type: "string" } },
            daily_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "number" },
                  date_label: { type: "string" },
                  departure_time: { type: "string" },
                  estimated_return: { type: "string" },
                  total_km: { type: "number" },
                  estimated_cost_r$: { type: "number" },
                  cities: { type: "array", items: { type: "string" } },
                  traffic_note: { type: "string" },
                  visits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "number" },
                        client_name: { type: "string" },
                        clinic_name: { type: "string" },
                        city: { type: "string" },
                        priority_score: { type: "number" },
                        suggested_time: { type: "string" },
                        duration_min: { type: "number" },
                        status: { type: "string" },
                        objective: { type: "string" },
                        preparation_tip: { type: "string" },
                        expected_outcome: { type: "string" },
                        drive_from_previous_min: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setOptimizedRoute({ ...result, clients_used: clientsWithDist });
      setExpandedDay(0);
      toast.success(`✅ Rota otimizada! ${result.total_visits} visitas em ${result.total_days} dias`);
    } catch (error) {
      toast.error('Erro ao otimizar rota: ' + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const openMapsRoute = (dayRoute) => {
    const base = encodeURIComponent(config.baseCity + ', SP');
    const waypoints = dayRoute.cities.map(c => encodeURIComponent(c + ', SP')).join('|');
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${base}&destination=${base}&waypoints=${waypoints}&travelmode=driving`, '_blank');
  };

  const shareOnWhatsApp = () => {
    if (!optimizedRoute) return;
    const lines = [`🗺️ *ROTA OTIMIZADA IA - ${format(new Date(config.date), 'dd/MM/yyyy')}*\n`];
    optimizedRoute.daily_routes?.forEach(d => {
      lines.push(`📅 *${d.date_label}* — ${d.cities?.join(' → ')}`);
      lines.push(`🚗 ${d.total_km}km | 💰 R$${d.estimated_cost_r$ || 0} | ⏰ ${d.departure_time}→${d.estimated_return}`);
      d.visits?.forEach((v, i) => {
        lines.push(`  ${i + 1}. ${v.suggested_time} - *${v.client_name}* (${v.city}) 🎯 ${v.objective}`);
      });
      lines.push('');
    });
    lines.push(`📊 Eficiência: ${optimizedRoute.efficiency_score}% | Total: ${optimizedRoute.total_visits} visitas`);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const statusColor = { quente: 'bg-red-100 text-red-700', morno: 'bg-yellow-100 text-yellow-700', frio: 'bg-blue-100 text-blue-700' };
  const statusIcon = { quente: '🔥', morno: '🌡️', frio: '❄️' };

  return (
    <div className="space-y-4">
      {/* Config Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="w-4 h-4 text-indigo-600" />
            Configurar Rota de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cidade base</label>
              <Select value={config.baseCity} onValueChange={v => setConfig(p => ({ ...p, baseCity: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CITY_COORDS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Saída</label>
              <Input type="time" value={config.departureTime}
                onChange={e => setConfig(p => ({ ...p, departureTime: e.target.value }))}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Max visitas/dia</label>
              <Select value={String(config.maxVisitsPerDay)} onValueChange={v => setConfig(p => ({ ...p, maxVisitsPerDay: +v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map(n => <SelectItem key={n} value={String(n)}>{n} visitas</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Foco</label>
              <Select value={config.focusStatus} onValueChange={v => setConfig(p => ({ ...p, focusStatus: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  <SelectItem value="quente">🔥 Só quentes</SelectItem>
                  <SelectItem value="morno">🌡️ Quentes + Mornos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Priority Preview */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">
              Clientes elegíveis: <strong>{eligibleClients.length}</strong>
              {selectedClients.length > 0 && <span className="text-indigo-600"> ({selectedClients.length} selecionados)</span>}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {eligibleClients.slice(0, 15).map(c => (
                <button key={c.id}
                  onClick={() => toggleClient(c.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    selectedClients.includes(c.id) ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    c._priorityScore >= 70 ? 'bg-red-500 text-white' :
                    c._priorityScore >= 40 ? 'bg-yellow-400 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {c._priorityScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-800 truncate block">{c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''}</span>
                    <span className="text-[10px] text-slate-500">{c.city} · {c.pipeline_stage}</span>
                  </div>
                  <span className="text-[10px] shrink-0">{statusIcon[c.status] || '⚪'}</span>
                  {selectedClients.includes(c.id) && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
            {selectedClients.length > 0 && (
              <button onClick={() => setSelectedClients([])} className="text-xs text-red-500 mt-1 hover:underline">
                Limpar seleção
              </button>
            )}
          </div>

          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || eligibleClients.length === 0}
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isOptimizing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Otimizando com IA...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Gerar Rota Otimizada</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {optimizedRoute && (
        <div className="space-y-3">
          {/* Summary KPIs */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { icon: Calendar, label: 'Dias', value: optimizedRoute.total_days },
                  { icon: Target, label: 'Visitas', value: optimizedRoute.total_visits },
                  { icon: Navigation, label: 'km Total', value: `${optimizedRoute.total_distance_km || 0}` },
                  { icon: BarChart3, label: 'Eficiência', value: `${optimizedRoute.efficiency_score}%` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-4 h-4 mx-auto text-indigo-600 mb-0.5" />
                    <div className="text-lg font-bold text-indigo-900">{value}</div>
                    <div className="text-[10px] text-indigo-600">{label}</div>
                  </div>
                ))}
              </div>

              {optimizedRoute.top_opportunity && (
                <div className="bg-white/70 rounded-lg p-2.5 mb-2 border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-800 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Maior oportunidade
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5">{optimizedRoute.top_opportunity}</p>
                </div>
              )}

              {optimizedRoute.key_recommendations?.map((r, i) => (
                <div key={i} className="text-xs text-indigo-700 flex items-start gap-1.5 mt-1">
                  <Zap className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />{r}
                </div>
              ))}

              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={shareOnWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOptimizedRoute(null)}
                  className="h-8 text-xs">
                  Nova Rota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Routes */}
          {optimizedRoute.daily_routes?.map((day, di) => (
            <Card key={di} className={`border-2 ${expandedDay === di ? 'border-indigo-300' : 'border-slate-200'}`}>
              <button
                onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{day.day_number}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{day.date_label}</p>
                  <p className="text-xs text-slate-500">{day.cities?.join(' → ')} · {day.visits?.length} visitas · {day.total_km}km</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-indigo-100 text-indigo-700">
                    🕐 {day.departure_time}→{day.estimated_return}
                  </Badge>
                  {expandedDay === di ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {expandedDay === di && (
                <CardContent className="pt-0 pb-3">
                  {/* Day info */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🚗 {day.total_km}km</span>
                    <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">💰 R${day.estimated_cost_r$ || 0}</span>
                    {day.traffic_note && <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🚦 {day.traffic_note}</span>}
                  </div>

                  {/* Visit cards */}
                  <div className="space-y-2">
                    {day.visits?.map((visit, vi) => {
                      const clientData = optimizedRoute.clients_used?.find(c => c.first_name === visit.client_name);
                      const coords = clientData ? CITY_COORDS[clientData.city] : null;
                      return (
                        <div key={vi} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start gap-2">
                            {/* Order + Priority indicator */}
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                visit.priority_score >= 70 ? 'bg-red-500' :
                                visit.priority_score >= 40 ? 'bg-yellow-500' : 'bg-slate-400'
                              }`}>{visit.order}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-sm text-slate-900">{visit.client_name}</span>
                                {visit.status && <span className="text-[10px]">{statusIcon[visit.status] || ''}</span>}
                                <Badge className={`text-[10px] px-1.5 py-0 ${statusColor[visit.status] || 'bg-slate-100 text-slate-600'}`}>
                                  Score {visit.priority_score}
                                </Badge>
                              </div>
                              {visit.clinic_name && <p className="text-xs text-slate-500">{visit.clinic_name}</p>}
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                <span>📍 {visit.city}</span>
                                <span>🕐 {visit.suggested_time}</span>
                                <span>⏱️ {visit.duration_min}min</span>
                                {visit.drive_from_previous_min > 0 && <span>🚗 +{visit.drive_from_previous_min}min</span>}
                              </div>
                              <div className="mt-1.5 space-y-0.5">
                                <p className="text-[11px] font-medium text-indigo-700">🎯 {visit.objective}</p>
                                {visit.preparation_tip && (
                                  <p className="text-[11px] text-slate-600 italic">💡 {visit.preparation_tip}</p>
                                )}
                                {visit.expected_outcome && (
                                  <p className="text-[11px] text-green-700">✅ {visit.expected_outcome}</p>
                                )}
                              </div>
                              {/* Navigation buttons */}
                              <div className="flex gap-1.5 mt-2">
                                <button
                                  onClick={() => {
                                    const q = coords ? `${coords[0]},${coords[1]}` : encodeURIComponent(visit.city + ', SP');
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`, '_blank');
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-700 hover:bg-blue-100"
                                >
                                  <Navigation className="w-3 h-3" /> Maps
                                </button>
                                <button
                                  onClick={() => {
                                    const q = encodeURIComponent((visit.clinic_name || visit.client_name) + ', ' + visit.city);
                                    window.open(`https://waze.com/ul?q=${q}&navigate=yes`, '_blank');
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-cyan-50 border border-cyan-200 rounded text-[11px] text-cyan-700 hover:bg-cyan-100"
                                >
                                  <Car className="w-3 h-3" /> Waze
                                </button>
                                {clientData?.phone && (
                                  <a
                                    href={`https://wa.me/${clientData.phone}`}
                                    target="_blank" rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-[11px] text-green-700 hover:bg-green-100"
                                  >
                                    <MessageSquare className="w-3 h-3" /> WA
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Route button for full day */}
                  <Button size="sm" onClick={() => openMapsRoute(day)}
                    className="w-full mt-3 h-9 bg-blue-600 hover:bg-blue-700 text-xs">
                    <Route className="w-3.5 h-3.5 mr-1.5" /> Abrir Rota Completa do Dia
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}