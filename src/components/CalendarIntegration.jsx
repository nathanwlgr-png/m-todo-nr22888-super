import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, ExternalLink, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

/**
 * Integração com Google Calendar
 * Sincroniza visitas e tarefas automaticamente
 */
export default function CalendarIntegration() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-calendar'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' })
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-calendar'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' })
  });

  const syncToCalendar = async () => {
    setSyncing(true);
    try {
      const events = [];
      
      // Visitas agendadas
      for (const visit of visits.slice(0, 20)) {
        if (!visit.google_calendar_synced) {
          events.push({
            title: `Visita: ${visit.client_name}`,
            description: `Tipo: ${visit.visit_type}\nLocal: ${visit.location || 'A definir'}\nNotas: ${visit.notes || ''}`,
            start: visit.scheduled_date,
            duration: visit.duration_minutes || 60,
            type: 'visit',
            client_id: visit.client_id
          });
        }
      }

      // Tarefas prioritárias
      for (const task of tasks.filter(t => t.priority === 'alta').slice(0, 15)) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(9, 0, 0); // 9h da manhã
        
        events.push({
          title: `Tarefa: ${task.title}`,
          description: task.description || '',
          start: dueDate.toISOString(),
          duration: 30,
          type: 'task',
          client_id: task.client_id
        });
      }

      setSyncResult({
        total: events.length,
        visits: events.filter(e => e.type === 'visit').length,
        tasks: events.filter(e => e.type === 'task').length
      });

      toast.success('Sincronização preparada!', {
        description: `${events.length} eventos prontos para o calendário`
      });

      // Criar arquivo .ics para importar
      const icsContent = generateICS(events);
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm_eventos.ics';
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(error);
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const generateICS = (events) => {
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CRM Seamaty//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    events.forEach((event, idx) => {
      const start = new Date(event.start);
      const end = new Date(start.getTime() + event.duration * 60000);
      
      ics += `BEGIN:VEVENT
UID:${Date.now()}-${idx}@crm-seamaty
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    ics += 'END:VCALENDAR';
    return ics;
  };

  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Integração Calendário</h3>
          <p className="text-xs text-slate-600">Sincronize visitas e tarefas</p>
        </div>
      </div>

      {syncResult && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-700">Pronto para importar!</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-slate-600">Visitas</p>
              <p className="font-bold text-blue-700">{syncResult.visits}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <p className="text-slate-600">Tarefas</p>
              <p className="font-bold text-purple-700">{syncResult.tasks}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Arquivo .ics baixado. Importe no Google Calendar, Outlook, etc.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={syncToCalendar}
          disabled={syncing}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sincronizando...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Exportar para Calendário
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-white rounded border">
            <p className="text-slate-600">Visitas agendadas</p>
            <p className="font-bold text-slate-800">{visits.length}</p>
          </div>
          <div className="p-2 bg-white rounded border">
            <p className="text-slate-600">Tarefas pendentes</p>
            <p className="font-bold text-slate-800">{tasks.length}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}