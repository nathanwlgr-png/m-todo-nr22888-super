import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone } from 'lucide-react';

const createIcon = (color = 'blue') => {
  const colors = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    orange: '#f97316'
  };

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="14" fill="${colors[color]}" opacity="0.2"/>
        <path d="M16 2C9.4 2 4 7.4 4 14c0 9 12 18 12 18s12-9 12-18c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="${colors[color]}"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function MapWithClinics({
  clinics,
  optimizedRoute,
  selectedClinics,
  onSelectClinic
}) {
  if (!clinics || clinics.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-50 rounded-lg">
        <p className="text-slate-500">Nenhuma clínica encontrada</p>
      </div>
    );
  }

  // Encontrar centro do mapa
  const centerLat =
    clinics.reduce((sum, c) => sum + (c.latitude || 0), 0) / clinics.length || -23.5505;
  const centerLng =
    clinics.reduce((sum, c) => sum + (c.longitude || 0), 0) / clinics.length || -46.6333;

  // Preparar rota
  const routeCoordinates = optimizedRoute?.optimizedPath?.map(clinic => [
    clinic.latitude,
    clinic.longitude
  ]) || [];

  return (
    <div className="space-y-4">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        className="h-96 rounded-lg border-2"
        style={{ zIndex: 10 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Rota otimizada */}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#3b82f6" weight={3} opacity={0.7} />
        )}

        {/* Marcadores */}
        {clinics.map((clinic, idx) => {
          const isSelected = selectedClinics.find(c => c.id === clinic.id);
          const isInRoute = optimizedRoute?.optimizedPath?.find(c => c.id === clinic.id);
          const routeOrder = isInRoute
            ? optimizedRoute.optimizedPath.findIndex(c => c.id === clinic.id) + 1
            : null;

          return (
            <Marker
              key={clinic.id}
              position={[clinic.latitude || 0, clinic.longitude || 0]}
              icon={createIcon(
                routeOrder ? 'green' : isSelected ? 'orange' : 'blue'
              )}
            >
              <Popup>
                <div className="w-56 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-sm flex-1">{clinic.name}</h3>
                    {routeOrder && (
                      <Badge className="bg-green-600">{routeOrder}º</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    {clinic.address && (
                      <div className="flex gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{clinic.address}</span>
                      </div>
                    )}
                    {clinic.phone && (
                      <div className="flex gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{clinic.phone}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => onSelectClinic(clinic)}
                    className="w-full h-8 text-xs"
                  >
                    {isSelected ? 'Selecionada' : 'Selecionar'}
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Selecionada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Na Rota</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}