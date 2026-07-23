import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Loader2, CheckCircle2, Bell, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * RASTREADOR GPS DE CLÍNICAS
 * Detecta clínicas veterinárias ao redor e cadastra automaticamente
 */
export default function GPSClinicTracker({ compact = false }) {
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [detectedClinics, setDetectedClinics] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const watchIdRef = useRef(null);
  const processedClinicsRef = useRef(new Set());
  const lastScanRef = useRef(0);
  const SCAN_INTERVAL_MS = 5 * 60 * 1000;
  const queryClient = useQueryClient();

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS não disponível no seu dispositivo');
      return;
    }

    setTracking(true);
    setNotifications([]);
    processedClinicsRef.current = new Set();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Atualiza a posição continuamente, mas limita buscas externas a cada 5 minutos.
        const now = Date.now();
        if (now - lastScanRef.current >= SCAN_INTERVAL_MS) {
          lastScanRef.current = now;
          await scanNearbyClinic(latitude, longitude);
        }
      },
      (error) => {
        console.error('Erro GPS:', error);
        toast.error('Erro ao acessar GPS');
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    toast.success('🛰️ GPS ativado! Rastreando clínicas...');
  };

  const stopTracking = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    toast.info('GPS desativado');
  };

  const scanNearbyClinic = async (lat, lng) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `DETECÇÃO DE CLÍNICAS VETERINÁRIAS VIA GPS

Localização atual: ${lat}, ${lng}

TAREFA:
Use Google Maps, Waze e dados de internet para encontrar clínicas veterinárias em um raio de 500m desta localização.

Retorne JSON com clínicas encontradas:

{
  "clinicas": [
    {
      "nome": "Nome da clínica",
      "endereco": "Endereço completo",
      "cidade": "Cidade",
      "distancia_metros": 0,
      "telefone": "5511999999999",
      "cnpj": "CNPJ se encontrado",
      "instagram": "@handle se encontrado",
      "email": "email se encontrado",
      "latitude": 0,
      "longitude": 0,
      "rating": 0,
      "total_avaliacoes": 0,
      "tipo": "clinica_pequena|clinica_media|hospital_veterinario"
    }
  ],
  "total_encontradas": 0,
  "timestamp": "${new Date().toISOString()}"
}

Priorize clínicas mais próximas (< 200m).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinicas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  endereco: { type: "string" },
                  cidade: { type: "string" },
                  distancia_metros: { type: "number" },
                  telefone: { type: "string" },
                  cnpj: { type: "string" },
                  instagram: { type: "string" },
                  email: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  rating: { type: "number" },
                  total_avaliacoes: { type: "number" },
                  tipo: { type: "string" }
                }
              }
            },
            total_encontradas: { type: "number" },
            timestamp: { type: "string" }
          }
        }
      });

      // Cadastrar somente resultados válidos.
      for (const clinica of result.clinicas || []) {
        const clinicKey = `${clinica.nome}-${clinica.cidade}`;
        
        if (!processedClinicsRef.current.has(clinicKey)) {
          processedClinicsRef.current.add(clinicKey);

          // Cadastrar como lead
          await base44.entities.Lead.create({
            full_name: 'A definir',
            company: clinica.nome,
            city: clinica.cidade,
            phone: clinica.telefone,
            email: clinica.email,
            instagram_handle: clinica.instagram?.replace('@', ''),
            source: 'google',
            interest: 'Equipamentos Seamaty',
            company_size: clinica.tipo === 'hospital_veterinario' ? '51-200' : '1-10',
            lead_score: clinica.rating ? Math.round(clinica.rating * 20) : 50,
            status: 'novo',
            notes: `🛰️ Detectado via GPS em ${new Date().toLocaleString('pt-BR')}
📍 Distância: ${clinica.distancia_metros}m
${clinica.cnpj ? `📋 CNPJ: ${clinica.cnpj}` : ''}
⭐ Avaliação: ${clinica.rating || 'N/A'} (${clinica.total_avaliacoes || 0} reviews)
📍 Coordenadas: ${clinica.latitude}, ${clinica.longitude}`
          });

          setDetectedClinics(prev => [...prev, clinica]);
          
          // Notificação
          const notification = {
            id: Date.now(),
            clinica: clinica.nome,
            distancia: clinica.distancia_metros,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev].slice(0, 10));

          toast.success(`📍 Clínica detectada!`, {
            description: `${clinica.nome} - ${clinica.distancia_metros}m`
          });
        }
      }

    } catch (error) {
      console.error('Erro ao escanear:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (compact) {
    return (
      <div className="relative">
        <Button
          onClick={tracking ? stopTracking : startTracking}
          variant={tracking ? 'default' : 'outline'}
          size="sm"
          className={tracking ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}
        >
          <Navigation className={`w-4 h-4 ${tracking ? 'animate-spin' : ''}`} />
        </Button>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${tracking ? 'bg-green-600 animate-pulse' : 'bg-slate-600'} flex items-center justify-center`}>
          <Navigation className={`w-6 h-6 text-white ${tracking ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">🛰️ Rastreador GPS de Clínicas</h3>
          <p className="text-xs text-slate-600">
            Detecta clínicas ao redor automaticamente
          </p>
        </div>
      </div>

      {currentLocation && (
        <div className="mb-3 p-2 bg-white rounded border border-green-300 text-xs">
          <p className="text-slate-600">
            📍 Localização: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      <Button
        onClick={tracking ? stopTracking : startTracking}
        className={`w-full h-12 ${tracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {tracking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Parar Rastreamento
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" />
            Iniciar Rastreamento GPS
          </>
        )}
      </Button>

      {detectedClinics.length > 0 && (
        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-green-300">
          <p className="text-sm font-semibold text-green-700 mb-2">
            ✓ {detectedClinics.length} clínicas detectadas
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {detectedClinics.slice(0, 5).map((clinica, i) => (
              <div key={i} className="text-xs p-2 bg-green-50 rounded border border-green-200">
                <p className="font-semibold text-slate-800">{clinica.nome}</p>
                <p className="text-slate-600">{clinica.distancia_metros}m - {clinica.cidade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-700">
              🔔 Notificações ({notifications.length})
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNotifications([])}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {notifications.map((notif) => (
              <div key={notif.id} className="text-xs p-2 bg-white rounded">
                <p className="font-medium text-slate-800">{notif.clinica}</p>
                <p className="text-slate-500">{notif.distancia}m - {notif.timestamp.toLocaleTimeString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-slate-500 mt-3">
        ⚡ Raio de detecção: 500m | Auto-cadastro em Possíveis Vendas
      </p>
    </Card>
  );
}