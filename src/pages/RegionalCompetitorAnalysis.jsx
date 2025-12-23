import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';

const REGIONS = [
  {
    name: "Nathan (Laranja)",
    color: "#ff6b35",
    cities: ["Marília", "Presidente Prudente", "Assis", "Tupã", "Adamantina", "Bauru", "Araçatuba", "Ourinhos", "Dracena", "Lins"]
  },
  {
    name: "Jaú/Botucatu (Verde)",
    color: "#4ecdc4",
    cities: ["Jaú", "Botucatu", "São Manuel", "Dois Córregos", "Lençóis Paulista", "Bariri", "Barra Bonita"]
  },
  {
    name: "Interior Oeste (Azul)",
    color: "#3b82f6",
    cities: ["São José do Rio Preto", "Araçatuba", "Andradina", "Birigui"]
  }
];

const CITY_COORDS = {
  "Marília": [-22.2139, -49.9461],
  "Presidente Prudente": [-22.1256, -51.3889],
  "Assis": [-22.6611, -50.4122],
  "Bauru": [-22.3149, -49.0608],
  "Jaú": [-22.2961, -48.5578],
  "Botucatu": [-22.8858, -48.4450],
  "São Manuel": [-22.7306, -48.5703],
  "Araçatuba": [-21.2089, -50.4328],
  "Lençóis Paulista": [-22.5989, -48.8003]
};

export default function RegionalCompetitorAnalysis() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCompetitors = async () => {
    setAnalyzing(true);
    toast.info('🔍 Buscando dados dos concorrentes...');

    try {
      // IA 1: Identificar concorrentes por região
      const competitorResearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Pesquise e identifique os principais concorrentes de equipamentos veterinários (analisadores hematológicos, bioquímicos) nas seguintes regiões do interior de São Paulo:

REGIÕES:
${REGIONS.map(r => `${r.name}: ${r.cities.join(', ')}`).join('\n')}

Para cada região, identifique:
1. Principais distribuidores/representantes de equipamentos veterinários
2. Marcas mais vendidas (ex: Mindray, Sysmex, Idexx, etc)
3. Estimativa de equipamentos instalados
4. Pontos fortes dos concorrentes
5. Estratégias de venda utilizadas

Use dados de mercado, tendências e pesquisa online.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            regions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region_name: { type: "string" },
                  main_competitor: { type: "string" },
                  competitor_brands: { type: "array", items: { type: "string" } },
                  estimated_installations: { type: "number" },
                  market_share: { type: "string" },
                  competitor_strengths: { type: "array", items: { type: "string" } },
                  competitor_weaknesses: { type: "array", items: { type: "string" } },
                  sales_strategy: { type: "string" }
                }
              }
            }
          }
        }
      });

      toast.info('💼 Analisando equipamentos dos concorrentes...');

      // IA 2: Comparar equipamentos
      const equipmentComparison = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise e compare os principais equipamentos veterinários dos concorrentes com os nossos:

CONCORRENTES IDENTIFICADOS:
${JSON.stringify(competitorResearch.regions, null, 2)}

NOSSOS EQUIPAMENTOS (buscar especificações online):
- Analisadores hematológicos
- Analisadores bioquímicos
- Equipamentos de diagnóstico veterinário

Compare:
1. Especificações técnicas
2. Preço médio de mercado
3. Diferenciais tecnológicos
4. Suporte e manutenção
5. Custo-benefício

