import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function SmartMapRoute({ clientsData = [], center = [-20.3, -49.0], showOptimization = true }) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [selectedClients, setSelectedClients] = useState(new Set());

  // Coordenadas das cidades (você pode expandir isso)
  const cityCoords = {
    'Marília': [-22.2141, -49.9477],
    'Bauru': [-22.3604, -49.0635],
    'Araraquara': [-21.7944, -48.1745],
    'São Carlos': [-22.0054, -47.8915],
    'Ribeirão Preto': [-21.1789, -47.8104],
    'Sorocaba': [-23.4955, -47.4597],
    'Campinas': [-22.9068, -47.0616],
    'São Paulo': [-23.5505, -46.6333],
  };

  // Preparar dados do mapa
  useEffect(() => {
    if (clientsData.length > 0) {
      const markersData = clientsData.map(client => {
        const cityName = client.city || 'Marília';
        const coords = cityCoords[cityName] || [-22.2141, -49.9477];
        return {
          id: client.id,
          name: client.first_name || client.clinic_name,
          coords,
          status: client.status,
          city: cityName,
          phone: client.phone,
        };
      });
      setMapData(markersData);
    }
  }, [clientsData]);

  const optimizeRoute = async () => {
    if (selectedClients.size === 0) {
      toast.info('Selecione clientes para otimizar rota');
      return;
    }

    setLoading(true);
    try {
      const selected = mapData.filter(m => selectedClients.has(m.id));
      const coordArray = selected.map(m => ({ lat: m.coords[0], lng: m.coords[1] }));

      const res = await base44.functions.invoke('optimizeRoute', {
        locations: coordArray,
        startPoint: coordArray[0]
      });

      if (res.data?.route) {
        setRoute(res.data.route.map(idx => selected[idx]));
        toast.success(`Rota otimizada: ${selected.length} clientes`);
      }
    } catch (e) {
      toast.error('Erro ao otimizar rota');
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (clientId) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const getMarkerColor = (status) => {
    const colors = { 'quente': '#22c55e', 'morno': '#f59e0b', 'frio': '#6366f1' };
    return colors[status] || '#94a3b8';
  };

  const routeCoords = route ? route.map(r => r.coords) : [];

  if (!mapData) {
    return <div className="text-center text-sm text-slate-500">Carregando mapa...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Controles */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={selectedClients.size > 0 ? 'default' : 'outline'}
          onClick={optimizeRoute}
          disabled={loading || selectedClients.size === 0}
          className="h-8 text-xs"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
          {loading ? 'Otimizando...' : `Otimizar (${selectedClients.size})`}
        </Button>
        {route && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRoute(null)}
            className="h-8 text-xs"
          >
            Limpar Rota
          </Button>
        )}
      </div>

      {/* Mapa */}
      <Card>
        <CardContent className="p-2">
          <div className="rounded overflow-hidden" style={{ height: '400px' }}>
            <MapContainer center={center} zoom={8} style={{ height: '100%' }} scrollWheelZoom={true}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* Marcadores com cores por status */}
              {mapData.map((marker) => {
                const statusColor = marker.status === 'quente' ? '#22c55e' : marker.status === 'morno' ? '#f59e0b' : '#6366f1';
                return (
                  <CircleMarker
                    key={marker.id}
                    center={marker.coords}
                    radius={8}
                    fill={true}
                    fillColor={statusColor}
                    fillOpacity={0.8}
                    color={statusColor}
                    weight={2}
                    opacity={0.9}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <p className="font-bold">{marker.name}</p>
                        <p className="text-slate-600">{marker.city}</p>
                        <p className={`text-[10px] px-2 py-0.5 rounded w-fit ${
                          marker.status === 'quente' ? 'bg-green-100 text-green-700' :
                          marker.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {marker.status}
                        </p>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedClients.has(marker.id)}
                            onChange={() => toggleClient(marker.id)}
                            className="w-3 h-3"
                          />
                          <span className="text-[10px]">Incluir na rota</span>
                        </label>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Rota otimizada */}
              {routeCoords.length > 1 && (
                <Polyline positions={routeCoords} color="#ef4444" weight={2} opacity={0.7} />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rota Otimizada */}
      {route && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-2.5">
            <p className="text-xs font-bold text-green-700 mb-2">✅ Rota Otimizada ({route.length} clientes)</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {route.map((client, idx) => (
                <div key={client.id} className="flex items-center gap-2 text-[10px] bg-white p-1.5 rounded">
                  <span className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-slate-500">{client.city}</p>
                  </div>
                  {client.phone && (
                    <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs">
                      💬
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes */}
      <Card className="max-h-40 overflow-y-auto">
        <CardContent className="p-2">
          <p className="text-xs font-bold text-slate-700 mb-1.5">Clientes no Mapa ({mapData.length})</p>
          <div className="grid grid-cols-2 gap-1">
            {mapData.map(marker => (
              <label key={marker.id} className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded cursor-pointer text-[10px]">
                <input
                  type="checkbox"
                  checked={selectedClients.has(marker.id)}
                  onChange={() => toggleClient(marker.id)}
                  className="w-3 h-3"
                />
                <div className="flex-1">
                  <p className="font-semibold">{marker.name}</p>
                  <p className="text-slate-500">{marker.city}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getMarkerColor(marker.status) }}
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}