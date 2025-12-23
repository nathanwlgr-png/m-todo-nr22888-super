import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MapPin, Phone, Mail, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import 'leaflet/dist/leaflet.css';

// Regiões do mapa de vendas (coordenadas aproximadas das regiões de SP)
const salesRegions = [
  {
    id: 'amanda',
    name: 'Amanda',
    color: '#FCD34D',
    cities: ['São Paulo', 'Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'Campinas', 'Sorocaba'],
    coordinates: [
      [-23.5, -46.6],
      [-23.0, -46.5],
      [-22.8, -47.0],
      [-23.5, -47.5],
      [-24.0, -47.0],
      [-24.0, -46.5]
    ]
  },
  {
    id: 'gabi',
    name: 'Gabi',
    color: '#60A5FA',
    cities: ['Ribeirão Preto', 'Araraquara', 'São Carlos', 'Franca', 'Jaboticabal'],
    coordinates: [
      [-21.0, -47.5],
      [-21.0, -48.5],
      [-22.0, -48.5],
      [-22.5, -47.5],
      [-22.0, -47.0]
    ]
  },
  {
    id: 'nando',
    name: 'Nando',
    color: '#34D399',
    cities: ['Santos', 'São Vicente', 'Praia Grande', 'Guarujá', 'Registro'],
    coordinates: [
      [-23.9, -46.3],
      [-24.5, -47.0],
      [-25.0, -48.0],
      [-24.5, -48.5],
      [-23.9, -47.5]
    ]
  },
  {
    id: 'nathan',
    name: 'Nathan',
    color: '#FB923C',
    cities: ['Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'],
    coordinates: [
      [-21.5, -49.5],
      [-21.5, -51.5],
      [-22.5, -51.5],
      [-23.0, -50.5],
      [-22.5, -49.0]
    ]
  }
];

function MapController({ selectedRegion, clients }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (selectedRegion && clients.length > 0) {
      const regionClients = clients.filter(c => 
        selectedRegion.cities.some(city => 
          c.city?.toLowerCase().includes(city.toLowerCase())
        )
      );
      
      if (regionClients.length > 0) {
        const bounds = regionClients
          .filter(c => c.city)
          .map(c => {
            const city = selectedRegion.cities.find(city => 
              c.city?.toLowerCase().includes(city.toLowerCase())
            );
            const region = salesRegions.find(r => r.cities.includes(city));
            if (region && region.coordinates.length > 0) {
              return region.coordinates[0];
            }
            return null;
          })
          .filter(Boolean);
        
        if (bounds.length > 0) {
          map.fitBounds(bounds);
        }
      }
    }
  }, [selectedRegion, clients, map]);
  
  return null;
}

export default function InteractiveSalesMap() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const filteredClients = useMemo(() => {
    if (!selectedRegion) return [];
    
    return clients.filter(client => {
      const cityMatch = selectedRegion.cities.some(city => 
        client.city?.toLowerCase().includes(city.toLowerCase())
      );
      
      const searchMatch = searchFilter === '' || 
        client.first_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        client.city?.toLowerCase().includes(searchFilter.toLowerCase());
      
      return cityMatch && searchMatch;
    });
  }, [clients, selectedRegion, searchFilter]);

  const regionStats = useMemo(() => {
    return salesRegions.map(region => {
      const regionClients = clients.filter(c => 
        region.cities.some(city => 
          c.city?.toLowerCase().includes(city.toLowerCase())
        )
      );
      
      return {
        ...region,
        totalClients: regionClients.length,
        hotClients: regionClients.filter(c => c.status === 'quente').length,
        revenue: regionClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0)
      };
    });
  }, [clients]);

  const center = [-22.5, -48.5]; // Centro aproximado de SP

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-600" />
          Mapa de Vendas por Região
        </h3>
        
        {/* Mapa */}
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-200" style={{ height: '400px' }}>
          <MapContainer 
            center={center} 
            zoom={7} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            {/* Regiões coloridas */}
            {salesRegions.map(region => (
              <Polygon
                key={region.id}
                positions={region.coordinates}
                pathOptions={{
                  color: region.color,
                  fillColor: region.color,
                  fillOpacity: selectedRegion?.id === region.id ? 0.6 : 0.3,
                  weight: selectedRegion?.id === region.id ? 3 : 2
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(region)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-slate-800">{region.name}</h4>
                    <p className="text-sm text-slate-600">
                      {regionStats.find(r => r.id === region.id)?.totalClients || 0} clientes
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setSelectedRegion(region)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </Popup>
              </Polygon>
            ))}
            
            {selectedRegion && <MapController selectedRegion={selectedRegion} clients={clients} />}
          </MapContainer>
        </div>

        {/* Estatísticas das Regiões */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {regionStats.map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                selectedRegion?.id === region.id
                  ? 'border-slate-800 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: region.color }}
                />
                <span className="font-semibold text-sm">{region.name}</span>
              </div>
              <p className="text-xs text-slate-600">{region.totalClients} clientes</p>
              <p className="text-xs text-green-600 font-medium">
                {region.hotClients} quentes
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Detalhes da Região Selecionada */}
      {selectedRegion && (
        <Card className="p-4 bg-white border-2 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedRegion.color }}
              />
              <h4 className="font-semibold text-slate-800">
                Região: {selectedRegion.name}
              </h4>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedRegion(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nome, clínica ou cidade..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum cliente encontrado nesta região
              </p>
            ) : (
              filteredClients.map(client => (
                <Link
                  key={client.id}
                  to={createPageUrl(`ClientProfile?id=${client.id}`)}
                  className="block p-3 rounded-lg border hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {client.first_name}
                      </h5>
                      {client.clinic_name && (
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {client.clinic_name}
                        </p>
                      )}
                      {client.city && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {client.phone && (
                          <a
                            href={`https://wa.me/${client.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === 'quente' ? 'bg-red-100 text-red-700' :
                        client.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {client.status === 'quente' ? '🔥 Quente' :
                         client.status === 'morno' ? '☀️ Morno' : '❄️ Frio'}
                      </span>
                      {client.purchase_score && (
                        <span className="text-xs text-slate-500">
                          Score: {client.purchase_score}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {filteredClients.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredClients.length}
                  </p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredClients.filter(c => c.status === 'quente').length}
                  </p>
                  <p className="text-xs text-slate-500">Quentes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(filteredClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-slate-500">Pipeline</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}