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
const createRecordIcon = (status, recordType) => {
  const colors = {
    quente: { bg: '#16A34A', border: '#BBF7D0', emoji: '🔥' },
    morno:  { bg: '#D97706', border: '#FDE68A', emoji: '⚡' },
    frio:   { bg: '#DC2626', border: '#FECACA', emoji: '❄️' },
  };
  const c = recordType === 'lead'
    ? { bg: '#7C3AED', border: '#DDD6FE', emoji: '🎯' }
    : colors[status] || { bg: '#6B7280', border: '#E5E7EB', emoji: '📍' };
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

const CITY_COORDINATES = {
  'marilia': [-22.2139, -49.9458],
  'marília': [-22.2139, -49.9458],
  'presidente prudente': [-22.1256, -51.3889],
  'assis': [-22.6617, -50.4111],
  'tupa': [-21.9347, -50.5117],
  'tupã': [-21.9347, -50.5117],
  'adamantina': [-21.6853, -51.0725],
  'bauru': [-22.3147, -49.0606],
  'aracatuba': [-21.2081, -50.4328],
  'araçatuba': [-21.2081, -50.4328],
  'ourinhos': [-22.9789, -49.8706],
  'dracena': [-21.4828, -51.5314],
  'lins': [-22.2189, -49.7431],
  'garca': [-22.2125, -49.6546],
  'birigui': [-21.2886, -50.3406],
  'andradina': [-20.8961, -51.3786],
  'avare': [-23.0987, -48.9251],
  'bariri': [-22.0744, -48.7403],
  'lencois paulista': [-22.5986, -48.8003],
  'santa cruz do rio pardo': [-22.8989, -49.6354],
  'piraju': [-23.1936, -49.3839],
  'vera cruz': [-22.2214, -49.8206],
  'promissao': [-21.5367, -49.8586],
  'guararapes': [-21.2608, -50.6428],
  'paraguacu paulista': [-22.4128, -50.5733],
  'sao manuel': [-22.7311, -48.5706],
  'palmital': [-22.7858, -50.2175],
  'cafelandia': [-21.8033, -49.6092],
  'candido mota': [-22.7464, -50.3869],
  'pompeia': [-22.1070, -50.1760],
  'pirajui': [-21.9986, -49.4572],
  'pederneiras': [-22.3511, -48.7781],
  'duartina': [-22.4142, -49.4089],
  'barra bonita': [-22.4947, -48.5581],
  'valparaiso': [-21.2278, -50.8697],
  'mirandopolis': [-21.1331, -51.1031],
  'agudos': [-22.4694, -48.9864],
  'ipaussu': [-23.0575, -49.6275],
  'botucatu': [-22.8869, -48.4450],
  'jau': [-22.2775, -48.5545],
  'jaú': [-22.2775, -48.5545],
  'araraquara': [-21.7930, -48.1763],
  'ribeirao preto': [-21.1767, -47.8101],
  'ribeirão preto': [-21.1767, -47.8101],
  'sao paulo': [-23.5505, -46.6333],
  'são paulo': [-23.5505, -46.6333],
  'campinas': [-22.9099, -47.0626],
};

function normalizeCity(city) {
  return String(city || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getExactClientLatLng(client) {
  const lat = Number(client.latitude ?? client.lat ?? client.google_latitude ?? client.maps_latitude ?? client.location?.lat ?? client.geo?.lat);
  const lng = Number(client.longitude ?? client.lng ?? client.lon ?? client.google_longitude ?? client.maps_longitude ?? client.location?.lng ?? client.geo?.lng);
  const validBrazil = lat >= -34 && lat <= 6 && lng >= -74 && lng <= -34;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !validBrazil) return null;
  return { lat, lng, approximate: false };
}

function getClientLatLng(client) {
  const exact = getExactClientLatLng(client);
  if (exact) return exact;
  const cityCoords = CITY_COORDINATES[normalizeCity(client.city)] || CITY_COORDINATES[String(client.city || '').trim().toLowerCase()];
  if (!cityCoords) return null;
  return { lat: cityCoords[0], lng: cityCoords[1], approximate: true };
}

function buildGoogleRouteUrl(points, myLocation) {
  if (!points.length) return null;
  const selected = points.slice(0, 8);
  const destination = selected[selected.length - 1];
  const waypoints = selected.slice(0, -1).map(c => `${c._lat},${c._lng}`).join('|');
  const origin = myLocation ? `&origin=${myLocation[0]},${myLocation[1]}` : '';
  const via = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '';
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination._lat},${destination._lng}${via}&travelmode=driving`;
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────
export default function ClientLocationMap() {
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterType, setFilterType] = useState('todos');
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(10); // km
  const [listExpanded, setListExpanded] = useState(true);

  const { data: clients = [], isLoading: loadingClients, refetch: refetchClients } = useQuery({
    queryKey: ['client-map'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000),
    staleTime: 60000,
  });

  const { data: leads = [], isLoading: loadingLeads, refetch: refetchLeads } = useQuery({
    queryKey: ['lead-map'],
    queryFn: () => base44.entities.Lead.list('-updated_date', 1000),
    staleTime: 60000,
  });

  const isLoading = loadingClients || loadingLeads;
  const refetch = useCallback(() => Promise.all([refetchClients(), refetchLeads()]), [refetchClients, refetchLeads]);

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

  // ── CLÍNICAS COM LOCALIZAÇÃO + DISTÂNCIA ─────────────────────────────────
  const recordsWithCoords = useMemo(() =>
    [...clients.map(record => ({ ...record, _recordType: 'client' })), ...leads.map(record => ({ ...record, _recordType: 'lead' }))]
      .map(record => {
        const coords = getClientLatLng(record);
        if (!coords) return null;
        return {
          ...record,
          _lat: coords.lat,
          _lng: coords.lng,
          _locationApprox: coords.approximate,
          distance: myLocation ? calcDistance(myLocation[0], myLocation[1], coords.lat, coords.lng) : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)),
    [clients, leads, myLocation]
  );

  const filtered = useMemo(() =>
    recordsWithCoords.filter(record =>
      (filterType === 'todos' || record._recordType === filterType) &&
      (filterStatus === 'todos' || record._recordType === 'lead' || record.status === filterStatus)
    ),
    [recordsWithCoords, filterStatus, filterType]
  );

  const nearby = useMemo(() =>
    myLocation
      ? filtered.filter(c => c.distance !== null && c.distance <= nearbyRadius)
      : [],
    [filtered, myLocation, nearbyRadius]
  );

  const clientsNeedingGeocode = useMemo(() =>
    clients.filter(c => !getExactClientLatLng(c)),
    [clients]
  );

  const routeUrl = useMemo(() => buildGoogleRouteUrl(nearby.length ? nearby : filtered, myLocation), [nearby, filtered, myLocation]);

  const handleGeocodeAll = useCallback(async () => {
    if (clientsNeedingGeocode.length === 0) { toast.success('Todos já têm localização!'); return; }
    // SAFE: geocode não aplica coordenada direto — gera sugestões na fila de aprovação.
    // Limite por lote para não sobrecarregar o tablet (até 50 por vez).
    const lote = clientsNeedingGeocode.slice(0, 50);
    const id = toast.loading(`Buscando coordenadas de ${lote.length} clientes...`);
    let ok = 0;
    for (let i = 0; i < lote.length; i += 5) {
      await Promise.all(lote.slice(i, i+5).map(async c => {
        try {
          const r = await base44.functions.invoke('geocodeClientLocation', { client_id: c.id, address: c.address, clinic_name: c.clinic_name, city: c.city, state: 'SP' });
          if (r.data?.geocoded) ok++;
        } catch {}
      }));
    }
    toast.dismiss(id);
    toast.success(`${ok} coordenadas sugeridas para aprovação (não aplicadas direto). Restam ${clientsNeedingGeocode.length - lote.length}.`);
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
          <span className="font-black text-slate-800 text-base">Mapa de Prospecção</span>
          <Badge variant="outline" className="text-xs">{filtered.length} registros no mapa</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-8 text-xs border rounded-md px-2 bg-white"
          >
            <option value="todos">Clientes e leads</option>
            <option value="client">Clientes atuais</option>
            <option value="lead">Novos leads</option>
          </select>
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
          {routeUrl && (
            <a href={routeUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8 text-xs">
                <Navigation2 className="w-4 h-4" /> Rota Matriz
              </Button>
            </a>
          )}
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
          <span><strong>{clientsNeedingGeocode.length}</strong> clientes sem coordenadas exatas — o mapa usa ponto aproximado por cidade enquanto aguarda validação.</span>
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

          {/* Marcadores de clientes e leads */}
          {filtered.map(client => (
            <Marker
              key={client.id}
              position={[client._lat, client._lng]}
              icon={createRecordIcon(client.status, client._recordType)}
              eventHandlers={{ click: () => setSelectedClient(client) }}
            >
              <Popup>
                <div className="w-52 text-sm">
                  <p className="font-bold leading-tight">{client.clinic_name || client.company || client.full_name || client.first_name}</p>
                  <p className="text-xs text-slate-500 mb-1">{client._recordType === 'lead' ? 'Novo lead' : 'Cliente atual'} · {client.city}{client._locationApprox ? ' · coordenada aproximada por cidade' : ''}</p>
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
                    <a href={`/${client._recordType === 'lead' ? 'LeadProfile' : 'ClientProfile'}?id=${client.id}`}
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
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-600"></div> Novo lead</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-600"></div> Cliente quente</div>
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
                      setFlyTarget([client._lat, client._lng]);
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
                      <p className="font-semibold text-sm text-slate-800 truncate">{client.clinic_name || client.company || client.full_name || client.first_name}</p>
                      <p className="text-xs text-slate-400 truncate">{client._recordType === 'lead' ? 'Lead' : 'Cliente'} • {client.city} {client._locationApprox ? '• ponto aproximado' : ''} {client.address ? `• ${client.address}` : ''}</p>
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
                        href={`/${client._recordType === 'lead' ? 'LeadProfile' : 'ClientProfile'}?id=${client.id}`}
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <Search className="w-4 h-4" />
                      </a>
                      {client._lat && client._lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${client._lat},${client._lng}`}
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