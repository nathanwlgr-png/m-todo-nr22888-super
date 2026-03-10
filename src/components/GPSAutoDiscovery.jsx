import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
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
        city: targetCity
      });

      if (res.data?.success) {
        const log = {
          time: new Date().toLocaleTimeString('pt-BR'),
          location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          new_leads: res.data.new_leads,
          duplicates: res.data.duplicates,
          message: res.data.message
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
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
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="w-5 h-5 text-purple-600" />
            GPS Auto-Discovery
            {isTracking && (
              <Badge className="bg-green-500 text-white animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white mr-1" />
                Ativo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Configurações */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Raio (km)</label>
              <Input
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                min={1}
                max={50}
                className="h-8 text-sm"
                disabled={isTracking}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Cidade (opcional)</label>
              <Input
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                placeholder="Ex: Marília"
                className="h-8 text-sm"
                disabled={isTracking}
              />
            </div>
          </div>

          {/* Localização atual */}
          {currentLocation && (
            <div className="p-2 bg-white rounded-lg border border-purple-200 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-purple-500" />
                <span className="text-slate-600">
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </span>
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-purple-500" />}
              </div>
            </div>
          )}

          {/* Botão de controle */}
          <Button
            onClick={isTracking ? stopGPSTracking : startGPSTracking}
            className={`w-full ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isTracking ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Parar GPS
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Iniciar GPS
              </>
            )}
          </Button>

          {/* Log de descobertas */}
          {discoveryLog.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-700 mb-1">📋 Últimas descobertas:</p>
              {discoveryLog.map((log, i) => (
                <div key={i} className="p-2 bg-white rounded border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400">{log.time}</span>
                    {log.new_leads > 0 && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        +{log.new_leads} leads
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600">{log.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="p-2 bg-purple-100 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800">
              💡 O GPS detecta clínicas próximas automaticamente, verifica duplicatas e cadastra novos leads.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}