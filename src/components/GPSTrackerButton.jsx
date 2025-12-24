import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BOTÃO GPS COMPACTO PARA HEADER
 * Rastreamento contínuo de clínicas
 */
export default function GPSTrackerButton() {
  const [tracking, setTracking] = useState(false);
  const [clinicsFound, setClinicsFound] = useState(0);
  const watchIdRef = useRef(null);
  const lastScanRef = useRef(0);
  const processedRef = useRef(new Set());

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS não disponível');
      return;
    }

    setTracking(true);
    processedRef.current = new Set();
    setClinicsFound(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();

        // Escanear a cada 30 segundos
        if (now - lastScanRef.current > 30000) {
          lastScanRef.current = now;
          await scanArea(latitude, longitude);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const scanArea = async (lat, lng) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `GPS: ${lat}, ${lng}

Busque clínicas veterinárias em raio de 500m usando Google Maps, Waze.

Retorne JSON:
{
  "clinicas": [
    {
      "nome": "Nome",
      "endereco": "Endereço completo",
      "cidade": "Cidade",
      "telefone": "5511999999999",
      "cnpj": "CNPJ",
      "instagram": "@handle",
      "distancia_metros": 0
    }
  ]
}

Apenas clínicas < 500m.`,
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
                  telefone: { type: "string" },
                  cnpj: { type: "string" },
                  instagram: { type: "string" },
                  distancia_metros: { type: "number" }
                }
              }
            }
          }
        }
      });

      for (const clinica of result.clinicas || []) {
        const key = `${clinica.nome}-${clinica.endereco}`;
        
        if (!processedRef.current.has(key)) {
          processedRef.current.add(key);

          await base44.entities.Lead.create({
            full_name: 'A definir',
            company: clinica.nome,
            city: clinica.cidade,
            phone: clinica.telefone,
            email: clinica.email,
            instagram_handle: clinica.instagram?.replace('@', ''),
            source: 'analise_mercado_ia',
            interest: 'Equipamentos Seamaty',
            lead_score: 70,
            status: 'novo',
            notes: `🛰️ GPS: ${clinica.distancia_metros}m
📍 ${clinica.endereco}
${clinica.cnpj ? `📋 CNPJ: ${clinica.cnpj}` : ''}
⏰ ${new Date().toLocaleString('pt-BR')}`
          });

          setClinicsFound(prev => prev + 1);
          toast.success(`📍 ${clinica.nome}`, {
            description: `${clinica.distancia_metros}m - Cadastrado!`
          });
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={tracking ? stopTracking : startTracking}
        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          tracking 
            ? 'bg-green-600 animate-pulse' 
            : 'glass hover:bg-white/10'
        } transition-all`}
      >
        <Navigation className={`w-3.5 h-3.5 ${tracking ? 'text-white animate-spin' : 'text-orange-400'}`} />
      </button>
      {clinicsFound > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {clinicsFound}
        </span>
      )}
    </div>
  );
}