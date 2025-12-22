import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Loader2, Filter, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AIRouteOptimizer from '@/components/AIRouteOptimizer';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas das cidades
const cityCoordinates = {
  'Sorocaba': [-23.5015, -47.4526],
  'Campinas': [-22.9099, -47.0626],
  'Piracicaba': [-22.7253, -47.6492],
  'Jundiaí': [-23.1864, -46.8978],
  'São José dos Campos': [-23.2237, -45.9009],
  'Itu': [-23.2644, -47.2997],
  'Marília': [-22.2139, -49.9461],
  'Bauru': [-22.3149, -49.0614],
  'Jaú': [-22.2964, -48.5578],
  'Lins': [-21.6778, -49.7436],
  'Botucatu': [-22.8858, -48.4450],
  'Ourinhos': [-22.9789, -49.8708],
  'Assis': [-22.6614, -50.4122],
  'Tupã': [-21.9347, -50.5136],
};

// Componente para ajustar bounds do mapa
function MapBounds({ markers }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [markers, map]);
  
  return null;
}

// Ícones personalizados por status
const getMarkerIcon = (status) => {
  const colors = {
    quente: '#ef4444',
    morno: '#eab308',
    frio: '#60a5fa'
  };
  
  const color = colors[status] || '#94a3b8';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function ClientsMap() {
  const navigate = useNavigate();
  
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Lista de vendedores
  const vendors = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.created_by).filter(Boolean))];
    return unique.sort();
  }, [clients]);

  // Lista de cidades
  const cities = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.city).filter(Boolean))];
    return unique.sort();
  }, [clients]);

  // Clientes filtrados com coordenadas
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtros
      const matchesVendor = vendorFilter === 'all' || client.created_by === vendorFilter;
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesCity = cityFilter === 'all' || client.city === cityFilter;
      
      // Tem coordenadas?
      const hasCoordinates = client.city && cityCoordinates[client.city];
      
      return matchesVendor && matchesStatus && matchesCity && hasCoordinates;
    });
  }, [clients, vendorFilter, statusFilter, cityFilter]);

  // Markers para o mapa
  const markers = useMemo(() => {
    return filteredClients
      .filter(client => client.city && cityCoordinates[client.city])
      .map(client => ({
        position: cityCoordinates[client.city],
        client
      }));
  }, [filteredClients]);

  const activeFiltersCount = [vendorFilter, statusFilter, cityFilter].filter(f => f !== 'all').length;

  const statusColors = {
    quente: 'bg-red-100 text-red-700 border-red-300',
    morno: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    frio: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Mapa de Clientes</h1>
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>

        {/* Filtros */}
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2 border-slate-200 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {showFilters && (
            <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="quente">Quente</SelectItem>
                    <SelectItem value="morno">Morno</SelectItem>
                    <SelectItem value="frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Vendedor</label>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos os vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vendedores</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Cidade</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setVendorFilter('all');
                  setCityFilter('all');
                }}
                className="w-full text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <p className="text-xs text-slate-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-800">{filteredClients.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-500 mb-1">Quentes</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredClients.filter(c => c.status === 'quente').length}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-500 mb-1">Cidades</p>
            <p className="text-2xl font-bold text-indigo-600">
              {new Set(filteredClients.map(c => c.city)).size}
            </p>
          </Card>
        </div>

        <AIRouteOptimizer clients={filteredClients} />
      </div>

      {/* Mapa */}
      <div className="px-4 pb-4">
        <Card className="overflow-hidden">
          <div style={{ height: '500px', width: '100%' }}>
            {markers.length > 0 ? (
              <MapContainer
                center={[-22.9099, -47.0626]}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds markers={markers.map(m => m.position)} />
                
                {markers.map((marker, index) => (
                  <Marker
                    key={`${marker.client.id}-${index}`}
                    position={marker.position}
                    icon={getMarkerIcon(marker.client.status)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800">
                            {marker.client.first_name || marker.client.full_name}
                          </h3>
                          {marker.client.status && (
                            <Badge className={`text-xs ${statusColors[marker.client.status]}`}>
                              {marker.client.status}
                            </Badge>
                          )}
                        </div>
                        
                        {marker.client.clinic_name && (
                          <p className="text-sm text-slate-600 mb-1">{marker.client.clinic_name}</p>
                        )}
                        
                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {marker.client.city}
                        </p>

                        {marker.client.purchase_score !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">Score</span>
                              <span className="font-semibold">{marker.client.purchase_score}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600"
                                style={{ width: `${marker.client.purchase_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => navigate(createPageUrl(`ClientProfile?id=${marker.client.id}`))}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          Ver Perfil
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Nenhum cliente com localização</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Legenda */}
      <div className="px-4 pb-8">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Legenda</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
              <span className="text-sm text-slate-600">Clientes Quentes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" />
              <span className="text-sm text-slate-600">Clientes Mornos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow" />
              <span className="text-sm text-slate-600">Clientes Frios</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}