Identifique nossos DIFERENCIAIS COMPETITIVOS.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            our_advantages: { type: "array", items: { type: "string" } },
            competitor_advantages: { type: "array", items: { type: "string" } },
            price_positioning: { type: "string" },
            technology_comparison: { type: "string" },
            market_opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      toast.info('🎯 Criando estratégia de contra-ataque...');

      // IA 3: Estratégia de contra-ataque
      const strategy = await base44.integrations.Core.InvokeLLM({
        prompt: `Com base na análise de concorrentes, crie uma estratégia de vendas para cada região:

ANÁLISE DE CONCORRENTES:
${JSON.stringify(competitorResearch.regions, null, 2)}

NOSSOS DIFERENCIAIS:
${JSON.stringify(equipmentComparison, null, 2)}

Para cada região, defina:
1. Mensagem-chave para vencer concorrentes
2. Argumentos de venda específicos
3. Promoções/ofertas recomendadas
4. Pontos de ataque nas fraquezas dos concorrentes
5. Clientes-alvo prioritários`,
        response_json_schema: {
          type: "object",
          properties: {
            regional_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  key_message: { type: "string" },
                  sales_arguments: { type: "array", items: { type: "string" } },
                  recommended_offers: { type: "string" },
                  target_clients: { type: "string" },
                  attack_points: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setAnalysis({
        competitors: competitorResearch.regions,
        comparison: equipmentComparison,
        strategies: strategy.regional_strategies
      });

      toast.success('✅ Análise completa!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar concorrentes');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-6 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold mb-2">Análise de Concorrentes</h1>
        <p className="text-red-100 text-sm">Mapeamento Regional e Estratégia</p>
      </div>

      <div className="p-6 space-y-6">
        {!analysis ? (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Análise Multi-IA</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Sistema de inteligência competitiva
                </p>
                <div className="text-xs text-slate-500 space-y-1 text-left">
                  <p>🤖 IA 1: Identificação de concorrentes por região</p>
                  <p>🤖 IA 2: Comparação técnica de equipamentos</p>
                  <p>🤖 IA 3: Estratégia de contra-ataque</p>
                </div>
              </div>
              <Button
                onClick={analyzeCompetitors}
                disabled={analyzing}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600"
              >
                {analyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Analisar Concorrentes
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Mapa */}
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mapa de Concorrentes por Região
              </h3>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[-22.5, -49.5]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {analysis.competitors.map((region, idx) => {
                    const regionData = REGIONS.find(r => r.name.includes(region.region_name.split(' ')[0]));
                    return regionData?.cities.map(city => {
                      const coords = CITY_COORDS[city];
                      if (!coords) return null;
                      
                      return (
                        <CircleMarker
                          key={`${city}-${idx}`}
                          center={coords}
                          radius={Math.sqrt(region.estimated_installations || 10) * 3}
                          fillColor={regionData.color}
                          fillOpacity={0.6}
                          color="#fff"
                          weight={2}
                        >
                          <Popup>
                            <div className="p-2">
                              <p className="font-bold">{city}</p>
                              <p className="text-sm">{region.main_competitor}</p>
                              <p className="text-xs text-slate-600">
                                ~{region.estimated_installations} instalações
                              </p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    });
                  })}
                </MapContainer>
              </div>
            </Card>

            {/* Concorrentes por Região */}
            {analysis.competitors.map((region, idx) => (
              <Card key={idx} className="p-5 border-l-4" style={{ borderLeftColor: REGIONS[idx]?.color }}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: REGIONS[idx]?.color }} />
                  {region.region_name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">🏢 Principal Concorrente:</p>
                    <p className="text-lg font-bold text-red-600">{region.main_competitor}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">📦 Marcas Vendidas:</p>
                    <div className="flex flex-wrap gap-2">
                      {region.competitor_brands.map((brand, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-slate-600 mb-1">Instalações</p>
                      <p className="text-2xl font-bold text-red-600">~{region.estimated_installations}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-slate-600 mb-1">Market Share</p>
                      <p className="text-lg font-bold text-orange-600">{region.market_share}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-2">✅ Forças do Concorrente:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {region.competitor_strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Fraquezas do Concorrente:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {region.competitor_weaknesses.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-700 mb-1">📊 Estratégia de Vendas Deles:</p>
                    <p className="text-sm text-blue-600">{region.sales_strategy}</p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Comparação de Equipamentos */}
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="font-bold text-lg text-green-800 mb-4">💪 Nossos Diferenciais</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-2">✅ Vantagens:</p>
                  <ul className="space-y-2">
                    {analysis.comparison.our_advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-600">
                        <span className="text-green-500">▶</span>
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-slate-700 mb-1">💰 Posicionamento de Preço:</p>
                  <p className="text-sm text-slate-600">{analysis.comparison.price_positioning}</p>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-slate-700 mb-1">🔬 Comparação Tecnológica:</p>
                  <p className="text-sm text-slate-600">{analysis.comparison.technology_comparison}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-700 mb-2">🎯 Oportunidades de Mercado:</p>
                  <ul className="space-y-1">
                    {analysis.comparison.market_opportunities.map((opp, i) => (
                      <li key={i} className="text-sm text-emerald-600">• {opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Estratégias por Região */}
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Estratégias de Contra-Ataque
              </h2>

              {analysis.strategies.map((strategy, idx) => (
                <Card key={idx} className="p-5 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="font-bold text-purple-800 mb-3">{strategy.region}</h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm font-semibold text-purple-700 mb-1">💬 Mensagem-Chave:</p>
                      <p className="text-sm text-purple-600 italic">"{strategy.key_message}"</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">🎯 Argumentos de Venda:</p>
                      <ul className="space-y-1">
                        {strategy.sales_arguments.map((arg, i) => (
                          <li key={i} className="text-sm text-slate-600">• {arg}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-700 mb-1">🎁 Ofertas Recomendadas:</p>
                      <p className="text-sm text-yellow-600">{strategy.recommended_offers}</p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-700 mb-1">👥 Clientes-Alvo:</p>
                      <p className="text-sm text-blue-600">{strategy.target_clients}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Pontos de Ataque:
                      </p>
                      <ul className="space-y-1">
                        {strategy.attack_points.map((point, i) => (
                          <li key={i} className="text-sm text-red-600">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Regenerate */}
            <Button
              onClick={analyzeCompetitors}
              disabled={analyzing}
              variant="outline"
              className="w-full"
            >
              🔄 Atualizar Análise
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}