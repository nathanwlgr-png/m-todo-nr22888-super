import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, AlertTriangle, Target, DollarSign, Shield } from 'lucide-react';

export default function CompetitorAnalysisAI({ client }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCompetitors = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Você é um analista de mercado e inteligência competitiva B2B.

TAREFA: Pesquise e analise os PRINCIPAIS CONCORRENTES DIRETOS do cliente abaixo.

DADOS DO CLIENTE:
- Nome/Clínica: ${client.clinic_name || client.first_name}
- CNPJ: ${client.cnpj || 'Não informado'}
- Razão Social: ${client.razao_social || 'Não informada'}
- Cidade: ${client.city || 'Não informada'}
- Tipo: ${client.client_type}
- Setor: Veterinária/Diagnóstico Animal

INSTRUÇÕES:
1. Pesquise no Google concorrentes diretos na mesma cidade/região
2. Busque clínicas veterinárias, hospitais veterinários e laboratórios próximos
3. Analise presença online (Google, Instagram, Facebook, site)
4. Identifique equipamentos que eles possuem/anunciam
5. Avalie estratégias de preço (se mencionadas em avaliações/posts)
6. Detecte pontos fortes e fracos nas avaliações online

Retorne JSON estruturado:
{
  "total_competitors_found": 5,
  "market_saturation": "alta/media/baixa",
  "competitors": [
    {
      "name": "Nome do Concorrente",
      "location": "Endereço/Bairro",
      "distance_km": 2.5,
      "online_presence": "forte/media/fraca",
      "rating": 4.5,
      "total_reviews": 120,
      "visible_equipment": ["Equipamento 1", "Equipamento 2"],
      "services_offered": ["Serviço 1", "Serviço 2"],
      "price_strategy": "premium/medio/economico",
      "price_indicators": "Indicadores encontrados",
      "strengths": ["Força 1", "Força 2"],
      "weaknesses": ["Fraqueza 1", "Fraqueza 2"],
      "opportunity_gap": "O que nosso cliente pode explorar"
    }
  ],
  "market_insights": {
    "avg_equipment_level": "basico/intermediario/avancado",
    "common_equipment": ["Equipamento comum 1", "Equipamento comum 2"],
    "price_range_observed": "R$ 100-500 (média de consultas)",
    "technology_gap": "Oportunidade tecnológica identificada",
    "service_gaps": ["Gap 1", "Gap 2"]
  },
  "competitive_advantages": [
    "Como nosso cliente pode se diferenciar 1",
    "Como nosso cliente pode se diferenciar 2"
  ],
  "threats": [
    "Ameaça competitiva 1",
    "Ameaça competitiva 2"
  ],
  "recommended_positioning": "Sugestão de posicionamento estratégico",
  "urgency_level": "alta/media/baixa",
  "market_summary": "Resumo executivo do cenário competitivo em 2-3 frases"
}

IMPORTANTE:
- Seja baseado em dados reais encontrados na busca
- Se não encontrar dados, indique claramente
- Foque em informações acionáveis para vendas`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_competitors_found: { type: "number" },
            market_saturation: { type: "string" },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  distance_km: { type: "number" },
                  online_presence: { type: "string" },
                  rating: { type: "number" },
                  total_reviews: { type: "number" },
                  visible_equipment: { type: "array", items: { type: "string" } },
                  services_offered: { type: "array", items: { type: "string" } },
                  price_strategy: { type: "string" },
                  price_indicators: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  opportunity_gap: { type: "string" }
                }
              }
            },
            market_insights: {
              type: "object",
              properties: {
                avg_equipment_level: { type: "string" },
                common_equipment: { type: "array", items: { type: "string" } },
                price_range_observed: { type: "string" },
                technology_gap: { type: "string" },
                service_gaps: { type: "array", items: { type: "string" } }
              }
            },
            competitive_advantages: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
            recommended_positioning: { type: "string" },
            urgency_level: { type: "string" },
            market_summary: { type: "string" }
          }
        }
      });

      setAnalysis(result);

      // Salvar data da análise no cliente
      await base44.entities.Client.update(client.id, {
        competitor_analysis_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao analisar concorrentes');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSaturationColor = (saturation) => {
    switch (saturation) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'baixa': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPresenceColor = (presence) => {
    switch (presence) {
      case 'forte': return 'text-green-600';
      case 'media': return 'text-yellow-600';
      case 'fraca': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-300 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">🎯 Análise de Concorrentes</h3>
          <p className="text-xs text-slate-600">Panorama competitivo via pesquisa na internet</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={analyzeCompetitors}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Pesquisando Concorrentes na Região...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Analisar Concorrência
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Resumo Executivo */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-2">📊 Resumo do Mercado</p>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{analysis.market_summary}</p>
            
            <div className="flex items-center gap-2">
              <Badge className={getSaturationColor(analysis.market_saturation)}>
                Saturação: {analysis.market_saturation?.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {analysis.total_competitors_found} concorrentes
              </Badge>
            </div>
          </div>

          {/* Insights do Mercado */}
          <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">💡 Insights de Mercado</p>
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Nível Tecnológico Médio</p>
                <p className="font-semibold text-slate-800 capitalize">{analysis.market_insights.avg_equipment_level}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Equipamentos Comuns</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.market_insights.common_equipment?.map((eq, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500">Faixa de Preço</p>
                <p className="font-semibold text-slate-800">{analysis.market_insights.price_range_observed}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                <p className="text-xs text-purple-700 font-medium">🚀 Gap Tecnológico</p>
                <p className="text-xs text-slate-700 mt-1">{analysis.market_insights.technology_gap}</p>
              </div>
            </div>
          </div>

          {/* Concorrentes Principais */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">🏢 Principais Concorrentes</p>
            <div className="space-y-2">
              {analysis.competitors?.slice(0, 3).map((comp, i) => (
                <Card key={i} className="p-3 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{comp.name}</p>
                      <p className="text-xs text-slate-500">{comp.location} • {comp.distance_km}km</p>
                    </div>
                    <div className="text-right">
                      {comp.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-semibold">{comp.rating}</span>
                          <span className="text-xs text-slate-500">({comp.total_reviews})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-slate-500">Presença Online</p>
                      <p className={`text-xs font-semibold capitalize ${getPresenceColor(comp.online_presence)}`}>
                        {comp.online_presence}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Estratégia Preço</p>
                      <p className="text-xs font-semibold capitalize text-slate-800">{comp.price_strategy}</p>
                    </div>
                  </div>

                  {comp.visible_equipment?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Equipamentos Visíveis</p>
                      <div className="flex flex-wrap gap-1">
                        {comp.visible_equipment.map((eq, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">{eq}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 rounded p-2 border border-green-200">
                      <p className="font-medium text-green-700 mb-1">✓ Forças</p>
                      <ul className="text-green-600 space-y-0.5">
                        {comp.strengths?.slice(0, 2).map((s, idx) => (
                          <li key={idx}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded p-2 border border-red-200">
                      <p className="font-medium text-red-700 mb-1">⚠ Fraquezas</p>
                      <ul className="text-red-600 space-y-0.5">
                        {comp.weaknesses?.slice(0, 2).map((w, idx) => (
                          <li key={idx}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded p-2 border border-amber-200 mt-2">
                    <p className="text-xs font-medium text-amber-700">💡 Oportunidade</p>
                    <p className="text-xs text-slate-700">{comp.opportunity_gap}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Vantagens Competitivas */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700">Como se Diferenciar</p>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              {analysis.competitive_advantages?.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ameaças */}
          {analysis.threats?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-semibold text-red-700">Ameaças Competitivas</p>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {analysis.threats.map((threat, i) => (
                  <li key={i}>• {threat}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Posicionamento Recomendado */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-700">Posicionamento Estratégico</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.recommended_positioning}</p>
          </div>

          {/* Urgência */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Urgência de Ação</span>
            </div>
            <Badge className={
              analysis.urgency_level === 'alta' ? 'bg-red-600 text-white' :
              analysis.urgency_level === 'media' ? 'bg-yellow-600 text-white' :
              'bg-green-600 text-white'
            }>
              {analysis.urgency_level?.toUpperCase()}
            </Badge>
          </div>

          <Button
            onClick={analyzeCompetitors}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={analyzing}
          >
            Atualizar Análise
          </Button>
        </div>
      )}
    </Card>
  );
}