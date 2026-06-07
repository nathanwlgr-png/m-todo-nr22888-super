/**
 * MODO CAÇA COMERCIAL v2 — OTIMIZADO
 * Cadastro rápido (< 3s) + Investigação sob demanda
 * Cache local por cidade (30 dias) | Paginação 10/10
 * NÃO roda IA pesada automaticamente
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Zap, Target, Brain, AlertCircle, RefreshCw,
  CheckCircle2, Loader2, MessageCircle, Search, Map,
  ChevronDown, ChevronUp, Plus, Mic, PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ── Cache local 30 dias ──────────────────────────────────────────────────────
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getCachedClinics(city) {
  try {
    const raw = localStorage.getItem(`caca_clinics_${city}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(`caca_clinics_${city}`); return null; }
    return data;
  } catch { return null; }
}

function setCachedClinics(city, data) {
  try { localStorage.setItem(`caca_clinics_${city}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ── Cor por temperatura ──────────────────────────────────────────────────────
const TEMP_CONFIG = {
  quente:  { label: '🔥 Quente',  color: 'bg-green-600',  border: 'border-green-500',  text: 'text-green-400'  },
  morno:   { label: '☀️ Morno',   color: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-yellow-400' },
  frio:    { label: '❄️ Frio',    color: 'bg-red-600',    border: 'border-red-500',    text: 'text-red-400'    },
  cliente: { label: '💎 Cliente', color: 'bg-blue-600',   border: 'border-blue-500',   text: 'text-blue-400'   },
  depois:  { label: '🟣 Depois',  color: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-400' },
};

const PAGE_SIZE = 10;

export default function ModoCacaComercial() {
  // ── Estado principal ──────────────────────────────────────────────────────
  const [step, setStep]                         = useState(0); // 0=inicio 1=GPS 2=lista 3=cadastro 4=sucesso
  const [gpsLocation, setGpsLocation]           = useState(null);
  const [manualCity, setManualCity]             = useState('');
  const [clinics, setClinics]                   = useState([]);
  const [page, setPage]                         = useState(0);
  const [loadingGPS, setLoadingGPS]             = useState(false);
  const [loadingClinics, setLoadingClinics]     = useState(false);
  const [investigatingId, setInvestigatingId]   = useState(null);
  const [savedLead, setSavedLead]               = useState(null);

  // ── Form cadastro rápido ──────────────────────────────────────────────────
  const [form, setForm] = useState({
    clinic_name: '', city: '', phone: '', address: '',
    temperature: 'frio', notes: '', origin: 'modo_caca'
  });
  const [savingLead, setSavingLead] = useState(false);

  // ── Ranking Top10 do CRM ──────────────────────────────────────────────────
  const { data: hotClinics = [] } = useQuery({
    queryKey: ['caca-hot'],
    queryFn: () => base44.entities.Client.filter({ status: 'quente' }, '-purchase_score', 10).catch(() => []),
    staleTime: 3600000,
  });

  // ── Clínicas paginadas ────────────────────────────────────────────────────
  const pagedClinics = useMemo(() => {
    const start = page * PAGE_SIZE;
    return clinics.slice(start, start + PAGE_SIZE);
  }, [clinics, page]);

  const totalPages = Math.ceil(clinics.length / PAGE_SIZE);

  // ── ETAPA 1: GPS ──────────────────────────────────────────────────────────
  const handleGetGPS = useCallback(async () => {
    setLoadingGPS(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStep(1);
      toast.success('GPS obtido!');
    } catch {
      toast.error('GPS indisponível. Digite a cidade manualmente.');
      setStep(1);
    }
    setLoadingGPS(false);
  }, []);

  // ── ETAPA 2: Buscar clínicas (cache first) ────────────────────────────────
  const handleFetchClinics = useCallback(async () => {
    const city = manualCity.trim();
    if (!city && !gpsLocation) { toast.error('Informe a cidade ou ative o GPS'); return; }

    // Cache hit?
    if (city) {
      const cached = getCachedClinics(city);
      if (cached) {
        setClinics(cached);
        setPage(0);
        setStep(2);
        toast.success(`${cached.length} clínicas carregadas do cache`);
        return;
      }
    }

    setLoadingClinics(true);
    try {
      const res = await base44.functions.invoke('getNearbyVeterinaryClinics', {
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        city: city || undefined,
        radiusKm: 20,
      });
      const list = (res.data?.clinics || res.data || []);
      setClinics(list);
      setPage(0);
      if (city) setCachedClinics(city, list);
      setStep(2);
      toast.success(`${list.length} clínicas encontradas`);
    } catch (err) {
      toast.error(`Erro ao buscar clínicas: ${err.message}`);
    }
    setLoadingClinics(false);
  }, [gpsLocation, manualCity]);

  // ── ETAPA 3: Cadastro Rápido (< 3s, sem IA pesada) ───────────────────────
  const handleSaveLeadRapido = useCallback(async () => {
    if (!form.clinic_name.trim()) { toast.error('Informe o nome da clínica'); return; }
    setSavingLead(true);
    toast.loading('Salvando lead...', { id: 'save-lead' });
    try {
      const lead = await base44.entities.Lead.create({
        full_name: form.clinic_name,
        company: form.clinic_name,
        city: form.city || manualCity,
        phone: form.phone,
        source: 'formulario_web',
        status: 'novo',
        notes: form.notes,
        stage: 'novo',
        interest: 'Equipamentos Seamaty',
        priority_level: form.temperature === 'quente' ? 'high' : form.temperature === 'morno' ? 'medium' : 'low',
      });
      toast.success('✅ Lead cadastrado!', { id: 'save-lead' });
      setSavedLead({ ...form, id: lead.id, leadId: lead.id });
      setStep(4);
      // Resetar form
      setForm({ clinic_name: '', city: '', phone: '', address: '', temperature: 'frio', notes: '', origin: 'modo_caca' });
    } catch (err) {
      toast.error(`Erro ao salvar: ${err.message}`, { id: 'save-lead' });
    }
    setSavingLead(false);
  }, [form, manualCity]);

  // ── Pré-preencher form ao clicar em clínica da lista ─────────────────────
  const handleSelectClinic = useCallback((clinic) => {
    setForm(f => ({
      ...f,
      clinic_name: clinic.name || '',
      city: clinic.city || manualCity,
      phone: clinic.phone || '',
      address: clinic.address || '',
    }));
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [manualCity]);

  // ── INVESTIGAÇÃO PESADA — só sob demanda ─────────────────────────────────
  const handleInvestigarFundo = useCallback(async (leadId, clinicName, city) => {
    setInvestigatingId(leadId);
    toast.loading('Investigando...', { id: 'invest' });
    try {
      await base44.functions.invoke('pesquisaCompletaClinica', {
        company_name: clinicName,
        city,
        lead_id: leadId,
      });
      toast.success('Investigação concluída! Acesse o perfil do lead.', { id: 'invest' });
    } catch (err) {
      toast.error(`Erro na investigação: ${err.message}`, { id: 'invest' });
    }
    setInvestigatingId(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 px-3 py-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-orange-400">🎯 Modo Caça Comercial</h1>
            <p className="text-orange-600 text-xs mt-0.5">Cadastro rápido · Investigação sob demanda</p>
          </div>
          {step > 0 && (
            <Button size="sm" variant="outline" className="text-orange-400 border-orange-600"
              onClick={() => { setStep(0); setClinics([]); setSavedLead(null); }}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reiniciar
            </Button>
          )}
        </div>

        {/* ── ETAPA 0: INÍCIO ─────────────────────────────────────────── */}
        {step === 0 && (
          <Card className="bg-slate-950 border-orange-500/50">
            <CardContent className="pt-6 space-y-4">
              <p className="text-orange-200 text-sm font-semibold">Fluxo em 5 etapas:</p>
              <div className="space-y-2 text-sm text-orange-300">
                {['📍 GPS / cidade', '🏥 Listar clínicas (cache 30d)', '⚡ Cadastro rápido (&lt;3s)', '🎨 Classificar por temperatura', '🔍 Investigar fundo sob demanda'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-900 text-orange-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </div>
                ))}
              </div>
              <Button onClick={handleGetGPS} className="w-full bg-green-600 hover:bg-green-700" disabled={loadingGPS}>
                {loadingGPS ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                {loadingGPS ? 'Obtendo GPS...' : '📍 Iniciar com GPS'}
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-orange-900" />
                <span className="text-orange-700 text-xs">ou</span>
                <div className="flex-1 h-px bg-orange-900" />
              </div>
              <Button onClick={() => setStep(1)} variant="outline" className="w-full text-orange-400 border-orange-700">
                ✍️ Digitar cidade manualmente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── ETAPA 1: CIDADE / GPS ────────────────────────────────────── */}
        {step === 1 && (
          <Card className="bg-slate-950 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Etapa 1 — Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gpsLocation && (
                <div className="p-2 bg-green-900/30 border border-green-500/50 rounded text-green-300 text-xs">
                  ✅ GPS: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                </div>
              )}
              <input
                className="w-full bg-slate-900 border border-orange-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-orange-800 focus:outline-none focus:border-orange-500"
                placeholder="Cidade (ex: Marília, Bauru, Botucatu...)"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFetchClinics()}
              />
              <Button onClick={handleFetchClinics} className="w-full bg-orange-600 hover:bg-orange-700" disabled={loadingClinics}>
                {loadingClinics ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                {loadingClinics ? 'Buscando clínicas...' : 'Buscar Clínicas'}
              </Button>
              <Button onClick={() => setStep(3)} variant="outline" className="w-full text-orange-400 border-orange-700 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Cadastrar sem buscar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── ETAPA 2: LISTA DE CLÍNICAS ───────────────────────────────── */}
        {step === 2 && (
          <Card className="bg-slate-950 border-orange-500/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-400 text-base flex items-center gap-2">
                  <Target className="w-4 h-4" /> {clinics.length} clínicas encontradas
                </CardTitle>
                <Button size="sm" variant="outline" className="text-orange-400 border-orange-700 text-xs"
                  onClick={() => setStep(3)}>
                  <Plus className="w-3 h-3 mr-1" /> Cadastrar manual
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pagedClinics.map((clinic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectClinic(clinic)}
                  className="w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-orange-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-orange-300 text-sm truncate">{clinic.name}</p>
                      <p className="text-orange-700 text-xs mt-0.5">{clinic.city} {clinic.distance ? `• ${clinic.distance.toFixed(1)}km` : ''}</p>
                      {clinic.phone && <p className="text-slate-500 text-xs mt-0.5">📞 {clinic.phone}</p>}
                    </div>
                    <span className="text-orange-500 text-xs shrink-0 mt-1">+ Cadastrar →</span>
                  </div>
                </button>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button size="sm" variant="outline" className="text-orange-400 border-orange-700"
                    onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    ← Anterior
                  </Button>
                  <span className="text-orange-600 text-xs">{page + 1}/{totalPages}</span>
                  <Button size="sm" variant="outline" className="text-orange-400 border-orange-700"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Próxima →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── ETAPA 3: CADASTRO RÁPIDO ─────────────────────────────────── */}
        {step === 3 && (
          <Card className="bg-slate-950 border-green-500/70">
            <CardHeader>
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Cadastro Rápido
                <span className="text-xs text-green-700 font-normal">— salva em &lt;3s, sem IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Nome — obrigatório */}
              <div>
                <label className="text-xs text-orange-500 font-bold uppercase mb-1 block">Nome da clínica *</label>
                <input
                  className="w-full bg-slate-900 border border-orange-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-orange-900 focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Clínica Vet São Paulo"
                  value={form.clinic_name}
                  onChange={e => setForm(f => ({ ...f, clinic_name: e.target.value }))}
                />
              </div>

              {/* Cidade */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-orange-500 font-bold uppercase mb-1 block">Cidade</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-slate-700 focus:outline-none focus:border-orange-500"
                    placeholder={manualCity || 'Cidade'}
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-orange-500 font-bold uppercase mb-1 block">WhatsApp / Tel</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-slate-700 focus:outline-none focus:border-orange-500"
                    placeholder="5511999999999"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Endereço — opcional */}
              <div>
                <label className="text-xs text-slate-600 font-bold uppercase mb-1 block">Endereço (opcional)</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-slate-700 focus:outline-none focus:border-orange-500"
                  placeholder="Rua, número..."
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>

              {/* Temperatura */}
              <div>
                <label className="text-xs text-orange-500 font-bold uppercase mb-2 block">Temperatura</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TEMP_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, temperature: key }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        form.temperature === key
                          ? `${cfg.color} text-white border-transparent`
                          : `bg-transparent ${cfg.text} ${cfg.border} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-xs text-slate-600 font-bold uppercase mb-1 block">
                  Observação rápida <span className="font-normal">(opcional)</span>
                </label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-orange-200 text-sm placeholder-slate-700 focus:outline-none focus:border-orange-500 resize-none"
                  rows={2}
                  placeholder="Ex: Tem equipamento concorrente, interesse em bioquímica..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Botões de ação */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleSaveLeadRapido}
                  className="w-full bg-green-600 hover:bg-green-700 font-bold"
                  disabled={savingLead || !form.clinic_name.trim()}
                >
                  {savingLead
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando lead...</>
                    : <><CheckCircle2 className="w-4 h-4 mr-2" /> ⚡ Cadastrar Prospecção Rápida</>
                  }
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-orange-400 border-orange-700 text-xs"
                    disabled={savingLead || !form.clinic_name.trim()}
                    onClick={async () => {
                      await handleSaveLeadRapido();
                      // Investigação é disparada no passo 4 pelo botão dedicado
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" /> Cadastrar + Investigar
                  </Button>
                  <Button
                    variant="outline"
                    className="text-slate-500 border-slate-700 text-xs"
                    onClick={() => setStep(step - 1 >= 0 ? step - 1 : 0)}
                  >
                    ← Voltar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ETAPA 4: SUCESSO + AÇÕES ─────────────────────────────────── */}
        {step === 4 && savedLead && (
          <Card className="bg-slate-950 border-green-500">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-1">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="text-green-400 font-black text-lg">✅ Lead Cadastrado!</p>
                <p className="text-green-300 font-bold">{savedLead.clinic_name}</p>
                <p className="text-slate-500 text-xs">{savedLead.city || manualCity}</p>
                <Badge className={`${TEMP_CONFIG[savedLead.temperature]?.color} text-white text-xs`}>
                  {TEMP_CONFIG[savedLead.temperature]?.label}
                </Badge>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg text-sm text-orange-300">
                <p className="font-bold mb-1">🎯 Próxima ação recomendada:</p>
                <p className="text-xs text-orange-400">
                  {savedLead.temperature === 'quente'
                    ? 'Contato imediato via WhatsApp + agendar visita esta semana'
                    : savedLead.temperature === 'morno'
                    ? 'Investigar fundo + preparar proposta para contato em 3-7 dias'
                    : 'Adicionar à sequência de follow-up e investigar fundo quando tiver tempo'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  className="w-full bg-purple-700 hover:bg-purple-800"
                  disabled={investigatingId === savedLead.leadId}
                  onClick={() => handleInvestigarFundo(savedLead.leadId, savedLead.clinic_name, savedLead.city || manualCity)}
                >
                  {investigatingId === savedLead.leadId
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Investigando...</>
                    : <><Search className="w-4 h-4 mr-2" /> 🔍 Investigar Fundo (IA Pesada)</>
                  }
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  {savedLead.phone && (
                    <Button
                      variant="outline"
                      className="text-green-400 border-green-700 text-xs"
                      onClick={() => window.open(`https://wa.me/${savedLead.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-blue-400 border-blue-700 text-xs"
                    onClick={() => window.location.href = '/ClientLocationMap'}
                  >
                    <Map className="w-3 h-3 mr-1" /> Ver no Mapa
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-orange-400 border-orange-700 text-sm"
                  onClick={() => { setSavedLead(null); setStep(step > 2 ? 2 : 1); }}
                >
                  + Cadastrar Próxima Clínica
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── RANKING DO DIA (sempre visível) ─────────────────────────── */}
        {hotClinics.length > 0 && (
          <Card className="bg-slate-950 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" /> 🏆 Clientes Quentes — Top 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {hotClinics.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-slate-900 rounded">
                    <span className="text-yellow-400 font-black text-sm w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-yellow-200 text-xs font-bold truncate">{c.clinic_name || c.first_name}</p>
                      <p className="text-yellow-800 text-[10px]">{c.city}</p>
                    </div>
                    {c.purchase_score && (
                      <Badge className="bg-yellow-900 text-yellow-300 text-[10px]">{c.purchase_score}%</Badge>
                    )}
                    {c.phone && (
                      <button
                        onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank')}
                        className="text-green-500 hover:text-green-400"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}