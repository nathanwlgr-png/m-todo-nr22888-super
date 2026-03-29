import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Calendar, Route, Clock, Navigation, Zap, Plus,
  ChevronRight, AlertTriangle, CheckCircle, Loader2, RefreshCw,
  Car, Timer, Map, Phone, User, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const formatTime = (iso) => {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
};

export default function VisitRouteManager() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startLocation, setStartLocation] = useState('São Paulo, SP');
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [tab, setTab] = useState('route'); // route | schedule | add

  // DB visits for the day
  const { data: dbVisits = [], refetch: refetchVisits } = useQuery({
    queryKey: ['visits-day', selectedDate],
    queryFn: async () => {
      const all = await base44.entities.Visit.list('-scheduled_date', 100);
      return all.filter(v => {
        const d = v.scheduled_date?.split('T')[0];
        return d === selectedDate;
      });
    },
    staleTime: 30000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-visit-route'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 120000,
  });

  // Fetch Google Calendar events
  const fetchCalMutation = useMutation({
    mutationFn: () => base44.functions.invoke('optimizeVisitRoute', {
      action: 'fetch_calendar_visits',
      date: selectedDate,
    }),
    onSuccess: (res) => {
      setCalendarEvents(res.data?.events || []);
      toast.success(`${res.data?.events?.length || 0} eventos carregados do Google Calendar`);
    },
    onError: (e) => toast.error('Erro ao buscar Google Calendar: ' + e.message),
  });

  // Optimize route
  const optimizeMutation = useMutation({
    mutationFn: () => {
      const visits = [
        ...dbVisits.map(v => ({
          client_name: v.client_name,
          address: clients.find(c => c.id === v.client_id)?.address || v.location || '',
          scheduled_time: formatTime(v.scheduled_date),
          duration: v.duration_minutes || 60,
          notes: v.notes,
        })),
        ...calendarEvents.filter(e => e.location).map(e => ({
          client_name: e.title,
          address: e.location,
          scheduled_time: formatTime(e.start),
          duration: 60,
        })),
      ];

      if (visits.length === 0) throw new Error('Nenhuma visita com endereço para otimizar');

      return base44.functions.invoke('optimizeVisitRoute', {
        action: 'optimize_route',
        date: selectedDate,
        start_location: startLocation,
        visits,
      });
    },
    onSuccess: (res) => {
      setOptimizedRoute(res.data?.optimized_route);
      setTab('route');
      toast.success('Rota otimizada com sucesso!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // Add visit to Google Calendar
  const addToCalMutation = useMutation({
    mutationFn: (visit) => base44.functions.invoke('optimizeVisitRoute', {
      action: 'create_calendar_event',
      visit,
    }),
    onSuccess: (res) => {
      toast.success('Visita adicionada ao Google Calendar!');
      if (res.data?.event_link) window.open(res.data.event_link, '_blank');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  // New visit form
  const [newVisit, setNewVisit] = useState({ client_id: '', notes: '', scheduled_date: selectedDate + 'T09:00', duration_minutes: 60 });

  const createVisitMutation = useMutation({
    mutationFn: async () => {
      const client = clients.find(c => c.id === newVisit.client_id);
      if (!client) throw new Error('Selecione um cliente');
      await base44.entities.Visit.create({
        client_id: client.id,
        client_name: client.clinic_name || client.full_name,
        scheduled_date: new Date(newVisit.scheduled_date).toISOString(),
        duration_minutes: Number(newVisit.duration_minutes),
        visit_type: 'primeira_visita',
        status: 'agendada',
        notes: newVisit.notes,
        location: client.address || '',
      });
    },
    onSuccess: () => {
      toast.success('Visita criada!');
      qc.invalidateQueries({ queryKey: ['visits-day'] });
      setTab('route');
    },
    onError: (e) => toast.error(e.message),
  });

  const totalVisits = dbVisits.length + calendarEvents.length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Route className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Rotas de Visitas</h1>
            <p className="text-indigo-200 text-sm">Otimização inteligente com Google Calendar</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{dbVisits.length}</p>
            <p className="text-xs text-indigo-200">Visitas CRM</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{calendarEvents.length}</p>
            <p className="text-xs text-indigo-200">Google Cal.</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{optimizedRoute?.total_distance_km || '--'}</p>
            <p className="text-xs text-indigo-200">km totais</p>
          </div>
        </div>
      </div>

      {/* Date & Location Controls */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setOptimizedRoute(null); }}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ponto de Partida
              </label>
              <Input
                placeholder="Ex: Rua das Flores, 100, SP"
                value={startLocation}
                onChange={e => setStartLocation(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => fetchCalMutation.mutate()}
              disabled={fetchCalMutation.isPending}
            >
              {fetchCalMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3 text-blue-500" />}
              Sincronizar Google Calendar
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
              onClick={() => optimizeMutation.mutate()}
              disabled={optimizeMutation.isPending || totalVisits === 0}
            >
              {optimizeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Otimizar Rota IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[
          { id: 'route', label: 'Rota Otimizada', icon: Route },
          { id: 'schedule', label: 'Agenda do Dia', icon: Calendar },
          { id: 'add', label: 'Nova Visita', icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? 'bg-white shadow text-indigo-700' : 'text-slate-500'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB: ROTA OTIMIZADA */}
      {tab === 'route' && (
        <div className="space-y-3">
          {!optimizedRoute && (
            <div className="text-center py-12 text-slate-400">
              <Map className="w-16 h-16 mx-auto text-slate-200 mb-3" />
              <p className="font-semibold">Nenhuma rota otimizada ainda</p>
              <p className="text-sm mt-1">Adicione visitas e clique em "Otimizar Rota IA"</p>
            </div>
          )}

          {optimizedRoute && (
            <>
              {/* Summary */}
              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-800 text-sm">{optimizedRoute.route_summary}</p>
                      <div className="flex gap-4 mt-2 text-xs text-indigo-600">
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" />{optimizedRoute.total_distance_km} km</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{optimizedRoute.total_travel_time_min} min</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Saída: {optimizedRoute.departure_time}</span>
                      </div>
                    </div>
                  </div>
                  {optimizedRoute.tips?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {optimizedRoute.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-indigo-700 flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-0.5">💡</span>{tip}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visits ordered */}
              <div className="space-y-2">
                {(optimizedRoute.optimized_visits || []).map((v, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="pt-0 p-0">
                      <div className="flex">
                        <div className="w-12 bg-indigo-600 flex flex-col items-center justify-center py-4 text-white flex-shrink-0">
                          <span className="text-lg font-black">{v.order}</span>
                        </div>
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">{v.client_name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{v.address || 'Endereço não informado'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-indigo-700">{v.suggested_time}</p>
                              {v.original_scheduled && v.original_scheduled !== v.suggested_time && (
                                <p className="text-xs text-slate-400 line-through">{v.original_scheduled}</p>
                              )}
                            </div>
                          </div>
                          {i > 0 && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Car className="w-3 h-3" />{v.travel_time_from_prev}</span>
                              {v.distance_from_prev && <span>{v.distance_from_prev}</span>}
                            </div>
                          )}
                          {v.traffic_alert && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1">
                              <AlertTriangle className="w-3 h-3" />{v.traffic_alert}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Open in Maps */}
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const waypoints = (optimizedRoute.optimized_visits || [])
                    .map(v => encodeURIComponent(v.address || v.client_name))
                    .join('/');
                  window.open(`https://www.google.com/maps/dir/${encodeURIComponent(startLocation)}/${waypoints}`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Rota no Google Maps
              </Button>
            </>
          )}
        </div>
      )}

      {/* TAB: AGENDA DO DIA */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          {dbVisits.length === 0 && calendarEvents.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto text-slate-200 mb-2" />
              <p>Nenhuma visita para {formatDate(selectedDate + 'T12:00')}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setTab('add')}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar Visita
              </Button>
            </div>
          )}

          {dbVisits.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📋 Visitas CRM ({dbVisits.length})</p>
              <div className="space-y-2">
                {dbVisits.map(v => {
                  const client = clients.find(c => c.id === v.client_id);
                  return (
                    <Card key={v.id}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{v.client_name}</p>
                              <p className="text-xs text-slate-500">{formatTime(v.scheduled_date)} · {v.duration_minutes || 60} min</p>
                              {client?.address && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{client.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 items-end">
                            <Badge className={`text-xs ${v.status === 'realizada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {v.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              onClick={() => addToCalMutation.mutate({
                                client_name: v.client_name,
                                address: client?.address || '',
                                equipment_interest: client?.equipment_interest,
                                notes: v.notes,
                                start_datetime: v.scheduled_date,
                                end_datetime: new Date(new Date(v.scheduled_date).getTime() + (v.duration_minutes || 60) * 60000).toISOString(),
                              })}
                              disabled={addToCalMutation.isPending}
                            >
                              <Calendar className="w-3 h-3" /> Exportar Cal.
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {calendarEvents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">📅 Google Calendar ({calendarEvents.length})</p>
              <div className="space-y-2">
                {calendarEvents.map(e => (
                  <Card key={e.id} className="border-blue-100">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{e.title}</p>
                          <p className="text-xs text-slate-500">{formatTime(e.start)} – {formatTime(e.end)}</p>
                          {e.location && (
                            <p className="text-xs text-blue-600 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: NOVA VISITA */}
      {tab === 'add' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Visita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cliente</label>
              <select
                value={newVisit.client_id}
                onChange={e => setNewVisit(p => ({ ...p, client_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.clinic_name || c.full_name} {c.city ? `— ${c.city}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={newVisit.scheduled_date}
                  onChange={e => setNewVisit(p => ({ ...p, scheduled_date: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Duração (min)</label>
                <Input
                  type="number"
                  value={newVisit.duration_minutes}
                  onChange={e => setNewVisit(p => ({ ...p, duration_minutes: e.target.value }))}
                  className="text-sm"
                  min={15} step={15}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Observações</label>
              <Input
                placeholder="Objetivo da visita, equipamentos, etc..."
                value={newVisit.notes}
                onChange={e => setNewVisit(p => ({ ...p, notes: e.target.value }))}
                className="text-sm"
              />
            </div>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              onClick={() => createVisitMutation.mutate()}
              disabled={createVisitMutation.isPending}
            >
              {createVisitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Criar Visita
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}