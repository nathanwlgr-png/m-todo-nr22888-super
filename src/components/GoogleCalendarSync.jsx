import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, RefreshCw, Loader2, CheckCircle, Upload, Download,
  Clock, Trash2, AlertCircle, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLOR_MAP = {
  '1': 'bg-blue-100 text-blue-800',
  '5': 'bg-yellow-100 text-yellow-800',
  '6': 'bg-teal-100 text-teal-800',
  '11': 'bg-red-100 text-red-800',
};

export default function GoogleCalendarSync() {
  const [syncingVisits, setSyncingVisits] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['gcal-events'],
    queryFn: async () => {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'get_events' });
      return res.data?.events || [];
    },
    staleTime: 60000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-sync'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
  });

  const syncedCount = visits.filter(v => v.google_calendar_synced).length;

  const handleSyncVisits = async () => {
    setSyncingVisits(true);
    try {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'sync_visits' });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.synced} visitas sincronizadas com Google Calendar!`);
        queryClient.invalidateQueries(['visits-sync']);
        queryClient.invalidateQueries(['visits-agenda']);
        refetch();
      }
    } catch (e) {
      toast.error('Erro ao sincronizar: ' + e.message);
    } finally {
      setSyncingVisits(false);
    }
  };

  const handleSyncTasks = async () => {
    setSyncingTasks(true);
    try {
      const res = await base44.functions.invoke('googleCalendarSync', { action: 'sync_tasks' });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.synced} tarefas exportadas para Google Calendar!`);
      }
    } catch (e) {
      toast.error('Erro ao sincronizar tarefas: ' + e.message);
    } finally {
      setSyncingTasks(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await base44.functions.invoke('googleCalendarSync', { action: 'delete_event', event_id: eventId });
      toast.success('Evento removido do Google Calendar');
      refetch();
    } catch (e) {
      toast.error('Erro ao remover evento');
    }
  };

  const formatEventDate = (event) => {
    const dt = event.start?.dateTime || event.start?.date;
    if (!dt) return '';
    try {
      return format(parseISO(dt), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dt;
    }
  };

  const isCrmEvent = (event) => !!event.extendedProperties?.private?.crm_visit_id || !!event.extendedProperties?.private?.crm_task_id;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Google Calendar Sync</h3>
              <p className="text-xs text-slate-500">Sincronização bidirecional em tempo real</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-700 font-medium">Conectado</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white rounded-lg p-2 text-center border border-indigo-100">
              <p className="text-xl font-bold text-indigo-600">{visits.length}</p>
              <p className="text-xs text-slate-500">Visitas CRM</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-green-100">
              <p className="text-xl font-bold text-green-600">{syncedCount}</p>
              <p className="text-xs text-slate-500">Sincronizadas</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
              <p className="text-xl font-bold text-blue-600">{events.length}</p>
              <p className="text-xs text-slate-500">No Calendário</p>
            </div>
          </div>

          {/* Sync Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSyncVisits}
              disabled={syncingVisits}
              className="bg-indigo-600 hover:bg-indigo-700 text-sm h-9"
            >
              {syncingVisits ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              Exportar Visitas
            </Button>
            <Button
              onClick={handleSyncTasks}
              disabled={syncingTasks}
              variant="outline"
              className="border-indigo-300 text-indigo-700 text-sm h-9"
            >
              {syncingTasks ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
              Exportar Tarefas
            </Button>
          </div>

          {/* Reminder Info */}
          <div className="mt-3 p-2 bg-white/70 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium mb-1">⏰ Lembretes automáticos configurados:</p>
            <div className="flex gap-2 flex-wrap">
              {['24h antes (email)', '1h antes (pop-up)', '15min antes (pop-up)'].map(r => (
                <span key={r} className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{r}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Próximos 30 dias
            </span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 w-7 p-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">Nenhum evento encontrado</p>
              <p className="text-xs mt-1">Sincronize as visitas para criar eventos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {events.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    {isCrmEvent(event)
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <Calendar className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{event.summary}</p>
                    <p className="text-xs text-slate-500">{formatEventDate(event)}</p>
                    {event.location && (
                      <p className="text-xs text-slate-400 truncate">📍 {event.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isCrmEvent(event) && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-0">CRM</Badge>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
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

      {/* Info */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-3 pb-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-0.5">
              <p className="font-semibold">Como funciona a sincronização:</p>
              <p>• Visitas CRM → Google Calendar com lembretes automáticos (24h, 1h, 15min)</p>
              <p>• Tarefas com prazo → exportadas como eventos de dia inteiro</p>
              <p>• Cores automáticas: 🔴 Fechamento · 🟢 Demo · 🔵 Visita geral</p>
              <p>• Sincronize novamente para atualizar eventos já criados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}