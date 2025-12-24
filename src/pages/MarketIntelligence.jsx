import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, Building2, CheckCircle, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONS = [
  {
    name: "Nathan (Laranja)",
    cities: ["Marília", "Presidente Prudente", "Assis", "Tupã", "Adamantina", "Bauru", "Araçatuba", "Ourinhos", "Dracena", "Lins"]
  },
  {
    name: "Jaú/Botucatu (Verde)",
    cities: ["Jaú", "Botucatu", "São Manuel", "Dois Córregos", "Lençóis Paulista", "Bariri", "Barra Bonita"]
  },
  {
    name: "Interior Oeste (Azul)",
    cities: ["São José do Rio Preto", "Araçatuba", "Andradina", "Birigui"]
  }
];

export default function MarketIntelligence() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [searchMode, setSearchMode] = useState('region'); // 'region' ou 'radius'
  const [customAddress, setCustomAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(30); // km
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const toggleCity = (city) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const selectAllCities = () => {
    const region = REGIONS.find(r => r.name === selectedRegion);
    if (region) setSelectedCities(region.cities);
  };

  const analyzeMarket = async () => {
    let citiesToAnalyze = [];
    
    if (searchMode === 'region') {
      if (selectedCities.length === 0) {
        toast.error('Selecione pelo menos uma cidade');
        return;
      }
      citiesToAnalyze = selectedCities;
    } else if (searchMode === 'radius') {
      if (!customAddress) {
        toast.error('Digite um endereço para busca por raio');
        return;
      }
      // IA vai descobrir as cidades dentro do raio
      citiesToAnalyze = []; // Será preenchido pela IA
    }

    setAnalyzing(true);
    
    try {
      toast.info('🔍 Etapa 1/4: Coletando dados populacionais do IBGE...');

      let searchPrompt = '';
      if (searchMode === 'radius') {
        searchPrompt = `Você é um especialista em análise geográfica veterinária. Sua missão:

**ENDEREÇO BASE:** ${customAddress}
**RAIO DE BUSCA:** ${searchRadius}km

ETAPAS OBRIGATÓRIAS:
1. Identifique a latitude e longitude EXATA do endereço base
2. Calcule TODAS as cidades dentro do raio de ${searchRadius}km usando distância geodésica
3. Liste cada cidade encontrada com sua distância exata do ponto central
4. Para cada cidade, busque dados do IBGE 2024

IMPORTANTE: Seja PRECISO na identificação geográfica. Use cálculo de distância real entre coordenadas.`;
      } else {
        searchPrompt = `Busque dados EXATOS do IBGE 2024 para estas cidades: ${citiesToAnalyze.join(', ')}`;
      }

      // IA 1: DADOS DEMOGRÁFICOS E IBGE DE TODAS AS CIDADES
      const demographicData = await base44.integrations.Core.InvokeLLM({
        prompt: `${searchPrompt}.

PARA CADA CIDADE, OBRIGATORIAMENTE:
1. População total atualizada (IBGE 2024)
2. Número de estabelecimentos veterinários registrados no CNAE (IBGE)
3. PIB per capita
4. Área urbana

ANÁLISE ESTATÍSTICA:
- Calcule: a cada 5.000 habitantes = 1 clínica veterinária esperada
- Compare: clínicas esperadas vs clínicas registradas no IBGE
- Identifique cidades saturadas ou com oportunidades

NÃO PULE NENHUMA CIDADE. Se não encontrar dados, indique como "não disponível".`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            center_coordinates: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
                address: { type: "string" }
              }
            },
            cities_complete_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  distance_km: { type: "number" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  population: { type: "number" },
                  veterinary_establishments_ibge: { type: "number" },
                  expected_clinics_by_population: { type: "number" },
                  market_saturation: { type: "string" },
                  pib_per_capita: { type: "number" },
                  opportunity_level: { type: "string" }
                }
              }
            },
            region_summary: {
              type: "object",
              properties: {
                total_population: { type: "number" },
                total_establishments_ibge: { type: "number" },
                expected_clinics_total: { type: "number" },
                market_gap: { type: "number" }
              }
            }
          }
        }
      });

      toast.info('🏥 Etapa 2/4: Mapeando TODAS as clínicas veterinárias da região...');
      
      const discoveredCities = demographicData.cities_complete_data?.map(c => c.city) || citiesToAnalyze;
      
      // IA 2: BUSCA COMPLETA DE CLÍNICAS - CIDADE POR CIDADE OU POR RAIO
      let clinicSearchPrompt = '';
      if (searchMode === 'radius' && demographicData.center_coordinates) {
        clinicSearchPrompt = `Você é um especialista em mapeamento veterinário. Sua missão:

**BUSCA POR RAIO GEOGRÁFICO:**
- Centro: ${customAddress} (${demographicData.center_coordinates.latitude}, ${demographicData.center_coordinates.longitude})
- Raio: ${searchRadius}km

ETAPAS OBRIGATÓRIAS:
1. Busque TODAS as clínicas veterinárias dentro do raio de ${searchRadius}km do ponto central
2. Para cada clínica, calcule a distância EXATA do centro em km
3. Inclua OBRIGATORIAMENTE as coordenadas (latitude, longitude) de cada clínica
4. Liste endereço completo, telefone, email se disponível
5. Classifique cada clínica`;
      } else {
        clinicSearchPrompt = `Faça uma busca EXAUSTIVA e COMPLETA de clínicas veterinárias em TODAS estas cidades: ${discoveredCities.join(', ')}.

PARA CADA CIDADE:
1. Busque no Google Maps, Google Business, redes sociais, diretórios veterinários
2. Liste TODAS as clínicas encontradas (nome, endereço, telefone, email)
3. INCLUA as coordenadas geográficas (latitude, longitude) de cada clínica
4. Classifique cada clínica`;
      }

      const clinicsSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `${clinicSearchPrompt}:
   - "clinica_pequena": até 2 veterinários, atendimento básico
   - "clinica_media": 3-10 veterinários, atendimentos gerais
   - "hospital_veterinario": 10+ veterinários, especialidades, internação
   - "veterinario_autonomo": atendimento domiciliar sem estrutura fixa

DADOS DEMOGRÁFICOS PARA CONTEXTO:
${JSON.stringify(demographicData.cities_complete_data, null, 2)}

Compare o número de clínicas encontradas com os dados do IBGE. Se encontrar menos clínicas do que o IBGE indica, continue buscando.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinics_by_city: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  clinics_found: { type: "number" },
                  clinics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        address: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        distance_from_center_km: { type: "number" },
                        phone: { type: "string" },
                        email: { type: "string" },
                        classification: { type: "string" },
                        staff_size: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            classification_summary: {
              type: "object",
              properties: {
                total_clinics: { type: "number" },
                clinica_pequena: { type: "number" },
                clinica_media: { type: "number" },
                hospital_veterinario: { type: "number" },
                veterinario_autonomo: { type: "number" }
              }
            },
            total_clinics_found: { type: "number" },
            clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  distance_from_center_km: { type: "number" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  classification: { 
                    type: "string",
                    enum: ["clinica_pequena", "clinica_media", "hospital_veterinario", "veterinario_autonomo"]
                  },
                  staff_size: { type: "string" }
                }
              }
            }
          }
        }
      });

      toast.info('🔬 Etapa 3/4: Identificando equipamentos instalados...');
      
      // Flatten all clinics from all cities
      const allClinics = clinicsSearch.clinics_by_city?.flatMap(city => 
        city.clinics.map(clinic => ({ ...clinic, city: city.city }))
      ) || clinicsSearch.clinics || [];
      
      // IA 3: Identificar equipamentos instalados
      const equipmentAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise PROFUNDAMENTE cada clínica e identifique equipamentos instalados:

CLÍNICAS (${allClinics.length} no total):
${JSON.stringify(allClinics, null, 2)}

Para cada clínica, pesquise e identifique:
1. Tem equipamento SEAMATY instalado? (sim/não)
2. CONCORRENTES - Tem equipamento IDEXX instalado? (sim/não)
3. CONCORRENTES - Tem equipamento ZOETIS instalado? (sim/não)
4. Tem analisador hematológico (hemograma)? (marca/modelo se possível)
5. Outras marcas de equipamentos identificadas

Use busca online, redes sociais, sites das clínicas, fornecedores, posts em grupos veterinários.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            seamaty_count: { type: "number" },
            idexx_count: { type: "number" },
            zoetis_count: { type: "number" },
            hemograma_count: { type: "number" },
            market_share_summary: { type: "string" },
            statistical_comparison: {
              type: "object",
              properties: {
                seamaty_market_share_percent: { type: "number" },
                idexx_market_share_percent: { type: "number" },
                zoetis_market_share_percent: { type: "number" },
                seamaty_vs_idexx_comparison: { type: "string" },
                seamaty_vs_zoetis_comparison: { type: "string" },
                market_leader: { type: "string" }
              }
            },
            clinics_with_equipment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  has_seamaty: { type: "boolean" },
                  has_idexx: { type: "boolean" },
                  has_zoetis: { type: "boolean" },
                  has_hemograma: { type: "boolean" },
                  hemograma_brand: { type: "string" },
                  other_equipment: { type: "array", items: { type: "string" } },
                  confidence_level: { type: "string" }
                }
              }
            }
          }
        }
      });

      toast.info('🎯 Etapa 4/4: Scoring de leads com IA...');
      
      // IA 4: Lead Scoring e Análise de Oportunidades
      const opportunities = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em qualificação de leads veterinários. Analise TODOS os dados e atribua um LEAD SCORE (0-100) para cada clínica.

DADOS DEMOGRÁFICOS: ${JSON.stringify(demographicData, null, 2)}
CLÍNICAS POR CIDADE: ${JSON.stringify(clinicsSearch, null, 2)}
EQUIPAMENTOS: ${JSON.stringify(equipmentAnalysis, null, 2)}

CRITÉRIOS DE SCORING (0-100):
1. **Ausência de Equipamento** (30 pontos): Sem hemograma = 30, Com concorrente = 10, Com SEAMATY = 0
2. **Tamanho da Clínica** (25 pontos): Hospital = 25, Média = 15, Pequena = 8, Autônomo = 3
3. **Demografia Local** (20 pontos): Cidade com gap de mercado = 20, Saturada = 5
4. **Potencial de Receita** (15 pontos): PIB per capita alto + população grande = 15
5. **Acessibilidade** (10 pontos): Distância do centro (se raio) ou facilidade logística

PARA CADA CLÍNICA:
- Calcule o lead score (0-100)
- Classifique: 🔥 HOT (80-100), ⭐ WARM (60-79), 💡 COLD (0-59)
- Explique brevemente o score
- Sugira abordagem ideal

Priorize clínicas SEM equipamento, hospitais grandes, e regiões com gap de mercado.`,
        response_json_schema: {
          type: "object",
          properties: {
            scored_leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  lead_score: { type: "number" },
                  score_category: { type: "string", enum: ["HOT", "WARM", "COLD"] },
                  score_explanation: { type: "string" },
                  opportunity_type: { type: "string" },
                  estimated_value: { type: "string" },
                  recommended_approach: { type: "string" },
                  priority_rank: { type: "number" }
                }
              }
            },
            scoring_summary: {
              type: "object",
              properties: {
                total_leads: { type: "number" },
                hot_leads: { type: "number" },
                warm_leads: { type: "number" },
                cold_leads: { type: "number" },
                avg_score: { type: "number" },
                total_pipeline_value: { type: "string" }
              }
            }
          }
        }
      });

      setResults({
        region: searchMode === 'region' ? `Cidades Selecionadas (${citiesToAnalyze.length})` : `Raio ${searchRadius}km de ${customAddress}`,
        searchMode,
        searchRadius,
        centerCoordinates: demographicData.center_coordinates,
        demographicData,
        clinics: clinicsSearch,
        equipment: equipmentAnalysis,
        opportunities
      });

      toast.success('✅ Análise completa!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar mercado');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-6 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold mb-2">Inteligência de Mercado</h1>
        <p className="text-blue-100 text-sm">Análise completa da região via Google</p>
      </div>

      <div className="p-6 space-y-6">
        {!results ? (
          <Card className="p-6">
            <div className="space-y-6">
              {/* Modo de Busca */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Modo de Busca</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={searchMode === 'region' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('region')}
                    className="h-auto py-4"
                  >
                    <div className="text-left">
                      <p className="font-semibold">Por Região</p>
                      <p className="text-xs opacity-80">Selecione cidades específicas</p>
                    </div>
                  </Button>
                  <Button
                    variant={searchMode === 'radius' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('radius')}
                    className="h-auto py-4"
                  >
                    <div className="text-left">
                      <p className="font-semibold">Por Raio</p>
                      <p className="text-xs opacity-80">Endereço + distância</p>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Busca por Região */}
              {searchMode === 'region' && (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Selecione a região base</h3>
                    <Select value={selectedRegion} onValueChange={(val) => {
                      setSelectedRegion(val);
                      setSelectedCities([]);
                    }}>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue placeholder="Escolha a região" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region.name} value={region.name}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRegion && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-base">Selecione as cidades ({selectedCities.length})</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllCities}
                          className="text-xs"
                        >
                          Todas
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                        {REGIONS.find(r => r.name === selectedRegion)?.cities.map((city) => (
                          <button
                            key={city}
                            onClick={() => toggleCity(city)}
                            className={`p-2 rounded-lg text-sm text-left transition-all ${
                              selectedCities.includes(city)
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'bg-white border hover:border-indigo-300'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Busca por Raio */}
              {searchMode === 'radius' && (
                <>
                  <div>
                    <h3 className="font-semibold text-base mb-2">Endereço Central</h3>
                    <Input
                      placeholder="Ex: Rua das Flores, 123 - Marília/SP"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2">Raio de Busca: {searchRadius}km</h3>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>10km</span>
                      <span>200km</span>
                    </div>
                  </div>
                </>
              )}

              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-3">O que vamos descobrir:</h4>
                <div className="space-y-2 text-sm text-indigo-700">
                  <p>📊 <strong>Etapa 1:</strong> Dados demográficos do IBGE de TODAS as cidades</p>
                  <p>📊 <strong>Média:</strong> 1 clínica a cada 5.000 habitantes</p>
                  <p>🏥 <strong>Etapa 2:</strong> Busca completa cidade por cidade</p>
                  <p>✅ <strong>Etapa 3:</strong> Identificação de SEAMATY</p>
                  <p>⚠️ <strong>Concorrentes:</strong> IDEXX e Zoetis com market share</p>
                  <p>🎯 <strong>Etapa 4:</strong> Oportunidades prioritárias</p>
                </div>
              </div>

              <Button
                onClick={analyzeMarket}
                disabled={
                  (searchMode === 'region' && selectedCities.length === 0) ||
                  (searchMode === 'radius' && !customAddress) ||
                  analyzing
                }
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analisando... (pode levar 1-2 min)
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    {searchMode === 'region' 
                      ? `Analisar ${selectedCities.length} cidade(s)` 
                      : `Analisar raio de ${searchRadius}km`}
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Dados Demográficos Completos */}
            {results.demographicData && (
              <>
                <Card className="p-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                 <h3 className="font-bold text-xl mb-4">📊 Análise Demográfica Completa - {results.region}</h3>

                 {results.searchMode === 'radius' && results.centerCoordinates && (
                   <div className="mb-4 p-3 bg-white/10 rounded-lg">
                     <p className="text-sm font-semibold mb-1">📍 Centro da Busca:</p>
                     <p className="text-xs opacity-90">{results.centerCoordinates.address}</p>
                     <p className="text-xs opacity-75">
                       Lat: {results.centerCoordinates.latitude.toFixed(6)}, Lng: {results.centerCoordinates.longitude.toFixed(6)}
                     </p>
                     <p className="text-xs opacity-75 mt-1">Raio: {results.searchRadius}km</p>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="p-3 bg-white/20 rounded-lg">
                     <p className="text-xs opacity-90">População Total</p>
                     <p className="text-2xl font-bold">{results.demographicData.region_summary?.total_population?.toLocaleString() || 0}</p>
                   </div>
                   <div className="p-3 bg-white/20 rounded-lg">
                     <p className="text-xs opacity-90">Estabelecimentos IBGE</p>
                     <p className="text-2xl font-bold">{results.demographicData.region_summary?.total_establishments_ibge || 0}</p>
                   </div>
                   <div className="p-3 bg-white/20 rounded-lg">
                     <p className="text-xs opacity-90">Clínicas Esperadas (5k hab)</p>
                     <p className="text-2xl font-bold">{results.demographicData.region_summary?.expected_clinics_total || 0}</p>
                   </div>
                   <div className="p-3 bg-white/20 rounded-lg">
                     <p className="text-xs opacity-90">Gap de Mercado</p>
                     <p className="text-2xl font-bold">{results.demographicData.region_summary?.market_gap || 0}</p>
                   </div>
                 </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.demographicData.cities_complete_data?.map((city, idx) => (
                      <div key={idx} className="p-3 bg-white/10 rounded-lg text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-base">{city.city}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            city.opportunity_level === 'alta' ? 'bg-red-200 text-red-800' :
                            city.opportunity_level === 'media' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {city.opportunity_level}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs opacity-90">
                          <div>
                            <p>👥 População: {city.population?.toLocaleString()}</p>
                            <p>🏥 IBGE: {city.veterinary_establishments} clínicas</p>
                            {city.distance_km && <p>📍 Distância: {city.distance_km.toFixed(1)}km</p>}
                          </div>
                          <div>
                            <p>📊 Esperado: {city.expected_clinics_by_population} clínicas</p>
                            <p className="font-semibold">{city.market_saturation}</p>
                          </div>
                        </div>
                        {city.pib_per_capita && (
                          <p className="text-xs opacity-75 mt-1">💰 PIB per capita: R$ {city.pib_per_capita?.toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Clínicas por Cidade */}
                {results.clinics.clinics_by_city && (
                  <Card className="p-5 bg-white">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">🏥 Clínicas Encontradas por Cidade</h3>
                    <div className="space-y-3">
                      {results.clinics.clinics_by_city.map((cityData, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-800">{cityData.city}</h4>
                            <span className="text-sm text-slate-600">{cityData.clinics_found} clínicas</span>
                          </div>
                          <div className="space-y-1">
                            {cityData.clinics.map((clinic, cidx) => {
                              const classLabels = {
                                clinica_pequena: { text: 'Pequena', color: 'bg-blue-100 text-blue-700' },
                                clinica_media: { text: 'Média', color: 'bg-purple-100 text-purple-700' },
                                hospital_veterinario: { text: 'Hospital', color: 'bg-red-100 text-red-700' },
                                veterinario_autonomo: { text: 'Autônomo', color: 'bg-green-100 text-green-700' }
                              };
                              const classInfo = classLabels[clinic.classification] || { text: 'N/A', color: 'bg-gray-100 text-gray-700' };
                              
                              return (
                                <div key={cidx} className="text-xs p-2 bg-slate-50 rounded flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800">{clinic.name}</p>
                                    <p className="text-slate-500">{clinic.address}</p>
                                    {clinic.distance_from_center_km && (
                                      <p className="text-blue-600">📍 {clinic.distance_from_center_km.toFixed(1)}km do centro</p>
                                    )}
                                    {clinic.phone && <p className="text-green-600">{clinic.phone}</p>}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded ${classInfo.color} ml-2`}>
                                    {classInfo.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Classificação de Clínicas */}
            {results.clinics.classification_summary && (
              <Card className="p-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h3 className="font-bold text-xl mb-4">🏥 Classificação por Tipo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/20 rounded-lg col-span-2">
                    <p className="text-sm opacity-90">Total Encontrado</p>
                    <p className="text-4xl font-bold">{results.clinics.classification_summary.total_clinics}</p>
                    <p className="text-xs opacity-75 mt-1">em {results.demographicData?.cities_complete_data?.length || 0} cidades</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Clínicas Pequenas</p>
                    <p className="text-2xl font-bold">{results.clinics.classification_summary.clinica_pequena}</p>
                    <p className="text-xs opacity-75 mt-1">até 2 veterinários</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Clínicas Médias</p>
                    <p className="text-2xl font-bold">{results.clinics.classification_summary.clinica_media}</p>
                    <p className="text-xs opacity-75 mt-1">3-10 veterinários</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Hospitais Veterinários</p>
                    <p className="text-2xl font-bold">{results.clinics.classification_summary.hospital_veterinario}</p>
                    <p className="text-xs opacity-75 mt-1">10+ veterinários</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Veterinários Autônomos</p>
                    <p className="text-2xl font-bold">{results.clinics.classification_summary.veterinario_autonomo}</p>
                    <p className="text-xs opacity-75 mt-1">domiciliar</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Resumo Geral */}
            <Card className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="font-bold text-xl mb-4">🔬 Equipamentos Instalados</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-sm opacity-90">Clínicas Analisadas</p>
                  <p className="text-3xl font-bold">{results.clinics.classification_summary?.total_clinics || 0}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-sm opacity-90">Com Hemograma</p>
                  <p className="text-3xl font-bold">{results.equipment.hemograma_count}</p>
                </div>
                <div className="p-3 bg-green-400/30 rounded-lg">
                  <p className="text-sm opacity-90">✅ SEAMATY</p>
                  <p className="text-3xl font-bold">{results.equipment.seamaty_count}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-sm opacity-90">🎯 Oportunidades</p>
                  <p className="text-3xl font-bold">{(results.clinics.classification_summary?.total_clinics || 0) - results.equipment.seamaty_count - results.equipment.idexx_count - results.equipment.zoetis_count}</p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <p className="text-sm opacity-90">⚠️ IDEXX</p>
                  <p className="text-3xl font-bold">{results.equipment.idexx_count}</p>
                </div>
                <div className="p-3 bg-orange-400/30 rounded-lg">
                  <p className="text-sm opacity-90">⚠️ Zoetis</p>
                  <p className="text-3xl font-bold">{results.equipment.zoetis_count}</p>
                </div>
              </div>
            </Card>

            {/* Comparação Estatística */}
            {results.equipment.statistical_comparison && (
              <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="font-bold text-lg text-green-800 mb-4">📊 Comparação Estatística</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-center">
                    <p className="text-xs text-green-700 mb-1">SEAMATY</p>
                    <p className="text-3xl font-bold text-green-800">
                      {results.equipment.statistical_comparison.seamaty_market_share_percent}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">Market Share</p>
                  </div>
                  
                  <div className="p-3 bg-red-100 rounded-lg text-center">
                    <p className="text-xs text-red-700 mb-1">IDEXX</p>
                    <p className="text-3xl font-bold text-red-800">
                      {results.equipment.statistical_comparison.idexx_market_share_percent}%
                    </p>
                    <p className="text-xs text-red-600 mt-1">Market Share</p>
                  </div>
                  
                  <div className="p-3 bg-orange-100 rounded-lg text-center">
                    <p className="text-xs text-orange-700 mb-1">Zoetis</p>
                    <p className="text-3xl font-bold text-orange-800">
                      {results.equipment.statistical_comparison.zoetis_market_share_percent}%
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Market Share</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-semibold text-slate-800 mb-1">SEAMATY vs IDEXX:</p>
                    <p className="text-sm text-slate-600">{results.equipment.statistical_comparison.seamaty_vs_idexx_comparison}</p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-semibold text-slate-800 mb-1">SEAMATY vs Zoetis:</p>
                    <p className="text-sm text-slate-600">{results.equipment.statistical_comparison.seamaty_vs_zoetis_comparison}</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-1">🏆 Líder de Mercado:</p>
                    <p className="text-sm font-bold text-amber-900">{results.equipment.statistical_comparison.market_leader}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Lead Scoring Summary */}
            {results.opportunities.scoring_summary && (
              <Card className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <h3 className="font-bold text-xl mb-4">📊 Resumo de Lead Scoring</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Total de Leads</p>
                    <p className="text-3xl font-bold">{results.opportunities.scoring_summary.total_leads}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <p className="text-xs opacity-90">Score Médio</p>
                    <p className="text-3xl font-bold">{results.opportunities.scoring_summary.avg_score}</p>
                  </div>
                  <div className="p-3 bg-red-400/30 rounded-lg">
                    <p className="text-xs opacity-90">🔥 HOT Leads (80-100)</p>
                    <p className="text-3xl font-bold">{results.opportunities.scoring_summary.hot_leads}</p>
                  </div>
                  <div className="p-3 bg-yellow-400/30 rounded-lg">
                    <p className="text-xs opacity-90">⭐ WARM Leads (60-79)</p>
                    <p className="text-3xl font-bold">{results.opportunities.scoring_summary.warm_leads}</p>
                  </div>
                </div>
                {results.opportunities.scoring_summary.total_pipeline_value && (
                  <div className="p-3 bg-green-400/30 rounded-lg text-center">
                    <p className="text-sm opacity-90">Pipeline Estimado</p>
                    <p className="text-2xl font-bold">{results.opportunities.scoring_summary.total_pipeline_value}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Leads Ranqueados por Score */}
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="font-bold text-lg text-green-800 mb-4">
                🎯 Leads Ranqueados por Score IA
              </h3>

              {results.opportunities.scored_leads && results.opportunities.scored_leads.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.opportunities.scored_leads
                    .sort((a, b) => b.lead_score - a.lead_score)
                    .map((lead, idx) => {
                      const categoryStyles = {
                        HOT: { bg: 'bg-red-50', border: 'border-red-500', badge: 'bg-red-500 text-white', icon: '🔥' },
                        WARM: { bg: 'bg-yellow-50', border: 'border-yellow-500', badge: 'bg-yellow-500 text-white', icon: '⭐' },
                        COLD: { bg: 'bg-blue-50', border: 'border-blue-500', badge: 'bg-blue-500 text-white', icon: '💡' }
                      };
                      const style = categoryStyles[lead.score_category] || categoryStyles.COLD;

                      return (
                        <div key={idx} className={`p-4 ${style.bg} rounded-lg border-l-4 ${style.border}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800">#{lead.priority_rank}</span>
                                <p className="font-bold text-slate-800">{lead.clinic_name}</p>
                              </div>
                              <p className="text-sm text-slate-600">{lead.city}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.badge}`}>
                                {style.icon} {lead.score_category}
                              </span>
                              <span className="text-2xl font-bold text-slate-800">{lead.lead_score}</span>
                            </div>
                          </div>

                          <div className="space-y-2 mt-3">
                            <div className="p-2 bg-white/70 rounded">
                              <p className="text-xs font-semibold text-slate-700">💡 Score:</p>
                              <p className="text-sm text-slate-600">{lead.score_explanation}</p>
                            </div>

                            <div className="p-2 bg-white/70 rounded">
                              <p className="text-xs font-semibold text-slate-700">🎯 Oportunidade:</p>
                              <p className="text-sm text-slate-600">{lead.opportunity_type}</p>
                            </div>

                            {lead.estimated_value && (
                              <div className="p-2 bg-green-100 rounded">
                                <p className="text-xs font-semibold text-green-800">💰 Valor Estimado:</p>
                                <p className="text-sm font-bold text-green-900">{lead.estimated_value}</p>
                              </div>
                            )}

                            <div className="p-2 bg-indigo-50 rounded">
                              <p className="text-xs font-semibold text-indigo-800">📋 Abordagem Recomendada:</p>
                              <p className="text-sm text-indigo-700">{lead.recommended_approach}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-green-600">Nenhum lead encontrado</p>
              )}
            </Card>

            {/* Equipamentos por Clínica */}
            <Card className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                🔬 Equipamentos Instalados por Clínica
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.equipment.clinics_with_equipment.map((clinic, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{clinic.clinic_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {clinic.city}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                        {clinic.confidence_level}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {clinic.has_seamaty && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          SEAMATY ✓
                        </span>
                      )}
                      {clinic.has_idexx && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                          IDEXX ⚠️
                        </span>
                      )}
                      {clinic.has_zoetis && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                          Zoetis ⚠️
                        </span>
                      )}
                      {clinic.has_hemograma && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Hemograma {clinic.hemograma_brand ? `(${clinic.hemograma_brand})` : '✓'}
                        </span>
                      )}
                      {clinic.other_equipment && clinic.other_equipment.length > 0 && (
                        clinic.other_equipment.map((eq, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                            {eq}
                          </span>
                        ))
                      )}
                      {!clinic.has_seamaty && !clinic.has_idexx && !clinic.has_zoetis && !clinic.has_hemograma && (
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          Sem equipamento identificado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Lista Completa de Clínicas */}
            <Card className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                🏥 Todas as Clínicas da Região ({results.clinics.total_clinics_found})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.clinics.clinics.map((clinic, idx) => {
                  const classLabels = {
                    clinica_pequena: { text: 'Pequena', color: 'bg-blue-100 text-blue-700' },
                    clinica_media: { text: 'Média', color: 'bg-purple-100 text-purple-700' },
                    hospital_veterinario: { text: 'Hospital', color: 'bg-red-100 text-red-700' },
                    veterinario_autonomo: { text: 'Autônomo', color: 'bg-green-100 text-green-700' }
                  };
                  const classInfo = classLabels[clinic.classification] || { text: 'Não classificado', color: 'bg-gray-100 text-gray-700' };
                  
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-slate-800">{clinic.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${classInfo.color}`}>
                          {classInfo.text}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{clinic.address}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">{clinic.city}</span>
                        {clinic.staff_size && <span className="text-xs text-slate-500">👥 {clinic.staff_size}</span>}
                        {clinic.phone && <span className="text-xs text-green-600">{clinic.phone}</span>}
                        {clinic.email && <span className="text-xs text-blue-600">{clinic.email}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Button
              onClick={() => setResults(null)}
              variant="outline"
              className="w-full"
            >
              🔄 Nova Análise
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}