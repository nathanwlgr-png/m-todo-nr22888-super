import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

// Componente nativo para markers clusterizados
function ClusteredMarkers({ clients, onSelect }) {
  const map = useMap();

  React.useEffect(() => {
    const mcg = L.markerClusterGroup({ maxClusterRadius: 60 });

    clients.forEach(client => {
      const marker = L.marker([client.latitude, client.longitude], {
        icon: createIcon(client.status, client.precision_status),
      });
      marker.bindPopup(`
        <div style="min-width:160px;font-size:13px">
          <b>${client.clinic_name || client.first_name || '—'}</b><br/>
          <span style="color:#666">${client.city || ''}</span><br/>
          <span>Status: ${client.status || '—'}</span>
        </div>
      `);
      marker.on('click', () => onSelect(client));
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    return () => { map.removeLayer(mcg); };
  }, [map, clients, onSelect]);

  return null;
}
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MapPin, AlertTriangle, Navigation, MessageCircle, Search, RefreshCw, Navigation2, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Ícones customizados por status
const createIcon = (status, precisionStatus) => {
  let color = '#9CA3AF'; // cinza padrão
  
  if (precisionStatus === 'revisar') {
    color = '#6B7280'; // cinza escuro — revisar
  } else if (status === 'quente') {
    color = '#22C55E'; // verde — quente
  } else if (status === 'morno') {
    color = '#FBBF24'; // amarelo — morno
  } else if (status === 'frio') {
    color = '#EF4444'; // vermelho — frio
  }

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        📍
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function ClientLocationMap() {
  const [searchCity, setSearchCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterConfidence, setFilterConfidence] = useState('todos');
  const [mapCenter, setMapCenter] = useState([-10.2, -51.5]);
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['client-map'],
    queryFn: async () => {
      const items = await base44.entities.Client.list('-updated_date', 500);
      return items;
    },
    staleTime: 60000,
  });

  // Contar clientes sem localização
  const clientsNeedingGeocode = useMemo(() => 
    clients.filter(c => !c.latitude || !c.longitude),
    [clients]
  );

  const cities = useMemo(() => [...new Set(clients.map(c => c.city).filter(Boolean))].sort(), [clients]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      // Mostrar apenas clientes com localização válida
      if (!c.latitude || !c.longitude) return false;
      
      const matchCity = !searchCity || c.city === searchCity;
      const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
      const matchConfidence = filterConfidence === 'todos' || c.precision_status === filterConfidence;
      return matchCity && matchStatus && matchConfidence;
    });
  }, [clients, searchCity, filterStatus, filterConfidence]);

  const handleGeocodeAll = useCallback(async () => {
    if (clientsNeedingGeocode.length === 0) {
      toast.success('Todos os clientes já têm localização validada!');
      return;
    }

    const toastId = toast.loading(`Geocodificando ${clientsNeedingGeocode.length} clientes...`);
    let success = 0;
    let failed = 0;
    
    // Processar em paralelo com limite
    const batchSize = 5;
    for (let i = 0; i < clientsNeedingGeocode.length; i += batchSize) {
      const batch = clientsNeedingGeocode.slice(i, i + batchSize);
      await Promise.all(batch.map(async (client) => {
        try {
          await base44.functions.invoke('geocodeClientLocation', {
            client_id: client.id,
            address: client.address,
            clinic_name: client.clinic_name,
            city: client.city,
            state: 'SP',
          });
          success++;
        } catch (err) {
          failed++;
          console.error(`Erro ao geocodificar ${client.clinic_name}:`, err);
        }
      }));
    }

    toast.dismiss(toastId);
    toast.success(`${success} clientes geocodificados${failed > 0 ? `, ${failed} falharam` : ''}!`);
    refetch();
  }, [clientsNeedingGeocode, refetch]);

  const getPrecisionColor = (status) => {
    const map = {
      '100_validado': 'bg-green-100 text-green-800',
      'alta_confianca': 'bg-blue-100 text-blue-800',
      'media_confianca': 'bg-yellow-100 text-yellow-800',
      'baixa_confianca': 'bg-orange-100 text-orange-800',
      'revisar': 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando mapa...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Mapa de Clientes NR22888
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alerta de clientes sem geocodificação */}
          {clientsNeedingGeocode.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-amber-800">
                <p className="font-semibold">{clientsNeedingGeocode.length} clientes sem localização validada</p>
                <p className="text-xs mt-1">Clique em "Geocodificar" para validar endereços automaticamente</p>
              </div>
              <Button
                onClick={handleGeocodeAll}
                size="sm"
                variant="outline"
                className="gap-1 shrink-0"
              >
                <Zap className="w-4 h-4" />
                Geocodificar
              </Button>
            </div>
          )}

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="h-9 text-sm border rounded-md px-2 bg-white"
            >
              <option value="">Todas cidades ({clients.length})</option>
              {cities.map(c => {
                const count = clients.filter(cl => cl.city === c).length;
                return <option key={c} value={c}>{c} ({count})</option>;
              })}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 text-sm border rounded-md px-2 bg-white"
            >
              <option value="todos">Todos status</option>
              <option value="quente">🟢 Quente</option>
              <option value="morno">🟡 Morno</option>
              <option value="frio">🔴 Frio</option>
            </select>

            <select
              value={filterConfidence}
              onChange={e => setFilterConfidence(e.target.value)}
              className="h-9 text-sm border rounded-md px-2 bg-white"
            >
              <option value="todos">Todas confiabilidades</option>
              <option value="100_validado">✅ 100% Validado</option>
              <option value="alta_confianca">✔️ Alta</option>
              <option value="media_confianca">◐ Média</option>
              <option value="baixa_confianca">△ Baixa</option>
              <option value="revisar">⚠️ Revisar</option>
            </select>

            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {/* Mapa Leaflet */}
          <div className="relative h-96 rounded-lg border overflow-hidden">
            {filtered.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                Nenhum cliente com localização válida neste filtro
              </div>
            ) : (
              <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <ClusteredMarkers clients={filtered} onSelect={setSelectedClient} />
              </MapContainer>
            )}
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {[
              { color: '#22C55E', label: 'Quente', icon: '🟢' },
              { color: '#FBBF24', label: 'Morno', icon: '🟡' },
              { color: '#EF4444', label: 'Frio', icon: '🔴' },
              { color: '#3B82F6', label: 'Equipado', icon: '🔵' },
              { color: '#6B7280', label: 'Revisar', icon: '⚠️' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Painel de detalhes do cliente selecionado */}
      {selectedClient && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{selectedClient.clinic_name || selectedClient.first_name}</CardTitle>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-red-500">✕</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Localização</p>
                <p className="font-semibold">{selectedClient.city}, SP</p>
                <p className="text-xs text-slate-600">{selectedClient.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge className={`text-xs mt-1 ${
                  selectedClient.status === 'quente' ? 'bg-green-500' :
                  selectedClient.status === 'morno' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {selectedClient.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Confiança</p>
                <Badge className={`text-xs mt-1 ${getPrecisionColor(selectedClient.precision_status)}`}>
                  {selectedClient.precision_status?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Score de Compra</p>
                <p className="font-semibold">{selectedClient.purchase_score || '—'}</p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-2 flex-wrap">
              {selectedClient.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => window.open(`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => {
                  window.location.href = `/ClientProfile?id=${selectedClient.id}`;
                }}
              >
                <Search className="w-4 h-4" />
                Perfil
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => {
                  window.location.href = `/ModoInvestigativoSupremo?client_id=${selectedClient.id}`;
                }}
              >
                <Navigation2 className="w-4 h-4" />
                Investigar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => {
                  window.location.href = `/GenerateWhatsAppIntegrated?client_id=${selectedClient.id}`;
                }}
              >
                <MessageCircle className="w-4 h-4" />
                SPIN
              </Button>
            </div>

            {/* Alerta de confiabilidade */}
            {selectedClient.precision_status === 'revisar' && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-2 flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <p className="font-semibold">Localização incerta</p>
                  <p>Valide o endereço no cadastro do cliente para geocodificar automaticamente.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}