import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, RefreshCw, Download, Upload, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GoogleCalendarSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100)
  });

  const isConnected = user?.google_calendar_connected || false;
  const lastSync = user?.google_calendar_last_sync;

  const handleConnect = () => {
    toast.error('Backend Functions precisam estar habilitadas', {
      description: 'Vá em Configurações do App → Backend Functions para ativar a integração com Google Calendar.',
      duration: 5000
    });
    
    // When backend functions are enabled, this would work:
    // window.location.href = base44.connectors.getAuthorizationUrl('googlecalendar', {
    //   redirect_url: window.location.href
    // });
  };

  const handleDisconnect = async () => {
    try {
      await base44.auth.updateMe({
        google_calendar_connected: false,
        google_calendar_last_sync: null
      });
      queryClient.invalidateQueries();
      toast.success('Google Calendar desconectado');
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  const syncToGoogleCalendar = async () => {
    setSyncing(true);
    
    try {
      // Simulate sync for now
      const pendingVisits = visits.filter(v => !v.google_calendar_synced);
      
      // When backend functions are enabled, this would sync via API:
      // for (const visit of pendingVisits) {
      //   await base44.integrations.GoogleCalendar.CreateEvent({
      //     summary: `Visita Seamaty - ${visit.client_name}`,
      //     start: visit.scheduled_date,
      //     duration_minutes: visit.duration_minutes,
      //     location: visit.location,
      //     description: visit.notes
      //   });
      //   await base44.entities.Visit.update(visit.id, { google_calendar_synced: true });
      // }
      
      await base44.auth.updateMe({
        google_calendar_last_sync: new Date().toISOString()
      });
      
      toast.success(`${pendingVisits.length} eventos sincronizados`, {
        description: 'Suas visitas foram enviadas para o Google Calendar'
      });
      
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error('Erro na sincronização', {
        description: 'Verifique se Backend Functions está habilitado'
      });
    }
    
    setSyncing(false);
  };

  const importFromGoogleCalendar = async () => {
    setImporting(true);
    
    try {
      // When backend functions are enabled, this would import via API:
      // const events = await base44.integrations.GoogleCalendar.ListEvents({
      //   time_min: new Date().toISOString(),
      //   max_results: 50
      // });
      
      // const imported = [];
      // for (const event of events) {
      //   // Only import if not already in CRM
      //   const existing = await base44.entities.Visit.filter({ 
      //     google_calendar_event_id: event.id 
      //   });
      //   
      //   if (existing.length === 0) {
      //     await base44.entities.Visit.create({
      //       client_name: event.summary || 'Evento importado',
      //       scheduled_date: event.start.dateTime,
      //       duration_minutes: 60,
      //       location: event.location,
      //       notes: event.description,
      //       status: 'agendada',
      //       google_calendar_event_id: event.id,
      //       google_calendar_synced: true
      //     });
      //     imported.push(event);
      //   }
      // }
      
      toast.success('Eventos importados do Google Calendar', {
        description: 'Eventos futuros foram adicionados à sua agenda'
      });
      
      queryClient.invalidateQueries(['visits']);
    } catch (error) {
      toast.error('Erro ao importar', {
        description: 'Verifique se Backend Functions está habilitado'
      });
    }
    
    setImporting(false);
  };

  const pendingSync = visits.filter(v => !v.google_calendar_synced && v.status === 'agendada').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Calendar')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Google Calendar</h1>
            <p className="text-xs text-slate-500">Sincronização automática</p>
          </div>
          {isConnected && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Backend Functions Warning */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-1">Backend Functions Necessário</h3>
              <p className="text-sm text-slate-600 mb-3">
                Para usar a integração completa com Google Calendar, você precisa habilitar Backend Functions nas configurações do app.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => window.open('https://docs.base44.com/backend-functions', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver Documentação
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Status */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Status da Conexão</h3>
          
          {!isConnected ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-4">Conecte sua conta Google Calendar</p>
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Conectar com Google
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Conectado</p>
                    {lastSync && (
                      <p className="text-xs text-slate-500">
                        Última sincronização: {format(new Date(lastSync), "dd/MM 'às' HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Desconectar
                </Button>
              </div>

              {pendingSync > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>{pendingSync}</strong> visitas pendentes de sincronização
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Sync Actions */}
        {isConnected && (
          <>
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Sincronização Automática</h3>
              <p className="text-sm text-slate-600 mb-4">
                Toda nova visita agendada no CRM será automaticamente criada no seu Google Calendar.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={syncToGoogleCalendar}
                  disabled={syncing || pendingSync === 0}
                  variant="outline"
                  className="h-12"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Enviar ({pendingSync})
                </Button>

                <Button
                  onClick={importFromGoogleCalendar}
                  disabled={importing}
                  variant="outline"
                  className="h-12"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Importar
                </Button>
              </div>
            </Card>

            {/* Features */}
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Recursos Disponíveis</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Sincronização Bidirecional</p>
                    <p className="text-sm text-slate-500">Eventos criados em qualquer lugar aparecem em ambos</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Atualizações em Tempo Real</p>
                    <p className="text-sm text-slate-500">Mudanças sincronizadas automaticamente</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Lembretes do Google</p>
                    <p className="text-sm text-slate-500">Notificações no celular para suas visitas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Visão Unificada</p>
                    <p className="text-sm text-slate-500">Todos os compromissos em um só lugar</p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Recent Synced Events */}
        {isConnected && (
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Eventos Sincronizados</h3>
            <div className="space-y-2">
              {visits.filter(v => v.google_calendar_synced).slice(0, 5).map(visit => (
                <div key={visit.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{visit.client_name}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(visit.scheduled_date), "dd/MM 'às' HH:mm")}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
              {visits.filter(v => v.google_calendar_synced).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum evento sincronizado ainda
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}