import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  Navigation, MapPin, Zap, Clock, CheckCircle, X, Phone,
  Building2, MessageCircle, ChevronDown, ChevronUp, Timer,
  Coffee, Car, Utensils, Play, Square, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STOP_RADIUS = 100;
const STOP_TIME = 2 * 60 * 1000;

// Sugestões de parada por região/horário
const PARADAS_ALMOCO = {
  'Marília':   ['Restaurante Pantanal - Centro', 'Churrascaria Estrela - Av. Sampaio Vidal'],
  'Bauru':     ['Restaurante Cebola Rosa - Centro', 'Praça da Alimentação - Shopping Bauru'],
  'Lins':      ['Churrascaria Lins Grill - Av. 7 de Setembro', 'Padaria Central - Rua X'],
  'Jaú':       ['Restaurante Bom Prato - Centro', 'Lanchonete Família - Rua XV'],
  'Botucatu':  ['Restaurante Universitário - Vila Rubião', 'Churrascaria Bandeirantes'],
  'Ourinhos':  ['Restaurante Casarão - Centro', 'Pizzaria Bella Napoli'],
  'Assis':     ['Restaurante Rancho Fundo - Av. Rui Barbosa', 'Churrascaria Assis Grill'],
};

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function GPSClinicaRadar({ clients = [] }) {
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [posAtual, setPosAtual] = useState(null);
  const [clinicasProximas, setClinicasProximas] = useState([]);
  const [paradaDetectada, setParadaDetectada] = useState(null);
  const [modalVisita, setModalVisita] = useState(null);
  const [expandido, setExpandido] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  // Cronômetro de visita
  const [visitaEmAndamento, setVisitaEmAndamento] = useState(null); // { clientId, clientName, startTime }
  const [tempoVisita, setTempoVisita] = useState(0); // ms
  const timerRef = useRef(null);

  // Rota ativa (próximos destinos)
  const [rotaAtiva, setRotaAtiva] = useState(null); // { destinos: [], atual: 0 }

  const watchRef = useRef(null);
  const paradaRef = useRef({ pos: null, since: null });

  const clientesGeo = clients.filter(c => c.phone || c.city);

  // Cronômetro
  useEffect(() => {
    if (visitaEmAndamento) {
      timerRef.current = setInterval(() => {
        setTempoVisita(Date.now() - visitaEmAndamento.startTime);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setTempoVisita(0);
    }
    return () => clearInterval(timerRef.current);
  }, [visitaEmAndamento]);

  const iniciarCronometro = (cliente) => {
    setVisitaEmAndamento({ clientId: cliente.id, clientName: cliente.first_name, startTime: Date.now() });
    toast.success(`⏱️ Cronômetro iniciado para ${cliente.first_name}`);
  };

  const pararCronometro = async () => {
    if (!visitaEmAndamento) return;
    const duracao = Date.now() - visitaEmAndamento.startTime;
    clearInterval(timerRef.current);

    // Salvar duração na visita mais recente do cliente
    try {
      const visits = await base44.entities.Visit.filter({ client_id: visitaEmAndamento.clientId });
      if (visits.length > 0) {
        const ultima = visits.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
        await base44.entities.Visit.update(ultima.id, {
          duration_minutes: Math.round(duracao / 60000),
          result_notes: (ultima.result_notes || '') + `\n[Tempo real: ${formatDuration(duracao)}]`,
        });
        toast.success(`✅ Tempo registrado: ${formatDuration(duracao)} para ${visitaEmAndamento.clientName}`);
      }
    } catch (e) {
      toast.info(`Visita finalizada em ${formatDuration(duracao)}`);
    }

    setVisitaEmAndamento(null);
    setTempoVisita(0);
  };

  const atualizarPosicao = useCallback((pos) => {
    const { latitude, longitude } = pos.coords;
    setPosAtual({ lat: latitude, lng: longitude, acc: pos.coords.accuracy });

    const parada = paradaRef.current;
    if (!parada.pos) {
      paradaRef.current = { pos: { lat: latitude, lng: longitude }, since: Date.now() };
    } else {
      const dist = calcDist(parada.pos.lat, parada.pos.lng, latitude, longitude);
      if (dist < STOP_RADIUS) {
        if (Date.now() - parada.since > STOP_TIME) {
          setParadaDetectada(prev => prev || { lat: latitude, lng: longitude, since: parada.since });
        }
      } else {
        paradaRef.current = { pos: { lat: latitude, lng: longitude }, since: Date.now() };
        setParadaDetectada(null);
      }
    }

    // SAFE: distância real só quando o cliente tem coordenada validada.
    // Nunca usar distância aleatória/simulada.
    const proximas = clientesGeo
      .filter(c => c.city)
      .map(c => {
        const temCoord = !!(c.latitude && c.longitude);
        return {
          ...c,
          tem_coordenada: temCoord,
          dist_metros: temCoord ? Math.round(calcDist(latitude, longitude, c.latitude, c.longitude)) : null,
        };
      })
      .sort((a, b) => {
        if (a.dist_metros == null && b.dist_metros == null) return 0;
        if (a.dist_metros == null) return 1;
        if (b.dist_metros == null) return -1;
        return a.dist_metros - b.dist_metros;
      })
      .slice(0, 5);
    setClinicasProximas(proximas);
  }, [clientesGeo]);

  const iniciarGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS não disponível neste dispositivo'); return; }
    setGpsAtivo(true);
    watchRef.current = navigator.geolocation.watchPosition(
      atualizarPosicao,
      (err) => toast.error('Erro GPS: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    toast.success('🛰️ GPS ativado! Monitorando sua rota...');
  };

  const pararGPS = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setGpsAtivo(false);
    setPosAtual(null);
    setParadaDetectada(null);
    setClinicasProximas([]);
    toast.info('GPS desativado');
  };

  useEffect(() => {
    if (paradaDetectada && clinicasProximas.length > 0) {
      setModalVisita({ tipo: 'existente', cliente: clinicasProximas[0] });
    } else if (paradaDetectada) {
      setModalVisita({ tipo: 'nova_clinica' });
    }
  }, [paradaDetectada]);

  const registrarVisita = async (observacoes, respostas) => {
    setRegistrando(true);
    try {
      const cliente = modalVisita?.cliente;
      const now = new Date().toISOString();
      if (cliente?.id) {
        await base44.entities.Visit.create({
          client_id: cliente.id,
          client_name: cliente.first_name,
          scheduled_date: now,
          visit_type: 'primeira_visita',
          status: 'realizada',
          location: posAtual ? `${posAtual.lat.toFixed(5)},${posAtual.lng.toFixed(5)}` : '',
          notes: `[GPS AUTO] ${observacoes || ''}\n${JSON.stringify(respostas)}`,
        });
        await base44.entities.Client.update(cliente.id, {
          last_visit_date: now.split('T')[0],
          last_contact_date: now.split('T')[0],
        });
        toast.success(`Visita registrada para ${cliente.first_name}!`);

        // Iniciar cronômetro automaticamente
        iniciarCronometro(cliente);
      } else {
        toast.success('Clínica anotada para prospecção!');
      }
      setModalVisita(null);
      setParadaDetectada(null);
      paradaRef.current = { pos: null, since: null };
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setRegistrando(false);
    }
  };

  // Navegar para o próximo cliente da rota
  const navegarProxCliente = (cliente, app = 'maps') => {
    const lat = cliente.latitude || 0;
    const lng = cliente.longitude || 0;
    const addr = encodeURIComponent(cliente.clinic_name ? `${cliente.clinic_name}, ${cliente.city}` : cliente.city || '');

    if (app === 'waze') {
      // Waze - usar endereço
      window.open(`https://waze.com/ul?q=${addr}&navigate=yes`, '_blank');
    } else {
      // Google Maps com destino
      if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=driving`, '_blank');
      }
    }
  };

  // Sugestão de almoço baseada na hora e cidade
  const getSugestaoAlmoco = () => {
    const hora = new Date().getHours();
    if (hora < 11 || hora > 14) return null;

    const cidade = clinicasProximas[0]?.city;
    const opcoes = PARADAS_ALMOCO[cidade] || ['Procure restaurantes próximos no Google Maps'];
    return { cidade, opcoes };
  };

  const almoco = gpsAtivo ? getSugestaoAlmoco() : null;

  return (
    <>
      <Card className={`border-2 ${gpsAtivo ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className={`w-4 h-4 ${gpsAtivo ? 'text-green-600 animate-pulse' : 'text-slate-400'}`} />
              Radar GPS + Navegação
              {gpsAtivo && <Badge className="bg-green-500 text-white text-xs animate-pulse">ATIVO</Badge>}
            </CardTitle>
            <button onClick={() => setExpandido(!expandido)}>
              {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-2">
          {/* GPS toggle */}
          <div className="flex gap-2">
            {!gpsAtivo ? (
              <Button onClick={iniciarGPS} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs">
                <Navigation className="w-3 h-3 mr-1" /> Ativar GPS
              </Button>
            ) : (
              <Button onClick={pararGPS} size="sm" variant="outline" className="flex-1 border-red-300 text-red-600 h-8 text-xs">
                <X className="w-3 h-3 mr-1" /> Parar GPS
              </Button>
            )}
          </div>

          {gpsAtivo && posAtual && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Precisão: {Math.round(posAtual.acc)}m
              {paradaDetectada && <Badge className="bg-orange-500 text-white text-xs ml-1 animate-pulse">PARADO!</Badge>}
            </p>
          )}

          {/* ═══ CRONÔMETRO DE VISITA ═══ */}
          {visitaEmAndamento ? (
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Visita em andamento
                  </p>
                  <p className="font-bold text-indigo-800 text-sm">{visitaEmAndamento.clientName}</p>
                  <p className="text-2xl font-mono font-bold text-indigo-700 mt-1">{formatDuration(tempoVisita)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={pararCronometro}
                  className="bg-red-500 hover:bg-red-600 h-9 w-9 p-0"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : gpsAtivo && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Timer className="w-3 h-3" /> Cronômetro automático ao registrar visita
            </p>
          )}

          {/* ═══ SUGESTÃO DE ALMOÇO ═══ */}
          {almoco && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                <Utensils className="w-3 h-3" /> Hora do almoço! Sugestões em {almoco.cidade || 'sua região'}:
              </p>
              {almoco.opcoes.map((op, i) => (
                <button
                  key={i}
                  onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(op)}`, '_blank')}
                  className="block text-xs text-amber-700 hover:text-amber-900 hover:underline mt-0.5"
                >
                  🍽️ {op}
                </button>
              ))}
            </div>
          )}

          {/* ═══ CLÍNICAS PRÓXIMAS COM NAVEGAÇÃO DIRETA ═══ */}
          {expandido && gpsAtivo && clinicasProximas.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Clínicas na região:
              </p>
              {clinicasProximas.map((c) => (
                <div key={c.id} className="bg-white rounded-lg border p-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''}</p>
                      <p className="text-xs text-slate-400">
                        {c.city}
                        {c.dist_metros != null
                          ? ` · ${c.dist_metros < 1000 ? `${c.dist_metros}m` : `${(c.dist_metros / 1000).toFixed(1)}km`}`
                          : ' · sem coordenada validada'}
                      </p>
                    </div>
                    <Badge className={c.status === 'quente' ? 'bg-red-100 text-red-700 text-xs' : 'bg-slate-100 text-slate-600 text-xs'}>
                      {c.status}
                    </Badge>
                  </div>
                  {/* Botões de navegação */}
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => navegarProxCliente(c, 'maps')}
                      className="flex-1 text-xs py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Maps
                    </button>
                    <button
                      onClick={() => navegarProxCliente(c, 'waze')}
                      className="flex-1 text-xs py-1.5 bg-cyan-50 text-cyan-700 rounded-md border border-cyan-200 hover:bg-cyan-100 flex items-center justify-center gap-1"
                    >
                      <Car className="w-3 h-3" /> Waze
                    </button>
                    <button
                      onClick={() => { setModalVisita({ tipo: 'existente', cliente: c }); iniciarCronometro(c); }}
                      className="flex-1 text-xs py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Chegou
                    </button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline"
                onClick={() => setModalVisita({ tipo: 'nova_clinica' })}
                className="w-full h-7 text-xs border-dashed border-indigo-300 text-indigo-600">
                + Registrar nova clínica aqui
              </Button>
            </div>
          )}

          {/* Iniciar cronômetro manual */}
          {gpsAtivo && !visitaEmAndamento && clinicasProximas.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs text-slate-500 mb-1">Iniciar cronômetro manualmente:</p>
              <div className="flex flex-wrap gap-1">
                {clinicasProximas.slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => iniciarCronometro(c)}
                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" /> {c.first_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══ MODAL PARADA / VISITA ══ */}
      {modalVisita && (
        <ModalVisitaGPS
          modalVisita={modalVisita}
          onRegistrar={registrarVisita}
          onFechar={() => { setModalVisita(null); setParadaDetectada(null); }}
          onNavegar={navegarProxCliente}
          registrando={registrando}
        />
      )}
    </>
  );
}

function ModalVisitaGPS({ modalVisita, onRegistrar, onFechar, onNavegar, registrando }) {
  const [obs, setObs] = useState('');
  const [respostas, setRespostas] = useState({});

  const perguntas = [
    { id: 'interesse', label: 'Demonstrou interesse?', opcoes: ['Sim, muito!', 'Pouco interesse', 'Sem interesse', 'Não estava disponível'] },
    { id: 'equipamento', label: 'Possui equipamento?', opcoes: ['Sim, próprio', 'Terceiriza exames', 'Quer adquirir', 'Não sabe ainda'] },
    { id: 'decisor', label: 'Quem atendeu?', opcoes: ['Proprietário', 'Veterinário', 'Recepção', 'Gerente'] },
    { id: 'retorno', label: 'Possibilidade de retorno?', opcoes: ['Agendar visita', 'Ligar em 1 semana', 'Sem potencial', 'Já é cliente'] },
  ];

  const cliente = modalVisita.cliente;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">
                {modalVisita.tipo === 'nova_clinica' ? '📍 Nova Clínica Detectada!' : `📍 Parada: ${cliente?.first_name}`}
              </p>
              <p className="text-indigo-200 text-xs">
                {modalVisita.tipo === 'nova_clinica' ? 'Registre esta clínica para prospecção' : `${cliente?.clinic_name || cliente?.city || ''}`}
              </p>
            </div>
            <button onClick={onFechar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {cliente && modalVisita.tipo === 'existente' && (
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{cliente.first_name}</p>
                  <p className="text-xs text-slate-500">{cliente.clinic_name} · {cliente.city}</p>
                  {cliente.phone && (
                    <a href={`https://wa.me/${cliente.phone}`} target="_blank" rel="noreferrer"
                      className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <MessageCircle className="w-3 h-3" /> {cliente.phone}
                    </a>
                  )}
                </div>
                <Badge className={cliente.status === 'quente' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}>
                  {cliente.status}
                </Badge>
              </div>
              {/* Botões de navegação dentro do modal */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onNavegar(cliente, 'maps')}
                  className="flex-1 text-xs py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-blue-700"
                >
                  <Navigation className="w-3 h-3" /> Google Maps
                </button>
                <button
                  onClick={() => onNavegar(cliente, 'waze')}
                  className="flex-1 text-xs py-2 bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-cyan-700"
                >
                  <Car className="w-3 h-3" /> Waze
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Responda rapidamente:</p>
            {perguntas.map(p => (
              <div key={p.id}>
                <p className="text-xs text-slate-600 mb-1.5">{p.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {p.opcoes.map(op => (
                    <button key={op}
                      onClick={() => setRespostas(r => ({ ...r, [p.id]: op }))}
                      className={`text-xs px-2 py-2 rounded-lg border transition-colors text-left ${
                        respostas[p.id] === op ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >{op}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Observação (opcional):</p>
            <textarea value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Ex: Clínica nova, 3 veterinários, interessados em hemato..."
              className="w-full border rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>

          <div className="flex gap-2 pb-2">
            <Button onClick={() => onRegistrar(obs, respostas)} disabled={registrando} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {registrando ? '...' : '✅ Registrar + Iniciar Cronômetro'}
            </Button>
            <Button onClick={onFechar} variant="outline" className="text-slate-500">Pular</Button>
          </div>
        </div>
      </div>
    </div>
  );
}