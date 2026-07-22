import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, RefreshCw, Loader2, CheckCircle, Upload, Download,
  Clock, Trash2, AlertCircle, Zap, ArrowDownCircle, Plus, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CONNECTOR_ID = '6a6031d8a6b552c19b90098b';

export default function GoogleCalendarSync() {
  const [syncingVisits, setSyncingVisits] = useState(false);
  const [calendarUser, setCalendarUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [activeTab, setActiveTab] = useState('sync'); // sync | import
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: loadingEvents, refetch } = useQuery({
    queryKey: ['gcal-events'],
    queryFn: async () => {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'get_events' });
      setConnected(true);
      return res.data?.events || [];
    },
    staleTime: 60000,
    retry: false,
    enabled: !!calendarUser,
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authenticated) => {
      if (authenticated) {
        setCalendarUser(await base44.auth.me());
      }
      setConnectionLoading(false);
    });
  }, []);

  const connectCalendar = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        const result = await refetch();
        setConnected(!result.error);
      }
    }, 500);
  };

  const disconnectCalendar = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-sync'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
  });

  const syncedCount = visits.filter(v => v.google_calendar_synced).length;
  const notSynced = visits.filter(v => !v.google_calendar_synced).length;

  // Eventos do Google Calendar que NÃO são do CRM (candidatos a importar)
  const externalEvents = events.filter(e =>
    !e.extendedProperties?.private?.crm_visit_id &&
    !e.extendedProperties?.private?.crm_task_id
  );

  const handleSyncVisits = async () => {
    setSyncingVisits(true);
    try {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'sync_visits' });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.synced} visitas sincronizadas!`);
        queryClient.invalidateQueries(['visits-sync']);
        queryClient.invalidateQueries(['visits-agenda']);
        refetch();
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSyncingVisits(false);
    }
  };

  const handleSyncTasks = async () => {
    setSyncingTasks(true);
    try {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'sync_tasks' });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.synced} tarefas exportadas!`);
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSyncingTasks(false);
    }
  };

  const handleImportEvent = async (event) => {
    setImportingId(event.id);
    try {
      const res = await base44.functions.invoke('googleCalendarSync', {
        action: 'import_from_calendar',
        event_id: event.id,
        client_name: event.summary?.replace(/^(Visita:|🏥)/i, '').trim() || event.summary,
      });
      if (res.data?.success) {
        toast.success(`✅ "${event.summary}" importado como visita no CRM!`);
        queryClient.invalidateQueries(['visits-sync']);
        queryClient.invalidateQueries(['visits-agenda']);
        refetch();
      }
    } catch (e) {
      toast.error('Erro ao importar: ' + e.message);
    } finally {
      setImportingId(null);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await base44.functions.invoke('googleCalendarSync', { action: 'delete_event', event_id: eventId });
      toast.success('Evento removido do Google Calendar');
      refetch();
    } catch (e) {
      toast.error('Erro ao remover');
    }
  };

  const formatDate = (event) => {
    const dt = event.start?.dateTime || event.start?.date;
    if (!dt) return '';
    try {
      return format(parseISO(dt), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dt;
    }
  };

  const isCrmEvent = (e) =>
    !!e.extendedProperties?.private?.crm_visit_id ||
    !!e.extendedProperties?.private?.crm_task_id;

  if (connectionLoading || (calendarUser && loadingEvents && !connected)) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  if (!calendarUser) return <Card><CardContent className="pt-6"><Button className="w-full" onClick={() => base44.auth.redirectToLogin()}>Entrar para conectar o Google Calendar</Button></CardContent></Card>;
  if (!connected) return <Card className="border-indigo-200"><CardContent className="space-y-3 pt-6"><p className="text-sm text-slate-600">Conecte sua agenda pessoal para receber visitas com horário e endereço.</p><Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={connectCalendar}><Calendar className="mr-2 h-4 w-4" />Conectar meu Google Calendar</Button></CardContent></Card>;

  return (
    <div className="space-y-4">

      {/* Status Bar */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Google Calendar</h3>
              <p className="text-xs text-slate-500">Sincronização bidirecional automática</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-700 font-medium">Minha agenda conectada</span>
              <button onClick={disconnectCalendar} className="ml-2 text-xs text-slate-500 underline">Desconectar</button>
              </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Visitas CRM', value: visits.length, color: 'text-indigo-600', bg: 'border-indigo-100' },
              { label: 'Sincronizadas', value: syncedCount, color: 'text-green-600', bg: 'border-green-100' },
              { label: 'Pendentes', value: notSynced, color: 'text-orange-500', bg: 'border-orange-100' },
              { label: 'No Calendário', value: events.length, color: 'text-blue-600', bg: 'border-blue-100' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`bg-white rounded-lg p-2 text-center border ${bg}`}>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSyncVisits}
              disabled={syncingVisits}
              className="bg-indigo-600 hover:bg-indigo-700 h-9 text-sm"
            >
              {syncingVisits
                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                : <Upload className="w-4 h-4 mr-1" />}
              Exportar Visitas
            </Button>
            <Button
              onClick={handleSyncTasks}
              disabled={syncingTasks}
              variant="outline"
              className="border-indigo-300 text-indigo-700 h-9 text-sm"
            >
              {syncingTasks
                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                : <Zap className="w-4 h-4 mr-1" />}
              Exportar Tarefas
            </Button>
          </div>

          {/* Auto-sync info */}
          <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-800">🔄 Sync automático ativo</p>
                <p className="text-xs text-green-700">Visitas criadas pela IA são sincronizadas automaticamente com o Google Calendar.</p>
              </div>
            </div>
          </div>

          {/* Lembretes */}
          <div className="mt-2 p-2 bg-white/70 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium mb-1">⏰ Lembretes automáticos:</p>
            <div className="flex gap-2 flex-wrap">
              {['24h antes (email)', '1h antes (pop-up)', '15min antes (pop-up)'].map(r => (
                <span key={r} className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{r}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'sync', label: `📤 CRM → Google (${events.filter(isCrmEvent).length})` },
          { id: 'import', label: `📥 Google → CRM (${externalEvents.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CRM → Google Calendar */}
      {activeTab === 'sync' && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> Eventos do CRM no Calendário
              </span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 w-7 p-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            {loadingEvents ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : events.filter(isCrmEvent).length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">Nenhum evento CRM no calendário</p>
                <p className="text-xs mt-1">Clique em "Exportar Visitas" para sincronizar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {events.filter(isCrmEvent).map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2.5 rounded-lg border bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{event.summary}</p>
                      <p className="text-xs text-slate-500">{formatDate(event)}</p>
                      {event.location && (
                        <p className="text-xs text-slate-400 truncate">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className="text-xs bg-green-100 text-green-700 border-0">CRM</Badge>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        title="Remover do Google Calendar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Google Calendar → CRM (Importar) */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-blue-500" /> Eventos externos para importar
              </span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 w-7 p-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            {loadingEvents ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : externalEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">Sem eventos externos para importar</p>
                <p className="text-xs mt-1">Todos os eventos já estão no CRM</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {externalEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2.5 rounded-lg border bg-white hover:bg-blue-50 transition-colors">
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{event.summary}</p>
                      <p className="text-xs text-slate-500">{formatDate(event)}</p>
                      {event.location && (
                        <p className="text-xs text-slate-400 truncate">📍 {event.location}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImportEvent(event)}
                      disabled={importingId === event.id}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 shrink-0"
                    >
                      {importingId === event.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><Plus className="w-3 h-3 mr-1" />CRM</>
                      }
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-3 pb-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-0.5">
              <p className="font-semibold">Como funciona:</p>
              <p>• 🤖 IA agenda visita → sincronização automática com Google Calendar</p>
              <p>• 📤 "Exportar Visitas" → envia todas as visitas do CRM</p>
              <p>• 📥 "Google → CRM" → importa eventos externos como visitas</p>
              <p>• 🔴 Fechamento · 🟢 Demo · 🟡 Follow-up · 🔵 Primeira visita</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}