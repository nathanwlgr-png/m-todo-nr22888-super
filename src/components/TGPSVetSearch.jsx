import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  Navigation, MapPin, Loader2, Search, Building2,
  Phone, MessageCircle, UserPlus, Users, Star, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function TGPSVetSearch({ onAddLead, onAddClient }) {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [results, setResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [addingId, setAddingId] = useState(null);

  const buscarPorGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS não disponível neste dispositivo');
      return;
    }
    setLocating(true);
    setResults([]);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocating(false);
        await buscarVeterinarios({ lat: latitude, lng: longitude });
      },
      (err) => {
        setLocating(false);
        toast.error('Erro ao obter GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const buscarPorCidade = async () => {
    if (!manualCity.trim()) { toast.error('Digite uma cidade'); return; }
    await buscarVeterinarios({ cidade: manualCity.trim() });
  };

  const buscarVeterinarios = async ({ lat, lng, cidade }) => {
    setLoading(true);
    setResults([]);
    try {
      const localRef = lat && lng
        ? `coordenadas latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)} (Brasil)`
        : `cidade de ${cidade}, Brasil`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de busca de clínicas e hospitais veterinários.
        
Busque na internet hospitais veterinários, clínicas veterinárias e centros veterinários em: ${localRef}.

Para cada estabelecimento encontrado, retorne:
- name: nome da clínica/hospital
- address: endereço completo
- city: cidade
- phone: telefone (formato brasileiro, ex: 14999999999)
- owner_vet: nome do proprietário ou veterinário responsável (se disponível)
- specialties: especialidades (ex: pequenos animais, oncologia, cirurgia)
- type: "hospital_veterinario" ou "clinica_veterinaria" ou "clinica_especializada"
- website: site (se disponível)
- has_lab: se tem laboratório interno (true/false, baseado em pesquisa)
- distance_km: distância estimada em km do ponto de referência

Busque pelo menos 10-15 estabelecimentos reais. Priorize hospitais veterinários e clínicas de médio/grande porte.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinicas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  owner_vet: { type: "string" },
                  specialties: { type: "string" },
                  type: { type: "string" },
                  website: { type: "string" },
                  has_lab: { type: "boolean" },
                  distance_km: { type: "number" }
                }
              }
            },
            region_searched: { type: "string" }
          }
        }
      });

      const clinicas = response.clinicas || [];
      setResults(clinicas.sort((a, b) => (a.distance_km || 99) - (b.distance_km || 99)));
      toast.success(`${clinicas.length} clínicas/hospitais encontrados!`);
    } catch (error) {
      toast.error('Erro ao buscar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarComoLead = async (clinica) => {
    setAddingId(clinica.name);
    try {
      const lead = await base44.entities.Lead.create({
        full_name: clinica.owner_vet || clinica.name,
        company: clinica.name,
        phone: clinica.phone?.replace(/\D/g, '') || '',
        city: clinica.city,
        address: clinica.address,
        website: clinica.website,
        source: 'analise_mercado_ia',
        interest: 'Analisador hematológico / bioquímico',
        notes: `Encontrado via TGPS GPS. Tipo: ${clinica.type}. Especialidades: ${clinica.specialties || '-'}. Tem lab: ${clinica.has_lab ? 'Sim' : 'Não/desconhecido'}`,
        stage: 'novo',
        status: 'novo'
      });
      toast.success(`Lead criado: ${clinica.name}`);
      setResults(prev => prev.filter(c => c.name !== clinica.name));
    } catch (e) {
      toast.error('Erro ao criar lead: ' + e.message);
    } finally {
      setAddingId(null);
    }
  };

  const adicionarComoCliente = async (clinica) => {
    setAddingId(clinica.name + '_client');
    try {
      await base44.entities.Client.create({
        first_name: clinica.owner_vet || clinica.name,
        clinic_name: clinica.name,
        phone: clinica.phone?.replace(/\D/g, '') || '',
        city: clinica.city,
        address: clinica.address,
        website: clinica.website,
        lead_source: 'analise_mercado_ia',
        client_type: clinica.type === 'hospital_veterinario' ? 'hospital_veterinario' : 'clinica_pequena',
        status: 'frio',
        purchase_score: 40,
        notes: `Captado via TGPS GPS. Especialidades: ${clinica.specialties || '-'}. Lab interno: ${clinica.has_lab ? 'Sim' : 'Não'}`,
        pipeline_stage: 'lead'
      });
      toast.success(`Cliente criado: ${clinica.name}`);
      setResults(prev => prev.filter(c => c.name !== clinica.name));
    } catch (e) {
      toast.error('Erro ao criar cliente: ' + e.message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
        <CardTitle className="text-sm flex items-center gap-2 text-indigo-800">
          <Navigation className="w-4 h-4 text-indigo-600" />
          🛰️ TGPS — Radar de Hospitais Veterinários
        </CardTitle>
        <p className="text-xs text-indigo-600">Localiza hospitais e clínicas vet via GPS ou cidade e adiciona ao CRM</p>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {/* Busca por GPS */}
        <Button
          onClick={buscarPorGPS}
          disabled={loading || locating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 text-sm"
        >
          {locating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Obtendo GPS...</>
          ) : loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando na internet...</>
          ) : (
            <><Navigation className="w-4 h-4 mr-2" /> 📍 Buscar por GPS (minha localização)</>
          )}
        </Button>

        {/* Busca manual por cidade */}
        <div className="flex gap-2">
          <Input
            placeholder="Ou digite uma cidade... ex: Marília"
            value={manualCity}
            onChange={e => setManualCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarPorCidade()}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={buscarPorCidade}
            disabled={loading || locating}
            size="sm"
            variant="outline"
            className="border-indigo-300 text-indigo-700 h-9"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {userLocation && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {results.length} clínicas/hospitais encontrados
              </p>
              <button onClick={() => setResults([])} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {results.map((clinica, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-3 space-y-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{clinica.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        clinica.type === 'hospital_veterinario'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {clinica.type === 'hospital_veterinario' ? '🏥 Hospital' : '🏪 Clínica'}
                      </Badge>
                      {clinica.has_lab && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">🔬 Lab</Badge>
                      )}
                    </div>
                    {clinica.owner_vet && (
                      <p className="text-xs text-indigo-600 mt-0.5">👨‍⚕️ {clinica.owner_vet}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      {clinica.city}{clinica.address ? ` — ${clinica.address}` : ''}
                      {clinica.distance_km ? ` · ${clinica.distance_km.toFixed(1)}km` : ''}
                    </p>
                    {clinica.specialties && (
                      <p className="text-xs text-slate-400 mt-0.5">🩺 {clinica.specialties}</p>
                    )}
                    {clinica.phone && (
                      <a href={`https://wa.me/${clinica.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        className="text-xs text-green-600 flex items-center gap-1 mt-0.5 hover:underline">
                        <MessageCircle className="w-2.5 h-2.5" /> {clinica.phone}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => adicionarComoLead(clinica)}
                      disabled={addingId === clinica.name}
                      className="h-7 px-2 text-[10px] bg-orange-500 hover:bg-orange-600"
                    >
                      {addingId === clinica.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-2.5 h-2.5 mr-0.5" />Lead</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adicionarComoCliente(clinica)}
                      disabled={addingId === clinica.name + '_client'}
                      className="h-7 px-2 text-[10px] border-indigo-300 text-indigo-700"
                    >
                      {addingId === clinica.name + '_client' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Users className="w-2.5 h-2.5 mr-0.5" />Cliente</>}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !locating && results.length === 0 && (
          <div className="text-center py-4 text-slate-400">
            <Navigation className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
            <p className="text-xs">Use o GPS ou digite uma cidade para encontrar hospitais veterinários</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}