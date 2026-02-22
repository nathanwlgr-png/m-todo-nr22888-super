import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

export default function GeoMapClients({ clients = [] }) {
  const mapData = useMemo(() => {
    return clients.map(client => {
      const cityName = client.city || 'Marília';
      const coords = cityCoords[cityName] || [-22.2141, -49.9477];
      return {
        id: client.id,
        name: client.first_name || client.clinic_name,
        coords,
        status: client.status,
        city: cityName,
        phone: client.phone,
        score: client.purchase_score || 0,
      };
    });
  }, [clients]);

  const statusColor = {
    'quente': { color: '#22c55e', label: '🔴 Quente' },
    'morno': { color: '#f59e0b', label: '🟡 Morno' },
    'frio': { color: '#6366f1', label: '🔵 Frio' }
  };

  const center = mapData.length > 0 
    ? mapData.reduce((acc, m) => [acc[0] + m.coords[0], acc[1] + m.coords[1]], [0, 0]).map(v => v / mapData.length)
    : [-22.2141, -49.9477];

  if (!mapData.length) {
    return <p className="text-xs text-slate-500">Sem clientes para exibir no mapa</p>;
  }

  return (
    <Card>
      <CardContent className="p-2">
        <div className="rounded overflow-hidden" style={{ height: '350px' }}>
          <MapContainer center={center} zoom={8} style={{ height: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />

            {mapData.map((marker) => {
              const sc = statusColor[marker.status] || statusColor['frio'];
              return (
                <CircleMarker
                  key={marker.id}
                  center={marker.coords}
                  radius={7}
                  fill={true}
                  fillColor={sc.color}
                  fillOpacity={0.85}
                  color={sc.color}
                  weight={2}
                  opacity={1}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-32">
                      <p className="font-bold text-slate-800">{marker.name}</p>
                      <p className="text-slate-600 text-[10px]">{marker.city}</p>
                      <Badge className="text-[9px]" variant="outline">{sc.label}</Badge>
                      <p className="text-slate-700 font-semibold">Score: {marker.score}/100</p>
                      {marker.phone && (
                        <a 
                          href={`https://wa.me/${marker.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block text-green-600 hover:text-green-700 text-xs font-semibold"
                        >
                          💬 Abrir WhatsApp
                        </a>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}