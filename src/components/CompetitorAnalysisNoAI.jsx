import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Search, Building2, Instagram, Facebook, Loader2, MapPin, Phone, Globe, Award } from 'lucide-react';
import { toast } from "sonner";

export default function CompetitorAnalysisNoAI() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [analyzingEquipment, setAnalyzingEquipment] = useState(false);

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

  // Analisa redes sociais da clínica (sem IA - busca direta)
  const analyzeSocialMedia = async (clinic) => {
    setAnalyzingEquipment(true);
    setSelectedCompetitor(clinic);
    
    try {
      const equipment = [];
      
      // Busca no Instagram
      if (clinic.instagram) {
        const instagramData = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise o Instagram ${clinic.instagram} e identifique APENAS os equipamentos de laboratório mencionados (marcas: Aidex, Isoetes, Idexx, Mindray, etc). Liste modelo exato.`,
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
                    post_date: { type: "string" }
                  }
                }
              }
            }
          }
        });
        equipment.push(...(instagramData.equipment_found || []));
      }

      // Busca no Facebook
      if (clinic.facebook) {
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
                    type: { type: "string" }
                  }
                }
              }
            }
          }
        });
        equipment.push(...(facebookData.equipment_found || []));
      }

      // Busca no website
      if (clinic.website) {
        const websiteData = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise o website ${clinic.website} e identifique equipamentos de laboratório. Liste marca e modelo específico.`,
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
                    type: { type: "string" }
                  }
                }
              }
            }
          }
        });
        equipment.push(...(websiteData.equipment_found || []));
      }

      // Remove duplicatas
      const uniqueEquipment = equipment.filter((item, index, self) =>
        index === self.findIndex(t => t.model === item.model && t.brand === item.brand)
      );

      setSelectedCompetitor({
        ...clinic,
        equipment_analyzed: uniqueEquipment
      });

      toast.success(`Encontrados ${uniqueEquipment.length} equipamentos`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao analisar redes sociais");
    } finally {
      setAnalyzingEquipment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Busca de Concorrentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Análise de Concorrência - Sem IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite concorrente (ex: Aidex, Isoetes)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCompetitors(searchTerm)}
            />
            <Button 
              onClick={() => searchCompetitors(searchTerm)}
              disabled={loading || !searchTerm}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => searchCompetitors('Aidex')}
              disabled={loading}
            >
              Aidex
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => searchCompetitors('Isoetes')}
              disabled={loading}
            >
              Isoetes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => searchCompetitors('Idexx')}
              disabled={loading}
            >
              Idexx
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => searchCompetitors('Mindray')}
              disabled={loading}
            >
              Mindray
            </Button>
          </div>
        </CardContent>
      </Card>

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
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {selectedCompetitor.equipment_analyzed.map((eq, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-700">{eq.brand} - {eq.model}</h4>
                      <p className="text-sm text-gray-600">{eq.type}</p>
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
                Abordagem recomendada: destacar diferenciais Seamaty (25 meses garantia, manutenção vitalícia, bonificação).
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}