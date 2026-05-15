/**
 * MODO CAÇA COMERCIAL — Sistema de Inteligência Comercial Veterinária
 * 
 * Fluxo:
 * 1. GPS + Cidade → Clínicas próximas
 * 2. Investigar clínicas (Google, Instagram, Facebook, site)
 * 3. Detectar equipamentos concorrentes
 * 4. Gerar perfil comercial (score + porte + laboratório)
 * 5. Numerologia (perfil comportamental)
 * 6. Gerar abordagem (SPIN + CTA + gatilhos)
 * 7. Ranking do dia (clínicas quentes)
 * 
 * REGRA: Sem IA automática. Tudo sob demanda.
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Zap, Target, Brain, TrendingUp, AlertCircle,
  RefreshCw, Clock, CheckCircle2, AlertTriangle, Shield,
  Download, Share2, Filter, ChevronRight, Loader2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ModoCacaComercial() {
  const [operationActive, setOperationActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [nearClinics, setNearClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicProfile, setClinicProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Passo 1: Obter GPS
  const handleGetGPS = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = position.coords;
      setGpsLocation({ lat: latitude, lng: longitude });
      setCurrentStep(1);
    } catch (err) {
      setError('GPS não disponível. Use localização manual.');
    }
    setLoading(false);
  };

  // Passo 2: Buscar clínicas próximas
  const handleFetchNearClinics = async () => {
    if (!gpsLocation) {
      setError('GPS necessário primeiro');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getNearbyVeterinaryClinics', {
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lng,
        radiusKm: 15,
      });
      setNearClinics(res.data.clinics || []);
      setCurrentStep(2);
    } catch (err) {
      setError(`Erro ao buscar clínicas: ${err.message}`);
    }
    setLoading(false);
  };

  // Passo 3-6: Investigar clínica + Gerar perfil
  const handleInvestigateClinic = async (clinic) => {
    setSelectedClinic(clinic);
    setLoading(true);
    setError(null);
    try {
      // Combina: investigação + perfil + numerologia + SPIN
      const [investigation, numerology] = await Promise.all([
        base44.functions.invoke('investigateLeadPublicData', {
          company_name: clinic.name,
          city: clinic.city,
          include_web: true,
          include_social: true,
        }),
        base44.functions.invoke('consultiveNumerologyAnalysis', {
          name: clinic.name,
          decision_role: 'proprietario',
        }),
      ]);

      // Detectar equipamentos usando análise de imagens/site
      const equipmentDetected = extractEquipmentFromProfile(investigation.data);

      // Gerar SPIN selling
      const spinRes = await base44.functions.invoke('generateSpinSellingMessages', {
        client_name: clinic.name,
        context: `Clínica veterinária ${clinic.city}. Estrutura: ${investigation.data.segment || 'desconhecida'}`,
        previous_interaction: null,
      });

      setClinicProfile({
        clinic,
        investigation: investigation.data,
        numerology: numerology.data,
        equipmentDetected,
        spinSelling: spinRes.data,
        score: calculateScore(investigation.data, equipmentDetected),
        timestamp: new Date(),
      });
      setCurrentStep(6);
    } catch (err) {
      setError(`Erro ao investigar: ${err.message}`);
    }
    setLoading(false);
  };

  // Calcular score de potencial comercial
  const calculateScore = (investigation, equipments) => {
    let score = 50;

    // Porte
    if (investigation.segment === 'hospital_veterinario') score += 25;
    else if (investigation.segment === 'clinica_media') score += 15;
    else if (investigation.segment === 'clinica_pequena') score += 5;

    // Estrutura
    if (investigation.has_laboratory) score += 10;
    if (investigation.has_surgery) score += 10;
    if (investigation.has_emergency) score += 5;

    // Equipamentos concorrentes detectados
    if (equipments.length > 0) score += (equipments.length * 5);

    // Reviews positivos
    if (investigation.google_rating && investigation.google_rating >= 4.5) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  // Extrair equipamentos do perfil (simulação — em produção usar ML)
  const extractEquipmentFromProfile = (investigation) => {
    const competitors = [];
    const text = (investigation.web_content || '').toLowerCase();
    
    if (text.includes('idexx') || text.includes('catalyst')) competitors.push('IDEXX');
    if (text.includes('fuji') || text.includes('fujifilm')) competitors.push('Fuji');
    if (text.includes('zoetis')) competitors.push('Zoetis');
    if (text.includes('seamaty') || text.includes('vg2')) competitors.push('Seamaty');
    
    return competitors;
  };

  // Ranking do dia
  const { data: hotClinics = [] } = useQuery({
    queryKey: ['hot-clinics-ranking'],
    queryFn: async () => {
      try {
        const clients = await base44.entities.Client.list('-purchase_score', 20);
        return clients
          .filter(c => (c.purchase_score || 0) > 70)
          .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
          .slice(0, 10);
      } catch {
        return [];
      }
    },
    staleTime: 3600000, // 1 hora
    enabled: operationActive,
  });

  // UI Passo a Passo
  const steps = [
    { label: 'GPS', icon: MapPin },
    { label: 'Clínicas', icon: Target },
    { label: 'Investigar', icon: Eye },
    { label: 'Perfil', icon: Brain },
    { label: 'Numerologia', icon: TrendingUp },
    { label: 'SPIN Selling', icon: Zap },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 py-6" style={{ background: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ══════ HEADER ══════ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-orange-400">🎯 Modo Caça Comercial</h1>
            <p className="text-orange-200 text-sm mt-1">Inteligência Comercial Veterinária em Tempo Real</p>
          </div>
          <Button
            size="lg"
            className={`${operationActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={() => setOperationActive(!operationActive)}
          >
            {operationActive ? '⏹️ Parar' : '▶️ Iniciar Operação'}
          </Button>
        </div>

        {/* ══════ PROGRESSO VISUAL ══════ */}
        {operationActive && (
          <Card className="bg-slate-950 border-orange-500/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-orange-400">Progresso da Operação</span>
                  <span className="text-xs text-orange-600">{currentStep}/6</span>
                </div>
                <Progress value={(currentStep / 6) * 100} className="h-2" />
                <div className="grid grid-cols-6 gap-2">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-center flex flex-col items-center gap-1 ${
                          isDone ? 'bg-green-900 border border-green-500' :
                          isCurrent ? 'bg-orange-900 border border-orange-500 animate-pulse' :
                          'bg-slate-800 border border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isDone ? 'text-green-400' : isCurrent ? 'text-orange-400' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-bold">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════ ERROS ══════ */}
        {error && (
          <Card className="bg-red-950 border-red-500/50">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-bold">Erro</p>
                <p className="text-red-200 text-xs">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════ PASSO 1: GPS ══════ */}
        {!operationActive && (
          <Card className="bg-slate-950 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Passo 1: Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-orange-200 text-sm">
                Ative a operação para começar. O sistema irá:
              </p>
              <ol className="text-orange-300 text-sm space-y-2 ml-4">
                <li>1. Obter sua localização GPS</li>
                <li>2. Buscar clínicas veterinárias próximas</li>
                <li>3. Investigar cada clínica (Google, redes sociais, site)</li>
                <li>4. Detectar equipamentos concorrentes</li>
                <li>5. Análise numerológica do proprietário</li>
                <li>6. Gerar abordagem SPIN Selling personalizada</li>
              </ol>
              <Button onClick={() => setOperationActive(true)} className="w-full bg-green-600 hover:bg-green-700 mt-4">
                ▶️ Iniciar Operação
              </Button>
            </CardContent>
          </Card>
        )}

        {operationActive && currentStep === 0 && (
          <Card className="bg-slate-950 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Passo 1: Obter Localização GPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gpsLocation ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <p className="text-green-300 font-bold text-sm">✅ GPS Obtido</p>
                    <p className="text-green-200 text-xs mt-1">Lat: {gpsLocation.lat.toFixed(4)} | Lng: {gpsLocation.lng.toFixed(4)}</p>
                  </div>
                  <Button onClick={handleFetchNearClinics} className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Buscar Clínicas Próximas (15km)
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGetGPS} className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  📍 Obter Localização
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════ PASSO 2: CLÍNICAS PRÓXIMAS ══════ */}
        {operationActive && currentStep >= 1 && nearClinics.length > 0 && (
          <Card className="bg-slate-950 border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Passo 2: Clínicas Próximas ({nearClinics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nearClinics.map((clinic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInvestigateClinic(clinic)}
                    className="p-4 rounded-lg border border-orange-500/30 hover:border-orange-500 bg-slate-900 hover:bg-slate-800 transition-all text-left"
                    disabled={loading}
                  >
                    <p className="font-bold text-orange-300">{clinic.name}</p>
                    <p className="text-xs text-orange-600 mt-1">{clinic.distance?.toFixed(1)}km • {clinic.city}</p>
                    {clinic.segment && (
                      <Badge className="mt-2 text-[10px] bg-orange-900 text-orange-200">
                        {clinic.segment}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════ PASSO 3-6: PERFIL COMERCIAL ══════ */}
        {clinicProfile && (
          <div className="space-y-4">
            {/* Score */}
            <Card className="bg-slate-950 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-green-400">🎯 Score de Potencial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-5xl font-black text-green-400">{clinicProfile.score}</p>
                  <p className="text-green-600 text-sm mt-1">
                    {clinicProfile.score >= 80 ? '🔥 Oportunidade QUENTE' :
                     clinicProfile.score >= 60 ? '⚠️ Oportunidade Média' :
                     clinicProfile.score >= 40 ? '❄️ Oportunidade Fria' :
                     '🟣 Sem Potencial'}
                  </p>
                </div>
                <Progress value={clinicProfile.score} className="h-3" />
              </CardContent>
            </Card>

            {/* Investigação */}
            <Card className="bg-slate-950 border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Investigação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-blue-500 font-bold">TIPO</p>
                    <p className="font-bold">{clinicProfile.investigation.segment || 'Desconhecido'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-bold">RATING</p>
                    <p className="font-bold">{clinicProfile.investigation.google_rating ? `${clinicProfile.investigation.google_rating}⭐` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-bold">LABORATÓRIO</p>
                    <p className="font-bold">{clinicProfile.investigation.has_laboratory ? '✅ Sim' : '❌ Não'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-bold">CIRURGIA</p>
                    <p className="font-bold">{clinicProfile.investigation.has_surgery ? '✅ Sim' : '❌ Não'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos Detectados */}
            {clinicProfile.equipmentDetected.length > 0 && (
              <Card className="bg-slate-950 border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-red-400">⚠️ Equipamentos Concorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {clinicProfile.equipmentDetected.map((eq, idx) => (
                      <Badge key={idx} className="bg-red-900 text-red-200">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Numerologia */}
            {clinicProfile.numerology && (
              <Card className="bg-slate-950 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Perfil Comportamental (Numerologia)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-purple-200 text-sm">
                  <div>
                    <p className="text-[10px] text-purple-500 font-bold">TIPO DECISÓRIO</p>
                    <p className="font-bold">{clinicProfile.numerology.decision_style || 'Analisar'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-500 font-bold">ABORDAGEM RECOMENDADA</p>
                    <p className="font-bold">{clinicProfile.numerology.approach_tips || 'Formal e técnica'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SPIN Selling */}
            {clinicProfile.spinSelling && (
              <Card className="bg-slate-950 border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-400 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Abordagem SPIN Selling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-orange-200 text-sm">
                  {clinicProfile.spinSelling.situation && (
                    <div>
                      <p className="text-[10px] text-orange-500 font-bold uppercase">🎯 SITUAÇÃO (Quebra-gelo)</p>
                      <p>{clinicProfile.spinSelling.situation}</p>
                    </div>
                  )}
                  {clinicProfile.spinSelling.problem && (
                    <div>
                      <p className="text-[10px] text-orange-500 font-bold uppercase">❓ PROBLEMA (Pergunta)</p>
                      <p>{clinicProfile.spinSelling.problem}</p>
                    </div>
                  )}
                  {clinicProfile.spinSelling.implication && (
                    <div>
                      <p className="text-[10px] text-orange-500 font-bold uppercase">💡 IMPLICAÇÃO (Gatilho)</p>
                      <p>{clinicProfile.spinSelling.implication}</p>
                    </div>
                  )}
                  {clinicProfile.spinSelling.needPayoff && (
                    <div>
                      <p className="text-[10px] text-orange-500 font-bold uppercase">🎁 SOLUÇÃO (Benefício)</p>
                      <p>{clinicProfile.spinSelling.needPayoff}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-orange-500/30 flex gap-2">
                    <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={() => {
                      navigator.clipboard.writeText(
                        `${clinicProfile.spinSelling.situation}\n\n${clinicProfile.spinSelling.problem}\n\n${clinicProfile.spinSelling.implication}\n\n${clinicProfile.spinSelling.needPayoff}`
                      );
                    }}>
                      <Download className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-orange-400 border-orange-500">
                      <Share2 className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => {
              setClinicProfile(null);
              setCurrentStep(1);
            }} variant="outline" className="w-full">
              ← Investigar Outra Clínica
            </Button>
          </div>
        )}

        {/* ══════ RANKING DO DIA ══════ */}
        {operationActive && hotClinics.length > 0 && (
          <Card className="bg-slate-950 border-yellow-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">🏆 Ranking do Dia (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hotClinics.map((clinic, idx) => (
                  <div key={clinic.id} className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg">
                    <span className="font-black text-yellow-400 text-lg w-8">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-yellow-200 truncate">{clinic.clinic_name || clinic.first_name}</p>
                      <p className="text-xs text-yellow-600">{clinic.city}</p>
                    </div>
                    <Badge className="bg-yellow-900 text-yellow-200">
                      {clinic.purchase_score}%
                    </Badge>
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