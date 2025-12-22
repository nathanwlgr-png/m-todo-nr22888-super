import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Plus, Clock, MapPin, ExternalLink, Settings } from 'lucide-react';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const visitTypeLabels = {
  primeira_visita: 'Primeira Visita',
  demonstracao: 'Demonstração',
  followup: 'Follow-up',
  fechamento: 'Fechamento'
};

const statusColors = {
  agendada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  remarcada: 'bg-amber-100 text-amber-700'
};

export default function Calendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Visit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['visits'])
  });

  const createGoogleCalendarUrl = (visit) => {
    const startDate = parseISO(visit.scheduled_date);
    const endDate = new Date(startDate.getTime() + (visit.duration_minutes || 60) * 60000);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Visita Comercial - ${visit.client_name}`,
      dates: `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
      details: `Tipo: ${visitTypeLabels[visit.visit_type]}\nCliente: ${visit.client_name}\n${visit.notes || ''}`,
      location: visit.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const upcomingVisits = visits.filter(v => v.status === 'agendada' && isFuture(parseISO(v.scheduled_date)));
  const todayVisits = visits.filter(v => v.status === 'agendada' && isToday(parseISO(v.scheduled_date)));
  const pastVisits = visits.filter(v => v.status === 'agendada' && isPast(parseISO(v.scheduled_date)) && !isToday(parseISO(v.scheduled_date)));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Agenda de Visitas</h1>
              <p className="text-xs text-slate-500">{upcomingVisits.length} visitas agendadas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('GoogleCalendarSettings')}>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('Clients')}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Visits */}
        {todayVisits.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Hoje
            </h2>
            <div className="space-y-3">
              {todayVisits.map(visit => (
                <Card key={visit.id} className="p-4 border-l-4 border-l-indigo-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{visit.client_name}</h3>
                      <Badge className="mt-1 bg-indigo-100 text-indigo-700 text-xs">
                        {visitTypeLabels[visit.visit_type]}
                      </Badge>
                    </div>
                    <Badge className={statusColors[visit.status]}>
                      {visit.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(parseISO(visit.scheduled_date), "HH:mm")} • {visit.duration_minutes || 60} min
                    </div>
                    {visit.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {visit.location}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <a
                      href={createGoogleCalendarUrl(visit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Google Agenda
                      </Button>
                    </a>
                    <Link to={createPageUrl(`ClientProfile?id=${visit.client_id}`)} className="flex-1">
                      <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Ver Cliente
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Visits */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-3">Próximas Visitas</h2>
          <div className="space-y-3">
            {upcomingVisits.length === 0 ? (
              <Card className="p-6 text-center">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Nenhuma visita agendada</p>
                <Link to={createPageUrl('Clients')}>
                  <Button size="sm" className="mt-3">Agendar Visita</Button>
                </Link>
              </Card>
            ) : (
              upcomingVisits.map(visit => (
                <Card key={visit.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{visit.client_name}</h3>
                      <p className="text-sm text-slate-500">
                        {format(parseISO(visit.scheduled_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">
                        {visitTypeLabels[visit.visit_type]}
                      </Badge>
                    </div>
                  </div>
                  
                  {visit.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      {visit.location}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={createGoogleCalendarUrl(visit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Adicionar à Agenda
                      </Button>
                    </a>
                    <Link to={createPageUrl(`ClientProfile?id=${visit.client_id}`)}>
                      <Button size="sm" variant="ghost">Ver</Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Past Visits (to complete) */}
        {pastVisits.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Visitas Pendentes</h2>
            <div className="space-y-2">
              {pastVisits.slice(0, 5).map(visit => (
                <Card key={visit.id} className="p-3 bg-amber-50 border-amber-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{visit.client_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(visit.scheduled_date), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ 
                        id: visit.id, 
                        data: { status: 'realizada' }
                      })}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                    >
                      Concluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}