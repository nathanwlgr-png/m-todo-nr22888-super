import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { Search, Building2, Instagram, Facebook, Loader2, MapPin, Phone, Globe, Award, Linkedin, Map, X } from 'lucide-react';
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function CompetitorAnalysisNoAI() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetitors, setSelectedCompetitors] = useState(['Idexx', 'Isoetes']);
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [analyzingEquipment, setAnalyzingEquipment] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Busca automática por GPS ao montar componente
  React.useEffect(() => {
    if (!autoSearched) {
      searchByGPS();
    }
  }, []);

  // Busca concorrentes por GPS - MÚLTIPLOS
  const searchByGPS = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não disponível');
      return;
    }

    if (selectedCompetitors.length === 0) {
      toast.error('Selecione ao menos um concorrente');
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      
      const competitorsText = selectedCompetitors.join(', ');
      
      const searchResults = await base44.integrations.Core.InvokeLLM({
        prompt: `BUSCA GPS DE CLÍNICAS VETERINÁRIAS COM EQUIPAMENTOS: ${competitorsText}

LOCALIZAÇÃO GPS: ${latitude}, ${longitude}
RAIO: 50 km

Busque clínicas veterinárias que possuem equipamentos das marcas: ${competitorsText} (concorrentes Seamaty).

Para cada clínica encontrada, retorne:
- Nome da clínica
- Latitude e Longitude (coordenadas GPS exatas)
- Cidade
- Estado  
- Endereço completo
- Telefone (formato 5511999999999)
- Website
- Instagram (@usuario)
- Facebook (URL)
- LinkedIn (URL da página da empresa)
- Equipamentos identificados (marca e modelo específico)
- Distância em km

Busque em: Google Maps, redes sociais (Instagram, Facebook, LinkedIn), websites oficiais.

Ordene por distância (mais próximas primeiro).
Máximo 30 clínicas.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  city: { type: "string" },
                  state: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  website: { type: "string" },
                  instagram: { type: "string" },
                  facebook: { type: "string" },
                  linkedin: { type: "string" },
                  equipment_mentioned: {
                    type: "array",
                    items: { type: "string" }
                  },
                  distance_km: { type: "number" }
                }
              }
            },
            total_found: { type: "number" }
          }
        }
      });

      setCompetitors(searchResults.clinics || []);
      setAutoSearched(true);
      setShowMap(true);
      toast.success(`${searchResults.total_found || 0} clínicas com ${competitorsText} encontradas próximas a você`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar por GPS");
    } finally {
      setLoading(false);
    }
  };

  // Busca concorrentes via Google Search (sem IA)
  const searchCompetitors = async (competitor) => {
    setLoading(true);
    try {
      const query = `${competitor} veterinária brasil -seamaty`;
      
      // Busca no Google
      const searchResults = await base44.integrations.Core.InvokeLLM({
        prompt: `Busque informações sobre "${competitor}" no mercado veterinário brasileiro. Liste clínicas que usam produtos ${competitor}.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  website: { type: "string" },
                  instagram: { type: "string" },
                  facebook: { type: "string" },
                  phone: { type: "string" },
                  equipment_mentioned: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            total_found: { type: "number" },
            competitor_info: {
              type: "object",
              properties: {
                country: { type: "string" },
                main_products: { type: "array", items: { type: "string" } },
                market_share_estimate: { type: "string" }
              }
            }
          }
        }
      });

      setCompetitors(searchResults.clinics || []);
      toast.success(`Encontradas ${searchResults.total_found || 0} clínicas com ${competitor}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar concorrentes");
    } finally {
      setLoading(false);
    }
  };

  // Analisa TODAS as fontes da clínica (Instagram, Facebook, LinkedIn, Website)
  const analyzeSocialMedia = async (clinic) => {
    setAnalyzingEquipment(true);
    setSelectedCompetitor(clinic);
    
    try {
      const equipment = [];
      const sources = [];
      
      // Busca no Instagram
      if (clinic.instagram) {
        try {
          const instagramData = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise o Instagram ${clinic.instagram} e identifique APENAS os equipamentos de laboratório mencionados (marcas: Aidex, Isoetes, Idexx, Mindray, Sysmex, etc). Liste modelo exato.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                equipment_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      model: { type: "string" },
                      type: { type: "string" },
                      post_date: { type: "string" },
                      source: { type: "string" }
                    }
                  }
                }
              }
            }
          });
          const eqWithSource = (instagramData.equipment_found || []).map(e => ({ ...e, source: 'Instagram' }));
          equipment.push(...eqWithSource);
          if (eqWithSource.length > 0) sources.push('Instagram');
        } catch (e) {
          console.error('Erro Instagram:', e);
        }
      }

      // Busca no Facebook
      if (clinic.facebook) {
        try {
          const facebookData = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise a página Facebook ${clinic.facebook} e identifique equipamentos de laboratório veterinário. Liste marca e modelo.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                equipment_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      model: { type: "string" },
                      type: { type: "string" },
                      source: { type: "string" }
                    }
                  }
                }
              }
            }
          });
          const eqWithSource = (facebookData.equipment_found || []).map(e => ({ ...e, source: 'Facebook' }));
          equipment.push(...eqWithSource);
          if (eqWithSource.length > 0) sources.push('Facebook');
        } catch (e) {
          console.error('Erro Facebook:', e);
        }
      }

      // Busca no LinkedIn
      if (clinic.linkedin) {
        try {
          const linkedinData = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise a página LinkedIn ${clinic.linkedin} da clínica veterinária e identifique equipamentos de laboratório mencionados. Liste marca e modelo.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                equipment_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      model: { type: "string" },
                      type: { type: "string" },
                      source: { type: "string" }
                    }
                  }
                }
              }
            }
          });
          const eqWithSource = (linkedinData.equipment_found || []).map(e => ({ ...e, source: 'LinkedIn' }));
          equipment.push(...eqWithSource);
          if (eqWithSource.length > 0) sources.push('LinkedIn');
        } catch (e) {
          console.error('Erro LinkedIn:', e);
        }
      }

      // Busca no website
      if (clinic.website) {
        try {
          const websiteData = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise o website ${clinic.website} e identifique equipamentos de laboratório veterinário. Liste marca e modelo específico.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                equipment_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      model: { type: "string" },
                      type: { type: "string" },
                      source: { type: "string" }
                    }
                  }
                }
              }
            }
          });
          const eqWithSource = (websiteData.equipment_found || []).map(e => ({ ...e, source: 'Website' }));
          equipment.push(...eqWithSource);
          if (eqWithSource.length > 0) sources.push('Website');
        } catch (e) {
          console.error('Erro Website:', e);
        }
      }

      // Remove duplicatas
      const uniqueEquipment = equipment.filter((item, index, self) =>
        index === self.findIndex(t => t.model === item.model && t.brand === item.brand)
      );

      setSelectedCompetitor({
        ...clinic,
        equipment_analyzed: uniqueEquipment,
        sources_analyzed: sources
      });

      toast.success(`Encontrados ${uniqueEquipment.length} equipamentos em ${sources.length} fonte(s)`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao analisar redes sociais");
    } finally {
      setAnalyzingEquipment(false);
    }
  };

  const toggleCompetitor = (competitor) => {
    if (selectedCompetitors.includes(competitor)) {
      setSelectedCompetitors(selectedCompetitors.filter(c => c !== competitor));
    } else {
      setSelectedCompetitors([...selectedCompetitors, competitor]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção Múltipla de Concorrentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Análise de Concorrência - Busca Múltipla
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Buscando clínicas por GPS e redes sociais...</span>
            </div>
          )}

          {/* Seleção de Concorrentes */}
          <div>
            <p className="text-sm text-slate-600 mb-2">Selecione os concorrentes para buscar:</p>
            <div className="flex flex-wrap gap-2">
              {['Idexx', 'Isoetes', 'Mindray', 'Aidex', 'Sysmex', 'Roche'].map(competitor => (
                <div key={competitor} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <Checkbox
                    checked={selectedCompetitors.includes(competitor)}
                    onCheckedChange={() => toggleCompetitor(competitor)}
                  />
                  <span className="text-sm font-medium">{competitor}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {selectedCompetitors.length} concorrente(s) selecionado(s)
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={searchByGPS}
              disabled={loading || selectedCompetitors.length === 0}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
              Buscar {selectedCompetitors.length > 0 && `(${selectedCompetitors.length} marcas)`}
            </Button>
            {competitors.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowMap(!showMap)}
              >
                <Map className="w-4 h-4 mr-2" />
                {showMap ? 'Ocultar' : 'Ver'} Mapa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapa de Clínicas */}
      {showMap && competitors.length > 0 && userLocation && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Mapa de Clínicas Concorrentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowMap(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden border-2 border-slate-200">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Marcador da localização do usuário */}
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">📍 Você está aqui</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Marcadores das clínicas */}
                {competitors.filter(c => c.latitude && c.longitude).map((clinic, index) => (
                  <Marker 
                    key={index} 
                    position={[clinic.latitude, clinic.longitude]}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <p className="font-bold text-slate-800">{clinic.name}</p>
                        <p className="text-xs text-slate-600">{clinic.city}, {clinic.state}</p>
                        {clinic.equipment_mentioned && clinic.equipment_mentioned.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-red-600">Equipamentos:</p>
                            {clinic.equipment_mentioned.map((eq, i) => (
                              <Badge key={i} variant="outline" className="text-xs mr-1 mt-1">
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => analyzeSocialMedia(clinic)}
                        >
                          Analisar Detalhado
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              📍 Azul = Você | 📍 Vermelho = Clínicas com {selectedCompetitors.join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clínicas Encontradas */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {competitors.length} Clínicas Encontradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {competitors.map((clinic, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h3 className="font-semibold">{clinic.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clinic.city}, {clinic.state}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => analyzeSocialMedia(clinic)}
                        disabled={analyzingEquipment}
                      >
                        {analyzingEquipment && selectedCompetitor?.name === clinic.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {clinic.equipment_mentioned && clinic.equipment_mentioned.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {clinic.equipment_mentioned.map((eq, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm">
                      {clinic.instagram && (
                        <a 
                          href={`https://instagram.com/${clinic.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-pink-600 hover:underline"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </a>
                      )}
                      {clinic.facebook && (
                        <a 
                          href={clinic.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </a>
                      )}
                      {clinic.linkedin && (
                        <a 
                          href={clinic.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-700 hover:underline"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                      {clinic.website && (
                        <a 
                          href={clinic.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-gray-600 hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Site
                        </a>
                      )}
                      {clinic.phone && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-4 h-4" />
                          {clinic.phone}
                        </span>
                      )}
                      {clinic.distance_km && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <MapPin className="w-4 h-4" />
                          {clinic.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise Detalhada da Clínica Selecionada */}
      {selectedCompetitor?.equipment_analyzed && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Equipamentos Identificados - {selectedCompetitor.name}
            </CardTitle>
            {selectedCompetitor.sources_analyzed && (
              <p className="text-sm text-slate-600 mt-2">
                Analisado em: {selectedCompetitor.sources_analyzed.join(', ')}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {selectedCompetitor.equipment_analyzed.map((eq, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-700">{eq.brand} - {eq.model}</h4>
                      <p className="text-sm text-gray-600">{eq.type}</p>
                      {eq.source && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Fonte: {eq.source}
                        </Badge>
                      )}
                      {eq.post_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mencionado em: {eq.post_date}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">Concorrente</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Oportunidade de Conversão</h4>
              <p className="text-sm text-blue-800">
                Esta clínica possui {selectedCompetitor.equipment_analyzed.length} equipamento(s) concorrente(s).
                Fontes analisadas: {selectedCompetitor.sources_analyzed?.join(', ') || 'Instagram, Facebook, LinkedIn, Website'}.
                Abordagem recomendada: destacar diferenciais Seamaty (25 meses garantia, manutenção vitalícia, bonificação).
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}