import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import RouteMap from '@/components/RouteOptimizer/RouteMap';
import RouteStats from '@/components/RouteOptimizer/RouteStats';
import WhatsAppRouteAlert from '@/components/RouteOptimizer/WhatsAppRouteAlert';
import {
  RefreshCw, Calendar, MapPin, Zap,
  Navigation, Sparkles, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');
const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const normalizeText = (value) => cleanText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const isInvalidAddress = (value) => {
  const normalized = normalizeText(value);
  return !normalized || ['n a', 'na', 'n/a', 'nao informado', 'sem endereco', 'endereco pendente', 'undefined', 'null'].includes(normalized) || normalized.length < 5;
};

const BAD_NAME_TOKENS = ['cli', 'dra', 'dr', 'c', 'alma'];

const removeBadNameTokens = (value) => cleanText(value)
  .split(/\s+/)
  .filter((part) => !BAD_NAME_TOKENS.includes(normalizeText(part)))
  .join(' ')
  .replace(/\s+/g, ' ')
  .trim();

const isCutName = (value) => {
  const text = cleanText(value);
  const normalized = normalizeText(text);
  const parts = normalized.split(' ').filter(Boolean);
  return !normalized || BAD_NAME_TOKENS.includes(normalized) || parts.every(part => BAD_NAME_TOKENS.includes(part)) || (normalized.length <= 3 && !text.includes(' '));
};

const firstCompleteName = (...values) => {
  for (const value of values) {
    const cleaned = removeBadNameTokens(value);
    if (cleaned && !isCutName(cleaned)) return cleaned;
  }
  return '';
};

const getRouteDisplayName = (stop, client = {}) => {
  const clinicName = firstCompleteName(client.clinic_name, stop.clinic_name);
  if (clinicName) return clinicName;

  const fullName = firstCompleteName(client.full_name, stop.full_name);
  if (fullName) return fullName;

  const clientName = firstCompleteName(stop.client_name, client.first_name);
  if (clientName) return clientName;

  return 'Cliente sem nome completo';
};

export default function SmartRouteOptimizer() {
  const [date, setDate] = useState(localToday());
  const [startLocation, setStartLocation] = useState('Marília, SP');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [clientDetails, setClientDetails] = useState({});
  const [tab, setTab] = useState('rota'); // rota | stats | whatsapp

  // Para otimização em lote por cidade
  const [city, setCity] = useState('');
  const [days, setDays] = useState(3);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [activeMode, setActiveMode] = useState('day'); // day | batch

  const handleOptimizeDay = async () => {
    setLoading(true);
    setResult(null);
    setClientDetails({});
    try {
      const res = await base44.functions.invoke('optimizeDayRoute', {
        date,
        start_location: startLocation,
        notify_phone: null,
      });
      const data = res.data;
      setResult(data);

      const clientIds = [...new Set((data?.optimized_route || []).map(stop => stop.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const clientsById = {};
        const loadedClients = await Promise.all(clientIds.map(id => base44.entities.Client.get(id).catch(() => null)));
        loadedClients.filter(Boolean).forEach(client => { clientsById[client.id] = client; });
        setClientDetails(clientsById);
      }

      if (data?.optimized_route?.length > 0) {
        toast.success(`Rota otimizada! ${data.optimized_route.length} visitas organizadas.`);
        setTab('rota');
      } else {
        toast.info(data?.message || 'Nenhuma visita encontrada para este dia.');
      }
    } catch (e) {
      toast.error('Erro ao otimizar rota: ' + e.message);
    }
    setLoading(false);
  };

  const handleBatchOptimize = async () => {
    if (!city.trim()) { toast.error('Informe a cidade'); return; }
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const res = await base44.functions.invoke('autoOptimizeRoutes', {
        city: city.trim(),
        days,
      });
      setBatchResult(res.data);
      toast.success(res.data?.message || 'Agenda criada!');
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
    setBatchLoading(false);
  };

  // Normaliza apenas a exibicao da rota: nao altera clientes, visitas ou tarefas.
  const rawRoute = result?.optimized_route || [];
  const seenStops = new Set();
  const route = rawRoute
    .map((stop) => {
      const client = clientDetails[stop.client_id] || {};
      const hasValidAddress = !isInvalidAddress(stop.location);
      return {
        ...stop,
        display_name: getRouteDisplayName(stop, client),
        location: hasValidAddress ? cleanText(stop.location) : '',
        original_location: stop.location,
        address_status: hasValidAddress ? 'ok' : 'pendente',
      };
    })
    .filter((stop) => {
      const normalizedAddress = normalizeText(stop.location || 'endereco pendente');
      const normalizedName = normalizeText(stop.display_name);
      const key = `${normalizedName}|${normalizedAddress}`;
      if (seenStops.has(key)) return false;
      seenStops.add(key);
      return true;
    })
    .map((stop, index) => ({ ...stop, display_position: index + 1 }));
  const hasInvalidRouteAddress = route.some(stop => stop.address_status === 'pendente');
  const stats = hasInvalidRouteAddress ? { ...(result?.stats || {}), estimated_km: null, estimated_km_saved: null, estimated_fuel_saved_liters: null, total_drive_minutes: null } : result?.stats;
  const waMessage = result?.whatsapp_message || '';
  const distanceValue = Number(stats?.estimated_km);
  const hasDistance = Number.isFinite(distanceValue) && distanceValue > 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,107,0,0.18)', border: '1px solid rgba(255,107,0,0.4)' }}>
            <Navigation className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Rotas Inteligentes</h1>
            <p className="text-xs text-orange-600">Agenda otimizada • Maps • Rascunho para WhatsApp</p>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-2 rounded-xl p-1 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
          {[
            { key: 'day', label: '📅 Dia', icon: Calendar },
            { key: 'batch', label: '🗓️ Semana', icon: BarChart3 },
          ].map(m => (
            <button key={m.key} onClick={() => setActiveMode(m.key)}
              className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
              style={activeMode === m.key
                ? { background: '#ff6b00', color: 'white' }
                : { color: '#666' }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── MODO DIA ── */}
        {activeMode === 'day' && (
          <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.25)' }}>
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">🎯 Otimizar Rota do Dia</p>

            <div className="space-y-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Data das visitas</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm text-white focus:outline-none"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Ponto de partida</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-600" />
                  <input value={startLocation} onChange={e => setStartLocation(e.target.value)}
                    placeholder="Ex: Marília, SP"
                    className="w-full pl-8 h-10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }} />
                </div>
              </div>

            </div>

            <Button onClick={handleOptimizeDay} disabled={loading}
              className="w-full h-11 font-black gap-2"
              style={{ background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #ff6b00, #ff9500)', color: 'white', border: 'none' }}>
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Calculando rota com IA...</>
                : <><Sparkles className="w-4 h-4" /> Otimizar Rota do Dia</>}
            </Button>
          </div>
        )}

        {/* ── MODO SEMANA ── */}
        {activeMode === 'batch' && (
          <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.25)' }}>
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">📆 Planejar Semana de Visitas</p>
            <div className="space-y-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Cidade alvo</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Ex: Marília"
                  className="w-full h-10 px-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Dias a planejar: <span className="text-orange-400 font-black">{days}</span></label>
                <input type="range" min={1} max={7} value={days} onChange={e => setDays(Number(e.target.value))}
                  className="w-full accent-orange-500" />
              </div>
            </div>

            <Button onClick={handleBatchOptimize} disabled={batchLoading || !city.trim()}
              className="w-full h-11 font-black gap-2"
              style={{ background: batchLoading ? '#1a1a1a' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none' }}>
              {batchLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Criando agenda...</>
                : <><Zap className="w-4 h-4" /> Gerar Agenda da Semana</>}
            </Button>

            {/* Resultado batch */}
            {batchResult && !batchResult.error && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-black text-purple-400 mb-2">✅ {batchResult.message}</p>
                {(batchResult.schedule || []).map(day => (
                  <div key={day.day} className="rounded-xl p-3"
                    style={{ background: '#1a1a1a', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-purple-300">
                        Dia {day.day} — {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>
                        {day.clients?.length} visitas
                      </span>
                    </div>
                    <div className="space-y-1">
                      {(day.clients || []).map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-4 h-4 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</span>
                          <span className="truncate">{c.name} {c.clinic ? `— ${c.clinic}` : ''}</span>
                          <span className="text-[9px] text-purple-600 shrink-0">P{c.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTADO: TABS ── */}
        {result && route.length > 0 && (
          <div>
            {/* Tab switcher resultado */}
            <div className="flex gap-1 rounded-xl p-1 mb-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              {[
                { key: 'rota', label: '🗺️ Rota' },
                { key: 'stats', label: '📊 Economia' },
                { key: 'whatsapp', label: '💬 WhatsApp' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
                  style={tab === t.key
                    ? { background: '#ff6b00', color: 'white' }
                    : { color: '#666' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* KPIs rápidos */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { val: route.length, label: 'Visitas', color: '#ff9500' },
                { val: hasDistance ? `~${distanceValue}km` : 'distância não calculada', label: 'Distância', color: '#00bfff' },
                { val: hasDistance ? `${stats?.estimated_km_saved || 0}km` : 'não calculada', label: 'Economia', color: '#00ff88' },
              ].map(({ val, label, color }) => (
                <div key={label} className="rounded-xl p-2 text-center"
                  style={{ background: '#141414', border: `1px solid ${color}33` }}>
                  <p className="text-sm font-black" style={{ color }}>{val}</p>
                  <p className="text-[9px] text-slate-600">{label}</p>
                </div>
              ))}
            </div>

            {tab === 'rota' && (
              <RouteMap route={route} startLocation={startLocation} />
            )}

            {tab === 'stats' && (
              <RouteStats stats={stats} />
            )}

            {tab === 'whatsapp' && waMessage && (
              <WhatsAppRouteAlert
                message={waMessage}
                date={date}
                totalVisits={route.length}
              />
            )}

            {tab === 'whatsapp' && !waMessage && (
              <div className="rounded-2xl p-6 text-center"
                style={{ background: '#111', border: '1px solid rgba(0,255,136,0.15)' }}>
                <p className="text-sm text-slate-500">Nenhuma mensagem gerada para esta rota.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state após otimizar sem visitas */}
        {result && route.length === 0 && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
            <Calendar className="w-10 h-10 mx-auto mb-3 text-orange-800" />
            <p className="text-sm text-slate-500 mb-1">{result?.message || 'Nenhuma visita encontrada'}</p>
            <p className="text-xs text-slate-600">Agende visitas na tela de Visitas para otimizá-las aqui.</p>
          </div>
        )}

        {/* Dica */}
        {!result && !batchResult && (
          <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.1)' }}>
            <p className="text-xs font-black text-orange-600 mb-2">💡 Como usar:</p>
            <ul className="space-y-1 text-[11px] text-slate-500">
              <li>• <span className="text-orange-400">Dia:</span> otimiza visitas já agendadas para a data escolhida</li>
              <li>• <span className="text-purple-400">Semana:</span> cria agenda automática de uma cidade por 1–7 dias</li>
              <li>• A IA agrupa visitas por região para economizar combustível</li>
              <li>• Revise e abra manualmente o resumo da rota no WhatsApp</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}