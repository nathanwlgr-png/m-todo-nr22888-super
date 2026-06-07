/**
 * MODO CAÇA COMERCIAL v2 — Rápido, Leve, Prático
 * 
 * Fluxo:
 * 1. GPS → cidade/região
 * 2. Listar clínicas (dados básicos, paginado)
 * 3. Cadastrar lead RÁPIDO (< 3 segundos)
 * 4. Investigação profunda SOMENTE sob demanda
 */

import React, { useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Zap, Target, Search, CheckCircle2, MessageCircle, Map, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import CacaClinicCard from '@/components/caca/CacaClinicCard';
import CacaQuickForm from '@/components/caca/CacaQuickForm';
import CacaSuccessPanel from '@/components/caca/CacaSuccessPanel';

const CACHE_KEY = (city) => `caca_clinics_${city}`;
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias
const PAGE_SIZE = 10;

// Cache local por cidade
const getCachedClinics = (city) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY(city));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY(city)); return null; }
    return data;
  } catch { return null; }
};
const setCachedClinics = (city, data) => {
  try { localStorage.setItem(CACHE_KEY(city), JSON.stringify({ data, ts: Date.now() })); } catch {}
};

export default function ModoCacaComercial() {
  // Etapas: idle → gps → listing → register → success
  const [step, setStep] = useState('idle');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [clinics, setClinics] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [savedLead, setSavedLead] = useState(null);

  // Clientes existentes para marcar "azul" (cliente ativo)
  const { data: existingClients = [] } = useQuery({
    queryKey: ['caca-existing-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 300000,
  });

  const existingNames = useMemo(() => 
    new Set(existingClients.map(c => (c.clinic_name || c.first_name || '').toLowerCase().trim())),
    [existingClients]
  );

  // Paginação local
  const pagedClinics = useMemo(() => clinics.slice(0, (page + 1) * PAGE_SIZE), [clinics, page]);
  const hasMore = pagedClinics.length < clinics.length;

  // ETAPA 1: GPS
  const handleGetGPS = useCallback(async () => {
    setLoadingGps(true);
    setGpsError(null);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStep('gps');
    } catch {
      setGpsError('GPS não disponível. Digite a cidade manualmente.');
      setStep('gps');
    }
    setLoadingGps(false);
  }, []);

  // ETAPA 2: Buscar clínicas (com cache)
  const handleFetchClinics = useCallback(async (cityName) => {
    const city = cityName || manualCity;
    if (!city && !gpsLocation) return;

    // Verificar cache
    const cached = city ? getCachedClinics(city) : null;
    if (cached) {
      setClinics(cached);
      setPage(0);
      setStep('listing');
      return;
    }

    setLoadingClinics(true);
    try {
      const res = await base44.functions.invoke('getNearbyVeterinaryClinics', {
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        city: city || undefined,
        radiusKm: 20,
      });
      const data = res.data?.clinics || [];
      setClinics(data);
      setPage(0);
      if (city) setCachedClinics(city, data);
      setStep('listing');
    } catch (err) {
      setGpsError(`Erro ao buscar clínicas: ${err.message}`);
    }
    setLoadingClinics(false);
  }, [gpsLocation, manualCity]);

  // ETAPA 3: Selecionar clínica → abrir form rápido
  const handleSelectClinic = useCallback((clinic) => {
    setSelectedClinic(clinic);
    setSavedLead(null);
    setStep('register');
  }, []);

  // ETAPA 3: Salvar lead rápido (sem IA)
  const handleSaveQuick = useCallback(async (formData) => {
    const lead = await base44.entities.Lead.create({
      full_name: formData.clinic_name,
      company: formData.clinic_name,
      phone: formData.phone || '',
      city: formData.city,
      source: 'caca_comercial',
      status: 'novo',
      notes: `Temperatura: ${formData.temperatura}${formData.notes ? '\n' + formData.notes : ''}`,
      ...formData,
    });
    setSavedLead({ ...lead, temperatura: formData.temperatura, clinic_name: formData.clinic_name, phone: formData.phone, city: formData.city });
    setStep('success');
  }, []);

  const handleBack = useCallback(() => {
    setStep('listing');
    setSelectedClinic(null);
    setSavedLead(null);
  }, []);

  const handleReset = useCallback(() => {
    setStep('idle');
    setGpsLocation(null);
    setManualCity('');
    setClinics([]);
    setSelectedClinic(null);
    setSavedLead(null);
    setGpsError(null);
  }, []);

  return (
    <div className="min-h-screen pb-24 px-3 py-5" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-orange-400">🎯 Modo Caça</h1>
            <p className="text-orange-600 text-xs mt-0.5">Cadastro rápido — investigação sob demanda</p>
          </div>
          <div className="flex gap-2">
            {step !== 'idle' && (
              <Button size="sm" variant="outline" onClick={handleReset} className="text-orange-400 border-orange-700 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Reiniciar
              </Button>
            )}
          </div>
        </div>

        {/* ETAPA BADGES */}
        <div className="flex gap-1.5 flex-wrap">
          {['GPS', 'Clínicas', 'Cadastro', 'Salvo'].map((label, i) => {
            const stepIdx = { idle: -1, gps: 0, listing: 1, register: 2, success: 3 }[step];
            return (
              <span key={label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                i < stepIdx ? 'bg-green-900 text-green-300' :
                i === stepIdx ? 'bg-orange-900 text-orange-300' :
                'bg-slate-800 text-slate-500'
              }`}>{i < stepIdx ? '✓ ' : ''}{label}</span>
            );
          })}
        </div>

        {/* ERROS */}
        {gpsError && (
          <div className="flex items-start gap-2 p-3 bg-red-950 border border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs">{gpsError}</p>
          </div>
        )}

        {/* ═══ IDLE: Início ═══ */}
        {step === 'idle' && (
          <Card className="bg-slate-950 border-orange-500/40">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="text-5xl">🎯</div>
                <h2 className="text-orange-300 font-bold text-lg">Iniciar Caça Comercial</h2>
                <p className="text-orange-700 text-sm">Localize clínicas, cadastre leads em segundos e investigue somente quem vale.</p>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 font-bold text-white h-12"
                onClick={handleGetGPS}
                disabled={loadingGps}
              >
                {loadingGps ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                {loadingGps ? 'Obtendo GPS...' : '📍 Usar minha localização'}
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">ou</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite a cidade..."
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={!manualCity || loadingClinics}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  {loadingClinics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ GPS OBTIDO: Próximo passo ═══ */}
        {step === 'gps' && (
          <Card className="bg-slate-950 border-orange-500/40">
            <CardContent className="pt-6 space-y-4">
              {gpsLocation && (
                <div className="p-3 bg-green-950 border border-green-700 rounded-lg">
                  <p className="text-green-300 text-sm font-bold">✅ GPS obtido</p>
                  <p className="text-green-600 text-xs">Lat: {gpsLocation.lat.toFixed(4)} | Lng: {gpsLocation.lng.toFixed(4)}</p>
                </div>
              )}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 font-bold h-12"
                onClick={() => handleFetchClinics()}
                disabled={loadingClinics}
              >
                {loadingClinics ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                {loadingClinics ? 'Buscando clínicas...' : 'Buscar Clínicas Próximas (20km)'}
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">ou buscar por cidade</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digitar cidade..."
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={!manualCity || loadingClinics}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  {loadingClinics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ LISTING: Clínicas ═══ */}
        {step === 'listing' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-orange-400 text-sm font-bold">{clinics.length} clínicas encontradas</p>
              <div className="flex gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded-full bg-green-900 text-green-300">🟢 Quente</span>
                <span className="px-1.5 py-0.5 rounded-full bg-yellow-900 text-yellow-300">🟡 Morno</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-900 text-red-300">🔴 Frio</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-900 text-blue-300">🔵 Ativo</span>
              </div>
            </div>

            {pagedClinics.length === 0 && (
              <Card className="bg-slate-950 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400 text-sm">
                  Nenhuma clínica encontrada. Tente outra cidade.
                </CardContent>
              </Card>
            )}

            {pagedClinics.map((clinic, idx) => (
              <CacaClinicCard
                key={idx}
                clinic={clinic}
                isActive={existingNames.has((clinic.name || '').toLowerCase().trim())}
                onRegister={() => handleSelectClinic(clinic)}
              />
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full text-orange-400 border-orange-700"
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronDown className="w-4 h-4 mr-1" /> Ver mais ({clinics.length - pagedClinics.length} restantes)
              </Button>
            )}

            {/* Cadastrar clínica não listada */}
            <Card className="bg-slate-900 border-dashed border-slate-700">
              <CardContent className="pt-4">
                <Button
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => handleSelectClinic({ name: '', city: manualCity || '', distance: null })}
                >
                  + Cadastrar clínica não listada
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ REGISTER: Form rápido ═══ */}
        {step === 'register' && selectedClinic && (
          <CacaQuickForm
            clinic={selectedClinic}
            onSave={handleSaveQuick}
            onBack={handleBack}
          />
        )}

        {/* ═══ SUCCESS: Pós-cadastro ═══ */}
        {step === 'success' && savedLead && (
          <CacaSuccessPanel
            lead={savedLead}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}

      </div>
    </div>
  );
}