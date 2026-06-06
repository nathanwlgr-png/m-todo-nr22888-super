import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas aproximadas de cidades brasileiras comuns
const cityCoordinates = {
  // Região Laranja — Interior de SP (Nathan)
  'marília': [-22.2139, -49.9458],
  'presidente prudente': [-22.1256, -51.3889],
  'assis': [-22.6617, -50.4111],
  'tupã': [-21.9347, -50.5117],
  'adamantina': [-21.6853, -51.0725],
  'bauru': [-22.3147, -49.0606],
  'araçatuba': [-21.2081, -50.4328],
  'ourinhos': [-22.9789, -49.8706],
  'dracena': [-21.4828, -51.5314],
  'lins': [-22.2189, -49.7431],
  'agudos': [-22.4694, -48.9864],
  'águas de santa bárbara': [-22.8814, -49.2389],
  'botucatu': [-22.8869, -48.4450],
  'jaú': [-22.2775, -48.5545],
  'araraquara': [-21.7930, -48.1763],
  'ribeirão preto': [-21.1767, -47.8101],
  // Capitais Brasileiras
  'são paulo': [-23.5505, -46.6333],
  'rio de janeiro': [-22.9068, -43.1729],
  'belo horizonte': [-19.9167, -43.9345],
  'brasília': [-15.8267, -47.9218],
  'salvador': [-12.9714, -38.5014],
  'fortaleza': [-3.7172, -38.5433],
  'curitiba': [-25.4284, -49.2733],
  'recife': [-8.0476, -34.8770],
  'porto alegre': [-30.0346, -51.2177],
  'manaus': [-3.1190, -60.0217],
  'belém': [-1.4554, -48.5044],
  'goiânia': [-16.6869, -49.2648],
  'guarulhos': [-23.4538, -46.5333],
  'campinas': [-22.9099, -47.0626],
  'são bernardo do campo': [-23.6944, -46.5653],
  'natal': [-5.7945, -35.2110],
  'campo grande': [-20.4697, -54.6201],
  'teresina': [-5.0892, -42.8019],
  'são luís': [-2.5297, -44.3028],
  'joão pessoa': [-7.1195, -34.8450]
};

function MapUpdater({ bounds }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [bounds, map]);
  
  return null;
}

export default function ClientsMap({ clients }) {
  const { mapData, bounds } = useMemo(() => {
    const cityGroups = {};
    
    clients.forEach(client => {
      if (!client.city) return;
      
      const cityKey = client.city.toLowerCase().trim();
      const coords = cityCoordinates[cityKey];
      
      if (coords) {
        if (!cityGroups[cityKey]) {
          cityGroups[cityKey] = {
            name: client.city,
            coords,
            clients: [],
            hot: 0,
            warm: 0,
            cold: 0,
            revenue: 0
          };
        }
        
        cityGroups[cityKey].clients.push(client);
        cityGroups[cityKey][client.status === 'quente' ? 'hot' : client.status === 'morno' ? 'warm' : 'cold']++;
        cityGroups[cityKey].revenue += client.projected_revenue || 0;
      }
    });
    
    const mapData = Object.values(cityGroups);
    const bounds = mapData.length > 0 ? mapData.map(city => city.coords) : null;
    
    return { mapData, bounds };
  }, [clients]);

  if (mapData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
        <p className="text-slate-400 text-sm">Adicione cidades aos clientes para visualizar o mapa</p>
      </div>
    );
  }

  const getMarkerColor = (city) => {
    if (city.hot > 0) return '#ef4444';
    if (city.warm > 0) return '#eab308';
    return '#60a5fa';
  };

  const getMarkerSize = (city) => {
    const total = city.clients.length;
    return Math.max(8, Math.min(20, total * 3));
  };

  return (
    <div className="h-80 rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bounds && <MapUpdater bounds={bounds} />}
        
        {mapData.map((city, index) => (
          <CircleMarker
            key={index}
            center={city.coords}
            radius={getMarkerSize(city)}
            fillColor={getMarkerColor(city)}
            color="#fff"
            weight={2}
            fillOpacity={0.7}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 mb-1">{city.name}</p>
                <p className="text-slate-600 mb-2">{city.clients.length} cliente{city.clients.length !== 1 ? 's' : ''}</p>
                <div className="space-y-1 text-xs">
                  {city.hot > 0 && <p className="text-red-600">🔥 {city.hot} quente{city.hot !== 1 ? 's' : ''}</p>}
                  {city.warm > 0 && <p className="text-yellow-600">🌡️ {city.warm} morno{city.warm !== 1 ? 's' : ''}</p>}
                  {city.cold > 0 && <p className="text-blue-600">❄️ {city.cold} frio{city.cold !== 1 ? 's' : ''}</p>}
                  {city.revenue > 0 && (
                    <p className="text-emerald-600 font-medium mt-2">
                      💰 R$ {city.revenue.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}