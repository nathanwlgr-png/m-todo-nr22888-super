import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle, Zap, Target, TrendingUp, Loader2, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function InvestigacaoDeCampoReal() {
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(15);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Pega localização GPS do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.log('GPS desativado:', err);
        }
      );
    }
  }, []);

  // Função para iniciar investigação
  const startInvestigation = async () => {
    if (!city) {
      toast.error('Digite uma cidade');
      return;
    }

    if (!currentLocation && !showMap) {
      toast.error('Ative GPS ou use mapa');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('investigacaoCampoReal', {
        city,
        radius,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
      });

      const data = res.data || {};
      setInvestigations(data.clinics || []);
      
      if (data.total_found) {
        toast.success(`${data.total_found} clínicas encontradas!`);
      }
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Busca clientes do CRM para comparação
  const { data: crmClients = [] } = useQuery({
    queryKey: ['crmClients', city],
    queryFn: async () => {
      if (!city) return [];
      const clients = await base44.entities.Client.list();
      return clients.filter(c => c.city?.toLowerCase() === city.toLowerCase());
    },
  });

  // Abre Google Maps
  const openGoogleMaps = (clinic) => {
    const query = encodeURIComponent(`${clinic.name} ${clinic.city}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  // Enviar para WhatsApp
  const sendWhatsApp = (clinic) => {
    const msg = `Olá! Vimos que vocês estão em ${clinic.city} com ${clinic.name}. Gostaria de conversar sobre soluções para laboratório?`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Calcular rota
  const calculateRoute = async () => {
    if (investigations.length === 0) {
      toast.error('Nenhuma clínica para roteirizar');
      return;
    }

    try {
      const res = await base44.functions.invoke('optimizeVisitRoute', {
        clinics: investigations.map(c => ({
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          address: c.address,
        })),
        start_location: currentLocation || { lat: -23.5505, lng: -46.6333 },
      });

      if (res.data?.route_url) {
        window.open(res.data.route_url, '_blank');
        toast.success('Rota otimizada gerada!');
      }
    } catch (err) {
      toast.error('Erro ao gerar rota');
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-blue-400 mb-2">🔍 Investigação de Campo Real</h1>
          <p className="text-blue-200 text-sm">GPS integrado + Google Maps + Detecção de Lacunas CRM</p>
        </div>

        {/* Controles */}
        <Card className="mb-6 border-blue-500/20" style={{ background: '#111' }}>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-blue-600 font-bold mb-2 block">CIDADE</label>
                <input
                  placeholder="Ex: São Paulo, Marília"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && startInvestigation()}
                  className="w-full px-4 py-2 rounded-lg text-sm text-white"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(59,130,246,0.2)' }}
                />
              </div>

              <div>
                <label className="text-xs text-blue-600 font-bold mb-2 block">RAIO (KM)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white font-bold w-12 text-right">{radius}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-blue-600 font-bold mb-2 block">LOCALIZAÇÃO</label>
                <div className="flex gap-2">
                  {currentLocation ? (
                    <div className="flex-1 px-3 py-2 rounded-lg text-xs text-green-400 bg-green-950/30 border border-green-500/30">
                      ✓ GPS Ativo
                    </div>
                  ) : (
                    <div className="flex-1 px-3 py-2 rounded-lg text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-500/30">
                      ⚠ Sem GPS
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                onClick={startInvestigation}
                disabled={loading || !city}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
                {loading ? 'Investigando...' : 'Iniciar Investigação'}
              </Button>

              {investigations.length > 0 && (
                <Button
                  onClick={calculateRoute}
                  variant="outline"
                  className="flex-1 text-blue-400 border-blue-500/30"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Rota Automática
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {investigations.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card style={{ background: '#111', borderColor: 'rgba(59,130,246,0.2)' }} className="border">
              <CardContent className="pt-4">
                <p className="text-xs text-blue-600 font-bold">TOTAL ENCONTRADO</p>
                <p className="text-2xl font-black text-blue-400">{investigations.length}</p>
              </CardContent>
            </Card>

            <Card style={{ background: '#111', borderColor: 'rgba(34,197,94,0.2)' }} className="border">
              <CardContent className="pt-4">
                <p className="text-xs text-green-600 font-bold">NO CRM</p>
                <p className="text-2xl font-black text-green-400">{crmClients.length}</p>
              </CardContent>
            </Card>

            <Card style={{ background: '#111', borderColor: 'rgba(239,68,68,0.2)' }} className="border">
              <CardContent className="pt-4">
                <p className="text-xs text-red-600 font-bold">OPORTUNIDADES</p>
                <p className="text-2xl font-black text-red-400">{investigations.length - crmClients.length}</p>
              </CardContent>
            </Card>

            <Card style={{ background: '#111', borderColor: 'rgba(249,115,22,0.2)' }} className="border">
              <CardContent className="pt-4">
                <p className="text-xs text-orange-600 font-bold">POTENCIAL MÉDIO</p>
                <p className="text-2xl font-black text-orange-400">
                  {investigations.length > 0 
                    ? Math.round(investigations.reduce((sum, c) => sum + (c.potential_score || 0), 0) / investigations.length)
                    : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Clínicas */}
        {investigations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-blue-400">Clínicas Investigadas</h2>
            
            {investigations.map((clinic, idx) => {
              const inCRM = crmClients.find(c => 
                c.clinic_name?.toLowerCase() === clinic.name.toLowerCase()
              );
              const hasGaps = !clinic.phone || !clinic.website || !clinic.instagram;

              return (
                <Card
                  key={idx}
                  className="cursor-pointer transition-all hover:shadow-lg border-blue-500/20"
                  style={{ background: selectedClinic === idx ? 'rgba(59,130,246,0.05)' : '#111' }}
                  onClick={() => setSelectedClinic(selectedClinic === idx ? null : idx)}
                >
                  <CardContent className="pt-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-white">{clinic.name}</h3>
                          {!inCRM && <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded">NÃO NO CRM</span>}
                          {hasGaps && <span className="text-[10px] bg-yellow-950 text-yellow-400 px-2 py-0.5 rounded">LACUNAS</span>}
                        </div>
                        <p className="text-xs text-blue-600">{clinic.address}</p>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <p className="text-[10px] text-blue-600 font-bold">POTENCIAL</p>
                        <p className="text-2xl font-black text-blue-400">{clinic.potential_score || 0}%</p>
                      </div>
                    </div>

                    {/* Detalhes */}
                    {selectedClinic === idx && (
                      <div className="pt-3 border-t border-blue-500/10 space-y-2">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-blue-600 font-bold">TELEFONE</p>
                            <p className="text-sm text-white font-bold">{clinic.phone || '❌ Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-600 font-bold">WEBSITE</p>
                            <p className="text-sm text-white font-bold">{clinic.website ? '✓ Tem' : '❌ Não'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-600 font-bold">INSTAGRAM</p>
                            <p className="text-sm text-white font-bold">{clinic.instagram ? `@${clinic.instagram}` : '❌ Não'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-600 font-bold">EQUIPAMENTO</p>
                            <p className="text-sm text-white font-bold">{clinic.equipment || '⚠️ Desconhecido'}</p>
                          </div>
                        </div>

                        {/* Fatores de Score */}
                        {clinic.score_factors && (
                          <div className="p-2 rounded bg-blue-950/20 border border-blue-500/10">
                            <p className="text-[10px] text-blue-600 font-bold mb-2">FATORES DO SCORE</p>
                            <div className="space-y-1 text-[10px]">
                              {clinic.score_factors.map((factor, i) => (
                                <p key={i} className="text-blue-300">• {factor}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botões */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGoogleMaps(clinic)}
                            className="flex-1 text-blue-400 border-blue-500/30 text-xs"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Maps
                          </Button>
                          {clinic.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsApp(clinic)}
                              className="flex-1 text-green-400 border-green-500/30 text-xs"
                            >
                              💬 WhatsApp
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => {
                              // Poderia abrir modal de criar cliente ou adicionar ao CRM
                              toast.success('Marcar para CRM');
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Adicionar CRM
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && investigations.length === 0 && city && (
          <div className="text-center py-12 text-blue-600/50">
            <p className="text-sm">Clique em "Iniciar Investigação" para buscar clínicas</p>
          </div>
        )}
      </div>
    </div>
  );
}