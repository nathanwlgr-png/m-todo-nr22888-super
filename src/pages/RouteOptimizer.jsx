import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, Clock, Route, Save, ExternalLink, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function RouteOptimizer() {
  const [selectedClients, setSelectedClients] = useState([]);
  const [startAddress, setStartAddress] = useState('Marília, SP');
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitDuration, setVisitDuration] = useState(60);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('Marília');
  const queryClient = useQueryClient();

  // SAFE/performance: limite razoável para tablet — não carregar base inteira de uma vez.
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-route'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });

  const { data: savedRoutes = [] } = useQuery({
    queryKey: ['optimized-routes'],
    queryFn: () => base44.entities.OptimizedRoute.list('-created_date', 100),
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = !searchTerm || 
        c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = !cityFilter || c.city === cityFilter;
      
      const hasAddress = c.address || c.cep;
      
      return matchesSearch && matchesCity && hasAddress;
    });
  }, [clients, searchTerm, cityFilter]);

  const cities = useMemo(() => {
    return [...new Set(clients.map(c => c.city).filter(Boolean))].sort();
  }, [clients]);

  const optimizeRouteMutation = useMutation({
    mutationFn: async () => {
      // Transformar client_ids em locations compatíveis com optimizeRoute
      const selected = clients.filter(c => selectedClients.includes(c.id));
      const locations = selected.map(c => {
        const hasCoords = !!(c.latitude && c.longitude);
        return {
          id: c.id,
          name: c.first_name || c.clinic_name,
          clinic_name: c.clinic_name,
          lat: hasCoords ? c.latitude : null,
          lng: hasCoords ? c.longitude : null,
          address: c.address || [c.cep, c.city].filter(Boolean).join(', '),
          city: c.city,
          has_coords: hasCoords,
        };
      });

      const semLocalizacao = locations.filter(l => !l.has_coords && !l.address);
      if (semLocalizacao.length === locations.length) {
        // Nenhum cliente tem localização suficiente: não quebrar, abrir Google Maps por cidade
        const cidades = [...new Set(selected.map(c => c.city).filter(Boolean))];
        const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent('clínicas veterinárias ' + (cidades[0] || ''))}`;
        return { success: true, fallback: true, fallbackUrl, message: 'Clientes sem localização suficiente — abrindo Google Maps aproximado.' };
      }

      const aproximada = locations.some(l => !l.has_coords);
      const response = await base44.functions.invoke('optimizeRoute', {
        locations,
        startPoint: startAddress,
        options: { visit_duration_minutes: visitDuration }
      });
      return { ...response.data, aproximada };
    },
    onSuccess: (data) => {
      if (data.fallback) {
        window.open(data.fallbackUrl, '_blank');
        toast.message('Rota aproximada', { description: data.message });
        return;
      }
      if (data.success) {
        setOptimizedRoute(data.route);
        toast.success(data.aproximada
          ? 'Rota otimizada (aproximada — alguns clientes sem coordenada)'
          : 'Rota otimizada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao otimizar rota');
      }
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const saveRouteMutation = useMutation({
    mutationFn: (routeData) => base44.entities.OptimizedRoute.create(routeData),
    onSuccess: () => {
      queryClient.invalidateQueries(['optimized-routes']);
      toast.success('Rota salva!');
    }
  });

  const toggleClient = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleOptimize = () => {
    if (selectedClients.length < 2) {
      toast.error('Selecione pelo menos 2 clientes');
      return;
    }
    optimizeRouteMutation.mutate();
  };

  const handleSaveRoute = () => {
    if (!routeName) {
      toast.error('Digite um nome para a rota');
      return;
    }
    if (!optimizedRoute) {
      toast.error('Otimize a rota primeiro');
      return;
    }

    saveRouteMutation.mutate({
      name: routeName,
      date: routeDate,
      client_ids: optimizedRoute.optimized_order,
      route_data: {
        total_distance_km: optimizedRoute.total_distance_km,
        total_duration_minutes: optimizedRoute.total_duration_minutes
      },
      visits: optimizedRoute.visits,
      google_maps_url: optimizedRoute.google_maps_url,
      status: 'planned'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Route className="w-6 h-6 text-indigo-600" />
              <div>
                <CardTitle>Otimizador de Rotas</CardTitle>
                <p className="text-sm text-slate-600">Planeje visitas eficientes</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Clientes ({selectedClients.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Todas as cidades</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredClients.map(client => (
                  <Card 
                    key={client.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedClients.includes(client.id) 
                        ? 'bg-indigo-50 border-indigo-300' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => toggleClient(client.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{client.first_name}</p>
                        {client.clinic_name && (
                          <p className="text-xs text-slate-600">{client.clinic_name}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-500">
                            {client.address || `${client.cep}, ${client.city}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        client.status === 'quente' ? 'bg-red-500' :
                        client.status === 'morno' ? 'bg-orange-500' : 'bg-blue-500'
                      }>
                        {client.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Ponto de Partida (opcional)</Label>
                <Input
                  placeholder="Endereço inicial"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo por Visita (minutos)</Label>
                <Input
                  type="number"
                  value={visitDuration}
                  onChange={(e) => setVisitDuration(parseInt(e.target.value))}
                  min="15"
                  max="180"
                />
              </div>

              <Button 
                onClick={handleOptimize}
                disabled={selectedClients.length < 2 || optimizeRouteMutation.isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {optimizeRouteMutation.isLoading ? 'Otimizando...' : 'Otimizar Rota'}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Optimized Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rota Otimizada</CardTitle>
            </CardHeader>
            <CardContent>
              {!optimizedRoute ? (
                <div className="text-center py-12 text-slate-500">
                  <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione clientes e otimize a rota</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-600">Distância</p>
                          <p className="text-lg font-bold text-blue-900">
                            {optimizedRoute.total_distance_km.toFixed(1)} km
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-green-50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-slate-600">Tempo Total</p>
                          <p className="text-lg font-bold text-green-900">
                            {Math.floor(optimizedRoute.total_duration_minutes / 60)}h{' '}
                            {optimizedRoute.total_duration_minutes % 60}m
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Visit List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {optimizedRoute.visits.map((visit, index) => (
                      <Card key={visit.client_id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-indigo-600">{index + 1}</Badge>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{visit.client_name}</p>
                            {visit.clinic_name && (
                              <p className="text-xs text-slate-600">{visit.clinic_name}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <p className="text-xs text-slate-500">
                                {new Date(visit.estimated_arrival).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Google Maps Link */}
                  <a 
                    href={optimizedRoute.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no Google Maps
                    </Button>
                  </a>

                  {/* Save Route */}
                  <div className="space-y-2 pt-3 border-t">
                    <Label>Nome da Rota</Label>
                    <Input
                      placeholder="Ex: Visitas Marília - Segunda"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                    />
                    
                    <Label>Data Planejada</Label>
                    <Input
                      type="date"
                      value={routeDate}
                      onChange={(e) => setRouteDate(e.target.value)}
                    />

                    <Button 
                      onClick={handleSaveRoute}
                      disabled={!routeName || saveRouteMutation.isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Rota
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Saved Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rotas Salvas ({savedRoutes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {savedRoutes.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhuma rota salva</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {savedRoutes
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map(route => (
                    <Card key={route.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{route.name}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(route.date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <Badge className={
                            route.status === 'completed' ? 'bg-green-600' :
                            route.status === 'in_progress' ? 'bg-blue-600' :
                            route.status === 'cancelled' ? 'bg-red-600' : 'bg-slate-600'
                          }>
                            {route.status}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{route.route_data?.total_distance_km?.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {Math.floor(route.route_data?.total_duration_minutes / 60)}h{' '}
                              {route.route_data?.total_duration_minutes % 60}m
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{route.client_ids?.length} visitas</Badge>
                          </div>
                        </div>

                        {route.google_maps_url && (
                          <a 
                            href={route.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="w-full mt-2">
                              <Navigation className="w-3 h-3 mr-1" />
                              Navegar
                            </Button>
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}