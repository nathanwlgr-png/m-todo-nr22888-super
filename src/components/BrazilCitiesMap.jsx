import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Route } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const MAJOR_BRAZILIAN_CITIES = [
  { name: 'São Paulo', coords: [-23.5505, -46.6333], state: 'SP' },
  { name: 'Rio de Janeiro', coords: [-22.9068, -43.1729], state: 'RJ' },
  { name: 'Belo Horizonte', coords: [-19.8267, -43.9365], state: 'MG' },
  { name: 'Brasília', coords: [-15.7939, -47.8822], state: 'DF' },
  { name: 'Salvador', coords: [-12.9714, -38.5014], state: 'BA' },
  { name: 'Fortaleza', coords: [-3.7319, -38.5267], state: 'CE' },
  { name: 'Manaus', coords: [-3.1190, -60.0217], state: 'AM' },
  { name: 'Curitiba', coords: [-25.4284, -49.2733], state: 'PR' },
  { name: 'Recife', coords: [-8.0476, -34.8770], state: 'PE' },
  { name: 'Porto Alegre', coords: [-30.0346, -51.2177], state: 'RS' },
  { name: 'Belém', coords: [-1.4554, -48.5039], state: 'PA' },
  { name: 'Goiânia', coords: [-15.7975, -48.2869], state: 'GO' },
  { name: 'Guarulhos', coords: [-23.4569, -46.4903], state: 'SP' },
  { name: 'Campinas', coords: [-22.8955, -47.0696], state: 'SP' },
  { name: 'São Gonçalo', coords: [-22.8308, -43.0537], state: 'RJ' },
  { name: 'Maceió', coords: [-9.6498, -35.7373], state: 'AL' },
  { name: 'Duque de Caxias', coords: [-22.7859, -43.3169], state: 'RJ' },
  { name: 'Natal', coords: [-5.7942, -35.2110], state: 'RN' },
  { name: 'Teresina', coords: [-5.0923, -42.8044], state: 'PI' },
  { name: 'São Luís', coords: [-2.9037, -44.3039], state: 'MA' },
];

export default function BrazilCitiesMap({ selectedClients = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [route, setRoute] = useState(null);
  const [mapKey, setMapKey] = useState(0);

  const filteredCities = MAJOR_BRAZILIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCity = (city) => {
    setSelectedCities(prev =>
      prev.some(c => c.name === city.name)
        ? prev.filter(c => c.name !== city.name)
        : [...prev, city]
    );
  };

  const calculateRoute = () => {
    if (selectedCities.length < 2) {
      alert('Selecione pelo menos 2 cidades para traçar rota');
      return;
    }

    const routeCoords = selectedCities.map(city => [city.coords[0], city.coords[1]]);
    setRoute(routeCoords);
    setMapKey(prev => prev + 1);
  };

  const clearSelection = () => {
    setSelectedCities([]);
    setRoute(null);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-900">🗺️ Mapa do Brasil - Planejador de Rotas</p>
            <p className="text-xs text-green-600">Selecione cidades e trace rotas otimizadas</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            placeholder="Buscar cidade ou estado (ex: São Paulo, SP)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-green-200">
          {filteredCities.map(city => (
            <button
              key={city.name}
              onClick={() => toggleCity(city)}
              className={`p-2 rounded text-xs font-semibold transition-all ${
                selectedCities.some(c => c.name === city.name)
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Selected Cities */}
        {selectedCities.length > 0 && (
          <div className="p-3 bg-white rounded-lg border-2 border-green-300 mb-4">
            <p className="text-xs font-bold text-green-700 mb-2">
              {selectedCities.length} cidade(s) selecionada(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCities.map(city => (
                <span key={city.name} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {city.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={calculateRoute}
            disabled={selectedCities.length < 2}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Route className="w-4 h-4 mr-2" />
            Traçar Rota
          </Button>
          <Button
            onClick={clearSelection}
            variant="outline"
            className="flex-1 border-green-300"
          >
            Limpar
          </Button>
        </div>

        {/* Map */}
        <div className="w-full h-96 rounded-lg border-2 border-green-300 overflow-hidden bg-slate-100">
          <MapContainer
            key={mapKey}
            center={[-14.2350, -51.9253]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Route Line */}
            {route && route.length > 1 && (
              <Polyline
                positions={route}
                color="green"
                weight={3}
                opacity={0.8}
                dashArray="5, 5"
              />
            )}

            {/* Selected Cities Markers */}
            {selectedCities.map((city, idx) => (
              <Marker key={city.name} position={[city.coords[0], city.coords[1]]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-green-700">{city.name}</p>
                    <p className="text-xs text-slate-600">{city.state}</p>
                    {route && <p className="text-xs text-blue-600">Parada #{idx + 1}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* All Cities Markers (smaller) */}
            {!route &&
              MAJOR_BRAZILIAN_CITIES.filter(c => !selectedCities.some(s => s.name === c.name)).map(
                city => (
                  <Marker
                    key={city.name}
                    position={[city.coords[0], city.coords[1]]}
                    icon={L.icon({
                      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
                      iconSize: [20, 32],
                      popupAnchor: [0, -16],
                    })}
                  >
                    <Popup>{city.name}</Popup>
                  </Marker>
                )
              )}
          </MapContainer>
        </div>

        {/* Info */}
        {route && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600 text-xs text-slate-700">
            <p className="font-bold text-blue-700 mb-1">✓ Rota Traçada</p>
            <p>Clique nos marcadores para ver detalhes de cada parada. Optimize sua agenda de visitas!</p>
          </div>
        )}
      </Card>
    </div>
  );
}