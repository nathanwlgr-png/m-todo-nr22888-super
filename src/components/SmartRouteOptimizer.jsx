import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, Loader2, Sparkles, Navigation, Clock, 
  TrendingUp, Target, Calendar, Route, CheckCircle2,
  AlertCircle, Send, Map as MapIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function SmartRouteOptimizer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [startLocation, setStartLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxVisits, setMaxVisits] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [route, setRoute] = useState(null);
  const [autoSelectMode, setAutoSelectMode] = useState(true);
  const [regionalMode, setRegionalMode] = useState(false);
  const [startCity, setStartCity] = useState('Marília');
  const [endCity, setEndCity] = useState('Lins');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const clientsWithAddress = useMemo(() => 
    clients.filter(c => c.city && (c.address || c.cep)),
    [clients]
  );

  const priorityClients = useMemo(() => 
    clientsWithAddress
      .filter(c => c.status === 'quente' || (c.status === 'morno' && (c.purchase_score || 0) >= 60))
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 15),
    [clientsWithAddress]
  );

  const generateRegionalRoute = async () => {
    setGenerating(true);
    try {
      const regionalClients = clients.filter(c => {
        const city = c.city?.toLowerCase();
        return city && (
          city.includes(startCity.toLowerCase()) ||
          city.includes(endCity.toLowerCase()) ||
          city.includes('promissão') ||
          city.includes('guaimbê') ||
          city.includes('cafelândia') ||
          city.includes('getulina')
        );
      });

      if (regionalClients.length === 0) {
        toast.error(`Nenhum cliente encontrado entre ${startCity} e ${endCity}`);
        setGenerating(false);
        return;
      }

      const sortedClients = regionalClients.sort((a, b) => 
        (b.purchase_score || 0) - (a.purchase_score || 0)
      );

      const result = await base44.functions.invoke('generateOptimizedRoute', {
        client_ids: sortedClients.map(c => c.id),
        start_location: startCity,
        max_visits_per_day: sortedClients.length,
        date: selectedDate,
        regional_route: true,
        end_location: endCity
      });

      setRoute(result.route);
      toast.success(`Rota ${startCity} → ${endCity} gerada!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar rota: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateRoute = async () => {
    if (regionalMode) {
      return generateRegionalRoute();
    }

    const clientsToRoute = autoSelectMode 
      ? priorityClients.slice(0, maxVisits).map(c => c.id)
      : selectedClientIds;

    if (clientsToRoute.length === 0) {
      toast.error('Selecione ao menos 1 cliente');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateOptimizedRoute', {
        client_ids: clientsToRoute,
        start_location: startLocation,
        max_visits_per_day: maxVisits,
        date: selectedDate
      });

      setRoute(result.route);
      toast.success('Rota otimizada gerada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar rota: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const createVisitsMutation = useMutation({
    mutationFn: (visits) => Promise.all(
      visits.map(v => base44.entities.Visit.create(v))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['visits']);
      toast.success('Visitas agendadas!');
    }
  });

  const scheduleAllVisits = async () => {
    if (!route?.daily_routes?.[0]?.visits) return;

    const visitsToCreate = route.daily_routes[0].visits.map(v => ({
      client_id: v.client_id,
      client_name: v.client_name,
      scheduled_date: `${route.daily_routes[0].day}T${v.suggested_time}:00`,
      duration_minutes: v.duration_minutes,
      visit_type: 'followup',
      location: v.address,
      notes: v.preparation_notes,
      status: 'agendada'
    }));

    await createVisitsMutation.mutateAsync(visitsToCreate);
  };

  const toggleClient = (clientId) => {
    setSelectedClientIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Navigation className="w-5 h-5" />
            Otimizador de Rotas IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!route ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-300">
                <Checkbox
                  checked={regionalMode}
                  onCheckedChange={(checked) => {
                    setRegionalMode(checked);
                    if (checked) {
                      setAutoSelectMode(false);
                      setSelectedClientIds([]);
                    }
                  }}
                  id="regional-mode"
                />
                <Label htmlFor="regional-mode" className="text-sm cursor-pointer font-semibold text-orange-800">
                  🗺️ Modo Regional (traçar rota entre cidades)
                </Label>
              </div>

              {regionalMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Cidade Inicial</Label>
                      <Input
                        value={startCity}
                        onChange={(e) => setStartCity(e.target.value)}
                        placeholder="Ex: Marília"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Cidade Final</Label>
                      <Input
                        value={endCity}
                        onChange={(e) => setEndCity(e.target.value)}
                        placeholder="Ex: Lins"
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-300">
                    <p className="text-xs text-amber-800">
                      🎯 A IA irá buscar TODOS os clientes entre {startCity} e {endCity}, incluindo cidades no trajeto, e criar uma rota otimizada.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Checkbox
                      checked={autoSelectMode}
                      onCheckedChange={(checked) => {
                        setAutoSelectMode(checked);
                        if (checked) setSelectedClientIds([]);
                      }}
                      id="auto-select"
                    />
                    <Label htmlFor="auto-select" className="text-sm cursor-pointer">
                      Seleção automática (clientes prioritários)
                    </Label>
                  </div>
                </>
              )}

              {!autoSelectMode && !regionalMode && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700">
                    Selecione clientes ({selectedClientIds.length} selecionados):
                  </p>
                  {priorityClients.map(c => (
                    <div
                      key={c.id}
                      onClick={() => toggleClient(c.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClientIds.includes(c.id)
                          ? 'bg-blue-100 border-blue-400'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{c.first_name}</p>
                          <p className="text-xs text-gray-600">{c.city}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            c.status === 'quente' ? 'bg-red-600' :
                            c.status === 'morno' ? 'bg-yellow-600' : 'bg-blue-600'
                          }>
                            {c.purchase_score}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!regionalMode && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ponto de Partida</Label>
                    <Input
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      placeholder="Ex: São Paulo, SP"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Máx. Visitas/Dia</Label>
                    <Input
                      type="number"
                      value={maxVisits}
                      onChange={(e) => setMaxVisits(parseInt(e.target.value) || 6)}
                      min="1"
                      max="10"
                      className="h-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <Button
                onClick={generateRoute}
                disabled={generating || (!autoSelectMode && !regionalMode && selectedClientIds.length === 0)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {regionalMode ? `Gerar Rota ${startCity} → ${endCity}` : 'Gerar Rota Otimizada'}
              </Button>

              {autoSelectMode && !regionalMode && (
                <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <p className="text-xs text-blue-800">
                    ℹ️ Modo automático: IA selecionará os {maxVisits} clientes mais prioritários com endereço
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-white rounded-lg text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-gray-500">Visitas</p>
                  <p className="text-xl font-bold">{route.daily_routes?.[0]?.total_visits || 0}</p>
                </div>
                <div className="p-3 bg-white rounded-lg text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-gray-500">Tempo</p>
                  <p className="text-xl font-bold">{route.daily_routes?.[0]?.estimated_total_time_hours?.toFixed(1)}h</p>
                </div>
                <div className="p-3 bg-white rounded-lg text-center">
                  <Route className="w-4 h-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-gray-500">Distância</p>
                  <p className="text-xl font-bold">{route.daily_routes?.[0]?.estimated_distance_km?.toFixed(0)}km</p>
                </div>
              </div>

              {/* Otimização Summary */}
              <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">📊 ANÁLISE DA ROTA</p>
                <p className="text-sm text-gray-700">{route.optimization_summary}</p>
              </div>

              {/* Visitas */}
              <div className="space-y-2">
                {route.daily_routes?.[0]?.visits?.map((visit, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(createPageUrl(`ClientProfile?id=${visit.client_id}`))}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                          {visit.order}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{visit.client_name}</p>
                          <p className="text-xs text-gray-600">{visit.clinic_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{visit.suggested_time}</p>
                        <p className="text-xs text-gray-500">{visit.duration_minutes}min</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{visit.address}</span>
                    </div>

                    {visit.distance_from_previous_km > 0 && (
                      <div className="flex items-center gap-2 text-xs text-orange-600 mb-2">
                        <Route className="w-3 h-3" />
                        <span>
                          {visit.distance_from_previous_km.toFixed(1)}km • {visit.travel_time_minutes}min viagem
                        </span>
                      </div>
                    )}

                    <div className="p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700">🎯 Objetivo:</p>
                      <p className="text-xs text-gray-700">{visit.visit_objective}</p>
                    </div>

                    {visit.preparation_notes && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                        <p className="text-xs font-semibold text-blue-700">📝 Preparação:</p>
                        <p className="text-xs text-gray-700">{visit.preparation_notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-600 text-xs">
                        Prioridade: {visit.priority_score}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recomendações */}
              {route.key_recommendations?.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    RECOMENDAÇÕES IA
                  </p>
                  <ul className="space-y-1">
                    {route.key_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rota Alternativa */}
              {route.alternative_route && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-1">💡 ROTA ALTERNATIVA</p>
                  <p className="text-sm text-gray-700">{route.alternative_route}</p>
                </div>
              )}

              {/* Ações */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={scheduleAllVisits}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Todas
                </Button>
                <Button
                  onClick={() => {
                    setRoute(null);
                    toast.info('Gere nova rota');
                  }}
                  variant="outline"
                >
                  Nova Rota
                </Button>
              </div>

              <Button
                onClick={() => navigate(createPageUrl('ScheduledAgenda'))}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Agenda Completa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}