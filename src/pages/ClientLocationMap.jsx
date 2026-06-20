import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, MessageCircle, Search, RefreshCw, Navigation2, Zap, AlertCircle, LocateFixed, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// ─── ÍCONES ────────────────────────────────────────────────────────────────
const createClientIcon = (status) => {
  const colors = {
    quente: { bg: '#16A34A', border: '#BBF7D0', emoji: '🔥' },
    morno:  { bg: '#D97706', border: '#FDE68A', emoji: '⚡' },
    frio:   { bg: '#DC2626', border: '#FECACA', emoji: '❄️' },
  };
  const c = colors[status] || { bg: '#6B7280', border: '#E5E7EB', emoji: '📍' };
  return L.divIcon({
    html: `<div style="background:${c.bg};width:36px;height:36px;border-radius:50%;border:3px solid ${c.border};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4);">${c.emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
};

const myLocationIcon = L.divIcon({
  html: `<div style="background:#3B82F6;width:20px;height:20px;border-radius:50%;border:4px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.4),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── COMPONENTE DE CENTRALIZAÇÃO NO MAPA ───────────────────────────────────
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// ─── CÁLCULO DE DISTÂNCIA (Haversine) ─────────────────────────────────────
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────
export default function ClientLocationMap() {
  const [filterStatus, setFilterStatus] = useState('todos');
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(10); // km
  const [listExpanded, setListExpanded] = useState(true);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['client-map'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 60000,
  });

  // ── GPS: pegar localização atual ─────────────────────────────────────────
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS não disponível neste dispositivo');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMyLocation(coords);
        setFlyTarget(coords);
        setLocating(false);
        toast.success('Localização encontrada!');
      },
      () => {
        setLocating(false);
        toast.error('Não foi possível obter sua localização. Verifique as permissões do navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Pegar localização automaticamente ao abrir
  useEffect(() => { locateMe(); }, []);

  // ── CLIENTES COM LOCALIZAÇÃO + DISTÂNCIA ─────────────────────────────────
  const clientsWithCoords = useMemo(() =>
    clients
      .filter(c => c.latitude && c.longitude)
      .map(c => ({
        ...c,
        distance: myLocation
          ? calcDistance(myLocation[0], myLocation[1], c.latitude, c.longitude)
          : null,
      }))
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)),
    [clients, myLocation]
  );

  const filtered = useMemo(() =>
    clientsWithCoords.filter(c =>
      filterStatus === 'todos' || c.status === filterStatus
    ),
    [clientsWithCoords, filterStatus]
  );

  const nearby = useMemo(() =>
    myLocation
      ? filtered.filter(c => c.distance !== null && c.distance <= nearbyRadius)
      : [],
    [filtered, myLocation, nearbyRadius]
  );

  const clientsNeedingGeocode = useMemo(() =>
    clients.filter(c => !c.latitude || !c.longitude),
    [clients]
  );

  const handleGeocodeAll = useCallback(async () => {
    if (clientsNeedingGeocode.length === 0) { toast.success('Todos já têm localização!'); return; }
    const id = toast.loading(`Geocodificando ${clientsNeedingGeocode.length} clientes...`);
    let ok = 0;
    for (let i = 0; i < clientsNeedingGeocode.length; i += 5) {
      await Promise.all(clientsNeedingGeocode.slice(i, i+5).map(async c => {
        try {
          await base44.functions.invoke('geocodeClientLocation', { client_id: c.id, address: c.address, clinic_name: c.clinic_name, city: c.city, state: 'SP' });
          ok++;
        } catch {}
      }));
    }
    toast.dismiss(id);
    toast.success(`${ok} clientes geocodificados!`);
    refetch();
  }, [clientsNeedingGeocode, refetch]);

  const statusLabel = { quente: '🔥 Quente', morno: '⚡ Morno', frio: '❄️ Frio' };
  const statusBadge = { quente: 'bg-green-600', morno: 'bg-amber-500', frio: 'bg-red-600' };

  const defaultCenter = myLocation || [-23.55, -46.63];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center"><div className="text-2xl mb-2">🗺️</div>Carregando clientes...</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-80px)] min-h-0">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-black text-slate-800 text-base">Radar de Clientes</span>
          <Badge variant="outline" className="text-xs">{filtered.length} no mapa</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-8 text-xs border rounded-md px-2 bg-white"
          >
            <option value="todos">Todos</option>
            <option value="quente">🔥 Quente</option>
            <option value="morno">⚡ Morno</option>
            <option value="frio">❄️ Frio</option>
          </select>
          <select
            value={nearbyRadius}
            onChange={e => setNearbyRadius(Number(e.target.value))}
            className="h-8 text-xs border rounded-md px-2 bg-white"
          >
            <option value={5}>Raio 5 km</option>
            <option value={10}>Raio 10 km</option>
            <option value={20}>Raio 20 km</option>
            <option value={50}>Raio 50 km</option>
          </select>
          <Button onClick={locateMe} disabled={locating} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 text-xs">
            <LocateFixed className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
            {locating ? 'Localizando...' : 'Minha Posição'}
          </Button>
          <Button onClick={refetch} variant="outline" size="sm" className="h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── ALERTA DE GEOCODE ── */}
      {clientsNeedingGeocode.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 mx-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span><strong>{clientsNeedingGeocode.length}</strong> clientes sem coordenadas.</span>
          <Button onClick={handleGeocodeAll} size="sm" variant="outline" className="h-6 text-xs ml-auto gap-1 border-amber-400">
            <Zap className="w-3 h-3" />Geocodificar
          </Button>
        </div>
      )}

      {/* ── MAPA ── */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: myLocation ? '48vh' : '60vh', minHeight: 280 }}>
        <MapContainer center={defaultCenter} zoom={myLocation ? 12 : 7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          {flyTarget && <FlyTo coords={flyTarget} />}

          {/* Marcador de localização atual */}
          {myLocation && (
            <>
              <Marker position={myLocation} icon={myLocationIcon}>
                <Popup>
                  <div className="text-xs font-bold text-blue-700">📍 Você está aqui</div>
                </Popup>
              </Marker>
              <Circle
                center={myLocation}
                radius={nearbyRadius * 1000}
                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.06, weight: 1.5, dashArray: '6' }}
              />
            </>
          )}

          {/* Marcadores dos clientes */}
          {filtered.map(client => (
            <Marker
              key={client.id}
              position={[client.latitude, client.longitude]}
              icon={createClientIcon(client.status)}
              eventHandlers={{ click: () => setSelectedClient(client) }}
            >
              <Popup>
                <div className="w-52 text-sm">
                  <p className="font-bold leading-tight">{client.clinic_name || client.first_name}</p>
                  <p className="text-xs text-slate-500 mb-1">{client.city}</p>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${statusBadge[client.status] || 'bg-gray-500'}`}>
                      {statusLabel[client.status] || client.status}
                    </span>
                    {client.distance !== null && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {client.distance < 1 ? `${Math.round(client.distance * 1000)}m` : `${client.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {client.phone && (
                      <a href={`https://wa.me/${client.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">WhatsApp</a>
                    )}
                    <a href={`/ClientProfile?id=${client.id}`}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">Perfil</a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legenda flutuante */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs space-y-1 z-[1000]">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div> Você</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-600"></div> Quente</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Morno</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-600"></div> Frio</div>
        </div>
      </div>

      {/* ── LISTA DE CLIENTES PRÓXIMOS ── */}
      {myLocation && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <button
            onClick={() => setListExpanded(v => !v)}
            className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 w-full text-left"
          >
            <div className="flex items-center gap-2">
              <LocateFixed className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-sm text-slate-800">
                {nearby.length} {nearby.length === 1 ? 'cliente próximo' : 'clientes próximos'}
                <span className="text-slate-400 font-normal ml-1">(até {nearbyRadius}km)</span>
              </span>
            </div>
            {listExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {listExpanded && (
            <div className="overflow-y-auto flex-1" style={{ maxHeight: '36vh' }}>
              {nearby.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum cliente com localização registrada em {nearbyRadius}km
                </div>
              ) : (
                nearby.map(client => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setFlyTarget([client.latitude, client.longitude]);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    {/* Distância */}
                    <div className="text-center min-w-[44px]">
                      <p className="text-sm font-black text-blue-700">
                        {client.distance < 1 ? `${Math.round(client.distance*1000)}m` : `${client.distance.toFixed(1)}km`}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{client.clinic_name || client.first_name}</p>
                      <p className="text-xs text-slate-400 truncate">{client.city} {client.address ? `• ${client.address}` : ''}</p>
                    </div>

                    {/* Status + Score */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${statusBadge[client.status] || 'bg-gray-500'}`}>
                        {statusLabel[client.status] || '—'}
                      </span>
                      {client.purchase_score > 0 && (
                        <span className="text-xs text-slate-400">Score {client.purchase_score}</span>
                      )}
                    </div>

                    {/* Ações rápidas */}
                    <div className="flex gap-1 shrink-0">
                      {client.phone && (
                        <a
                          href={`https://wa.me/${client.phone.replace(/\D/g,'')}`}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <a
                        href={`/ClientProfile?id=${client.id}`}
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <Search className="w-4 h-4" />
                      </a>
                      {client.latitude && client.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SEM LOCALIZAÇÃO ── */}
      {!myLocation && !locating && (
        <div className="text-center py-6 text-slate-400 text-sm">
          <LocateFixed className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <p className="font-semibold">Ative sua localização para ver clientes próximos</p>
          <Button onClick={locateMe} className="mt-3 bg-blue-600 text-white gap-1">
            <LocateFixed className="w-4 h-4" /> Localizar agora
          </Button>
        </div>
      )}
    </div>
  );
}