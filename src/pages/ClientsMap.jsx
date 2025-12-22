import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Loader2, Filter, X, Upload, Search, Edit2, Save } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AIRouteOptimizer from '@/components/AIRouteOptimizer';
import ClientDataEditor from '@/components/ClientDataEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
const getMarkerIcon = (status, hasPurchase) => {
  const colors = {
    quente: '#ef4444',
    morno: '#eab308',
    frio: '#60a5fa'
  };
  
  const color = hasPurchase ? '#22c55e' : (colors[status] || '#94a3b8');
  
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('mapa');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  cnpj: { type: "string" },
                  razao_social: { type: "string" },
                  city: { type: "string" },
                  clinic_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  decision_role: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output?.clients) {
        for (const client of extractedData.output.clients) {
          if (client.first_name && client.decision_role) {
            await base44.entities.Client.create({
              ...client,
              status: 'morno',
              purchase_score: 50
            });
          }
        }
        queryClient.invalidateQueries(['clients']);
        alert(`${extractedData.output.clients.length} clientes importados!`);
      } else {
        alert('Não foi possível extrair dados');
      }
    } catch (error) {
      alert('Erro ao processar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  // Clientes filtrados
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchTerm || 
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj?.includes(searchTerm) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVendor = vendorFilter === 'all' || client.created_by === vendorFilter;
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesCity = cityFilter === 'all' || client.city === cityFilter;
      
      return matchesSearch && matchesVendor && matchesStatus && matchesCity;
    });
  }, [clients, searchTerm, vendorFilter, statusFilter, cityFilter]);

  // Ordenação alfabética
  const clientsAlphabetical = useMemo(() => {
    return [...filteredClients].sort((a, b) => 
      (a.first_name || '').localeCompare(b.first_name || '')
    );
  }, [filteredClients]);

  // Ordenação por cidade
  const clientsByCity = useMemo(() => {
    const grouped = filteredClients.reduce((acc, client) => {
      const city = client.city || 'Sem cidade';
      if (!acc[city]) acc[city] = [];
      acc[city].push(client);
      return acc;
    }, {});
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredClients]);

  // Markers para o mapa
  const markers = useMemo(() => {
    return filteredClients
      .filter(client => client.city && cityCoordinates[client.city])
      .map(client => {
        const hasPurchase = sales.some(s => 
          s.client_id === client.id && (s.status === 'fechada' || s.status === 'entregue')
        );
        
        return {
          position: cityCoordinates[client.city],
          client,
          hasPurchase
        };
      });
  }, [filteredClients, sales]);

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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Mapa de Clientes</h1>
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>

        {/* Busca */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CNPJ, cidade..."
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Importar */}
        <div className="px-4 pb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="w-full border-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar PDF/Word/Excel
              </>
            )}
          </Button>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12">
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
            <TabsTrigger value="alfabetico">A-Z</TabsTrigger>
            <TabsTrigger value="cidade">Por Cidade</TabsTrigger>
          </TabsList>
        </Tabs>
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

        {activeTab === 'mapa' && <AIRouteOptimizer clients={filteredClients} />}
      </div>

      {/* Content */}
      <Tabs value={activeTab} className="px-4">
        {/* Mapa */}
        <TabsContent value="mapa" className="mt-0">
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
                      icon={getMarkerIcon(marker.client.status, marker.hasPurchase)}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-800">
                              {marker.client.first_name}
                            </h3>
                            {marker.hasPurchase && (
                              <Badge className="bg-green-600 text-white text-xs">✓ Cliente</Badge>
                            )}
                          </div>
                          
                          {marker.client.clinic_name && (
                            <p className="text-sm text-slate-600 mb-1">{marker.client.clinic_name}</p>
                          )}
                          
                          {marker.client.cnpj && (
                            <p className="text-xs text-slate-500 mb-1">CNPJ: {marker.client.cnpj}</p>
                          )}
                          
                          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {marker.client.city}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setEditingClient(marker.client)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(createPageUrl(`ClientProfile?id=${marker.client.id}`))}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                              Ver Perfil
                            </Button>
                          </div>
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

          {/* Legenda */}
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Legenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">Clientes (com venda)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">Quentes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">Mornos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">Frios</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alfabético */}
        <TabsContent value="alfabetico" className="mt-0 space-y-2">
          {clientsAlphabetical.map(client => {
            const hasPurchase = sales.some(s => 
              s.client_id === client.id && (s.status === 'fechada' || s.status === 'entregue')
            );
            
            return (
              <Card 
                key={client.id} 
                className={`p-4 ${hasPurchase ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{client.first_name}</h3>
                    {client.razao_social && (
                      <p className="text-sm text-slate-600">{client.razao_social}</p>
                    )}
                    {client.cnpj && (
                      <p className="text-xs text-slate-500">CNPJ: {client.cnpj}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">{client.city}</p>
                  </div>
                  <div className="flex gap-2">
                    {hasPurchase && (
                      <Badge className="bg-green-600 text-white">✓</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                  className="w-full"
                >
                  Ver Perfil
                </Button>
              </Card>
            );
          })}
        </TabsContent>

        {/* Por Cidade */}
        <TabsContent value="cidade" className="mt-0 space-y-4">
          {clientsByCity.map(([city, cityClients]) => (
            <Card key={city} className="p-4">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                {city} ({cityClients.length})
              </h3>
              <div className="space-y-2">
                {cityClients.map(client => {
                  const hasPurchase = sales.some(s => 
                    s.client_id === client.id && (s.status === 'fechada' || s.status === 'entregue')
                  );
                  
                  return (
                    <div 
                      key={client.id}
                      className={`p-3 rounded-lg border-2 ${hasPurchase ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{client.first_name}</p>
                          {client.cnpj && (
                            <p className="text-xs text-slate-500">CNPJ: {client.cnpj}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {hasPurchase && <Badge className="bg-green-600 text-white text-xs">✓</Badge>}
                          <Button size="sm" variant="ghost" onClick={() => setEditingClient(client)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                        className="w-full text-xs h-8"
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientDataEditor clientId={editingClient.id} client={editingClient} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}