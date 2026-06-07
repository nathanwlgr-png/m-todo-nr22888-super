import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, ExternalLink, Search, Route, Clock, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { isValidWhatsApp } from '@/utils/phoneUtils';

export default function SmartRouteMap() {
  const [expanded, setExpanded] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState([]);
  const [startAddress, setStartAddress] = useState('Marília, SP');

  const { data: clients = [] } = useQuery({
    queryKey: ['route-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
  });

  const cities = useMemo(() => [...new Set(clients.map(c => c.city).filter(Boolean))].sort(), [clients]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = !searchTerm ||
        c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = !cityFilter || c.city === cityFilter;
      return matchSearch && matchCity;
    });
  }, [clients, searchTerm, cityFilter]);

  const selectedClients = useMemo(() => clients.filter(c => selected.includes(c.id)), [clients, selected]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const MAX_ROUTE_STOPS = 12;

  // Deduplicar selecionados por nome+cidade
  const deduplicatedSelected = useMemo(() => {
    const seen = new Set();
    return selectedClients.filter(c => {
      const key = `${(c.clinic_name || c.first_name || '').toLowerCase().trim()}|${(c.city || '').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_ROUTE_STOPS);
  }, [selectedClients]);

  // Validar coordenadas
  const isValidCoord = (lat, lng) => {
    const lt = parseFloat(lat); const lg = parseFloat(lng);
    return !isNaN(lt) && !isNaN(lg) && lt >= -90 && lt <= 90 && lg >= -180 && lg <= 180;
  };

  const clientsWithCoords = useMemo(() =>
    deduplicatedSelected.filter(c => isValidCoord(c.latitude, c.longitude)),
    [deduplicatedSelected]
  );
  const clientsWithoutCoords = useMemo(() =>
    deduplicatedSelected.filter(c => !isValidCoord(c.latitude, c.longitude)),
    [deduplicatedSelected]
  );

  // Monta URL do Google Maps (coordenadas válidas → usa lat/lng, fallback → endereço)
  const googleMapsUrl = useMemo(() => {
    if (deduplicatedSelected.length === 0) return null;

    const origin = encodeURIComponent(startAddress);
    const waypoints = deduplicatedSelected.map(c => {
      if (isValidCoord(c.latitude, c.longitude)) {
        return encodeURIComponent(`${parseFloat(c.latitude)},${parseFloat(c.longitude)}`);
      }
      const addr = c.address ? `${c.address}, ${c.city}, SP` : `${c.clinic_name || c.first_name}, ${c.city}, SP`;
      return encodeURIComponent(addr);
    });

    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(0, -1);

    if (waypoints.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${middle.join('|')}&travelmode=driving&optimize=true`;
  }, [deduplicatedSelected, startAddress]);

  // Estimativa rápida de tempo (15min de deslocamento entre clínicas + 45min por visita)
  const estimativa = useMemo(() => {
    if (selected.length === 0) return null;
    const deslocamento = selected.length * 15; // estimativa 15min entre cada
    const visitas = selected.length * 45;
    const total = deslocamento + visitas;
    return { deslocamento, visitas, total, horas: Math.floor(total / 60), minutos: total % 60 };
  }, [selected]);

  return (
    <Card className="mb-4 border-emerald-200">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base text-emerald-800">Mapa de Rotas Inteligente</CardTitle>
            {selected.length > 0 && (
              <Badge className="bg-emerald-600 text-white text-xs">{selected.length} selecionados</Badge>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {/* Filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="h-8 text-xs border rounded-md px-2 bg-white"
            >
              <option value="">Todas cidades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Ponto de partida */}
          <div className="flex gap-2 items-center">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <Input
              placeholder="Ponto de partida"
              value={startAddress}
              onChange={e => setStartAddress(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Lista de clientes */}
          <div className="max-h-52 overflow-y-auto space-y-1 border rounded-lg p-2">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Nenhum cliente encontrado</p>
            )}
            {filtered.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selected.includes(c.id) ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                }`}
                onClick={() => toggle(c.id)}
              >
                <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} className="pointer-events-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{c.clinic_name || c.first_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {c.address ? `${c.address}, ` : ''}{c.city}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 items-end">
                  <Badge className={
                    c.status === 'quente' ? 'bg-red-500 text-white text-[9px] px-1 py-0' :
                    c.status === 'morno' ? 'bg-orange-500 text-white text-[9px] px-1 py-0' :
                    'bg-blue-400 text-white text-[9px] px-1 py-0'
                  }>
                    {c.status}
                  </Badge>
                  {!c.phone || !isValidWhatsApp(c.phone) ? (
                    <span title="Sem WhatsApp válido" className="text-[8px] text-amber-500 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />sem tel
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Selecionados e estimativa */}
          {selected.length > 0 && deduplicatedSelected.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-semibold">Não há pontos com localização válida para gerar rota.</p>
            </div>
          )}

          {selected.length > 0 && deduplicatedSelected.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800">
                  Rota selecionada ({deduplicatedSelected.length} clínicas
                  {clientsWithoutCoords.length > 0 ? `, ${clientsWithoutCoords.length} sem GPS` : ''})
                </p>
                <button onClick={() => setSelected([])} className="text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sequência */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-emerald-700">
                  <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-[9px]">S</div>
                  <span className="font-medium">{startAddress}</span>
                </div>
                {deduplicatedSelected.map((c, i) => (
                  <div key={c.id} className="flex items-start gap-2 text-[10px]">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-3 bg-emerald-300" />
                      <div className="w-5 h-5 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center font-bold text-[9px] text-emerald-700">{i + 1}</div>
                    </div>
                    <div className="pt-3 flex-1">
                      <p className="font-semibold text-slate-700">{c.clinic_name || c.first_name}</p>
                      <p className="text-slate-500">{c.city} {c.address && `· ${c.address}`}</p>
                      <div className="flex items-center gap-1 text-emerald-600 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>~15 min deslocamento · 45 min visita</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tempo total estimado */}
              {estimativa && (
                <div className="grid grid-cols-3 gap-2 mt-2 border-t border-emerald-200 pt-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-emerald-700">{estimativa.horas}h {estimativa.minutos}m</p>
                    <p className="text-[9px] text-slate-500">Tempo total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-700">{estimativa.deslocamento}min</p>
                    <p className="text-[9px] text-slate-500">Deslocamento</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-purple-700">{estimativa.visitas}min</p>
                    <p className="text-[9px] text-slate-500">Visitas</p>
                  </div>
                </div>
              )}

              {/* Botão Google Maps */}
              {googleMapsUrl && (
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-sm mt-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    Abrir Rota no Google Maps
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          )}

          {selected.length === 0 && (
            <p className="text-xs text-slate-400 text-center">Selecione clínicas para calcular a rota mais eficiente (máx. {MAX_ROUTE_STOPS})</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}