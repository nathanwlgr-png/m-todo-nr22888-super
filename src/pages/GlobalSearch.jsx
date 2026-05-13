import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MapPin, User, Building2, Phone, Mail, 
  Calendar, Target, TrendingUp, Navigation, Loader2
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Buscar dados
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients-search'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads-search'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['visits-search'],
    queryFn: () => base44.entities.Visit.list(),
  });

  // Obter localização do usuário
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          // Usar localização padrão de São Paulo
          setLocation({
            lat: -23.5505,
            lng: -46.6333,
            timestamp: new Date().toISOString(),
            fallback: true
          });
          setLoadingLocation(false);
        }
      );
    } else {
      setLocation({
        lat: -23.5505,
        lng: -46.6333,
        timestamp: new Date().toISOString(),
        fallback: true
      });
      setLoadingLocation(false);
    }
  };

  // Calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filtrar e ordenar resultados
  const filterResults = (items, type) => {
    if (!searchTerm && !location) return items;

    let filtered = items;

    // Filtrar por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const searchFields = [
          item.full_name, item.first_name, item.client_name,
          item.clinic_name, item.company, item.city,
          item.email, item.phone, item.notes
        ].filter(Boolean).join(' ').toLowerCase();
        return searchFields.includes(term);
      });
    }

    // Adicionar distância se houver localização
    if (location && !location.fallback) {
      filtered = filtered.map(item => {
        // Tentar obter coordenadas da cidade (simplificado - em produção usar API de geocoding)
        const cityCoords = getCityCoords(item.city);
        if (cityCoords) {
          const distance = calculateDistance(
            location.lat, location.lng,
            cityCoords.lat, cityCoords.lng
          );
          return { ...item, distance };
        }
        return item;
      });

      // Ordenar por distância
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return filtered;
  };

  // Coordenadas aproximadas de cidades (simplificado)
  const getCityCoords = (city) => {
    if (!city) return null;
    const coords = {
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Marília': { lat: -22.2139, lng: -49.9458 },
      'Campinas': { lat: -22.9099, lng: -47.0626 },
      'Santos': { lat: -23.9608, lng: -46.3334 },
      'Ribeirão Preto': { lat: -21.1704, lng: -47.8103 },
      'Sorocaba': { lat: -23.5015, lng: -47.4526 }
    };
    return coords[city] || null;
  };

  const filteredClients = filterResults(clients, 'client');
  const filteredLeads = filterResults(leads, 'lead');
  const filteredVisits = filterResults(visits, 'visit');

  const totalResults = filteredClients.length + filteredLeads.length + filteredVisits.length;

  const ResultCard = ({ item, type }) => (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-lg transition-all"
      onClick={() => {
        if (type === 'client') navigate(createPageUrl('ClientProfile') + `?id=${item.id}`);
        if (type === 'lead') navigate(createPageUrl('LeadProfile') + `?id=${item.id}`);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {type === 'client' && <User className="w-4 h-4 text-blue-600" />}
              {type === 'lead' && <Target className="w-4 h-4 text-orange-600" />}
              {type === 'visit' && <Calendar className="w-4 h-4 text-green-600" />}
              <h3 className="font-semibold">
                {item.full_name || item.first_name || item.client_name}
              </h3>
            </div>

            {(item.clinic_name || item.company) && (
              <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                <Building2 className="w-3 h-3" />
                <span>{item.clinic_name || item.company}</span>
              </div>
            )}

            {item.city && (
              <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                <MapPin className="w-3 h-3" />
                <span>{item.city}</span>
                {item.distance && (
                  <Badge variant="outline" className="ml-2">
                    {item.distance.toFixed(1)} km
                  </Badge>
                )}
              </div>
            )}

            {item.phone && (
              <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                <Phone className="w-3 h-3" />
                <span>{item.phone}</span>
              </div>
            )}

            {item.email && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{item.email}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {item.status && (
              <Badge className={
                item.status === 'quente' ? 'bg-red-500' :
                item.status === 'morno' ? 'bg-yellow-500' :
                'bg-blue-500'
              }>
                {item.status}
              </Badge>
            )}
            {item.purchase_score > 0 && (
              <Badge variant="outline">
                Score: {item.purchase_score}
              </Badge>
            )}
            {item.predictive_score > 0 && (
              <Badge variant="outline">
                {item.predictive_score}%
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🔍 Busca Global Inteligente</h1>
          <p className="text-slate-600">
            Busque clientes, leads e visitas com localização em tempo real
          </p>
        </div>

        {/* Barra de busca e localização */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome, cidade, empresa, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
              <Button
                variant="outline"
                onClick={getLocation}
                disabled={loadingLocation}
                className="gap-2"
              >
                {loadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Atualizar Localização
              </Button>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>
                  Localização: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  {location.fallback && ' (São Paulo - padrão)'}
                </span>
                <span className="text-xs text-slate-400">
                  · Atualizado: {new Date(location.timestamp).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados da Busca</span>
              <Badge variant="outline" className="text-lg">
                {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  Todos ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="clients">
                  Clientes ({filteredClients.length})
                </TabsTrigger>
                <TabsTrigger value="leads">
                  Leads ({filteredLeads.length})
                </TabsTrigger>
                <TabsTrigger value="visits">
                  Visitas ({filteredVisits.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-2">
                  {filteredClients.map(c => <ResultCard key={c.id} item={c} type="client" />)}
                  {filteredLeads.map(l => <ResultCard key={l.id} item={l} type="lead" />)}
                  {filteredVisits.map(v => <ResultCard key={v.id} item={v} type="visit" />)}
                  {totalResults === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="clients">
                {filteredClients.map(c => <ResultCard key={c.id} item={c} type="client" />)}
                {filteredClients.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    Nenhum cliente encontrado
                  </div>
                )}
              </TabsContent>

              <TabsContent value="leads">
                {filteredLeads.map(l => <ResultCard key={l.id} item={l} type="lead" />)}
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    Nenhum lead encontrado
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visits">
                {filteredVisits.map(v => <ResultCard key={v.id} item={v} type="visit" />)}
                {filteredVisits.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    Nenhuma visita encontrada
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}