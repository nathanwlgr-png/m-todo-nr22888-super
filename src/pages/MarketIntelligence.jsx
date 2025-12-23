import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, Building2, CheckCircle, MapPin } from 'lucide-react';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const analyzeMarket = async () => {
    if (!selectedRegion) {
      toast.error('Selecione uma região primeiro');
      return;
    }

    setAnalyzing(true);
    const region = REGIONS.find(r => r.name === selectedRegion);
    
    try {
      toast.info('🔍 Buscando dados do IBGE e clínicas veterinárias...');

      // IA 1: Buscar dados do IBGE + clínicas
      const clinicsSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Pesquise e forneça os seguintes dados para as cidades: ${region.cities.join(', ')}:

1. DADOS DO IBGE:
   - População total de cada cidade
   - Número estimado de estabelecimentos veterinários cadastrados no IBGE
   - Dados demográficos relevantes

2. CLÍNICAS VETERINÁRIAS (Google Maps/Business):
   - Liste TODAS as clínicas veterinárias cadastradas
   - Para cada clínica: nome, endereço, cidade, telefone, email

Combine dados do IBGE com busca no Google para ser completo.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ibge_data: {
              type: "object",
              properties: {
                total_establishments_ibge: { type: "number" },
                cities_data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      city: { type: "string" },
                      population: { type: "number" },
                      veterinary_establishments: { type: "number" }
                    }
                  }
                }
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
                  phone: { type: "string" },
                  email: { type: "string" }
                }
              }
            }
          }
        }
      });

      toast.info('🔬 Analisando equipamentos e concorrentes (IDEXX, Zoetis)...');

      // IA 2: Identificar equipamentos e concorrentes
      const equipmentAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise as clínicas veterinárias e identifique equipamentos instalados:

CLÍNICAS:
${JSON.stringify(clinicsSearch.clinics, null, 2)}

Para cada clínica, pesquise e identifique:
1. Tem equipamento IRIX instalado? (sim/não)
2. Tem equipamento OET instalado? (sim/não)
3. CONCORRENTES - Tem equipamento IDEXX instalado? (sim/não)
4. CONCORRENTES - Tem equipamento ZOETIS instalado? (sim/não)
5. Tem analisador hematológico (hemograma)? (marca/modelo se possível)
6. Outras marcas de equipamentos identificadas

