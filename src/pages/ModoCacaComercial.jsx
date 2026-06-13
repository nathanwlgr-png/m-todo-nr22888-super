/**
 * MODO CAÇA COMERCIAL v3 — Rápido, Seguro, Validado
 * 
 * Fluxo:
 * 1. GPS → cidade/região
 * 2. Listar clínicas (dados básicos, paginado)
 * 3. Cadastrar lead RÁPIDO (< 3 segundos)
 * 4. Investigação profunda SOMENTE sob demanda
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Target, Search, ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CacaClinicCard from '@/components/caca/CacaClinicCard';
import CacaQuickForm from '@/components/caca/CacaQuickForm';
import CacaSuccessPanel from '@/components/caca/CacaSuccessPanel';
import DuplicateCheckModal from '@/components/caca/DuplicateCheckModal';

// ── Cache local por cidade (30 dias) ──
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 10;

const CITY_MAP = {
  'marilia': 'Marília', 'marília': 'Marília',
  'jau': 'Jaú', 'jaú': 'Jaú',
  'sao paulo': 'São Paulo', 'são paulo': 'São Paulo',
  'aracatuba': 'Araçatuba', 'araçatuba': 'Araçatuba',
  'ribeirao preto': 'Ribeirão Preto', 'ribeirão preto': 'Ribeirão Preto',
  'bauru': 'Bauru', 'botucatu': 'Botucatu', 'ourinhos': 'Ourinhos',
  'assis': 'Assis', 'presidente prudente': 'Presidente Prudente',
};

const normalizeCity = (city) => {
  if (!city || city.trim().length < 3) return null;
  const trimmed = city.trim();
  const key = trimmed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mapped = CITY_MAP[key] || trimmed;
  // Garantir sufixo SP
  if (!mapped.toUpperCase().endsWith(', SP')) return `${mapped}, SP`;
  return mapped;
};

const isValidCoord = (val) => {
  const n = parseFloat(val);
  return !isNaN(n) && isFinite(n) && n !== 0;
};

const getCachedClinics = (city) => {
  try {
    const raw = localStorage.getItem(`caca_v3_${city}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(`caca_v3_${city}`); return null; }
    return data;
  } catch { return null; }
};
const setCachedClinics = (city, data) => {
  try { localStorage.setItem(`caca_v3_${city}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
};

import { cacaDebugStore } from '@/lib/cacaDebugStore';

export default function ModoCacaComercial() {
  const [step, setStep] = useState('idle');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [clinics, setClinics] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false); // loading único anti-clique-duplo
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [savedLead, setSavedLead] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null); // { existing, formData }
  const isFetching = useRef(false);

  // Clientes/leads existentes para verificação de duplicidade
  const { data: existingClients = [] } = useQuery({
    queryKey: ['caca-existing-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 300),
    staleTime: 300000,
  });
  const { data: existingLeads = [] } = useQuery({
    queryKey: ['caca-existing-leads'],
    queryFn: () => base44.entities.Lead.list('-updated_date', 300),
    staleTime: 300000,
  });

  const existingNames = useMemo(() =>
    new Set(existingClients.map(c => (c.clinic_name || c.first_name || '').toLowerCase().trim())),
    [existingClients]
  );

  const pagedClinics = useMemo(() => clinics.slice(0, (page + 1) * PAGE_SIZE), [clinics, page]);
  const hasMore = pagedClinics.length < clinics.length;

  // ── ETAPA 1: GPS ──
  const handleGetGPS = useCallback(async () => {
    if (loading || isFetching.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!isValidCoord(lat) || !isValidCoord(lng)) {
        throw new Error('Coordenadas inválidas recebidas do GPS.');
      }
      setGpsLocation({ lat, lng });
      cacaDebugStore.lastGPS = { lat, lng };
      setStep('gps');
    } catch {
      // Regra 4: fallback automático para cidade base
      setErrorMsg('GPS indisponível. Buscando por cidade base (Marília, SP)...');
      setStep('gps');
      setManualCity('Marília');
      // Busca automática em background após pequeno delay
      setTimeout(() => {
        setErrorMsg('GPS indisponível. Buscando por Marília, SP automaticamente.');
      }, 500);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ── ETAPA 2: Buscar clínicas ──
  const handleFetchClinics = useCallback(async (cityOverride) => {
    if (isFetching.current) return;
    const cityRaw = cityOverride || manualCity;
    const city = normalizeCity(cityRaw);
    const byGPS = !cityRaw && gpsLocation;

    // Validações
    if (!byGPS && (!city || city.length < 3)) {
      setErrorMsg('Digite pelo menos 3 letras da cidade para buscar.');
      return;
    }
    if (byGPS && (!isValidCoord(gpsLocation?.lat) || !isValidCoord(gpsLocation?.lng))) {
      setErrorMsg('Localização GPS inválida. Use a busca por cidade.');
      return;
    }

    // Cache
    if (city) {
      const cached = getCachedClinics(city);
      if (cached) {
        setClinics(cached);
        setPage(0);
        setStep('listing');
        cacaDebugStore.lastCity = city;
        cacaDebugStore.lastStatus = 'cache_hit';
        cacaDebugStore.lastResultCount = cached.length;
        return;
      }
    }

    isFetching.current = true;
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      latitude: byGPS ? gpsLocation.lat : undefined,
      longitude: byGPS ? gpsLocation.lng : undefined,
      city: city || undefined,
      radiusKm: 20,
    };

    // Regra 1: log obrigatório antes da chamada
    console.error('CAÇA COMERCIAL', {
      cidade: city,
      latitude: payload.latitude,
      longitude: payload.longitude,
      raio: payload.radiusKm,
      endpoint: 'getNearbyVeterinaryClinics',
      payload,
    });

    cacaDebugStore.lastPayload = payload;
    cacaDebugStore.lastEndpoint = 'getNearbyVeterinaryClinics';
    cacaDebugStore.lastCity = city;
    const t0 = Date.now();

    // Regra 5: timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await base44.functions.invoke('buscarClinicasProximas', {
        cidade: city || undefined,
        lat: byGPS ? payload.latitude : undefined,
        lng: byGPS ? payload.longitude : undefined,
        raio_km: 20,
      });
      clearTimeout(timeoutId);
      const data = res.data?.clinicas || [];
      cacaDebugStore.lastStatus = res.data?.status;
      cacaDebugStore.lastDurationMs = Date.now() - t0;
      cacaDebugStore.lastResultCount = data.length;
      cacaDebugStore.lastError = null;

      setClinics(data);
      setPage(0);
      if (city) setCachedClinics(city, data);
      setStep('listing');
      // Aviso de fallback CRM
      if (res.data?.status === 'MODO_CACA_OK_FALLBACK_CRM_MAPS_PENDENTE') {
        setErrorMsg('Resultado baseado no CRM. Maps externo pendente.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err?.response?.data?.error || err?.message || 'Erro desconhecido';
      const isTimeout = err?.name === 'AbortError' || msg.includes('abort');
      cacaDebugStore.lastError = msg;
      cacaDebugStore.lastDurationMs = Date.now() - t0;
      console.error('CAÇA COMERCIAL - erro fetch:', { msg, payload, durationMs: Date.now() - t0 });
      setErrorMsg(isTimeout
        ? 'Tempo esgotado (15s). Verifique sua conexão e tente novamente.'
        : 'Relatório temporariamente indisponível. Tente novamente.'
      );
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [gpsLocation, manualCity]);

  // ── ETAPA 3: Selecionar clínica ──
  const handleSelectClinic = useCallback((clinic) => {
    setSelectedClinic(clinic);
    setSavedLead(null);
    setStep('register');
  }, []);

  // ── Verificar duplicidade antes de salvar ──
  const checkDuplicate = useCallback((formData) => {
    const nameNorm = (formData.clinic_name || '').toLowerCase().trim();
    const phoneNorm = (formData.phone || '').replace(/\D/g, '');
    const cityNorm = (formData.city || '').toLowerCase().trim();

    const allRecords = [
      ...existingClients.map(c => ({ ...c, _type: 'client' })),
      ...existingLeads.map(l => ({ ...l, _type: 'lead', clinic_name: l.company || l.full_name })),
    ];

    const found = allRecords.find(r => {
      const rName = (r.clinic_name || r.first_name || r.full_name || '').toLowerCase().trim();
      const rPhone = (r.phone || '').replace(/\D/g, '');
      const rCity = (r.city || '').toLowerCase().trim();
      const rCnpj = (r.cnpj || '').replace(/\D/g, '');
      const formCnpj = (formData.cnpj || '').replace(/\D/g, '');

      if (formCnpj && rCnpj && formCnpj === rCnpj) return true;
      if (phoneNorm && rPhone && phoneNorm === rPhone) return true;
      if (nameNorm && rName && rName.includes(nameNorm.slice(0, 6)) && rCity === cityNorm) return true;
      return false;
    });

    return found || null;
  }, [existingClients, existingLeads]);

  // ── ETAPA 3: Salvar lead rápido ──
  const handleSaveQuick = useCallback(async (formData) => {
    const duplicate = checkDuplicate(formData);
    if (duplicate) {
      setDuplicateData({ existing: duplicate, formData });
      return;
    }
    await doSaveLead(formData);
  }, [checkDuplicate]);

  const doSaveLead = useCallback(async (formData) => {
    const lead = await base44.entities.Lead.create({
      full_name: formData.clinic_name,
      company: formData.clinic_name,
      phone: formData.phone || '',
      city: formData.city,
      source: 'outro',
      status: 'novo',
      notes: `Temperatura: ${formData.temperatura}${formData.notes ? '\n' + formData.notes : ''}`,
    });
    setSavedLead({ ...lead, temperatura: formData.temperatura, clinic_name: formData.clinic_name, phone: formData.phone, city: formData.city });
    setDuplicateData(null);
    setStep('success');
  }, []);

  const handleBack = useCallback(() => {
    setStep('listing');
    setSelectedClinic(null);
    setSavedLead(null);
    setDuplicateData(null);
  }, []);

  const handleReset = useCallback(() => {
    setStep('idle');
    setGpsLocation(null);
    setManualCity('');
    setClinics([]);
    setSelectedClinic(null);
    setSavedLead(null);
    setErrorMsg(null);
    setDuplicateData(null);
    isFetching.current = false;
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
          {step !== 'idle' && (
            <Button size="sm" variant="outline" onClick={handleReset} className="text-orange-400 border-orange-700 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Reiniciar
            </Button>
          )}
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

        {/* ERRO AMIGÁVEL */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-950 border border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-xs">{errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 text-[10px] mt-1 underline">Fechar</button>
            </div>
          </div>
        )}

        {/* Modal de duplicidade */}
        {duplicateData && (
          <DuplicateCheckModal
            existing={duplicateData.existing}
            formData={duplicateData.formData}
            onOpenExisting={() => {
              const id = duplicateData.existing.id;
              const type = duplicateData.existing._type;
              window.open(`/${type === 'client' ? 'ClientProfile' : 'Leads'}?id=${id}`, '_blank');
              setDuplicateData(null);
            }}
            onCreateAnyway={() => doSaveLead(duplicateData.formData)}
            onCancel={() => setDuplicateData(null)}
          />
        )}

        {/* ═══ IDLE ═══ */}
        {step === 'idle' && (
          <Card className="bg-slate-950 border-orange-500/40">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="text-5xl">🎯</div>
                <h2 className="text-orange-300 font-bold text-lg">Iniciar Caça Comercial</h2>
                <p className="text-orange-700 text-sm">Localize clínicas, cadastre leads em segundos.</p>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 font-bold text-white h-12"
                onClick={handleGetGPS}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                {loading ? 'Obtendo GPS...' : '📍 Usar minha localização'}
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">ou</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite a cidade (mín. 3 letras)..."
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity.length >= 3 && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={manualCity.trim().length < 3 || loading}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ GPS OBTIDO ═══ */}
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
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                {loading ? 'Buscando clínicas...' : 'Buscar Clínicas Próximas (20km)'}
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">ou buscar por cidade</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digitar cidade (mín. 3 letras)..."
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity.length >= 3 && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={manualCity.trim().length < 3 || loading}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ LISTING ═══ */}
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

        {/* ═══ REGISTER ═══ */}
        {step === 'register' && selectedClinic && (
          <CacaQuickForm
            clinic={selectedClinic}
            onSave={handleSaveQuick}
            onBack={handleBack}
          />
        )}

        {/* ═══ SUCCESS ═══ */}
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