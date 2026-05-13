import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigation, MapPin, Loader2, CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function GPSAutoDiscovery() {
  const [isTracking, setIsTracking] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5);
  const [targetCity, setTargetCity] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [discoveryLog, setDiscoveryLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const watchIdRef = useRef(null);

  const processLocation = async (latitude, longitude) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await base44.functions.invoke('processGPSLocation', {
        latitude,
        longitude,
        radius: searchRadius,
        city: targetCity,
      });
      if (res.data?.success) {
        const log = {
          time: new Date().toLocaleTimeString('pt-BR'),
          location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          new_leads: res.data.new_leads,
          duplicates: res.data.duplicates,
          message: res.data.message,
        };
        setDiscoveryLog(prev => [log, ...prev].slice(0, 10));
        if (res.data.new_leads > 0) {
          toast.success(`🎯 ${res.data.new_leads} novos leads descobertos!`);
        }
      }
    } catch (error) {
      toast.error('Erro ao processar localização: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS não suportado pelo navegador');
      return;
    }
    setIsTracking(true);
    toast.info('GPS ativado. Monitorando localização...');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        processLocation(latitude, longitude);
      },
      (error) => {
        toast.error('Erro GPS: ' + error.message);
        stopGPSTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopGPSTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info('GPS desativado');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(168,85,247,0.3)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(168,85,247,0.1)', borderBottom: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black text-purple-300">GPS Auto-Discovery</span>
        </div>
        {isTracking && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-green-400">ATIVO</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Configurações */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Raio (km)</label>
            <input
              type="number"
              value={searchRadius}
              onChange={e => setSearchRadius(Number(e.target.value))}
              min={1} max={50}
              disabled={isTracking}
              className="w-full h-9 px-3 rounded-xl text-xs text-white focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(168,85,247,0.3)' }}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Cidade (opcional)</label>
            <input
              value={targetCity}
              onChange={e => setTargetCity(e.target.value)}
              placeholder="Ex: Marília"
              disabled={isTracking}
              className="w-full h-9 px-3 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(168,85,247,0.3)' }}
            />
          </div>
        </div>

        {/* Localização atual */}
        {currentLocation && (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs text-purple-300">
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </span>
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-auto" />}
          </div>
        )}

        {/* Botão de controle */}
        <button
          onClick={isTracking ? stopGPSTracking : startGPSTracking}
          className="w-full h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
          style={isTracking
            ? { background: 'rgba(255,68,68,0.2)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.4)' }
            : { background: 'rgba(168,85,247,0.9)', color: 'white', border: 'none' }
          }>
          {isTracking ? (
            <><AlertCircle className="w-4 h-4" /> Parar GPS</>
          ) : (
            <><Navigation className="w-4 h-4" /> Iniciar GPS Sniper</>
          )}
        </button>

        {/* Log de descobertas */}
        {discoveryLog.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-purple-400 mb-2 uppercase tracking-wider">📋 Descobertas recentes</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {discoveryLog.map((log, i) => (
                <div key={i} className="rounded-xl p-2.5"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-500">{log.time}</span>
                    {log.new_leads > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                        style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}>
                        +{log.new_leads} leads
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <p className="text-[11px] text-purple-400">
            💡 O GPS detecta clínicas próximas automaticamente, verifica duplicatas e cadastra novos leads no CRM.
          </p>
        </div>
      </div>
    </div>
  );
}