Use busca online, redes sociais, sites das clínicas, fornecedores, posts em grupos veterinários.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            irix_count: { type: "number" },
            oet_count: { type: "number" },
            idexx_count: { type: "number" },
            zoetis_count: { type: "number" },
            hemograma_count: { type: "number" },
            market_share_summary: { type: "string" },
            clinics_with_equipment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  has_irix: { type: "boolean" },
                  has_oet: { type: "boolean" },
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

      toast.info('🎯 Identificando oportunidades de venda...');

      // IA 3: Identificar oportunidades
      const opportunities = await base44.integrations.Core.InvokeLLM({
        prompt: `Com base nos dados das clínicas e equipamentos instalados, identifique:

DADOS:
${JSON.stringify(equipmentAnalysis, null, 2)}

Identifique:
1. Clínicas SEM hemograma (oportunidade de venda)
2. Clínicas com equipamentos antigos IRIX/OET (oportunidade de upgrade)
3. Clínicas grandes sem laboratório próprio
4. Prioridade de abordagem (alta/média/baixa)

Retorne lista priorizada de oportunidades.`,
        response_json_schema: {
          type: "object",
          properties: {
            high_priority: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  opportunity_type: { type: "string" },
                  reason: { type: "string" },
                  estimated_value: { type: "string" }
                }
              }
            },
            medium_priority: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  opportunity_type: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setResults({
        region: selectedRegion,
        clinics: clinicsSearch,
        equipment: equipmentAnalysis,
        opportunities: opportunities
      });

      toast.success('✅ Análise completa!');

      // Cadastrar automaticamente as oportunidades de alta prioridade
      if (opportunities.high_priority && opportunities.high_priority.length > 0) {
        toast.info('📝 Cadastrando oportunidades prioritárias...');
        
        let registered = 0;
        for (const opp of opportunities.high_priority) {
          try {
            const clinicData = clinicsSearch.clinics.find(c => 
              c.name.toLowerCase().includes(opp.clinic_name.toLowerCase())
            );
            
            await base44.entities.Client.create({
              first_name: opp.clinic_name,
              clinic_name: opp.clinic_name,
              city: opp.city,
              address: clinicData?.address || '',
              phone: clinicData?.phone || '',
              email: clinicData?.email || '',
              decision_role: 'proprietario',
              status: 'quente',
              purchase_score: 80,
              notes: `OPORTUNIDADE: ${opp.opportunity_type}\n${opp.reason}\nValor estimado: ${opp.estimated_value || 'N/A'}`
            });
            registered++;
          } catch (error) {
            console.log('Erro ao cadastrar:', opp.clinic_name);
          }
        }
        
        if (registered > 0) {
          toast.success(`✅ ${registered} clínicas cadastradas automaticamente!`);
        }
      }

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
              <div>
                <h3 className="font-semibold text-lg mb-2">Selecione sua região</h3>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
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
                {selectedRegion && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Cidades:</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {REGIONS.find(r => r.name === selectedRegion)?.cities.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-3">O que vamos descobrir:</h4>
                <div className="space-y-2 text-sm text-indigo-700">
                  <p>📊 Dados do IBGE (população e estabelecimentos)</p>
                  <p>🏥 Todas as clínicas veterinárias (Google + IBGE)</p>
                  <p>✅ Nossos equipamentos: IRIX e OET</p>
                  <p>⚠️ Concorrentes: IDEXX e Zoetis</p>
                  <p>🩸 Quantas clínicas têm hemograma (marca/modelo)</p>
                  <p>🎯 Oportunidades prioritárias</p>
                  <p>✅ Cadastro automático no sistema</p>
                </div>
              </div>

              <Button
                onClick={analyzeMarket}
                disabled={!selectedRegion || analyzing}
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
                    Analisar Mercado Completo
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Dados IBGE */}
            {results.clinics.ibge_data && (
              <Card className="p-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <h3 className="font-bold text-xl mb-4">📊 Dados IBGE - {results.region}</h3>
                <div className="p-3 bg-white/20 rounded-lg mb-3">
                  <p className="text-sm opacity-90">Estabelecimentos Veterinários (IBGE)</p>
                  <p className="text-3xl font-bold">{results.clinics.ibge_data.total_establishments_ibge}</p>
                </div>
                <div className="space-y-2">
                  {results.clinics.ibge_data.cities_data?.map((city, idx) => (
                    <div key={idx} className="p-2 bg-white/10 rounded text-sm">
                      <p className="font-semibold">{city.city}</p>
                      <p className="text-xs opacity-90">
                        Pop: {city.population?.toLocaleString()} | Estabelecimentos: {city.veterinary_establishments}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Resumo Geral */}
            <Card className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="font-bold text-xl mb-4">🔬 Equipamentos Instalados</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-sm opacity-90">Clínicas Encontradas</p>
                  <p className="text-3xl font-bold">{results.clinics.total_clinics_found}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-sm opacity-90">Com Hemograma</p>
                  <p className="text-3xl font-bold">{results.equipment.hemograma_count}</p>
                </div>
                <div className="p-3 bg-green-400/30 rounded-lg">
                  <p className="text-sm opacity-90">✅ IRIX (Nosso)</p>
                  <p className="text-3xl font-bold">{results.equipment.irix_count}</p>
                </div>
                <div className="p-3 bg-green-400/30 rounded-lg">
                  <p className="text-sm opacity-90">✅ OET (Nosso)</p>
                  <p className="text-3xl font-bold">{results.equipment.oet_count}</p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <p className="text-sm opacity-90">⚠️ IDEXX (Concorrente)</p>
                  <p className="text-3xl font-bold">{results.equipment.idexx_count}</p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <p className="text-sm opacity-90">⚠️ Zoetis (Concorrente)</p>
                  <p className="text-3xl font-bold">{results.equipment.zoetis_count}</p>
                </div>
              </div>
              {results.equipment.market_share_summary && (
                <div className="mt-4 p-3 bg-white/20 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Market Share:</p>
                  <p className="text-xs opacity-90">{results.equipment.market_share_summary}</p>
                </div>
              )}
            </Card>

            {/* Oportunidades de Alta Prioridade */}
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="font-bold text-lg text-green-800 mb-4 flex items-center gap-2">
                🎯 Oportunidades ALTA Prioridade
                <span className="text-sm font-normal text-green-600">
                  ({results.opportunities.high_priority?.length || 0} clínicas)
                </span>
              </h3>
              
              {results.opportunities.high_priority && results.opportunities.high_priority.length > 0 ? (
                <div className="space-y-3">
                  {results.opportunities.high_priority.map((opp, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{opp.clinic_name}</p>
                          <p className="text-sm text-slate-500">{opp.city}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold text-green-700">Tipo:</span> {opp.opportunity_type}
                        </p>
                        <p className="text-sm text-slate-600">{opp.reason}</p>
                        {opp.estimated_value && (
                          <p className="text-sm font-bold text-green-700 mt-2">
                            💰 {opp.estimated_value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-700 font-semibold">
                      ✅ Essas clínicas foram cadastradas automaticamente no sistema!
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-green-600">Nenhuma oportunidade de alta prioridade identificada</p>
              )}
            </Card>

            {/* Oportunidades de Média Prioridade */}
            {results.opportunities.medium_priority && results.opportunities.medium_priority.length > 0 && (
              <Card className="p-5 bg-gradient-to-r from-yellow-50 to-amber-50">
                <h3 className="font-bold text-lg text-amber-800 mb-4">
                  ⭐ Oportunidades MÉDIA Prioridade ({results.opportunities.medium_priority.length})
                </h3>
                <div className="space-y-3">
                  {results.opportunities.medium_priority.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-amber-500">
                      <p className="font-semibold text-slate-800">{opp.clinic_name}</p>
                      <p className="text-xs text-slate-500 mb-1">{opp.city}</p>
                      <p className="text-sm text-amber-700">{opp.opportunity_type}</p>
                      <p className="text-xs text-slate-600 mt-1">{opp.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
                      {clinic.has_irix && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          IRIX ✓
                        </span>
                      )}
                      {clinic.has_oet && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          OET ✓
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
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
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
                      {!clinic.has_irix && !clinic.has_oet && !clinic.has_hemograma && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
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
                {results.clinics.clinics.map((clinic, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="font-semibold text-slate-800">{clinic.name}</p>
                    <p className="text-xs text-slate-600">{clinic.address}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-slate-500">{clinic.city}</span>
                      {clinic.phone && <span className="text-xs text-green-600">{clinic.phone}</span>}
                      {clinic.email && <span className="text-xs text-blue-600">{clinic.email}</span>}
                    </div>
                  </div>
                ))}
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