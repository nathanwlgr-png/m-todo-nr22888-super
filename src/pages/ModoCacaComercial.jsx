/**
 * MODO CAÇA COMERCIAL v3 — Validado, Robusto, Rápido
 * GPS → Listing → Cadastro → Sucesso
 * - Validação de coordenadas antes de chamar API
 * - Normalização de cidade
 * - Cache local 30 dias
 * - Anti-clique-duplo
 * - Fallback automático GPS → cidade
 * - Anti-duplicidade antes de cadastrar
 * - Log de debug para /debug-caca
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
import CacaDuplicateDialog from '@/components/caca/CacaDuplicateDialog';

// ─── Cache local ───────────────────────────────────────────
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias
const cacheKey = (city) => `caca_clinics_${city.toLowerCase().trim()}`;

function getCached(city) {
  try {
    const raw = localStorage.getItem(cacheKey(city));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(cacheKey(city)); return null; }
    return data;
  } catch { return null; }
}

function setCache(city, data) {
  try { localStorage.setItem(cacheKey(city), JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ─── Normalização de cidade ─────────────────────────────────
const CITY_NORMALIZE = {
  marilia: 'Marília', marília: 'Marília',
  jau: 'Jaú', jaú: 'Jaú',
  aracatuba: 'Araçatuba', araçatuba: 'Araçatuba',
  bauru: 'Bauru', botucatu: 'Botucatu', lins: 'Lins',
  assis: 'Assis', ourinhos: 'Ourinhos',
  'ribeirao preto': 'Ribeirão Preto', 'ribeirão preto': 'Ribeirão Preto',
  'sao paulo': 'São Paulo', 'são paulo': 'São Paulo',
  'presidente prudente': 'Presidente Prudente',
};

function normalizeCity(city) {
  if (!city || city.trim().length < 3) return null;
  const key = city.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_NORMALIZE[key] || CITY_NORMALIZE[city.trim().toLowerCase()] || city.trim();
}

// ─── Validação de coordenadas ───────────────────────────────
function isValidCoord(lat, lng) {
  const lt = parseFloat(lat);
  const lg = parseFloat(lng);
  return !isNaN(lt) && !isNaN(lg) && lt >= -90 && lt <= 90 && lg >= -180 && lg <= 180;
}

// ─── Log para /debug-caca ───────────────────────────────────
function logDebug(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem('debug_caca_log') || '[]');
    existing.unshift({ ...entry, ts: new Date().toISOString() });
    localStorage.setItem('debug_caca_log', JSON.stringify(existing.slice(0, 20)));
  } catch {}
}

// ─── Similaridade de nomes (simples) ────────────────────────
function isSimilarName(a, b) {
  if (!a || !b) return false;
  const clean = (s) => s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const ca = clean(a), cb = clean(b);
  if (ca === cb) return true;
  if (ca.includes(cb) || cb.includes(ca)) return true;
  return false;
}

const PAGE_SIZE = 10;

export default function ModoCacaComercial() {
  const [step, setStep] = useState('idle'); // idle | gps | listing | register | success
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [clinics, setClinics] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false); // loading único para evitar duplo clique
  const [error, setError] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [savedLead, setSavedLead] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState(null); // { pendingForm, matches }
  const loadingRef = useRef(false);

  // Clientes existentes
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
    new Set([
      ...existingClients.map(c => (c.clinic_name || c.first_name || '').toLowerCase().trim()),
    ]),
    [existingClients]
  );

  const pagedClinics = useMemo(() => clinics.slice(0, (page + 1) * PAGE_SIZE), [clinics, page]);
  const hasMore = pagedClinics.length < clinics.length;

  // ─── ETAPA 1: GPS ──────────────────────────────────────────
  const handleGetGPS = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 60000 })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!isValidCoord(lat, lng)) {
        setError('GPS retornou coordenadas inválidas. Digite a cidade manualmente.');
        setStep('gps');
      } else {
        setGpsLocation({ lat, lng });
        setStep('gps');
      }
    } catch (err) {
      setError('GPS não disponível neste dispositivo. Digite a cidade manualmente.');
      setStep('gps');
    }

    loadingRef.current = false;
    setLoading(false);
  }, []);

  // ─── ETAPA 2: Buscar clínicas ──────────────────────────────
  const handleFetchClinics = useCallback(async (cityOverride) => {
    if (loadingRef.current) return;

    const cityRaw = cityOverride || manualCity;
    const city = normalizeCity(cityRaw);
    const useGps = !cityRaw && gpsLocation && isValidCoord(gpsLocation.lat, gpsLocation.lng);

    // Validações
    if (!useGps && (!city || city.length < 3)) {
      setError('Digite o nome da cidade (mínimo 3 caracteres).');
      return;
    }

    // Cache
    if (city) {
      const cached = getCached(city);
      if (cached) {
        setClinics(cached);
        setPage(0);
        setStep('listing');
        setError(null);
        return;
      }
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const payload = useGps
        ? { latitude: gpsLocation.lat, longitude: gpsLocation.lng, radiusKm: 20 }
        : { city, radiusKm: 20 };

      const res = await base44.functions.invoke('getNearbyVeterinaryClinics', payload);
      const data = res.data?.clinics || [];
      const duration = Date.now() - startTime;

      logDebug({
        mode: useGps ? 'gps' : 'city',
        city: city || null,
        lat: gpsLocation?.lat,
        lng: gpsLocation?.lng,
        count: data.length,
        duration_ms: duration,
        status: 'success',
      });

      setClinics(data);
      setPage(0);
      if (city) setCache(city, data);
      setStep('listing');

    } catch (err) {
      const duration = Date.now() - startTime;
      const msg = err?.response?.data?.error || err.message || 'Erro desconhecido';

      logDebug({
        mode: useGps ? 'gps' : 'city',
        city: city || null,
        lat: gpsLocation?.lat,
        lng: gpsLocation?.lng,
        duration_ms: duration,
        status: 'error',
        error: msg,
      });

      setError(`Não foi possível buscar clínicas. ${msg}`);
    }

    loadingRef.current = false;
    setLoading(false);
  }, [gpsLocation, manualCity]);

  // ─── ETAPA 3: Selecionar clínica ───────────────────────────
  const handleSelectClinic = useCallback((clinic) => {
    setSelectedClinic(clinic);
    setSavedLead(null);
    setStep('register');
  }, []);

  // ─── ANTI-DUPLICIDADE ───────────────────────────────────────
  const checkDuplicates = useCallback((formData) => {
    const matches = [];
    const nameToCheck = formData.clinic_name?.toLowerCase().trim();
    const phoneToCheck = formData.phone?.replace(/\D/g, '');
    const cityToCheck = formData.city?.toLowerCase().trim();

    for (const c of [...existingClients]) {
      const sameName = isSimilarName(c.clinic_name || c.first_name, formData.clinic_name);
      const samePhone = phoneToCheck && c.phone?.replace(/\D/g, '') === phoneToCheck;
      const sameCnpj = formData.cnpj && c.cnpj && formData.cnpj.replace(/\D/g, '') === c.cnpj.replace(/\D/g, '');
      const sameCity = c.city?.toLowerCase().trim() === cityToCheck;

      if (samePhone || sameCnpj || (sameName && sameCity)) {
        matches.push({ type: 'client', record: c });
      }
    }

    for (const l of [...existingLeads]) {
      const sameName = isSimilarName(l.company || l.full_name, formData.clinic_name);
      const samePhone = phoneToCheck && l.phone?.replace(/\D/g, '') === phoneToCheck;
      const sameCity = l.city?.toLowerCase().trim() === cityToCheck;

      if (samePhone || (sameName && sameCity)) {
        matches.push({ type: 'lead', record: l });
      }
    }

    return matches;
  }, [existingClients, existingLeads]);

  // ─── ETAPA 3: Salvar lead ───────────────────────────────────
  const handleSaveQuick = useCallback(async (formData, forceCreate = false) => {
    if (!forceCreate) {
      const matches = checkDuplicates(formData);
      if (matches.length > 0) {
        setDuplicateCheck({ pendingForm: formData, matches });
        return;
      }
    }

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
    setDuplicateCheck(null);
    setStep('success');
  }, [checkDuplicates]);

  const handleBack = useCallback(() => {
    setStep('listing');
    setSelectedClinic(null);
    setSavedLead(null);
    setDuplicateCheck(null);
  }, []);

  const handleReset = useCallback(() => {
    setStep('idle');
    setGpsLocation(null);
    setManualCity('');
    setClinics([]);
    setSelectedClinic(null);
    setSavedLead(null);
    setError(null);
    setDuplicateCheck(null);
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

        {/* ERRO */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-950 border border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
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
                  placeholder="Digite a cidade... (ex: Marília)"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity.trim().length >= 3 && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={!manualCity || manualCity.trim().length < 3 || loading}
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
              {!gpsLocation && (
                <div className="p-3 bg-yellow-950 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-300 text-sm font-bold">⚠️ GPS não disponível</p>
                  <p className="text-yellow-600 text-xs">Use a busca por cidade abaixo.</p>
                </div>
              )}
              {gpsLocation && (
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 font-bold h-12"
                  onClick={() => handleFetchClinics()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                  {loading ? 'Buscando clínicas...' : 'Buscar Clínicas Próximas (20km)'}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">ou buscar por cidade</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digitar cidade... (ex: Marília)"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={e => e.key === 'Enter' && manualCity.trim().length >= 3 && handleFetchClinics(manualCity)}
                />
                <Button
                  onClick={() => handleFetchClinics(manualCity)}
                  disabled={!manualCity || manualCity.trim().length < 3 || loading}
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
                <span className="px-1.5 py-0.5 rounded-full bg-blue-900 text-blue-300">🔵 Ativo</span>
                <span className="px-1.5 py-0.5 rounded-full bg-green-900 text-green-300">🟢 Quente</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-900 text-red-300">🔴 Frio</span>
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

        {/* ═══ DUPLICIDADE DIALOG ═══ */}
        {duplicateCheck && (
          <CacaDuplicateDialog
            matches={duplicateCheck.matches}
            onForceCreate={() => handleSaveQuick(duplicateCheck.pendingForm, true)}
            onCancel={() => setDuplicateCheck(null)}
          />
        )}

      </div>
    </div>
  );
}