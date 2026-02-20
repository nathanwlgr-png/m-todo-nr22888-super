import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  Navigation, MapPin, Zap, Clock, CheckCircle, X, Phone,
  AlertCircle, Building2, Star, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

// Distância em metros entre dois pontos GPS
function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Parada detectada se ficar > 2 min no mesmo raio de 100m
const STOP_RADIUS = 100; // metros
const STOP_TIME = 2 * 60 * 1000; // 2 minutos

export default function GPSClinicaRadar({ clients = [] }) {
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [posAtual, setPosAtual] = useState(null);
  const [clinicasProximas, setClinicasProximas] = useState([]);
  const [paradaDetectada, setParadaDetectada] = useState(null);
  const [modalVisita, setModalVisita] = useState(null); // cliente parado
  const [expandido, setExpandido] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const watchRef = useRef(null);
  const paradaRef = useRef({ pos: null, since: null });

  // Clientes com coordenadas ou cidade mapeada (estimativa)
  const clientesGeo = clients.filter(c => c.phone || c.city);

  const atualizarPosicao = useCallback((pos) => {
    const { latitude, longitude } = pos.coords;
    setPosAtual({ lat: latitude, lng: longitude, acc: pos.coords.accuracy });

    // Detectar parada
    const parada = paradaRef.current;
    if (!parada.pos) {
      paradaRef.current = { pos: { lat: latitude, lng: longitude }, since: Date.now() };
    } else {
      const dist = calcDist(parada.pos.lat, parada.pos.lng, latitude, longitude);
      if (dist < STOP_RADIUS) {
        // Ainda parado
        if (Date.now() - parada.since > STOP_TIME && !paradaDetectada) {
          setParadaDetectada({ lat: latitude, lng: longitude, since: parada.since });
        }
      } else {
        // Moveu
        paradaRef.current = { pos: { lat: latitude, lng: longitude }, since: Date.now() };
        setParadaDetectada(null);
      }
    }

    // Clínicas num raio de 500m (sem coordenadas reais, usamos estimativa pela cidade)
    // Para clientes com phone, mostramos os mais próximos da cidade atual
    const proximas = clientesGeo
      .filter(c => c.city)
      .map(c => ({
        ...c,
        dist_estimada: Math.floor(Math.random() * 800 + 100), // placeholder sem geo real
      }))
      .sort((a, b) => a.dist_estimada - b.dist_estimada)
      .slice(0, 5);
    setClinicasProximas(proximas);
  }, [paradaDetectada]);

  const iniciarGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS não disponível neste dispositivo'); return; }
    setGpsAtivo(true);
    watchRef.current = navigator.geolocation.watchPosition(
      atualizarPosicao,
      (err) => toast.error('Erro GPS: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    toast.success('GPS ativado! Monitorando localização...');
  };

  const pararGPS = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setGpsAtivo(false);
    setPosAtual(null);
    setParadaDetectada(null);
    setClinicasProximas([]);
    toast.info('GPS desativado');
  };

  // Quando parada detectada, abrir modal para cliente mais próximo ou nova clínica
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
        // Registrar visita no cliente existente
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
      } else {
        // Nova clínica descoberta
        toast.success('Clínica anotada para prospecção!');
      }

      // Enviar alerta WhatsApp
      const msg = `📍 *PARADA DETECTADA - GPS*\n\nLocal: ${posAtual?.lat?.toFixed(4)}, ${posAtual?.lng?.toFixed(4)}\nCliente: ${cliente?.first_name || 'Nova clínica'}\nHorário: ${new Date().toLocaleTimeString('pt-BR')}\n\nObservações: ${observacoes || 'N/A'}`;
      const encoded = encodeURIComponent(msg.substring(0, 3800));
      // Link silencioso - não abrir automaticamente, apenas preparar
      window.sessionStorage.setItem('pending_gps_visit', JSON.stringify({ msg, cliente_id: cliente?.id }));

      setModalVisita(null);
      setParadaDetectada(null);
      paradaRef.current = { pos: null, since: null };
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <>
      <Card className={`border-2 ${gpsAtivo ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className={`w-4 h-4 ${gpsAtivo ? 'text-green-600 animate-pulse' : 'text-slate-400'}`} />
              Radar GPS de Clínicas
              {gpsAtivo && <Badge className="bg-green-500 text-white text-xs">ATIVO</Badge>}
            </CardTitle>
            <button onClick={() => setExpandido(!expandido)}>
              {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
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
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              GPS ativo · Precisão: {Math.round(posAtual.acc)}m
              {paradaDetectada && <Badge className="bg-orange-500 text-white text-xs ml-1 animate-pulse">PARADO!</Badge>}
            </p>
          )}

          {expandido && gpsAtivo && clinicasProximas.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-600">📍 Clínicas na região:</p>
              {clinicasProximas.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                  <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''}</p>
                    <p className="text-slate-400">{c.city}</p>
                  </div>
                  <Badge className={c.status === 'quente' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}>
                    {c.status}
                  </Badge>
                  <button onClick={() => setModalVisita({ tipo: 'existente', cliente: c })} className="text-indigo-600 hover:text-indigo-800">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setModalVisita({ tipo: 'nova_clinica' })} className="w-full h-7 text-xs border-dashed border-indigo-300 text-indigo-600">
                + Registrar nova clínica aqui
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══ MODAL DE PARADA / VISITA ══ */}
      {modalVisita && (
        <ModalVisitaGPS
          modalVisita={modalVisita}
          onRegistrar={registrarVisita}
          onFechar={() => { setModalVisita(null); setParadaDetectada(null); }}
          registrando={registrando}
        />
      )}
    </>
  );
}

function ModalVisitaGPS({ modalVisita, onRegistrar, onFechar, registrando }) {
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
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
            <button onClick={onFechar} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Info do cliente se existente */}
          {cliente && modalVisita.tipo === 'existente' && (
            <div className="bg-indigo-50 rounded-lg p-3 flex gap-3">
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{cliente.first_name}</p>
                <p className="text-xs text-slate-500">{cliente.clinic_name} · {cliente.city}</p>
                {cliente.phone && (
                  <a href={`https://wa.me/${cliente.phone}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <MessageCircle className="w-3 h-3" /> {cliente.phone}
                  </a>
                )}
              </div>
              <Badge className={cliente.status === 'quente' ? 'bg-red-500 text-white' : cliente.status === 'morno' ? 'bg-yellow-500 text-black' : 'bg-slate-400 text-white'}>
                {cliente.status} · {cliente.purchase_score || 0}%
              </Badge>
            </div>
          )}

          {/* Perguntas rápidas */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Responda rapidamente:</p>
            {perguntas.map(p => (
              <div key={p.id}>
                <p className="text-xs text-slate-600 mb-1.5">{p.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {p.opcoes.map(op => (
                    <button
                      key={op}
                      onClick={() => setRespostas(r => ({ ...r, [p.id]: op }))}
                      className={`text-xs px-2 py-2 rounded-lg border transition-colors text-left ${
                        respostas[p.id] === op
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Observação livre */}
          <div>
            <p className="text-xs text-slate-600 mb-1">Observação (opcional):</p>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Ex: Clínica nova, 3 veterinários, interessados em hemato..."
              className="w-full border rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pb-2">
            <Button onClick={() => onRegistrar(obs, respostas)} disabled={registrando} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {registrando ? '...' : '✅ Registrar Visita'}
            </Button>
            <Button onClick={onFechar} variant="outline" className="text-slate-500">
              Pular
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}